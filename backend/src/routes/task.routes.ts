import { Router } from 'express';
import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
  assignTaskController,
  getTaskStatisticsController
} from '../controllers/task.controller';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  taskQuerySchema
} from '../validators/task.validator';
import validate from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

// Task CRUD operations
router.post('/', validate(createTaskSchema), createTaskController);
router.get('/', validate(taskQuerySchema, 'query'), getTasksController);
router.get('/statistics', getTaskStatisticsController);
router.get('/:taskId', getTaskByIdController);
router.put('/:taskId', validate(updateTaskSchema), updateTaskController);
router.delete('/:taskId', deleteTaskController);

// Task assignment
router.post('/:taskId/assign', validate(assignTaskSchema), assignTaskController);

export default router;