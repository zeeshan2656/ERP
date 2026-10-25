import { Router } from 'express';
import { rolesController } from './roles.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { createRoleSchema, updateRoleSchema } from './roles.schema.js';
const router = Router();
router.use(authenticate);
router.get('/permissions-matrix', requirePermission('roles', 'view'), (req, res, next) => rolesController.getPermissionsMatrix(req, res, next));
router.get('/', requirePermission('roles', 'view'), (req, res, next) => rolesController.listRoles(req, res, next));
router.post('/', requirePermission('roles', 'add'), validate({ body: createRoleSchema }), (req, res, next) => rolesController.createRole(req, res, next));
router.get('/:id', requirePermission('roles', 'view'), (req, res, next) => rolesController.getRole(req, res, next));
router.put('/:id', requirePermission('roles', 'edit'), validate({ body: updateRoleSchema }), (req, res, next) => rolesController.updateRole(req, res, next));
router.delete('/:id', requirePermission('roles', 'delete'), (req, res, next) => rolesController.deleteRole(req, res, next));
export default router;
//# sourceMappingURL=roles.routes.js.map