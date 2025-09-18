import type { Request, Response, NextFunction } from 'express';
import { register, login, getProfile, updateProfile, deleteProfile, checkEmailExists, getUserById, searchUsersByEmail } from '../services/user.service';

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
            const { email, firstName, lastName, password, address, phone } = req.body;
            const user = await register({ email, firstName, lastName, password,address, phone });
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    next(err);
  }
};

export const checkEmailExistsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    const exists = await checkEmailExists(email as string);
    res.status(200).json({ exists });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
    const result = await login(req.body);
    res.status(200).json({ message: 'Login successful', ...result });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getProfile((req as any).user.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateData = req.body;
    const updatedUser = await updateProfile((req as any).user.id, updateData);
    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    next(err);
  }
};

export const deleteUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteProfile((req as any).user.id);
    res.status(200).json({ message: 'Profile deleted' });
  } catch (err) {
    next(err);
  }
};

export const getUserByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔍 getUserByIdController called with params:', req.params);
    console.log('🔍 getUserByIdController URL:', req.url);
    console.log('🔍 getUserByIdController path:', req.path);
    
    const { userId } = req.params;
    if (!userId) {
      console.log('❌ getUserByIdController: No userId provided');
      res.status(400).json({ message: 'User ID is required' });
      return;
    }
    
    console.log('📤 getUserByIdController: Looking for user with ID:', userId);
    const user = await getUserById(userId);
    res.status(200).json(user);
  } catch (err) {
    console.error('❌ getUserByIdController error:', err);
    next(err);
  }
};

export const searchUsersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔍 User search request received');
    console.log('📋 Query params:', req.query);
    console.log('📋 Full URL:', req.url);
    console.log('📋 Path:', req.path);
    
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      console.log('❌ Invalid email query parameter');
      res.status(400).json({ success: false, message: 'Email query parameter is required' });
      return;
    }
    
    console.log('📤 Searching for users with email:', email);
    const users = await searchUsersByEmail(email);
    console.log('✅ Search completed, returning', users.length, 'users');
    
    // Always return success, even if no users found
    res.status(200).json({ success: true, users });
  } catch (err: any) {
    console.error('❌ Error in searchUsersController:', err);
    // Return empty array instead of error
    res.status(200).json({ success: true, users: [] });
  }
};

// Test endpoint to verify routing is working
export const testSearchController = async (req: Request, res: Response): Promise<void> => {
  console.log('🧪 Test search endpoint hit!');
  res.status(200).json({ 
    success: true, 
    message: 'Search endpoint is working!', 
    query: req.query,
    url: req.url,
    path: req.path
  });
};

