// src/routes/scanLogs.ts
import { Router } from 'express';
import { getScanLogs, getScanStats } from '../controllers/scanLogsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getScanLogs);
router.get('/stats', getScanStats);

export default router;
