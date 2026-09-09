import { PrismaClient, UserRole, EventStatus, RegistrationStatus } from '@prisma/client';
import assert from 'node:assert';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== Running Database Integrity & Constraint Tests ===\n');
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

  // 1. Partial Unique Index: Duplicate ACTIVE registration must be rejected
  await test('Prevents duplicate ACTIVE registration for same user and event', async () => {
    const user = await prisma.user.findFirstOrThrow({ where: { email: 'alice@college.edu' } });
    const event = await prisma.event.findFirstOrThrow({ where: { title: { contains: 'Hackathon' } } });

    // Alice already has an ACTIVE registration for Hackathon from seed
    let rejected = false;
    try {
      await prisma.registration.create({
        data: {
          userId: user.id,
          eventId: event.id,
          status: RegistrationStatus.ACTIVE,
        },
      });
    } catch (err: any) {
      rejected = true;
      assert(err.message.includes('unique_active_user_event_registration') || err.code === 'P2002' || err.code === 'P2010');
    }
    assert(rejected, 'Expected duplicate ACTIVE registration to be rejected');
  });

  // 2. Partial Unique Index: Allows CANCELLED registration alongside ACTIVE registration
  await test('Allows CANCELLED registration alongside ACTIVE registration for same user and event', async () => {
    const user = await prisma.user.findFirstOrThrow({ where: { email: 'alice@college.edu' } });
    const event = await prisma.event.findFirstOrThrow({ where: { title: { contains: 'Hackathon' } } });

    // Alice has an ACTIVE registration. Creating a CANCELLED one should succeed!
    const cancelledReg = await prisma.registration.create({
      data: {
        userId: user.id,
        eventId: event.id,
        status: RegistrationStatus.CANCELLED,
      },
    });
    assert(cancelledReg.id, 'Cancelled registration should have been created');
    
    // Clean up this test record
    await prisma.registration.delete({ where: { id: cancelledReg.id } });
  });

  // 3. Multi-event participation: Student can register for multiple events
  await test('Allows single student to hold active registrations across multiple events', async () => {
    const user = await prisma.user.findFirstOrThrow({ where: { email: 'alice@college.edu' } });
    const activeRegs = await prisma.registration.findMany({
      where: { userId: user.id, status: RegistrationStatus.ACTIVE },
    });
    assert(activeRegs.length >= 2, 'Alice should have active registrations in at least 2 distinct events');
    const uniqueEvents = new Set(activeRegs.map((r) => r.eventId));
    assert.strictEqual(uniqueEvents.size, activeRegs.length, 'Events must be distinct');
  });

  // 4. Unique email constraint
  await test('Rejects duplicate user email', async () => {
    let rejected = false;
    try {
      await prisma.user.create({
        data: {
          name: 'Duplicate Alice',
          email: 'alice@college.edu',
          passwordHash: 'hash',
          college: 'Another College',
          role: UserRole.STUDENT,
        },
      });
    } catch (err: any) {
      rejected = true;
      assert(err.code === 'P2002' || err.message.includes('Unique constraint'));
    }
    assert(rejected, 'Duplicate email should be rejected');
  });

  // 5. Temporal constraint: startTime < endTime
  await test('Enforces check constraint: startTime < endTime', async () => {
    const organizer = await prisma.user.findFirstOrThrow({ where: { role: UserRole.ORGANIZER } });
    let rejected = false;
    try {
      await prisma.event.create({
        data: {
          organizerId: organizer.id,
          title: 'Invalid Time Event',
          description: 'Desc',
          category: 'Category',
          startTime: new Date('2026-10-10T12:00:00Z'),
          endTime: new Date('2026-10-10T10:00:00Z'), // Invalid: before start
          venue: 'Room 1',
          registrationDeadline: new Date('2026-10-09T12:00:00Z'),
          eligibility: 'All',
          status: EventStatus.DRAFT,
        },
      });
    } catch (err: any) {
      rejected = true;
      assert(err.message.includes('chk_event_time_order') || err.code === 'P2010');
    }
    assert(rejected, 'Event with endTime < startTime must be rejected by check constraint');
  });

  // 6. Temporal constraint: registrationDeadline < startTime
  await test('Enforces check constraint: registrationDeadline < startTime', async () => {
    const organizer = await prisma.user.findFirstOrThrow({ where: { role: UserRole.ORGANIZER } });
    let rejected = false;
    try {
      await prisma.event.create({
        data: {
          organizerId: organizer.id,
          title: 'Invalid Deadline Event',
          description: 'Desc',
          category: 'Category',
          startTime: new Date('2026-10-10T12:00:00Z'),
          endTime: new Date('2026-10-10T14:00:00Z'),
          venue: 'Room 1',
          registrationDeadline: new Date('2026-10-10T13:00:00Z'), // Invalid: after start
          eligibility: 'All',
          status: EventStatus.DRAFT,
        },
      });
    } catch (err: any) {
      rejected = true;
      assert(err.message.includes('chk_event_deadline_order') || err.code === 'P2010');
    }
    assert(rejected, 'Event with registrationDeadline >= startTime must be rejected by check constraint');
  });

  // 7. Capacity constraint: capacity must be positive if provided
  await test('Enforces check constraint: capacity > 0', async () => {
    const organizer = await prisma.user.findFirstOrThrow({ where: { role: UserRole.ORGANIZER } });
    let rejected = false;
    try {
      await prisma.event.create({
        data: {
          organizerId: organizer.id,
          title: 'Zero Capacity Event',
          description: 'Desc',
          category: 'Category',
          startTime: new Date('2026-10-10T12:00:00Z'),
          endTime: new Date('2026-10-10T14:00:00Z'),
          venue: 'Room 1',
          capacity: 0, // Invalid: must be > 0
          registrationDeadline: new Date('2026-10-09T12:00:00Z'),
          eligibility: 'All',
          status: EventStatus.DRAFT,
        },
      });
    } catch (err: any) {
      rejected = true;
      assert(err.message.includes('chk_event_capacity_positive') || err.code === 'P2010');
    }
    assert(rejected, 'Event with capacity <= 0 must be rejected by check constraint');
  });

  // 8. Foreign key delete protection: Deleting organizer with events is restricted
  await test('Restricts deleting User when user has organized events', async () => {
    const organizer = await prisma.user.findFirstOrThrow({ where: { email: 'organizer1@college.edu' } });
    let rejected = false;
    try {
      await prisma.user.delete({ where: { id: organizer.id } });
    } catch (err: any) {
      rejected = true;
      assert(err.code === 'P2003' || err.message.includes('Foreign key constraint'));
    }
    assert(rejected, 'Deleting organizer with events should be restricted');
  });

  // 9. Foreign key delete protection: Deleting Event with registrations is restricted
  await test('Restricts deleting Event when event has registrations', async () => {
    const event = await prisma.event.findFirstOrThrow({ where: { title: { contains: 'Hackathon' } } });
    let rejected = false;
    try {
      await prisma.event.delete({ where: { id: event.id } });
    } catch (err: any) {
      rejected = true;
      assert(err.code === 'P2003' || err.message.includes('Foreign key constraint'));
    }
    assert(rejected, 'Deleting event with registrations should be restricted');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Test suite error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
