// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiResponse } from '../types';

export interface AuthRequest extends Request {
  adminId?: string;
  adminEmail?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided. Authorization header must be "Bearer <token>"',
      } as ApiResponse);
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    req.adminId = payload.adminId;
    req.adminEmail = payload.email;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    } as ApiResponse);
  }
};
