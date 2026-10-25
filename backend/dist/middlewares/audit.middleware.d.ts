import { Request } from 'express';
export interface AuditLogParams {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string;
    userAgent?: string;
}
export declare function logAuditEvent(params: AuditLogParams): Promise<void>;
export declare function auditAction(actionName: string, entityType: string): (req: Request, entityId?: string, oldValues?: Record<string, unknown>, newValues?: Record<string, unknown>) => void;
