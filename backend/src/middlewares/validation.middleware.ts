import type { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware that can validate different parts of the request
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Source to validate: 'body', 'query', 'params' (default: 'body')
 */
export default (schema: any, source = 'body') => (req: Request, res: Response, next: NextFunction): void => {
  console.log(`=== Validation Middleware (${source}) ===`);
  
  let dataToValidate;
  switch (source) {
    case 'query':
      dataToValidate = req.query;
      break;
    case 'params':
      dataToValidate = req.params;
      break;
    case 'body':
    default:
      dataToValidate = req.body;
      break;
  }
  
  console.log(`${source.charAt(0).toUpperCase() + source.slice(1)} data:`, JSON.stringify(dataToValidate, null, 2));
  
  const { error, value } = schema.validate(dataToValidate, { 
    abortEarly: false,
    allowUnknown: true,   // Allow unknown fields, especially for query params
    stripUnknown: false   // Don't strip unknown fields to avoid modification issues
  });
  
  if (error) {
    console.log('Validation Error:', error.details[0].message);
    console.log('Full error details:', error.details);
    
    res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
    return;
  }
  
  // Replace the validated data with the sanitized version
  switch (source) {
    case 'query':
      // Don't reassign req.query as it's read-only in newer Express versions
      // The validation already passed, so we can continue
      break;
    case 'params':
      // Don't reassign req.params as it can also be read-only
      // The validation already passed, so we can continue
      break;
    case 'body':
    default:
      req.body = value;
      break;
  }
  
  console.log('Validation passed');
  next();
}; 

