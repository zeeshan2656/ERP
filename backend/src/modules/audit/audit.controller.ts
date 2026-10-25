import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service.js';

export class AuditController {
  async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const action = req.query.action as string | undefined;
      const entityType = req.query.entityType as string | undefined;
      const userId = req.query.userId as string | undefined;

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
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
