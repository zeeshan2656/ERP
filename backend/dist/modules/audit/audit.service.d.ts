export declare class AuditService {
    getAuditLogs(params: {
        page?: number;
        limit?: number;
        action?: string;
        entityType?: string;
        userId?: string;
    }): Promise<{
        items: {
            id: string;
            userId: string | null;
            username: string | null;
            userFullName: string | null;
            action: string;
            entityType: string;
            entityId: string | null;
            oldValues: any;
            newValues: any;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export declare const auditService: AuditService;
