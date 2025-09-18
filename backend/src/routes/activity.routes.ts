import { Router } from 'express';
import { getActivitiesController } from '../controllers/activity.controller';
import { activityQuerySchema } from '../validators/activity.validator';
import validate from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

// All activity routes require authentication
router.use(authMiddleware);

router.get('/', validate(activityQuerySchema, 'query'), getActivitiesController);

export default router;