// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: errors.array().map(e => e.msg).join(', '),
    } as ApiResponse);
    return;
  }
  next();
};
