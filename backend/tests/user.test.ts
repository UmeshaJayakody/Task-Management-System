import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middlewares/error.middleware';
import userRoutes from '../src/routes/user.routes';
import { createAuthHeaders, createTestUser, generateAuthToken } from './helpers';
import { prisma } from './setup';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

describe('User Authentication & Management', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
        },
      });

      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'testPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Create user first
      await createTestUser(userData);

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const password = 'testPassword123';
      const user = await createTestUser({
        email: 'login@example.com',
        password: await bcrypt.hash(password, 10),
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: user.email,
          password: password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
        },
      });

      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for invalid credentials', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: user.email,
          password: 'wrongPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id);

      const response = await request(app)
        .get('/api/users/profile')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });

      expect(response.body.data.password).toBeUndefined();
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set(createAuthHeaders('invalid-token'))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id);

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890',
        bio: 'Updated bio',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set(createAuthHeaders(token))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          ...updateData,
          id: user.id,
          email: user.email,
        },
      });

      // Verify update in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser).toMatchObject(updateData);
    });

    it('should validate update data', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id);

      const invalidData = {
        email: 'invalid-email-format',
        phone: 'invalid-phone',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set(createAuthHeaders(token))
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('Password Management', () => {
    it('should change password successfully', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id);

      const passwordData = {
        currentPassword: 'testPassword123',
        newPassword: 'newPassword456',
      };

      const response = await request(app)
        .put('/api/users/password')
        .set(createAuthHeaders(token))
        .send(passwordData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password updated successfully',
      });

      // Verify password change by logging in with new password
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: user.email,
          password: 'newPassword456',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password change with wrong current password', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id);

      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
      };

      const response = await request(app)
        .put('/api/users/password')
        .set(createAuthHeaders(token))
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('current password');
    });

    it('should validate new password requirements', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id);

      const passwordData = {
        currentPassword: 'testPassword123',
        newPassword: '123', // Too short
      };

      const response = await request(app)
        .put('/api/users/password')
        .set(createAuthHeaders(token))
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('User Search and Listing', () => {
    it('should search users by name or email', async () => {
      const users = await Promise.all([
        createTestUser({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }),
        createTestUser({ firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }),
        createTestUser({ firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com' }),
      ]);

      const token = generateAuthToken(users[0].id);

      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'John' })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2); // John Doe and Bob Johnson
    });

    it('should paginate search results', async () => {
      // Create multiple test users
      const users = [];
      for (let i = 0; i < 15; i++) {
        users.push(await createTestUser({
          firstName: `User${i}`,
          email: `user${i}@example.com`
        }));
      }

      const token = generateAuthToken(users[0].id);

      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'User', page: 1, limit: 5 })
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(15);
    });
  });

  describe('Account Management', () => {
    it('should deactivate user account', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id);

      const response = await request(app)
        .put('/api/users/deactivate')
        .set(createAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Verify user cannot login after deactivation
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: user.email,
          password: 'testPassword123',
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
    });

    it('should update last login timestamp', async () => {
      const user = await createTestUser();

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: user.email,
          password: 'testPassword123',
        })
        .expect(200);

      // Check that lastLoginAt was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(new Date(updatedUser!.lastLoginAt!)).toBeInstanceOf(Date);
    });
  });

  describe('Data Validation', () => {
    it('should validate email format during registration', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            email,
            password: 'testPassword123',
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      }
    });

    it('should validate required fields during registration', async () => {
      const requiredFields = ['email', 'password', 'firstName', 'lastName'];

      for (const field of requiredFields) {
        const userData = {
          email: 'test@example.com',
          password: 'testPassword123',
          firstName: 'Test',
          lastName: 'User',
        };

        delete userData[field as keyof typeof userData];

        const response = await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      }
    });

    it('should enforce password strength requirements', async () => {
      const weakPasswords = [
        '123',           // Too short
        'password',      // No numbers
        '12345678',      // No letters
        'Pass1',         // Too short
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password,
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle duplicate email registration gracefully', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'testPassword123',
        firstName: 'First',
        lastName: 'User',
      };

      // First registration should succeed
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/users/register')
        .send({
          ...userData,
          firstName: 'Second',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long input data', async () => {
      const longString = 'a'.repeat(1000);

      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'testPassword123',
          firstName: longString,
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";

      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: maliciousEmail,
          password: 'testPassword123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});