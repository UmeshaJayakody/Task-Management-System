import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up test data and disconnect
  await cleanupDatabase();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanupDatabase();
});

async function cleanupDatabase() {
  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.activity.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});
}

export { prisma };