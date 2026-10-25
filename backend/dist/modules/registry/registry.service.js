import { query } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';
export class RegistryService {
    async listModules() {
        const rows = await query('SELECT * FROM module_registry ORDER BY menu_position ASC');
        return rows.map((r) => ({
            id: r.id,
            moduleKey: r.module_key,
            name: r.name,
            description: r.description,
            iconName: r.icon_name,
            routePath: r.route_path,
            menuPosition: r.menu_position,
            isCore: Boolean(r.is_core),
            isEnabled: Boolean(r.is_enabled),
            permissionKey: r.permission_key,
            category: r.category,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        }));
    }
    async toggleModule(moduleKey, isEnabled, actorUserId) {
        const rows = await query('SELECT id, module_key, name, is_core, is_enabled FROM module_registry WHERE module_key = ? LIMIT 1', [moduleKey]);
        if (!rows || rows.length === 0) {
            throw new AppError(`Module '${moduleKey}' not found.`, 404);
        }
        const mod = rows[0];
        if (mod.is_core && !isEnabled) {
            throw new AppError(`Cannot disable core module '${mod.name}'. Core modules are required for platform operation.`, 400);
        }
        await query('UPDATE module_registry SET is_enabled = ?, version = version + 1 WHERE module_key = ?', [isEnabled ? 1 : 0, moduleKey]);
        await logAuditEvent({
            userId: actorUserId,
            action: isEnabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED',
            entityType: 'module',
            entityId: moduleKey,
            oldValues: { isEnabled: Boolean(mod.is_enabled) },
            newValues: { isEnabled },
        });
        return {
            success: true,
            message: `Module '${mod.name}' has been ${isEnabled ? 'enabled' : 'disabled'}.`,
            data: {
                moduleKey,
                isEnabled,
            },
        };
    }
}
export const registryService = new RegistryService();
//# sourceMappingURL=registry.service.js.map