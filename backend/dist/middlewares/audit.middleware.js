import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
export async function logAuditEvent(params) {
    try {
        const id = uuidv4();
        await query(`INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [
            id,
            params.userId || null,
            params.action,
            params.entityType,
            params.entityId || null,
            params.oldValues ? JSON.stringify(params.oldValues) : null,
            params.newValues ? JSON.stringify(params.newValues) : null,
            params.ipAddress || null,
            params.userAgent || null,
        ]);
    }
    catch (err) {
        logger.error('Failed to write audit log entry', {
            error: err.message,
            action: params.action,
            entityType: params.entityType,
        });
    }
}
export function auditAction(actionName, entityType) {
    return (req, entityId, oldValues, newValues) => {
        const userId = req.user?.id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        // Asynchronously log audit event without blocking response
        logAuditEvent({
            userId,
            action: actionName,
            entityType,
            entityId,
            oldValues,
            newValues,
            ipAddress,
            userAgent,
        });
    };
}
//# sourceMappingURL=audit.middleware.js.map