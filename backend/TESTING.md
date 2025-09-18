# Testing Guide

This document provides comprehensive information about the testing setup and practices for the Task Management System backend.

## Overview

The testing suite is built using **Jest** with TypeScript support, providing comprehensive coverage for:
- **API endpoints** (integration tests)
- **Service layer** (unit tests)
- **Database operations** (with test database)
- **Authentication & authorization**
- **Error handling**
- **Validation**

## Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── helpers.ts                  # Test utilities and data factories
├── user.test.ts               # User authentication & profile tests
├── task.test.ts               # Task CRUD and management tests
├── team.test.ts               # Team collaboration tests
├── activity.test.ts           # Activity tracking tests
├── comment.test.ts            # Comment system tests
├── dependency.test.ts         # Task dependency tests
└── services/
    └── user.service.test.ts   # Service layer unit tests
```

## Setup

### Environment Configuration

1. **Test Database**: Uses a separate PostgreSQL database for testing
2. **Environment Variables**: Configured in `.env.test`
3. **Database Migrations**: Automatically applied before tests

### Installation

```bash
cd backend
npm install
```

### Database Setup

```bash
# Create test database (one-time setup)
createdb taskmanagement_test

# Run migrations for test database
npm run test:db:setup
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Advanced Commands

```bash
# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:services      # Service layer tests only

# Run comprehensive test suite
npm run test:full          # Full test suite with cleanup

# Quick testing (skip linting/type checking)
npm run test:quick

# Reset test database
npm run test:db:reset
```

### Custom Test Runner

The project includes a custom test runner (`test-runner.js`) with additional features:

```bash
# Run with custom options
node test-runner.js --coverage --verbose --cleanup

# Available options:
# --coverage      Generate coverage report
# --verbose       Detailed output
# --watch         Watch mode
# --cleanup       Clean up after tests
# --skip-lint     Skip ESLint
# --skip-type-check  Skip TypeScript compilation
```

## Test Patterns

### API Testing Pattern

```typescript
describe('POST /api/endpoint', () => {
  it('should create resource successfully', async () => {
    const testData = {
      name: 'Test Resource',
      description: 'Test Description'
    };

    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testData)
      .expect(201);

    expect(response.body).toMatchObject({
      name: testData.name,
      description: testData.description
    });
  });
});
```

### Service Testing Pattern

```typescript
describe('UserService', () => {
  it('should create user with hashed password', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = await userService.createUser(userData);
    
    expect(user.username).toBe(userData.username);
    expect(user.password).toBeUndefined(); // Password excluded from response
    
    // Verify password was hashed in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    expect(dbUser?.password).not.toBe(userData.password);
  });
});
```

### Authentication Testing

```typescript
// Using test helpers
const { user, authToken } = await createAuthenticatedUser();

const response = await request(app)
  .get('/api/protected-endpoint')
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200);
```

## Test Helpers

### Data Factories

The `helpers.ts` file provides factory functions for creating test data:

```typescript
// Create test user
const user = await createTestUser({
  username: 'customuser',
  email: 'custom@example.com'
});

// Create authenticated user with token
const { user, authToken } = await createAuthenticatedUser();

// Create test team with members
const { team, owner } = await createTestTeam({
  name: 'Test Team',
  memberCount: 3
});

// Create test task
const task = await createTestTask({
  title: 'Test Task',
  assigneeId: user.id,
  teamId: team.id
});
```

### Validation Helpers

```typescript
// Test input validation
await expectValidationError(
  request(app).post('/api/users').send(invalidData),
  ['email', 'password']
);

// Test authentication requirement
await expectAuthenticationError(
  request(app).get('/api/protected-endpoint')
);
```

## Coverage Requirements

The project maintains high test coverage standards:

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### Coverage Reports

```bash
# Generate and view coverage
npm run test:coverage
open coverage/lcov-report/index.html
```

## Database Testing

### Test Database Isolation

- Each test file uses transactions that are rolled back
- Database is cleaned between test suites
- Separate test database prevents data conflicts

### Migration Testing

```bash
# Test migrations on clean database
npm run test:db:reset
npm run test:db:setup
```

## CI/CD Integration

### GitHub Actions

The project includes a comprehensive CI/CD workflow (`.github/workflows/test.yml`):

- **Multi-node testing** (Node.js 18.x, 20.x)
- **PostgreSQL service** for database tests
- **Code coverage** reporting
- **Artifact archiving** for test results

### Local CI Simulation

```bash
# Run tests as they would in CI
npm run test:ci
```

## Debugging Tests

### Common Issues

1. **Database Connection**: Ensure test database exists and is accessible
2. **Environment Variables**: Check `.env.test` configuration
3. **Port Conflicts**: Ensure test ports are available
4. **Migration State**: Reset database if migrations are out of sync

### Debug Commands

```bash
# Debug database connectivity
npm run test:db:reset

# Run single test file
npx jest tests/user.test.ts

# Run tests with debug output
DEBUG=* npm test

# Run specific test case
npx jest -t "should create user successfully"
```

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "name": "Debug Jest Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "cwd": "${workspaceFolder}/backend"
}
```

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow the AAA pattern
3. **Test Isolation**: Each test should be independent
4. **Edge Cases**: Test boundary conditions and error scenarios
5. **Mock External Dependencies**: Use mocks for external services

### Test Organization

1. **Group Related Tests**: Use `describe` blocks for logical grouping
2. **Setup/Teardown**: Use `beforeEach`/`afterEach` for test preparation
3. **Shared Utilities**: Extract common test logic to helpers
4. **Data Management**: Use factories for consistent test data

### Performance

1. **Parallel Execution**: Tests run in parallel by default
2. **Database Cleanup**: Efficient cleanup between tests
3. **Resource Management**: Proper cleanup of resources
4. **Test Selection**: Use focused testing during development

## Troubleshooting

### Common Errors

| Error | Solution |
|-------|----------|
| `Database connection failed` | Check `.env.test` and ensure test database exists |
| `Port already in use` | Kill processes using test ports or change port configuration |
| `Migration failed` | Reset database with `npm run test:db:reset` |
| `Timeout errors` | Increase Jest timeout in `jest.config.js` |
| `Authentication failed` | Verify JWT secret and token generation |

### Getting Help

1. Check test output for specific error messages
2. Verify environment configuration
3. Run tests in verbose mode: `npm run test:verbose`
4. Check database logs for connection issues
5. Review Jest documentation for advanced configuration

## Future Enhancements

- **E2E Testing**: Browser automation with Playwright
- **Performance Testing**: Load testing with Artillery
- **Visual Testing**: Screenshot comparison testing
- **Contract Testing**: API contract validation
- **Mutation Testing**: Code quality validation with Stryker