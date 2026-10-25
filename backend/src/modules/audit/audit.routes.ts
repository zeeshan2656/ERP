import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('settings', 'view'),
  (req, res, next) => auditController.listLogs(req, res, next)
);

export default router;
