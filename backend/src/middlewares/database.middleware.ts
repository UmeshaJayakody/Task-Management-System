import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';

export const databaseErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Database Error:', error);

  // Handle Prisma connection errors
  if (error.code === 'P1001') {
    return res.status(503).json({
      error: 'Database connection failed',
      message: 'Unable to connect to the database. Please try again later.',
      code: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // Handle other Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Unique constraint violation',
          message: 'A record with this data already exists.',
          code: 'DUPLICATE_RECORD'
        });
      
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
          message: 'The requested record does not exist.',
          code: 'RECORD_NOT_FOUND'
        });
      
      default:
        return res.status(500).json({
          error: 'Database operation failed',
          message: 'An error occurred while processing your request.',
          code: 'DATABASE_ERROR'
        });
    }
  }

  if (error instanceof PrismaClientUnknownRequestError) {
    return res.status(500).json({
      error: 'Unknown database error',
      message: 'An unexpected database error occurred.',
      code: 'UNKNOWN_DATABASE_ERROR'
    });
  }

  // Pass other errors to the next error handler
  next(error);
};
