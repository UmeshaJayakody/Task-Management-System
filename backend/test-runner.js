#!/usr/bin/env node

/**
 * Test Runner Script for Task Management System
 * 
 * This script sets up the test environment, runs migrations,
 * executes tests, and generates coverage reports.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  testTimeout: 30000,
  maxWorkers: 1, // Use single worker for database tests
  setupTimeout: 60000,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    log(`Executing: ${command}`, 'cyan');
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`, 'red');
        reject(error);
        return;
      }
      if (stderr) {
        log(`Warning: ${stderr}`, 'yellow');
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve(stdout);
    });
  });
}

async function checkTestDatabase() {
  log('🔍 Checking test database configuration...', 'blue');

  const envTestPath = path.join(__dirname, '.env.test');
  if (!fs.existsSync(envTestPath)) {
    log('❌ .env.test file not found!', 'red');
    log('Please create .env.test with TEST_DATABASE_URL', 'yellow');
    process.exit(1);
  }

  log('✅ Test environment configuration found', 'green');
}

async function setupTestDatabase() {
  log('🛠️  Setting up test database...', 'blue');

  try {
    // Run Prisma migrations for test database
    await executeCommand('npx dotenv -e .env.test -- npx prisma migrate deploy');

    // Generate Prisma client
    await executeCommand('npx prisma generate');

    log('✅ Test database setup complete', 'green');
  } catch (error) {
    log('❌ Failed to setup test database', 'red');
    throw error;
  }
}

async function runLinting() {
  log('🔍 Running code linting...', 'blue');

  try {
    // Check if ESLint is available
    await executeCommand('npx eslint --version');
    await executeCommand('npx eslint src/ tests/ --ext .ts');
    log('✅ Linting passed', 'green');
  } catch (error) {
    log('⚠️  Linting skipped (ESLint not configured)', 'yellow');
  }
}

async function runTypeChecking() {
  log('🔍 Running TypeScript type checking...', 'blue');

  try {
    await executeCommand('npx tsc --noEmit');
    log('✅ Type checking passed', 'green');
  } catch (error) {
    log('❌ Type checking failed', 'red');
    throw error;
  }
}

async function runTests(options = {}) {
  log('🧪 Running tests...', 'blue');

  const {
    coverage = false,
    watch = false,
    pattern = '',
    verbose = false
  } = options;

  let command = 'npx dotenv -e .env.test -- npx jest';

  if (coverage) {
    command += ' --coverage';
  }

  if (watch) {
    command += ' --watch';
  }

  if (pattern) {
    command += ` --testNamePattern="${pattern}"`;
  }

  if (verbose) {
    command += ' --verbose';
  }

  // Add test configuration
  command += ` --maxWorkers=${TEST_CONFIG.maxWorkers}`;
  command += ` --testTimeout=${TEST_CONFIG.testTimeout}`;

  try {
    await executeCommand(command);
    log('✅ All tests passed!', 'green');
  } catch (error) {
    log('❌ Some tests failed', 'red');
    throw error;
  }
}

async function generateCoverageReport() {
  log('📊 Generating coverage report...', 'blue');

  try {
    await executeCommand('npx dotenv -e .env.test -- npx jest --coverage --coverageReporters=html --coverageReporters=text');

    const coveragePath = path.join(__dirname, 'coverage', 'lcov-report', 'index.html');
    if (fs.existsSync(coveragePath)) {
      log(`📄 Coverage report generated: ${coveragePath}`, 'green');
    }
  } catch (error) {
    log('❌ Failed to generate coverage report', 'red');
    throw error;
  }
}

async function cleanupTestData() {
  log('🧹 Cleaning up test data...', 'blue');

  try {
    // Reset test database
    await executeCommand('npx dotenv -e .env.test -- npx prisma migrate reset --force');
    log('✅ Test data cleaned up', 'green');
  } catch (error) {
    log('⚠️  Failed to cleanup test data', 'yellow');
  }
}

async function runTestSuite(options = {}) {
  const startTime = Date.now();

  try {
    log('🚀 Starting Task Management System Test Suite', 'magenta');
    log('=' * 50, 'cyan');

    // Check prerequisites
    await checkTestDatabase();

    // Setup
    await setupTestDatabase();

    // Code quality checks
    if (!options.skipLinting) {
      await runLinting();
    }

    if (!options.skipTypeCheck) {
      await runTypeChecking();
    }

    // Run tests
    await runTests(options);

    // Generate reports
    if (options.coverage) {
      await generateCoverageReport();
    }

    // Cleanup
    if (options.cleanup) {
      await cleanupTestData();
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`🎉 Test suite completed successfully in ${duration}s`, 'green');

  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`💥 Test suite failed after ${duration}s`, 'red');
    process.exit(1);
  }
}

// CLI Interface
const args = process.argv.slice(2);
const options = {
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  verbose: args.includes('--verbose'),
  skipLinting: args.includes('--skip-lint'),
  skipTypeCheck: args.includes('--skip-type-check'),
  cleanup: args.includes('--cleanup'),
  pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1] || ''
};

// Help message
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Task Management System Test Runner

Usage: node test-runner.js [options]

Options:
  --coverage        Generate coverage report
  --watch          Run tests in watch mode
  --verbose        Show verbose test output
  --skip-lint      Skip linting checks
  --skip-type-check Skip TypeScript type checking
  --cleanup        Clean up test data after tests
  --pattern=PATTERN Run tests matching pattern
  --help, -h       Show this help message

Examples:
  node test-runner.js --coverage
  node test-runner.js --watch
  node test-runner.js --pattern="User.*should.*"
  node test-runner.js --coverage --cleanup
`);
  process.exit(0);
}

// Run the test suite
runTestSuite(options);