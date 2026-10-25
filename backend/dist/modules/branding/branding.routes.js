import { Router } from 'express';
import { brandingController } from './branding.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { updateBrandingSchema } from './branding.schema.js';
const router = Router();
router.use(authenticate);
router.get('/', requirePermission('settings', 'view'), (req, res, next) => brandingController.getBranding(req, res, next));
router.put('/', requirePermission('settings', 'edit'), validate({ body: updateBrandingSchema }), (req, res, next) => brandingController.updateBranding(req, res, next));
export default router;
//# sourceMappingURL=branding.routes.js.map