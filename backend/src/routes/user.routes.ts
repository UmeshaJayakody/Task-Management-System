import { Router } from 'express';
const router: import('express').Router = Router();
import { createUser, loginUser, getUserProfile, updateUserProfile, deleteUserProfile, checkEmailExistsController, getUserByIdController, searchUsersController, testSearchController } from '../controllers/user.controller';
import { registerSchema, loginSchema } from '../validators/user.validator';
import validate from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';

router.get('/check-email', checkEmailExistsController);
router.get('/test-search', testSearchController); // Test endpoint (no auth needed)
router.get('/find-users', authMiddleware, searchUsersController); // Alternative endpoint
router.get('/search', authMiddleware, searchUsersController);
router.get('/profile', authMiddleware, getUserProfile);
router.get('/:userId', getUserByIdController);
router.post('/register', validate(registerSchema), createUser);
router.post('/login', validate(loginSchema), loginUser);
router.put('/profile', authMiddleware, updateUserProfile);
router.delete('/profile', authMiddleware, deleteUserProfile);


export default router;
