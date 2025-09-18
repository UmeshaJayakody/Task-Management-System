import bcrypt from 'bcryptjs';
import * as userService from '../src/services/user.service';
import { createTestUser } from './helpers';
import { prisma } from './setup';

describe('UserService', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await userService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect((user as any).password).toBeUndefined(); // Password should not be returned

      // Verify password is properly hashed in database
      const userInDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userInDb?.password).not.toBe(userData.password);

      const isPasswordValid = await bcrypt.compare(userData.password, userInDb!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'testPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await userService.register(userData);

      await expect(userService.register(userData)).rejects.toThrow();
    });

    it('should trim and normalize email', async () => {
      const userData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'testPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await userService.register(userData);
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const user = await createTestUser();

      const result = await userService.login({
        email: user.email,
        password: 'testPassword123'
      });

      expect(result).toBeDefined();
      expect(result.user.id).toBe(user.id);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const user = await createTestUser();

      await expect(
        userService.login({ email: user.email, password: 'wrongPassword' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject non-existent email', async () => {
      await expect(
        userService.login({ email: 'nonexistent@example.com', password: 'password' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const user = await createTestUser();

      const result = await userService.getUserById(user.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect((result as any).password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      const result = await userService.getUserById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const user = await createTestUser();
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890',
        bio: 'Updated bio',
      };

      const updatedUser = await userService.updateProfile(user.id, updateData);

      expect(updatedUser).toMatchObject(updateData);
      expect(updatedUser.id).toBe(user.id);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userService.updateProfile('non-existent-id', { firstName: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('getProfile', () => {
    it('should get user profile without password', async () => {
      const user = await createTestUser();

      const profile = await userService.getProfile(user.id);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(user.id);
      expect(profile.email).toBe(user.email);
      expect((profile as any).password).toBeUndefined();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userService.getProfile('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('checkEmailExists', () => {
    it('should return true for existing email', async () => {
      const user = await createTestUser();

      const exists = await userService.checkEmailExists(user.email);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await userService.checkEmailExists('nonexistent@example.com');
      expect(exists).toBe(false);
    });

    it('should be case insensitive', async () => {
      const user = await createTestUser({ email: 'test@example.com' });

      const exists = await userService.checkEmailExists('TEST@EXAMPLE.COM');
      expect(exists).toBe(true);
    });
  });

  describe('searchUsersByEmail', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'john.doe@example.com' });
      await createTestUser({ email: 'jane.smith@example.com' });
      await createTestUser({ email: 'bob.johnson@company.com' });
    });

    it('should search users by email pattern', async () => {
      const results = await userService.searchUsersByEmail('example.com');

      expect(results.length).toBe(2);
      expect(results.every((user: any) => user.email.includes('example.com'))).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const results = await userService.searchUsersByEmail('nonexistent.com');
      expect(results).toHaveLength(0);
    });

    it('should exclude passwords from search results', async () => {
      const results = await userService.searchUsersByEmail('example.com');

      results.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile', async () => {
      const user = await createTestUser();

      await userService.deleteProfile(user.id);

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(deletedUser).toBeNull();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userService.deleteProfile('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid email format', async () => {
      await expect(
        userService.register({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow();
    });

    it('should handle empty strings gracefully', async () => {
      await expect(
        userService.getUserById('')
      ).rejects.toThrow();
    });

    it('should handle null/undefined inputs', async () => {
      await expect(
        userService.getUserById(null as any)
      ).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      await expect(
        userService.register({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        })
      ).rejects.toThrow();
    });
  });
});