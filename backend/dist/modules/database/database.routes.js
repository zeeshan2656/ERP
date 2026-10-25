import { Router } from 'express';
import { databaseController } from './database.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
const router = Router();
// All database manager routes require an active authenticated session
router.use(authenticate);
// 1. Overview & Table List
router.get('/overview', requirePermission('database_manager', 'view'), (req, res, next) => databaseController.getOverview(req, res, next));
router.get('/tables', requirePermission('database_manager', 'view'), (req, res, next) => databaseController.listTables(req, res, next));
// 2. Foreign Key LOV Options
router.get('/foreign-options', requirePermission('database_manager', 'view'), (req, res, next) => databaseController.getForeignKeyOptions(req, res, next));
// 3. SQL Preview (Create/Alter)
router.post('/preview-sql', requirePermission('database_manager', 'view'), (req, res, next) => databaseController.previewSql(req, res, next));
// 4. Create Table
router.post('/tables', requirePermission('database_manager', 'add'), (req, res, next) => databaseController.createTable(req, res, next));
// 5. Table Structure
router.get('/tables/:tableName/structure', requirePermission('database_manager', 'view'), (req, res, next) => databaseController.getTableStructure(req, res, next));
// 6. Alter Table Structure
router.put('/tables/:tableName', requirePermission('database_manager', 'edit'), (req, res, next) => databaseController.alterTable(req, res, next));
// 7. Drop Table
router.delete('/tables/:tableName', requirePermission('database_manager', 'delete'), (req, res, next) => databaseController.dropTable(req, res, next));
// 8. Table Data Records (Browse / Insert / Update / Delete)
router.get('/tables/:tableName/data', requirePermission('database_manager', 'view'), (req, res, next) => databaseController.fetchTableData(req, res, next));
router.post('/tables/:tableName/data', requirePermission('database_manager', 'add'), (req, res, next) => databaseController.insertRecord(req, res, next));
router.put('/tables/:tableName/data/:pkValue', requirePermission('database_manager', 'edit'), (req, res, next) => databaseController.updateRecord(req, res, next));
router.delete('/tables/:tableName/data/:pkValue', requirePermission('database_manager', 'delete'), (req, res, next) => databaseController.deleteRecord(req, res, next));
export default router;
//# sourceMappingURL=database.routes.js.map