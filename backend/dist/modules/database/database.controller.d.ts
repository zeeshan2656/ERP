import { Request, Response, NextFunction } from 'express';
export declare class DatabaseController {
    /**
     * GET /api/v1/database/overview
     */
    getOverview(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/database/tables
     */
    listTables(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/database/tables/:tableName/structure
     */
    getTableStructure(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/database/preview-sql
     */
    previewSql(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/database/tables
     */
    createTable(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/database/tables/:tableName
     */
    alterTable(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/database/tables/:tableName
     */
    dropTable(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/database/tables/:tableName/data
     */
    fetchTableData(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/database/tables/:tableName/data
     */
    insertRecord(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/database/tables/:tableName/data/:pkValue
     */
    updateRecord(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/database/tables/:tableName/data/:pkValue
     */
    deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/database/foreign-options?table=...&column=...
     */
    getForeignKeyOptions(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const databaseController: DatabaseController;
