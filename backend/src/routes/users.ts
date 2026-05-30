// src/routes/users.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  regenerateQr,
} from '../controllers/usersController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/', getUsers);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  getUserById
);

router.post(
  '/',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  validate,
  createUser
);

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  validate,
  updateUser
);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  deleteUser
);

router.post(
  '/:id/regenerate-qr',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  regenerateQr
);

export default router;
