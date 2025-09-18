import Joi from 'joi';

export const createTeamSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Team name is required',
    'string.max': 'Team name must be less than 100 characters'
  }),
  description: Joi.string().max(500).optional().allow('')
});

export const updateTeamSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional().allow('')
});

export const addTeamMemberSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'User ID is required'
  }),
  role: Joi.string().valid('OWNER', 'ADMIN', 'MEMBER').optional()
});

export const updateTeamMemberRoleSchema = Joi.object({
  role: Joi.string().valid('ADMIN', 'MEMBER').required().messages({
    'any.required': 'Role is required',
    'any.only': 'Role must be either ADMIN or MEMBER'
  })
});