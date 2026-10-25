import { Request, Response, NextFunction } from 'express';
export declare class QueriesController {
    listQueries(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueryById(req: Request, res: Response, next: NextFunction): Promise<void>;
    createQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    duplicateQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    previewQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    generateSql(req: Request, res: Response, next: NextFunction): Promise<void>;
    executeSavedQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueryMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    getExecutionHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const queriesController: QueriesController;
