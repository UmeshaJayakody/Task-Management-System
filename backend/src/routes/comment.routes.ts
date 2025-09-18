import { Router } from 'express';
import {
  createCommentController,
  getTaskCommentsController,
  updateCommentController,
  deleteCommentController
} from '../controllers/comment.controller';
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema
} from '../validators/comment.validator';
import validate from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

// All comment routes require authentication
router.use(authMiddleware);

// Comment CRUD operations
router.post('/', validate(createCommentSchema), createCommentController);
router.get('/task/:taskId', validate(commentQuerySchema, 'query'), getTaskCommentsController);
router.put('/:commentId', validate(updateCommentSchema), updateCommentController);
router.delete('/:commentId', deleteCommentController);

export default router;