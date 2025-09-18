#!/usr/bin/env node

/**
 * Test Validation Script
 * 
 * This script validates the entire test suite setup and provides
 * a comprehensive health check for the testing infrastructure.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
    console.log(`${color}${message}${COLORS.RESET}`);
}

function success(message) {
    log(`✅ ${message}`, COLORS.GREEN);
}

function error(message) {
    log(`❌ ${message}`, COLORS.RED);
}

function warning(message) {
    log(`⚠️  ${message}`, COLORS.YELLOW);
}

function info(message) {
    log(`ℹ️  ${message}`, COLORS.BLUE);
}

function header(message) {
    log(`\n${COLORS.BOLD}${COLORS.BLUE}=== ${message} ===${COLORS.RESET}\n`);
}

function checkFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
        success(`${description} exists`);
        return true;
    } else {
        error(`${description} missing: ${filePath}`);
        return false;
    }
}

function runCommand(command, description, ignoreError = false) {
    try {
        info(`Running: ${description}`);
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        success(`${description} completed successfully`);
        return { success: true, output };
    } catch (err) {
        if (ignoreError) {
            warning(`${description} failed (ignored): ${err.message}`);
            return { success: false, output: err.message };
        } else {
            error(`${description} failed: ${err.message}`);
            return { success: false, output: err.message };
        }
    }
}

async function validateTestSetup() {
    let allValid = true;

    header('Validating Test Infrastructure');

    // Check core test files
    const testFiles = [
        ['tests/setup.ts', 'Test setup configuration'],
        ['tests/helpers.ts', 'Test helper functions'],
        ['tests/user.test.ts', 'User tests'],
        ['tests/task.test.ts', 'Task tests'],
        ['tests/team.test.ts', 'Team tests'],
        ['tests/activity.test.ts', 'Activity tests'],
        ['tests/user.service.test.ts', 'User service tests'],
        ['.env.test', 'Test environment configuration'],
        ['test-runner.js', 'Test runner script'],
        ['jest.config.js', 'Jest configuration']
    ];

    testFiles.forEach(([file, desc]) => {
        if (!checkFileExists(file, desc)) {
            allValid = false;
        }
    });

    // Check package.json test scripts
    header('Validating Package.json Scripts');

    if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredScripts = [
            'test',
            'test:watch',
            'test:coverage',
            'test:ci',
            'test:full'
        ];

        requiredScripts.forEach(script => {
            if (packageJson.scripts && packageJson.scripts[script]) {
                success(`Script "${script}" is configured`);
            } else {
                error(`Script "${script}" is missing`);
                allValid = false;
            }
        });
    }

    // Check dependencies
    header('Validating Dependencies');

    const result = runCommand('npm list jest @types/jest ts-jest supertest @types/supertest --depth=0', 'Checking test dependencies', true);
    if (!result.success) {
        warning('Some test dependencies may be missing. Please run: npm install');
    }

    // Check TypeScript compilation
    header('Validating TypeScript Compilation');

    const tscResult = runCommand('npx tsc --noEmit', 'TypeScript compilation check');
    if (!tscResult.success) {
        allValid = false;
    }

    // Check database connectivity (if possible)
    header('Validating Database Setup');

    if (fs.existsSync('.env.test')) {
        success('Test environment file exists');
        const envContent = fs.readFileSync('.env.test', 'utf8');
        if (envContent.includes('DATABASE_URL')) {
            success('Database URL configured in test environment');
        } else {
            error('DATABASE_URL missing in .env.test');
            allValid = false;
        }
    }

    // Check Prisma setup
    const prismaResult = runCommand('npx prisma generate', 'Prisma client generation', true);
    if (prismaResult.success) {
        success('Prisma client generated successfully');
    }

    // Validate Jest configuration
    header('Validating Jest Configuration');

    if (fs.existsSync('jest.config.js')) {
        try {
            const jestConfig = require('./jest.config.js');

            if (jestConfig.testEnvironment === 'node') {
                success('Jest environment configured for Node.js');
            }

            if (jestConfig.setupFilesAfterEnv && jestConfig.setupFilesAfterEnv.includes('./tests/setup.ts')) {
                success('Jest setup file configured');
            }

            if (jestConfig.collectCoverageFrom) {
                success('Coverage collection configured');
            }

        } catch (err) {
            error(`Jest configuration error: ${err.message}`);
            allValid = false;
        }
    }

    // Run a quick test validation
    header('Running Quick Test Validation');

    const quickTestResult = runCommand('npm test -- --passWithNoTests --testTimeout=10000', 'Quick test run', true);
    if (quickTestResult.success) {
        success('Test framework is working correctly');
    } else {
        warning('Test framework may have issues. Run full tests for detailed diagnostics.');
    }

    // Final summary
    header('Validation Summary');

    if (allValid) {
        success('🎉 All validations passed! Your test setup is ready.');
        info('\nNext steps:');
        info('1. Run "npm test" to execute all tests');
        info('2. Run "npm run test:coverage" to see coverage report');
        info('3. Run "npm run test:watch" for development mode');
        info('4. Check TESTING.md for comprehensive documentation');
    } else {
        error('❌ Some validations failed. Please address the issues above.');
        info('\nCommon fixes:');
        info('1. Run "npm install" to install missing dependencies');
        info('2. Ensure PostgreSQL is running and test database exists');
        info('3. Check .env.test configuration');
        info('4. Run "npx prisma generate" to generate Prisma client');
    }

    return allValid;
}

// Run validation
if (require.main === module) {
    validateTestSetup()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(err => {
            error(`Validation failed: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { validateTestSetup };