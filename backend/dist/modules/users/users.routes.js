import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { createUserSchema, updateUserSchema, adminResetPasswordSchema, userQuerySchema, } from './users.schema.js';
const router = Router();
// All user management routes require authentication
router.use(authenticate);
router.get('/', requirePermission('users', 'view'), validate({ query: userQuerySchema }), (req, res, next) => usersController.listUsers(req, res, next));
router.post('/', requirePermission('users', 'add'), validate({ body: createUserSchema }), (req, res, next) => usersController.createUser(req, res, next));
router.get('/:id', requirePermission('users', 'view'), (req, res, next) => usersController.getUser(req, res, next));
router.put('/:id', requirePermission('users', 'edit'), validate({ body: updateUserSchema }), (req, res, next) => usersController.updateUser(req, res, next));
router.delete('/:id', requirePermission('users', 'delete'), (req, res, next) => usersController.deleteUser(req, res, next));
router.put('/:id/status', requirePermission('users', 'edit'), (req, res, next) => usersController.toggleStatus(req, res, next));
router.put('/:id/reset-password', requirePermission('users', 'edit'), validate({ body: adminResetPasswordSchema }), (req, res, next) => usersController.resetPassword(req, res, next));
export default router;
//# sourceMappingURL=users.routes.js.map