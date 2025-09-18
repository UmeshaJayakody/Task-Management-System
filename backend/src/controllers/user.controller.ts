import type { Request, Response, NextFunction } from 'express';
import { register, login, getProfile, updateProfile, deleteProfile, checkEmailExists, getUserById } from '../services/user.service';

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
    res.status(200).json(user);
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
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }
    const user = await getUserById(userId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

