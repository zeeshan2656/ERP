import { authService } from './auth.service.js';
export class AuthController {
    async login(req, res, next) {
        try {
            const { emailOrUsername, password } = req.body;
            const ip = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await authService.login(emailOrUsername, password, ip, userAgent);
            res.json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async logout(req, res, next) {
        try {
            // In JWT stateless setup, client drops token.
            res.json({
                success: true,
                message: 'Successfully logged out.',
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getMe(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const data = await authService.getCurrentUserProfile(req.user.id);
            res.json({
                success: true,
                data,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async changePassword(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { fullName, email, avatarMediaId } = req.body;
            const result = await authService.updateProfile(req.user.id, fullName, email, avatarMediaId);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async updateThemePreference(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { themePreference, customTokens } = req.body;
            const result = await authService.updateThemePreference(req.user.id, themePreference, customTokens);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
export const authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map