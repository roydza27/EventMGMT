import request from 'supertest';
import assert from 'node:assert';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { jwtService } from '../../src/lib/jwt.js';
import { EventStatus, RegistrationStatus } from '@eventmgmt/shared';

async function runRegistrationTests() {
  console.log('=== Running Registration API Integration Tests ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error('   ', err.message || err);
      failed++;
    }
  }

  const app = createApp();

  const organizer = await prisma.user.findFirstOrThrow({ where: { email: 'organizer1@college.edu' } });
  const studentAlice = await prisma.user.findFirstOrThrow({ where: { email: 'alice@college.edu' } });
  const studentBob = await prisma.user.findFirstOrThrow({ where: { email: 'bob@stateuni.edu' } });

  const aliceToken = jwtService.signAccessToken({ userId: studentAlice.id, role: 'STUDENT' });
  const bobToken = jwtService.signAccessToken({ userId: studentBob.id, role: 'STUDENT' });
  const organizerToken = jwtService.signAccessToken({ userId: organizer.id, role: 'ORGANIZER' });

  const now = Date.now();
  const createdEventIds: string[] = [];

  try {
    // 1. Published event with capacity 2
    const testEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Reg Integration Test Workshop',
        description: 'Test workshop for registration verification.',
        category: 'Workshop',
        venue: 'Lab Alpha',
        startTime: new Date(now + 10 * 86400000),
        endTime: new Date(now + 10 * 86400000 + 7200000),
        registrationDeadline: new Date(now + 8 * 86400000),
        capacity: 2,
        eligibility: 'All students',
        status: EventStatus.PUBLISHED,
      },
    });
    createdEventIds.push(testEvent.id);

    // 2. Draft event
    const draftEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Draft Reg Test Event',
        description: 'Draft description.',
        category: 'Workshop',
        venue: 'Room B',
        startTime: new Date(now + 15 * 86400000),
        endTime: new Date(now + 15 * 86400000 + 7200000),
        registrationDeadline: new Date(now + 12 * 86400000),
        capacity: 10,
        eligibility: 'All students',
        status: EventStatus.DRAFT,
      },
    });
    createdEventIds.push(draftEvent.id);

    // 3. Past deadline event
    const expiredEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Past Deadline Event',
        description: 'Deadline in past.',
        category: 'Seminar',
        venue: 'Auditorium',
        startTime: new Date(now + 5 * 86400000),
        endTime: new Date(now + 5 * 86400000 + 7200000),
        registrationDeadline: new Date(now - 1 * 86400000), // expired
        capacity: 10,
        eligibility: 'All students',
        status: EventStatus.PUBLISHED,
      },
    });
    createdEventIds.push(expiredEvent.id);

    // --- TEST CASES ---

    let aliceRegId: string = '';

    await test('POST /api/events/:id/register allows authenticated student to register', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/register`)
        .set('Authorization', `Bearer ${aliceToken}`);

      assert.strictEqual(res.status, 201);
      assert(res.body.registration);
      assert.strictEqual(res.body.registration.status, 'ACTIVE');
      assert.strictEqual(res.body.registration.userId, studentAlice.id);
      assert.strictEqual(res.body.registration.eventId, testEvent.id);
      aliceRegId = res.body.registration.id;
    });

    await test('POST /api/events/:id/register rejects duplicate active registration with 409', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/register`)
        .set('Authorization', `Bearer ${aliceToken}`);

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error.code, 'CONFLICT');
    });

    await test('POST /api/events/:id/register rejects registration for DRAFT event with 409', async () => {
      const res = await request(app)
        .post(`/api/events/${draftEvent.id}/register`)
        .set('Authorization', `Bearer ${aliceToken}`);

      assert.strictEqual(res.status, 409);
    });

    await test('POST /api/events/:id/register rejects registration when deadline passed with 409', async () => {
      const res = await request(app)
        .post(`/api/events/${expiredEvent.id}/register`)
        .set('Authorization', `Bearer ${aliceToken}`);

      assert.strictEqual(res.status, 409);
    });

    await test('POST /api/events/:id/register rejects non-student role with 403', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/register`)
        .set('Authorization', `Bearer ${organizerToken}`);

      assert.strictEqual(res.status, 403);
    });

    let bobRegId: string = '';
    await test('POST /api/events/:id/register allows second student up to capacity', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/register`)
        .set('Authorization', `Bearer ${bobToken}`);

      assert.strictEqual(res.status, 201);
      bobRegId = res.body.registration.id;
    });

    await test('POST /api/events/:id/register rejects when capacity limit reached with 409', async () => {
      const thirdStudent = await prisma.user.findFirstOrThrow({ where: { email: 'carol@metropolis.edu' } });
      const carolToken = jwtService.signAccessToken({ userId: thirdStudent.id, role: 'STUDENT' });

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/register`)
        .set('Authorization', `Bearer ${carolToken}`);

      assert.strictEqual(res.status, 409);
      assert(res.body.error.message.includes('capacity'));
    });

    await test('POST /api/registrations/:id/cancel allows student to withdraw their registration', async () => {
      const res = await request(app)
        .post(`/api/registrations/${bobRegId}/cancel`)
        .set('Authorization', `Bearer ${bobToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.registration.status, 'CANCELLED');
    });

    await test('POST /api/registrations/:id/cancel rejects cancelling an already cancelled pass with 409', async () => {
      const res = await request(app)
        .post(`/api/registrations/${bobRegId}/cancel`)
        .set('Authorization', `Bearer ${bobToken}`);

      assert.strictEqual(res.status, 409);
    });

    await test('POST /api/registrations/:id/cancel denies non-owner from cancelling someone else pass', async () => {
      const res = await request(app)
        .post(`/api/registrations/${aliceRegId}/cancel`)
        .set('Authorization', `Bearer ${bobToken}`);

      assert.strictEqual(res.status, 404);
    });

    await test('POST /api/events/:id/register allows re-registration after previous cancellation', async () => {
      // Bob withdrew, so capacity freed up: Bob can register again!
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/register`)
        .set('Authorization', `Bearer ${bobToken}`);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.registration.status, 'ACTIVE');
    });

    await test('GET /api/registrations/me returns only the authenticated student registrations', async () => {
      const res = await request(app)
        .get('/api/registrations/me')
        .set('Authorization', `Bearer ${aliceToken}`);

      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.registrations));

      for (const reg of res.body.registrations) {
        assert.strictEqual(reg.userId, studentAlice.id);
        assert(reg.event, 'Should include associated event summary');
      }
    });

  } finally {
    await prisma.registration.deleteMany({
      where: { eventId: { in: createdEventIds } },
    });
    await prisma.event.deleteMany({
      where: { id: { in: createdEventIds } },
    });
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runRegistrationTests()
  .catch((err) => {
    console.error('Fatal test error in Registration tests:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
