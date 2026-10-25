import { Router } from 'express';
import { registryController } from './registry.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
const router = Router();
router.use(authenticate);
router.get('/', requirePermission('settings', 'view'), (req, res, next) => registryController.listModules(req, res, next));
router.put('/:key/toggle', requirePermission('settings', 'edit'), (req, res, next) => registryController.toggleModule(req, res, next));
export default router;
//# sourceMappingURL=registry.routes.js.map