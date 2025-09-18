import Joi from 'joi';

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Comment content is required',
    'string.max': 'Comment must be less than 1000 characters'
  }),
  taskId: Joi.string().required().messages({
    'any.required': 'Task ID is required'
  })
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Comment content is required',
    'string.max': 'Comment must be less than 1000 characters'
  })
});

export const commentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});