import { Router } from 'express';
import {
  createTeamController,
  getTeamsController,
  getTeamByIdController,
  updateTeamController,
  deleteTeamController,
  addTeamMemberController,
  removeTeamMemberController,
  updateTeamMemberRoleController,
  leaveTeamController
} from '../controllers/team.controller';
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  updateTeamMemberRoleSchema
} from '../validators/team.validator';
import validate from '../middlewares/validation.middleware';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

// All team routes require authentication
router.use(authMiddleware);

// Team CRUD operations
router.post('/', validate(createTeamSchema), createTeamController);
router.get('/', getTeamsController);
router.get('/:teamId', getTeamByIdController);
router.put('/:teamId', validate(updateTeamSchema), updateTeamController);
router.delete('/:teamId', deleteTeamController);

// Team membership management
router.post('/:teamId/members', validate(addTeamMemberSchema), addTeamMemberController);
router.delete('/:teamId/members/:memberId', removeTeamMemberController);
router.put('/:teamId/members/:memberId/role', validate(updateTeamMemberRoleSchema), updateTeamMemberRoleController);
router.post('/:teamId/leave', leaveTeamController);

export default router;