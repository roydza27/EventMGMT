import request from 'supertest';
import assert from 'node:assert';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { jwtService } from '../../src/lib/jwt.js';
import { EventStatus, RegistrationStatus } from '@eventmgmt/shared';

async function runEventDiscoveryTests() {
  console.log('=== Running Event Discovery Tests ===\n');
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
  const student = await prisma.user.findFirstOrThrow({ where: { email: 'alice@college.edu' } });

  const studentToken = jwtService.signAccessToken({ userId: student.id, role: 'STUDENT' });

  // Create isolated test fixture events
  const now = Date.now();
  const createdEventIds: string[] = [];

  try {
    // 1. Published Open Event (Category: TechTalk, Venue: Silicon Hall)
    const openEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Quantum Computing Frontiers',
        description: 'Explore advances in qubits and quantum algorithms.',
        category: 'TechTalk',
        venue: 'Silicon Hall Room A',
        startTime: new Date(now + 10 * 86400000), // +10 days
        endTime: new Date(now + 10 * 86400000 + 7200000),
        registrationDeadline: new Date(now + 9 * 86400000), // +9 days
        capacity: 50,
        eligibility: 'All students',
        status: EventStatus.PUBLISHED,
      },
    });
    createdEventIds.push(openEvent.id);

    // 2. Published Full Event (Category: Workshop, Venue: MakerSpace, Capacity: 1 with 1 registration)
    const fullEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Advanced Microcontroller Workshop',
        description: 'Hands-on embedded C programming with STM32.',
        category: 'Workshop',
        venue: 'MakerSpace Lab 1',
        startTime: new Date(now + 15 * 86400000), // +15 days
        endTime: new Date(now + 15 * 86400000 + 10800000),
        registrationDeadline: new Date(now + 14 * 86400000), // +14 days
        capacity: 1,
        eligibility: 'ECE/CS students',
        status: EventStatus.PUBLISHED,
      },
    });
    createdEventIds.push(fullEvent.id);

    await prisma.registration.create({
      data: {
        userId: student.id,
        eventId: fullEvent.id,
        status: RegistrationStatus.ACTIVE,
      },
    });

    // 3. Published Closed Registration Event (Deadline in past, but startTime in future)
    const closedEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Autonomous Drone Racing',
        description: 'High-speed FPV drone competition.',
        category: 'Competition',
        venue: 'Sports Arena',
        startTime: new Date(now + 5 * 86400000), // +5 days
        endTime: new Date(now + 5 * 86400000 + 14400000),
        registrationDeadline: new Date(now - 1 * 86400000), // -1 day (CLOSED)
        capacity: 20,
        eligibility: 'Open to all',
        status: EventStatus.PUBLISHED,
      },
    });
    createdEventIds.push(closedEvent.id);

    // 4. Draft Event (should NEVER show up in public discovery)
    const draftEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Secret Unannounced TechFest',
        description: 'Draft plan for university-wide festival.',
        category: 'Festival',
        venue: 'Central Quad',
        startTime: new Date(now + 40 * 86400000),
        endTime: new Date(now + 42 * 86400000),
        registrationDeadline: new Date(now + 38 * 86400000),
        capacity: 1000,
        eligibility: 'All colleges',
        status: EventStatus.DRAFT,
      },
    });
    createdEventIds.push(draftEvent.id);

    // 5. Cancelled Event (should NEVER show up in public discovery catalog)
    const cancelledEvent = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: 'Cancelled Robotics Expo',
        description: 'Former expo that was cancelled.',
        category: 'Exhibition',
        venue: 'Exhibition Center',
        startTime: new Date(now + 25 * 86400000),
        endTime: new Date(now + 26 * 86400000),
        registrationDeadline: new Date(now + 24 * 86400000),
        capacity: 100,
        eligibility: 'Open to all',
        status: EventStatus.CANCELLED,
      },
    });
    createdEventIds.push(cancelledEvent.id);

    // --- TEST CASES ---

    await test('Public catalog GET /api/events only returns PUBLISHED events and hides DRAFTs and CANCELLED', async () => {
      const res = await request(app).get('/api/events');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.events));

      const eventIds = res.body.events.map((e: any) => e.id);
      assert(eventIds.includes(openEvent.id), 'Should contain published open event');
      assert(eventIds.includes(fullEvent.id), 'Should contain published full event');
      assert(eventIds.includes(closedEvent.id), 'Should contain published closed-registration event');
      assert(!eventIds.includes(draftEvent.id), 'Must NOT contain DRAFT event');
      assert(!eventIds.includes(cancelledEvent.id), 'Must NOT contain CANCELLED event');

      for (const e of res.body.events) {
        assert.strictEqual(e.status, EventStatus.PUBLISHED);
      }
    });

    await test('Student catalog GET /api/events hides DRAFTs and CANCELLED events when authenticated as STUDENT', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${studentToken}`);

      assert.strictEqual(res.status, 200);
      const eventIds = res.body.events.map((e: any) => e.id);
      assert(!eventIds.includes(draftEvent.id), 'Must NOT contain DRAFT event for student');
      assert(!eventIds.includes(cancelledEvent.id), 'Must NOT contain CANCELLED event for student');
    });

    await test('Public/student query parameter ?status cannot expose non-published events', async () => {
      const resDraft = await request(app).get('/api/events?status=DRAFT');
      assert.strictEqual(resDraft.status, 200);
      const draftIds = resDraft.body.events.map((e: any) => e.id);
      assert(!draftIds.includes(draftEvent.id));

      const resCancelled = await request(app).get('/api/events?status=CANCELLED');
      assert.strictEqual(resCancelled.status, 200);
      const cancelledIds = resCancelled.body.events.map((e: any) => e.id);
      assert(!cancelledIds.includes(cancelledEvent.id));
    });

    await test('Case-insensitive search on title matches correctly', async () => {
      // search "quantum"
      const res = await request(app).get('/api/events?search=quantum');
      assert.strictEqual(res.status, 200);
      const ids = res.body.events.map((e: any) => e.id);
      assert(ids.includes(openEvent.id));
      assert(!ids.includes(fullEvent.id));

      // search uppercase "QUANTUM"
      const resUpper = await request(app).get('/api/events?search=QUANTUM');
      assert.strictEqual(resUpper.status, 200);
      const idsUpper = resUpper.body.events.map((e: any) => e.id);
      assert(idsUpper.includes(openEvent.id));
    });

    await test('Case-insensitive search on description matches correctly', async () => {
      const res = await request(app).get('/api/events?search=embedded');
      assert.strictEqual(res.status, 200);
      const ids = res.body.events.map((e: any) => e.id);
      assert(ids.includes(fullEvent.id));
      assert(!ids.includes(openEvent.id));
    });

    await test('Case-insensitive search on venue matches correctly', async () => {
      const res = await request(app).get('/api/events?search=Silicon');
      assert.strictEqual(res.status, 200);
      const ids = res.body.events.map((e: any) => e.id);
      assert(ids.includes(openEvent.id));
      assert(!ids.includes(closedEvent.id));
    });

    await test('Category filtering returns only events matching specified category', async () => {
      const res = await request(app).get('/api/events?category=TechTalk');
      assert.strictEqual(res.status, 200);
      for (const e of res.body.events) {
        assert.strictEqual(e.category, 'TechTalk');
      }
      const ids = res.body.events.map((e: any) => e.id);
      assert(ids.includes(openEvent.id));
      assert(!ids.includes(fullEvent.id));
    });

    await test('Date range filtering (from / to) filters events correctly', async () => {
      // from 12 days ahead to 20 days ahead -> should only include fullEvent (+15 days)
      const fromDate = new Date(now + 12 * 86400000).toISOString();
      const toDate = new Date(now + 20 * 86400000).toISOString();

      const res = await request(app).get(`/api/events?from=${fromDate}&to=${toDate}`);
      assert.strictEqual(res.status, 200);
      const ids = res.body.events.map((e: any) => e.id);
      assert(ids.includes(fullEvent.id));
      assert(!ids.includes(openEvent.id));
      assert(!ids.includes(closedEvent.id));
    });

    await test('Rejects invalid date format in query params with 400 Bad Request', async () => {
      const res = await request(app).get('/api/events?from=invalid-date');
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });

    await test('Derives OPEN availability correctly when capacity is not reached and deadline is in future', async () => {
      const res = await request(app).get(`/api/events/${openEvent.id}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.event.availability, 'OPEN');
      assert.strictEqual(res.body.event.activeRegistrationCount, 0);
    });

    await test('Derives FULL availability correctly when active registrations equal capacity', async () => {
      const res = await request(app).get(`/api/events/${fullEvent.id}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.event.availability, 'FULL');
      assert.strictEqual(res.body.event.activeRegistrationCount, 1);
    });

    await test('Derives REGISTRATION_CLOSED when registrationDeadline has passed', async () => {
      const res = await request(app).get(`/api/events/${closedEvent.id}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.event.availability, 'REGISTRATION_CLOSED');
    });

    await test('GET /api/events list endpoint returns availability and activeRegistrationCount for each item', async () => {
      const res = await request(app).get('/api/events');
      assert.strictEqual(res.status, 200);

      const openItem = res.body.events.find((e: any) => e.id === openEvent.id);
      assert(openItem);
      assert.strictEqual(openItem.availability, 'OPEN');
      assert.strictEqual(openItem.activeRegistrationCount, 0);

      const fullItem = res.body.events.find((e: any) => e.id === fullEvent.id);
      assert(fullItem);
      assert.strictEqual(fullItem.availability, 'FULL');
      assert.strictEqual(fullItem.activeRegistrationCount, 1);

      const closedItem = res.body.events.find((e: any) => e.id === closedEvent.id);
      assert(closedItem);
      assert.strictEqual(closedItem.availability, 'REGISTRATION_CLOSED');
    });

    await test('GET /api/events/:id returns 404 for DRAFT events when unauthenticated or student', async () => {
      const guestRes = await request(app).get(`/api/events/${draftEvent.id}`);
      assert.strictEqual(guestRes.status, 404);

      const studentRes = await request(app)
        .get(`/api/events/${draftEvent.id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      assert.strictEqual(studentRes.status, 404);
    });

    await test('GET /api/events/:id returns CANCELLED availability for cancelled event detail', async () => {
      const res = await request(app).get(`/api/events/${cancelledEvent.id}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.event.status, EventStatus.CANCELLED);
      assert.strictEqual(res.body.event.availability, 'CANCELLED');
    });

    await test('GET /api/events/:id returns 404 for nonexistent event ID', async () => {
      const res = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error.code, 'NOT_FOUND');
    });

    await test('GET /api/events/:id returns 400 for invalid UUID format', async () => {
      const res = await request(app).get('/api/events/not-a-valid-uuid');
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });

  } finally {
    // Cleanup created test events and registrations
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

runEventDiscoveryTests()
  .catch((err) => {
    console.error('Fatal test error in Event Discovery tests:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
