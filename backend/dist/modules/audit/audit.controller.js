import { auditService } from './audit.service.js';
export class AuditController {
    async listLogs(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const action = req.query.action;
            const entityType = req.query.entityType;
            const userId = req.query.userId;
            const data = await auditService.getAuditLogs({
                page,
                limit,
                action,
                entityType,
                userId,
            });
            res.json({
                success: true,
                data: data.items,
                pagination: data.pagination,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
export const auditController = new AuditController();
//# sourceMappingURL=audit.controller.js.map