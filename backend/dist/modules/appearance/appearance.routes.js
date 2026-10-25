import { Router } from 'express';
import { appearanceController } from './appearance.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { updateAppearanceSchema } from './appearance.schema.js';
const router = Router();
router.use(authenticate);
router.get('/', requirePermission('settings', 'view'), (req, res, next) => appearanceController.getSettings(req, res, next));
router.put('/', requirePermission('settings', 'edit'), validate({ body: updateAppearanceSchema }), (req, res, next) => appearanceController.updateSettings(req, res, next));
router.post('/reset', requirePermission('settings', 'edit'), (req, res, next) => appearanceController.resetSettings(req, res, next));
router.post('/reset-soft-ui', requirePermission('settings', 'edit'), (req, res, next) => appearanceController.resetSoftUiSettings(req, res, next));
router.post('/reset-style', requirePermission('settings', 'edit'), (req, res, next) => appearanceController.resetStyle(req, res, next));
router.post('/reset-style/:style', requirePermission('settings', 'edit'), (req, res, next) => appearanceController.resetStyle(req, res, next));
export default router;
//# sourceMappingURL=appearance.routes.js.map