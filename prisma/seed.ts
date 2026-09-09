import { PrismaClient, UserRole, EventStatus, RegistrationStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Development-only password hash for seeded accounts (password: "Password123!")
const DEV_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$devseedhash$placeholderhashforlocaldevonly';

async function main() {
  console.log('--- Seeding Database Foundation ---');

  // Clean existing records in reverse dependency order
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating Seed Users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Campus Administrator',
      email: 'admin@college.edu',
      passwordHash: DEV_PASSWORD_HASH,
      college: 'Apex Institute of Technology',
      role: UserRole.ADMIN,
    },
  });

  const organizer1 = await prisma.user.create({
    data: {
      name: 'Computer Science Club Lead',
      email: 'organizer1@college.edu',
      passwordHash: DEV_PASSWORD_HASH,
      college: 'Apex Institute of Technology',
      role: UserRole.ORGANIZER,
    },
  });

  const organizer2 = await prisma.user.create({
    data: {
      name: 'Robotics Society Lead',
      email: 'organizer2@stateuni.edu',
      passwordHash: DEV_PASSWORD_HASH,
      college: 'State University',
      role: UserRole.ORGANIZER,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@college.edu',
      passwordHash: DEV_PASSWORD_HASH,
      college: 'Apex Institute of Technology',
      role: UserRole.STUDENT,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@stateuni.edu',
      passwordHash: DEV_PASSWORD_HASH,
      college: 'State University',
      role: UserRole.STUDENT,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Carol Davis',
      email: 'carol@metropolis.edu',
      passwordHash: DEV_PASSWORD_HASH,
      college: 'Metropolis College',
      role: UserRole.STUDENT,
    },
  });

  console.log(`Created ${6} users across roles (ADMIN, ORGANIZER, STUDENT).`);

  console.log('Creating Seed Events...');
  const now = new Date();

  const draftEvent = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Intro to Web3 Workshop',
      description: 'Draft workshop on blockchain and smart contracts.',
      category: 'Workshop',
      startTime: new Date(Date.now() + 14 * 86400000), // in 14 days
      endTime: new Date(Date.now() + 14 * 86400000 + 7200000),
      venue: 'Auditorium B',
      capacity: 40,
      registrationDeadline: new Date(Date.now() + 13 * 86400000),
      eligibility: 'All college students welcome',
      prize: null,
      status: EventStatus.DRAFT,
    },
  });

  const publishedHackathon = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Annual Inter-College Hackathon 2026',
      description: '36-hour hackathon building solutions for sustainability.',
      category: 'Hackathon',
      startTime: new Date(Date.now() + 7 * 86400000), // in 7 days
      endTime: new Date(Date.now() + 9 * 86400000),
      venue: 'Innovation Hall & Online',
      capacity: 100,
      registrationDeadline: new Date(Date.now() + 5 * 86400000),
      eligibility: 'Open to enrolled students from any accredited college',
      prize: '$5000 Grand Prize Pool',
      status: EventStatus.PUBLISHED,
    },
  });

  const publishedSymposium = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Robotics & AI Symposium',
      description: 'Guest lectures and demos from robotics researchers.',
      category: 'Seminar',
      startTime: new Date(Date.now() + 10 * 86400000), // in 10 days
      endTime: new Date(Date.now() + 10 * 86400000 + 14400000),
      venue: 'Science Center 101',
      capacity: null, // Unlimited capacity
      registrationDeadline: new Date(Date.now() + 8 * 86400000),
      eligibility: 'Open to all students and faculty',
      prize: null,
      status: EventStatus.PUBLISHED,
    },
  });

  const completedEvent = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Spring Coding Bootcamp',
      description: 'Completed week-long crash course on full-stack development.',
      category: 'Bootcamp',
      startTime: new Date(Date.now() - 14 * 86400000),
      endTime: new Date(Date.now() - 7 * 86400000),
      venue: 'Virtual Classroom 3',
      capacity: 50,
      registrationDeadline: new Date(Date.now() - 15 * 86400000),
      eligibility: 'Beginner programmers',
      prize: 'Completion Badges',
      status: EventStatus.COMPLETED,
    },
  });

  const cancelledEvent = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Cancelled Drone Racing Exhibition',
      description: 'Exhibition cancelled due to venue maintenance.',
      category: 'Exhibition',
      startTime: new Date(Date.now() + 3 * 86400000),
      endTime: new Date(Date.now() + 3 * 86400000 + 10800000),
      venue: 'Sports Stadium',
      capacity: 200,
      registrationDeadline: new Date(Date.now() + 2 * 86400000),
      eligibility: 'All students',
      prize: 'Trophies',
      status: EventStatus.CANCELLED,
    },
  });

  console.log('Created 5 events across lifecycle states (DRAFT, PUBLISHED, COMPLETED, CANCELLED).');

  console.log('Creating Seed Registrations...');

  // 1. Alice Johnson registers for Hackathon (ACTIVE)
  await prisma.registration.create({
    data: {
      userId: student1.id,
      eventId: publishedHackathon.id,
      status: RegistrationStatus.ACTIVE,
    },
  });

  // 2. Alice Johnson also registers for Symposium (ACTIVE) -> BR-02: Multi-event registration allowed
  await prisma.registration.create({
    data: {
      userId: student1.id,
      eventId: publishedSymposium.id,
      status: RegistrationStatus.ACTIVE,
    },
  });

  // 3. Bob Smith previously cancelled Hackathon registration -> history retained
  await prisma.registration.create({
    data: {
      userId: student2.id,
      eventId: publishedHackathon.id,
      status: RegistrationStatus.CANCELLED,
      registeredAt: new Date(Date.now() - 86400000),
    },
  });

  // 4. Bob Smith re-registered for Hackathon (ACTIVE) -> coexistence of CANCELLED and ACTIVE
  await prisma.registration.create({
    data: {
      userId: student2.id,
      eventId: publishedHackathon.id,
      status: RegistrationStatus.ACTIVE,
      registeredAt: new Date(),
    },
  });

  // 5. Carol Davis registers for Symposium (ACTIVE)
  await prisma.registration.create({
    data: {
      userId: student3.id,
      eventId: publishedSymposium.id,
      status: RegistrationStatus.ACTIVE,
    },
  });

  console.log('Created seed registrations demonstrating multi-event participation and cancelled history coexistence.');

  console.log('\n--- Seed Summary ---');
  console.log('Development accounts:');
  console.log('  Admin:      admin@college.edu');
  console.log('  Organizers: organizer1@college.edu, organizer2@stateuni.edu');
  console.log('  Students:   alice@college.edu, bob@stateuni.edu, carol@metropolis.edu');
  console.log('  Password:   (All accounts use development password placeholder)\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
