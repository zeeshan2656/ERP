import { query } from '../config/database.js';
export function requirePermission(moduleKey, action) {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        // Super Admin role has unrestricted system access
        if (req.user.roleSlug === 'admin') {
            next();
            return;
        }
        try {
            const rows = await query(`SELECT can_view, can_add, can_edit, can_delete
         FROM role_permissions
         WHERE role_id = ? AND module_key = ?
         LIMIT 1`, [req.user.roleId, moduleKey]);
            if (!rows || rows.length === 0) {
                res.status(403).json({
                    success: false,
                    message: `Access denied: No permissions configured for module '${moduleKey}'.`,
                });
                return;
            }
            const perm = rows[0];
            const column = `can_${action}`;
            const hasPermission = Boolean(perm[column]);
            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    message: `Access denied: You do not have permission to ${action} in module '${moduleKey}'.`,
                });
                return;
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=permission.middleware.js.map