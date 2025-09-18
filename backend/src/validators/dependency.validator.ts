import Joi from 'joi';

export const createDependencySchema = Joi.object({
  taskId: Joi.string().required().messages({
    'any.required': 'Task ID is required'
  }),
  dependsOnTaskId: Joi.string().required().messages({
    'any.required': 'Dependency task ID is required'
  })
});

export const dependencyQuerySchema = Joi.object({
  teamId: Joi.string().optional()
});