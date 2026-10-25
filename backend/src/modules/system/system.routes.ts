import { Router } from 'express';
import { systemController } from './system.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { setupWizardSchema } from './system.schema.js';

const router = Router();

router.get('/health', (req, res, next) => systemController.getHealth(req, res, next));
router.get('/setup-status', (req, res, next) => systemController.getSetupStatus(req, res, next));
router.post(
  '/setup',
  validate({ body: setupWizardSchema }),
  (req, res, next) => systemController.performSetup(req, res, next)
);
router.get('/public-config', (req, res, next) => systemController.getPublicConfig(req, res, next));

export default router;
