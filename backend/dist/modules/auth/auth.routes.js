import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { rateLimiter } from '../../middlewares/rate-limit.middleware.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema, updateProfileSchema, updateThemePrefSchema, } from './auth.schema.js';
const router = Router();
// Public routes with rate limiting
router.post('/login', rateLimiter(10, 60 * 1000), // Max 10 attempts per minute
validate({ body: loginSchema }), (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', validate({ body: refreshTokenSchema }), (req, res, next) => authController.refreshToken(req, res, next));
// Protected routes
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.put('/profile', authenticate, validate({ body: updateProfileSchema }), (req, res, next) => authController.updateProfile(req, res, next));
router.put('/change-password', authenticate, validate({ body: changePasswordSchema }), (req, res, next) => authController.changePassword(req, res, next));
router.put('/preferences/theme', authenticate, validate({ body: updateThemePrefSchema }), (req, res, next) => authController.updateThemePreference(req, res, next));
export default router;
//# sourceMappingURL=auth.routes.js.map