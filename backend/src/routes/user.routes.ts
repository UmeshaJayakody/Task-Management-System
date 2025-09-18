import { Router } from 'express';
const router: import('express').Router = Router();
import { createUser, loginUser, getUserProfile, updateUserProfile, deleteUserProfile, checkEmailExistsController, getUserByIdController } from '../controllers/user.controller';
import { registerSchema, loginSchema } from '../validators/user.validator';
import validate from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';

router.get('/check-email', checkEmailExistsController);
router.get('/profile', authMiddleware, getUserProfile);
router.get('/:userId', getUserByIdController);
router.post('/register', validate(registerSchema), createUser);
router.post('/login', validate(loginSchema), loginUser);
router.put('/profile', authMiddleware, updateUserProfile);
router.delete('/profile', authMiddleware, deleteUserProfile);


export default router;
