import { prisma } from '../utils/database';
import jwt from 'jsonwebtoken';
import { comparePassword, hashPassword } from '../utils/hash';

// Type definitions
interface UserRegistrationData {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  address?: string;
  phone?: string;
}

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ErrorWithStatus extends Error {
  status?: number;
}

// Register a new user
export const register = async ({ email, firstName, lastName, password, address, phone }: UserRegistrationData) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error('Email already exists. Please use a different email address.') as ErrorWithStatus;
    err.name = 'BadRequestError'; 
    err.status = 400; 
    throw err;
  }
  
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      password: hashedPassword,
      address,
      phone,
    },
  });

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Login user
export const login = async ({ email, password }: LoginData) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

// Get user profile
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

// Update user profile
export const updateProfile = async (userId: string, data: UserUpdateData) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      bio: data.bio,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  return updatedUser;
};

// Delete user profile
export const deleteProfile = async (userId: string) => {
  await prisma.user.delete({
    where: { id: userId },
  });
};

// Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return !!user;
};

// Get user by ID
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

// Search users by email for team member invitation
export const searchUsersByEmail = async (emailQuery: string) => {
  console.log('🔍 Searching users with email query:', emailQuery);
  
  try {
    // Validate input
    if (!emailQuery || typeof emailQuery !== 'string') {
      console.log('⚠️ Invalid email query, returning empty array');
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: emailQuery,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      take: 10 // Limit results to 10 users
    });

    console.log('✅ Search results:', users.length, 'users found');
    return users || []; // Ensure we always return an array
  } catch (error) {
    console.error('❌ Error in searchUsersByEmail:', error);
    // Return empty array instead of throwing error
    return [];
  }
};