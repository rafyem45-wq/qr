// src/routes/scanner.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { verifyQr } from '../controllers/scannerController';
import { validate } from '../middleware/validate';

const router = Router();

// Scanner endpoint - public (no auth required for scanning)
router.post(
  '/verify',
  [body('qr_data').trim().notEmpty().withMessage('QR data is required')],
  validate,
  verifyQr
);

export default router;
