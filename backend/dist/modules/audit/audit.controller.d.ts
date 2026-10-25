import { Request, Response, NextFunction } from 'express';
export declare class AuditController {
    listLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const auditController: AuditController;
