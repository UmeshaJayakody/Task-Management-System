import { Router } from 'express';
import {
  addTaskDependencyController,
  removeTaskDependencyController,
  getTaskDependenciesController,
  validateTaskCompletionController,
  getDependencyGraphController
} from '../controllers/dependency.controller';
import {
  createDependencySchema,
  dependencyQuerySchema
} from '../validators/dependency.validator';
import validate from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

// All dependency routes require authentication
router.use(authMiddleware);

// Dependency management
router.post('/', validate(createDependencySchema), addTaskDependencyController);
router.delete('/:dependencyId', removeTaskDependencyController);
router.get('/task/:taskId', getTaskDependenciesController);
router.get('/task/:taskId/validate-completion', validateTaskCompletionController);
router.get('/graph', validate(dependencyQuerySchema, 'query'), getDependencyGraphController);

export default router;