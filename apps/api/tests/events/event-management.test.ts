import request from 'supertest';
import assert from 'node:assert';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { jwtService } from '../../src/lib/jwt.js';
import { EventStatus, UserRole } from '@eventmgmt/shared';

async function runEventManagementTests() {
  console.log('=== Running Event Management Tests ===\n');
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

  // Retrieve seed users for test identities
  const organizer1 = await prisma.user.findFirstOrThrow({ where: { email: 'organizer1@college.edu' } });
  const organizer2 = await prisma.user.findFirstOrThrow({ where: { email: 'organizer2@stateuni.edu' } });
  const student = await prisma.user.findFirstOrThrow({ where: { email: 'alice@college.edu' } });
  const admin = await prisma.user.findFirstOrThrow({ where: { email: 'admin@college.edu' } });

  const org1Token = jwtService.signAccessToken({ userId: organizer1.id, role: 'ORGANIZER' });
  const org2Token = jwtService.signAccessToken({ userId: organizer2.id, role: 'ORGANIZER' });
  const studentToken = jwtService.signAccessToken({ userId: student.id, role: 'STUDENT' });
  const adminToken = jwtService.signAccessToken({ userId: admin.id, role: 'ADMIN' });

  let createdEventId: string;

  // 1. Event Creation Tests
  await test('Organizer can create a valid event with status DRAFT', async () => {
    const payload = {
      title: 'Robotics Workshop 2026',
      description: 'Hands-on robotics workshop for students.',
      category: 'Workshop',
      startTime: new Date(Date.now() + 20 * 86400000).toISOString(),
      endTime: new Date(Date.now() + 20 * 86400000 + 7200000).toISOString(),
      venue: 'Lab 402',
      capacity: 30,
      registrationDeadline: new Date(Date.now() + 19 * 86400000).toISOString(),
      eligibility: 'Engineering students',
      prize: 'Robot kit',
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${org1Token}`)
      .send(payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.event.title, payload.title);
    assert.strictEqual(res.body.event.status, EventStatus.DRAFT);
    assert.strictEqual(res.body.event.organizerId, organizer1.id);
    createdEventId = res.body.event.id;
  });

  await test('Admin can also create an event', async () => {
    const payload = {
      title: 'University Convocation 2026',
      description: 'Annual convocation ceremony.',
      category: 'Ceremony',
      startTime: new Date(Date.now() + 30 * 86400000).toISOString(),
      endTime: new Date(Date.now() + 30 * 86400000 + 14400000).toISOString(),
      venue: 'Main Auditorium',
      capacity: 500,
      registrationDeadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      eligibility: 'Graduating students',
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.event.organizerId, admin.id);
  });

  await test('Rejects event creation by STUDENT with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Student Party',
        description: 'Fun party',
        category: 'Social',
        startTime: new Date(Date.now() + 10 * 86400000).toISOString(),
        endTime: new Date(Date.now() + 10 * 86400000 + 3600000).toISOString(),
        venue: 'Dorm',
        registrationDeadline: new Date(Date.now() + 9 * 86400000).toISOString(),
        eligibility: 'All',
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error?.code, 'FORBIDDEN');
  });

  await test('Rejects event creation without authentication with 401 Unauthorized', async () => {
    const res = await request(app).post('/api/events').send({});
    assert.strictEqual(res.status, 401);
  });

  await test('Rejects event creation when startTime >= endTime with 400 Bad Request', async () => {
    const start = new Date(Date.now() + 10 * 86400000);
    const end = new Date(start.getTime() - 3600000); // 1 hour earlier

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        title: 'Invalid Time Event',
        description: 'Desc',
        category: 'Workshop',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        venue: 'Room 1',
        registrationDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
        eligibility: 'All',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error?.code, 'VALIDATION_ERROR');
  });

  await test('Rejects event creation when registrationDeadline >= startTime with 400 Bad Request', async () => {
    const start = new Date(Date.now() + 10 * 86400000);
    const deadline = new Date(start.getTime() + 3600000); // 1 hour after start

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        title: 'Invalid Deadline Event',
        description: 'Desc',
        category: 'Workshop',
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + 7200000).toISOString(),
        venue: 'Room 1',
        registrationDeadline: deadline.toISOString(),
        eligibility: 'All',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error?.code, 'VALIDATION_ERROR');
  });

  await test('Rejects event creation when capacity <= 0 with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        title: 'Zero Capacity Event',
        description: 'Desc',
        category: 'Workshop',
        startTime: new Date(Date.now() + 10 * 86400000).toISOString(),
        endTime: new Date(Date.now() + 10 * 86400000 + 7200000).toISOString(),
        venue: 'Room 1',
        capacity: 0,
        registrationDeadline: new Date(Date.now() + 9 * 86400000).toISOString(),
        eligibility: 'All',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error?.code, 'VALIDATION_ERROR');
  });

  // 2. Ownership & Mutation Tests
  await test('Organizer can edit their own event', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        title: 'Robotics Workshop 2026 (Updated)',
        capacity: 45,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.event.title, 'Robotics Workshop 2026 (Updated)');
    assert.strictEqual(res.body.event.capacity, 45);
  });

  await test('Organizer CANNOT edit another organizer event (403 Forbidden)', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${org2Token}`)
      .send({
        title: 'Malicious Update',
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error?.code, 'FORBIDDEN');
  });

  await test('Admin can edit any organizer event', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        venue: 'Grand Hall 1',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.event.venue, 'Grand Hall 1');
  });

  // 3. Lifecycle Transition Tests: Publish
  await test('Non-owner organizer CANNOT publish another organizer event (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/publish`)
      .set('Authorization', `Bearer ${org2Token}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error?.code, 'FORBIDDEN');
  });

  await test('Owner organizer can publish their DRAFT event (status becomes PUBLISHED)', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/publish`)
      .set('Authorization', `Bearer ${org1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.event.status, EventStatus.PUBLISHED);
  });

  await test('Publishing an already PUBLISHED event returns 409 Conflict', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/publish`)
      .set('Authorization', `Bearer ${org1Token}`);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error?.code, 'CONFLICT');
  });

  // 4. Lifecycle Transition Tests: Cancel
  await test('Non-owner organizer CANNOT cancel another organizer event (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/cancel`)
      .set('Authorization', `Bearer ${org2Token}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error?.code, 'FORBIDDEN');
  });

  await test('Owner organizer can cancel their PUBLISHED event (status becomes CANCELLED)', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/cancel`)
      .set('Authorization', `Bearer ${org1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.event.status, EventStatus.CANCELLED);
  });

  await test('Publishing a CANCELLED event is rejected with 409 Conflict', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/publish`)
      .set('Authorization', `Bearer ${org1Token}`);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error?.code, 'CONFLICT');
  });

  await test('Cancelling an already CANCELLED event returns 409 Conflict', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/cancel`)
      .set('Authorization', `Bearer ${org1Token}`);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error?.code, 'CONFLICT');
  });

  // 5. Visibility & Discovery Tests
  await test('DRAFT events are concealed from unauthenticated/student requests (404 Not Found)', async () => {
    // Create a new draft event
    const draftEvent = await prisma.event.create({
      data: {
        organizerId: organizer1.id,
        title: 'Secret Draft Workshop',
        description: 'Not yet ready for public view',
        category: 'Workshop',
        startTime: new Date(Date.now() + 15 * 86400000),
        endTime: new Date(Date.now() + 15 * 86400000 + 7200000),
        venue: 'Room 5',
        registrationDeadline: new Date(Date.now() + 14 * 86400000),
        eligibility: 'Open',
        status: EventStatus.DRAFT,
      },
    });

    // Student requesting draft event by ID -> 404
    const studentRes = await request(app)
      .get(`/api/events/${draftEvent.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(studentRes.status, 404);

    // Unauthenticated requesting draft event by ID -> 404
    const guestRes = await request(app).get(`/api/events/${draftEvent.id}`);
    assert.strictEqual(guestRes.status, 404);

    // Non-owner organizer requesting draft event by ID -> 404
    const otherOrgRes = await request(app)
      .get(`/api/events/${draftEvent.id}`)
      .set('Authorization', `Bearer ${org2Token}`);
    assert.strictEqual(otherOrgRes.status, 404);

    // Owner organizer requesting draft event by ID -> 200 OK
    const ownerRes = await request(app)
      .get(`/api/events/${draftEvent.id}`)
      .set('Authorization', `Bearer ${org1Token}`);
    assert.strictEqual(ownerRes.status, 200);
    assert.strictEqual(ownerRes.body.event.title, 'Secret Draft Workshop');

    // Admin requesting draft event by ID -> 200 OK
    const adminRes = await request(app)
      .get(`/api/events/${draftEvent.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(adminRes.status, 200);

    // Clean up test draft
    await prisma.event.delete({ where: { id: draftEvent.id } });
  });

  await test('GET /api/events returns only PUBLISHED events to students and guests', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body.events));
    for (const evt of res.body.events) {
      assert.strictEqual(evt.status, EventStatus.PUBLISHED, 'Student catalog must contain only published events');
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runEventManagementTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
