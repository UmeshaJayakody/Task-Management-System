import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create Prisma client with test database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

beforeAll(async () => {
  try {
    // Connect to test database
    await prisma.$connect();

    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;

    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Clean up test data and disconnect
    await cleanupDatabase();
    await prisma.$disconnect();
    console.log('✅ Test database disconnected successfully');
  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanupDatabase();
});

afterEach(async () => {
  // Additional cleanup after each test if needed
  // This can be useful for tests that might leave connections open
});

async function cleanupDatabase() {
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    await prisma.activity.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.taskDependency.deleteMany({});
    await prisma.taskAssignment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  }
}

// Global test timeout for database operations
jest.setTimeout(30000);

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

export { prisma };
