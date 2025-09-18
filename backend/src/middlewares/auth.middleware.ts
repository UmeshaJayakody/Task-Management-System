import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export default (req: Request, res: Response, next: NextFunction): void => {
  console.log('🔐 Auth middleware - Path:', req.path, 'Method:', req.method);
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid authorization header');
    res.status(401).json({ message: 'Unauthorized: Token missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ Token malformed');
    res.status(401).json({ message: 'Unauthorized: Token malformed' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified for user:', (decoded as any).userId);
    (req as any).user = decoded; // Add user info to request
    next();
  } catch (err) {
    console.log('❌ Token invalid:', err);
    res.status(401).json({ message: 'Unauthorized: Token invalid' });
    return;
  }
};