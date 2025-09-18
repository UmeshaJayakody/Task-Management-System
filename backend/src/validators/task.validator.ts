import Joi from 'joi';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.empty': 'Task title is required',
    'string.max': 'Task title must be less than 200 characters'
  }),
  description: Joi.string().max(2000).optional().allow(''),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  dueDate: Joi.date().optional().allow(null).messages({
    'date.base': 'Due date must be a valid date'
  }),
  teamId: Joi.string().optional().allow(''),
  assigneeIds: Joi.array().items(Joi.string()).optional()
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED').optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  dueDate: Joi.date().optional().allow(null)
});

export const assignTaskSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).required().messages({
    'array.base': 'userIds must be an array',
    'any.required': 'userIds is required'
  })
});

export const taskQuerySchema = Joi.object({
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED').optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  assigneeId: Joi.string().optional(),
  teamId: Joi.string().optional(),
  createdById: Joi.string().optional(),
  dueDateBefore: Joi.date().optional(),
  dueDateAfter: Joi.date().optional(),
  search: Joi.string().max(100).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});