import Joi from 'joi';

export const activityQuerySchema = Joi.object({
  teamId: Joi.string().optional(),
  entityType: Joi.string().valid('USER', 'TASK', 'TEAM', 'COMMENT').optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});