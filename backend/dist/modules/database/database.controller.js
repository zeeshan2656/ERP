import { databaseService } from './database.service.js';
import { CreateTableSchema, AlterTableSchema, TableDataQuerySchema, RecordUpsertSchema, } from './database.schema.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';
export class DatabaseController {
    /**
     * GET /api/v1/database/overview
     */
    async getOverview(req, res, next) {
        try {
            const overview = await databaseService.getDatabaseOverview();
            res.json({
                success: true,
                data: overview,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/database/tables
     */
    async listTables(req, res, next) {
        try {
            const tables = await databaseService.listTables();
            res.json({
                success: true,
                data: tables,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/database/tables/:tableName/structure
     */
    async getTableStructure(req, res, next) {
        try {
            const { tableName } = req.params;
            const structure = await databaseService.getTableStructure(tableName);
            res.json({
                success: true,
                data: structure,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/database/preview-sql
     */
    async previewSql(req, res, next) {
        try {
            const { mode, payload, tableName } = req.body;
            if (mode === 'create') {
                const validated = CreateTableSchema.parse(payload);
                const sql = databaseService.generateCreateTableSql(validated);
                res.json({ success: true, sql });
                return;
            }
            if (mode === 'alter') {
                if (!tableName) {
                    res.status(400).json({ success: false, message: 'Table name is required for ALTER TABLE preview' });
                    return;
                }
                const validated = AlterTableSchema.parse(payload);
                const sqlStatements = databaseService.generateAlterTableSql(tableName, validated);
                res.json({ success: true, sql: sqlStatements.join('\n') });
                return;
            }
            res.status(400).json({ success: false, message: 'Invalid preview mode. Expected "create" or "alter".' });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/database/tables
     */
    async createTable(req, res, next) {
        try {
            const validated = CreateTableSchema.parse(req.body);
            const result = await databaseService.createTable(validated);
            logAuditEvent({
                userId: req.user?.id,
                action: 'DATABASE_TABLE_CREATED',
                entityType: 'database_table',
                entityId: validated.tableName,
                newValues: validated,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.status(201).json({
                success: true,
                message: result.message,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PUT /api/v1/database/tables/:tableName
     */
    async alterTable(req, res, next) {
        try {
            const { tableName } = req.params;
            const validated = AlterTableSchema.parse(req.body);
            const result = await databaseService.alterTable(tableName, validated);
            logAuditEvent({
                userId: req.user?.id,
                action: `DATABASE_TABLE_ALTERED_${validated.action.toUpperCase()}`,
                entityType: 'database_table',
                entityId: tableName,
                newValues: validated,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.json({
                success: true,
                message: result.message,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/database/tables/:tableName
     */
    async dropTable(req, res, next) {
        try {
            const { tableName } = req.params;
            const result = await databaseService.dropTable(tableName);
            logAuditEvent({
                userId: req.user?.id,
                action: 'DATABASE_TABLE_DROPPED',
                entityType: 'database_table',
                entityId: tableName,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/database/tables/:tableName/data
     */
    async fetchTableData(req, res, next) {
        try {
            const { tableName } = req.params;
            const queryDto = TableDataQuerySchema.parse(req.query);
            const result = await databaseService.fetchTableData(tableName, queryDto);
            res.json({
                success: true,
                data: result.data,
                columns: result.columns,
                primaryKey: result.primaryKey,
                pagination: result.pagination,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/database/tables/:tableName/data
     */
    async insertRecord(req, res, next) {
        try {
            const { tableName } = req.params;
            const validated = RecordUpsertSchema.parse(req.body);
            const result = await databaseService.insertRecord(tableName, validated.data);
            logAuditEvent({
                userId: req.user?.id,
                action: 'DATABASE_RECORD_INSERTED',
                entityType: tableName,
                entityId: result.insertId ? String(result.insertId) : undefined,
                newValues: validated.data,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.status(201).json({
                success: true,
                message: result.message,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PUT /api/v1/database/tables/:tableName/data/:pkValue
     */
    async updateRecord(req, res, next) {
        try {
            const { tableName, pkValue } = req.params;
            const validated = RecordUpsertSchema.parse(req.body);
            const result = await databaseService.updateRecord(tableName, pkValue, validated.data);
            logAuditEvent({
                userId: req.user?.id,
                action: 'DATABASE_RECORD_UPDATED',
                entityType: tableName,
                entityId: String(pkValue),
                newValues: validated.data,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/database/tables/:tableName/data/:pkValue
     */
    async deleteRecord(req, res, next) {
        try {
            const { tableName, pkValue } = req.params;
            const result = await databaseService.deleteRecord(tableName, pkValue);
            logAuditEvent({
                userId: req.user?.id,
                action: 'DATABASE_RECORD_DELETED',
                entityType: tableName,
                entityId: String(pkValue),
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/database/foreign-options?table=...&column=...
     */
    async getForeignKeyOptions(req, res, next) {
        try {
            const table = String(req.query.table || '');
            const column = String(req.query.column || '');
            if (!table || !column) {
                res.status(400).json({ success: false, message: 'Both "table" and "column" parameters are required.' });
                return;
            }
            const options = await databaseService.getForeignKeyOptions(table, column);
            res.json({
                success: true,
                data: options,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
export const databaseController = new DatabaseController();
//# sourceMappingURL=database.controller.js.map