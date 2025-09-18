import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import userRoutes from '../src/routes/user.routes';
import { errorHandler } from '../src/middlewares/error.middleware';
import { prisma } from './setup';
import { createTestUser, generateAuthToken, createAuthHeaders } from './helpers';

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
});