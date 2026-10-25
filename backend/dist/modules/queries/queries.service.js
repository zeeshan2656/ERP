import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { sqlGeneratorService } from './sql-generator.service.js';
export class QueriesService {
    /**
     * Generates a URL-safe slug from a query name
     */
    generateSlug(name) {
        const baseSlug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `${baseSlug || 'query'}-${uuidv4().substring(0, 6)}`;
    }
    /**
     * List saved queries with pagination, search, and category filters
     */
    async listQueries(options) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(Math.max(1, options.limit || 15), 100);
        const offset = (page - 1) * limit;
        const whereClauses = [];
        const params = [];
        if (options.search && options.search.trim()) {
            whereClauses.push('(sq.name LIKE ? OR sq.description LIKE ? OR sq.category LIKE ?)');
            const q = `%${options.search.trim()}%`;
            params.push(q, q, q);
        }
        if (options.category && options.category !== 'all') {
            whereClauses.push('sq.category = ?');
            params.push(options.category);
        }
        if (options.status && options.status !== 'all') {
            whereClauses.push('sq.status = ?');
            params.push(options.status);
        }
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // Count
        const countSql = `SELECT COUNT(*) as total FROM saved_queries sq ${whereSql}`;
        const countRows = await query(countSql, params);
        const total = Number(countRows[0]?.total) || 0;
        // Data
        const dataSql = `
      SELECT
        sq.id, sq.name, sq.slug, sq.description, sq.category, sq.status,
        sq.visual_definition, sq.generated_sql, sq.parameters, sq.output_columns,
        sq.created_by_user_id, sq.updated_by_user_id, sq.created_at, sq.updated_at,
        u1.full_name as created_by_name,
        u2.full_name as updated_by_name,
        (SELECT qeh.status FROM query_execution_history qeh
         WHERE qeh.query_id = sq.id ORDER BY qeh.executed_at DESC LIMIT 1) as last_execution_status,
        (SELECT qeh.execution_time_ms FROM query_execution_history qeh
         WHERE qeh.query_id = sq.id ORDER BY qeh.executed_at DESC LIMIT 1) as last_execution_time_ms
      FROM saved_queries sq
      LEFT JOIN users u1 ON sq.created_by_user_id = u1.id
      LEFT JOIN users u2 ON sq.updated_by_user_id = u2.id
      ${whereSql}
      ORDER BY sq.updated_at DESC
      LIMIT ? OFFSET ?
    `;
        const rows = await query(dataSql, [...params, limit, offset]);
        const formatted = rows.map((r) => {
            const visualDef = typeof r.visual_definition === 'string' ? JSON.parse(r.visual_definition) : r.visual_definition;
            const paramsList = typeof r.parameters === 'string' ? JSON.parse(r.parameters || '[]') : r.parameters || [];
            const outputCols = typeof r.output_columns === 'string' ? JSON.parse(r.output_columns || '[]') : r.output_columns || [];
            // Extract referenced table names for summary badges
            const tables = (visualDef?.tables || []).map((t) => t.tableName);
            return {
                id: r.id,
                name: r.name,
                slug: r.slug,
                description: r.description,
                category: r.category,
                status: r.status,
                sourceTables: tables,
                columnCount: outputCols.length || (visualDef?.columns?.length ?? 0),
                parameterCount: paramsList.length,
                generatedSql: r.generated_sql,
                createdByName: r.created_by_name || 'System',
                updatedByName: r.updated_by_name || 'System',
                lastExecutionStatus: r.last_execution_status || null,
                lastExecutionTimeMs: r.last_execution_time_ms || null,
                isTemplate: r.slug?.startsWith('sample-') || r.category === 'Sample Queries',
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            };
        });
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            items: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    /**
     * Get distinct categories
     */
    async getCategories() {
        const rows = await query('SELECT DISTINCT category FROM saved_queries WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
        const set = new Set(['General', 'Sample Queries']);
        rows.forEach((r) => {
            if (r.category)
                set.add(r.category);
        });
        return Array.from(set);
    }
    /**
     * Get query by ID with full visual definition
     */
    async getQueryById(id) {
        const rows = await query(`SELECT sq.*, u1.full_name as created_by_name, u2.full_name as updated_by_name
       FROM saved_queries sq
       LEFT JOIN users u1 ON sq.created_by_user_id = u1.id
       LEFT JOIN users u2 ON sq.updated_by_user_id = u2.id
       WHERE sq.id = ? OR sq.slug = ?
       LIMIT 1`, [id, id]);
        if (rows.length === 0) {
            throw new Error(`Query '${id}' not found.`);
        }
        const r = rows[0];
        const visualDef = typeof r.visual_definition === 'string' ? JSON.parse(r.visual_definition) : r.visual_definition;
        const parameters = typeof r.parameters === 'string' ? JSON.parse(r.parameters || '[]') : r.parameters || [];
        const outputColumns = typeof r.output_columns === 'string' ? JSON.parse(r.output_columns || '[]') : r.output_columns || [];
        return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description,
            category: r.category,
            status: r.status,
            visualDefinition: visualDef,
            generatedSql: r.generated_sql,
            parameters,
            outputColumns,
            createdByName: r.created_by_name,
            updatedByName: r.updated_by_name,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        };
    }
    /**
     * Helper to verify if userId exists in users table to satisfy foreign key constraint
     */
    async getValidUserId(userId) {
        if (!userId)
            return null;
        const userRows = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
        return userRows.length > 0 ? userRows[0].id : null;
    }
    /**
     * Create a new query
     */
    async createQuery(data, userId) {
        const id = uuidv4();
        const slug = this.generateSlug(data.name);
        // Generate SQL from definition
        const generated = sqlGeneratorService.generate(data.visualDefinition);
        // Extract output columns metadata
        const outputColumns = data.visualDefinition.gridColumns && data.visualDefinition.gridColumns.length > 0
            ? data.visualDefinition.gridColumns.filter((c) => c.isVisible !== false).map((c) => ({
                id: c.id,
                name: c.columnName || c.alias,
                alias: c.alias || c.columnName,
                table: c.tableName || (c.isCalculated ? 'CALCULATED' : ''),
                tableAlias: c.tableAlias || '',
                type: c.outputType || 'VARCHAR',
                isCalculated: !!c.isCalculated,
            }))
            : [
                ...(data.visualDefinition.columns || []).map((c) => ({
                    id: c.id,
                    name: c.columnName,
                    alias: c.alias || `${c.tableAlias}_${c.columnName}`,
                    table: c.tableName,
                    tableAlias: c.tableAlias,
                    type: c.dataType || 'VARCHAR',
                    isCalculated: false,
                })),
                ...(data.visualDefinition.calculatedColumns || []).map((c) => ({
                    id: c.id,
                    name: c.alias,
                    alias: c.alias,
                    table: 'CALCULATED',
                    tableAlias: '',
                    type: c.outputType || 'VARCHAR',
                    isCalculated: true,
                })),
            ];
        const safeUserId = await this.getValidUserId(userId);
        await query(`INSERT INTO saved_queries
       (id, name, slug, description, category, status, visual_definition, generated_sql, parameters, output_columns, created_by_user_id, updated_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id,
            data.name,
            slug,
            data.description || null,
            data.category || 'General',
            data.status || 'draft',
            JSON.stringify(data.visualDefinition),
            generated.sql,
            JSON.stringify(data.parameters || []),
            JSON.stringify(outputColumns),
            safeUserId,
            safeUserId,
        ]);
        logger.info('Created new saved query', { id, name: data.name, slug });
        return this.getQueryById(id);
    }
    /**
     * Update an existing query
     */
    async updateQuery(id, data, userId) {
        const existing = await this.getQueryById(id);
        const updatedDef = data.visualDefinition || existing.visualDefinition;
        const generated = sqlGeneratorService.generate(updatedDef);
        const outputColumns = updatedDef.gridColumns && updatedDef.gridColumns.length > 0
            ? updatedDef.gridColumns.filter((c) => c.isVisible !== false).map((c) => ({
                id: c.id,
                name: c.columnName || c.alias,
                alias: c.alias || c.columnName,
                table: c.tableName || (c.isCalculated ? 'CALCULATED' : ''),
                tableAlias: c.tableAlias || '',
                type: c.outputType || 'VARCHAR',
                isCalculated: !!c.isCalculated,
            }))
            : [
                ...(updatedDef.columns || []).map((c) => ({
                    id: c.id,
                    name: c.columnName,
                    alias: c.alias || `${c.tableAlias}_${c.columnName}`,
                    table: c.tableName,
                    tableAlias: c.tableAlias,
                    type: c.dataType || 'VARCHAR',
                    isCalculated: false,
                })),
                ...(updatedDef.calculatedColumns || []).map((c) => ({
                    id: c.id,
                    name: c.alias,
                    alias: c.alias,
                    table: 'CALCULATED',
                    tableAlias: '',
                    type: c.outputType || 'VARCHAR',
                    isCalculated: true,
                })),
            ];
        const safeUserId = await this.getValidUserId(userId);
        await query(`UPDATE saved_queries
       SET name = COALESCE(?, name),
           description = ?,
           category = COALESCE(?, category),
           status = COALESCE(?, status),
           visual_definition = ?,
           generated_sql = ?,
           parameters = ?,
           output_columns = ?,
           updated_by_user_id = ?
       WHERE id = ?`, [
            data.name || existing.name,
            data.description !== undefined ? data.description : existing.description,
            data.category || existing.category,
            data.status || existing.status,
            JSON.stringify(updatedDef),
            generated.sql,
            JSON.stringify(data.parameters !== undefined ? data.parameters : existing.parameters),
            JSON.stringify(outputColumns),
            safeUserId,
            existing.id,
        ]);
        return this.getQueryById(existing.id);
    }
    /**
     * Delete query
     */
    async deleteQuery(id) {
        const existing = await this.getQueryById(id);
        await query('DELETE FROM saved_queries WHERE id = ?', [existing.id]);
        return { success: true, message: `Query '${existing.name}' deleted successfully.` };
    }
    /**
     * Duplicate query
     */
    async duplicateQuery(id, userId) {
        const source = await this.getQueryById(id);
        const newName = `${source.name} (Copy)`;
        return this.createQuery({
            name: newName,
            description: source.description,
            category: source.category,
            status: 'draft',
            visualDefinition: source.visualDefinition,
            parameters: source.parameters,
        }, userId);
    }
    /**
     * Execute live preview of unsaved visual query definition
     */
    async previewQuery(def, parameterValues = {}) {
        const startTime = Date.now();
        const generated = sqlGeneratorService.generate(def, parameterValues);
        try {
            // Execute query with timeout
            const rows = await query(generated.sql, generated.params);
            const executionTimeMs = Date.now() - startTime;
            // Extract result column metadata
            let columns = [];
            if (rows.length > 0) {
                columns = Object.keys(rows[0]).map((key) => ({
                    id: key,
                    header: key,
                    accessorKey: key,
                }));
            }
            else if (def.gridColumns && def.gridColumns.length > 0) {
                columns = def.gridColumns
                    .filter((c) => c.isVisible !== false && (c.columnName || c.calculatedFormula || c.alias))
                    .map((c) => {
                    const name = c.alias || c.columnName || c.field || 'col';
                    return {
                        id: name,
                        header: name,
                        accessorKey: name,
                    };
                });
            }
            else {
                columns = (def.columns || []).map((c) => ({
                    id: c.alias || `${c.tableAlias}_${c.columnName}`,
                    header: c.alias || `${c.tableAlias}_${c.columnName}`,
                    accessorKey: c.alias || `${c.tableAlias}_${c.columnName}`,
                }));
            }
            return {
                success: true,
                data: rows,
                columns,
                rowCount: rows.length,
                executionTimeMs,
                generatedSql: generated.sql,
                warnings: generated.warnings,
            };
        }
        catch (err) {
            const executionTimeMs = Date.now() - startTime;
            logger.error('Query preview execution failed', { error: err.message, sql: generated.sql });
            let message = err.message || 'Execution error';
            if (/FULL OUTER JOIN/i.test(generated.sql) && /syntax/i.test(message)) {
                message = 'FULL OUTER JOIN is not natively supported by the MySQL database engine. Please use LEFT JOIN, RIGHT JOIN, or combine queries using UNION.';
            }
            throw new Error(message);
        }
    }
    /**
     * Execute saved query with parameters and record execution history
     */
    async executeSavedQuery(id, parameterValues = {}, options = {}, userId) {
        const saved = await this.getQueryById(id);
        const def = saved.visualDefinition;
        // Apply pagination override if provided
        if (options.limit !== undefined) {
            def.limit = options.limit;
        }
        if (options.offset !== undefined) {
            def.offset = options.offset;
        }
        const startTime = Date.now();
        const generated = sqlGeneratorService.generate(def, parameterValues);
        let status = 'success';
        let errorMessage = null;
        let rows = [];
        try {
            rows = await query(generated.sql, generated.params);
        }
        catch (err) {
            status = 'error';
            let message = err.message || 'Execution error';
            if (/FULL OUTER JOIN/i.test(generated.sql) && /syntax/i.test(message)) {
                message = 'FULL OUTER JOIN is not natively supported by the MySQL database engine. Please use LEFT JOIN, RIGHT JOIN, or combine queries using UNION.';
            }
            errorMessage = message;
            logger.error('Saved query execution failed', { queryId: id, error: err.message });
        }
        const executionTimeMs = Date.now() - startTime;
        // Log execution history
        try {
            const safeUserId = await this.getValidUserId(userId);
            await query(`INSERT INTO query_execution_history
         (id, query_id, executed_by_user_id, execution_time_ms, row_count, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [uuidv4(), saved.id, safeUserId, executionTimeMs, rows.length, status, errorMessage]);
        }
        catch (logErr) {
            logger.warn('Failed to record query execution history', { logErr });
        }
        if (status === 'error') {
            throw new Error(`Execution failed: ${errorMessage}`);
        }
        const resultColumns = rows.length > 0
            ? Object.keys(rows[0]).map((key) => ({
                id: key,
                header: key,
                accessorKey: key,
            }))
            : (saved.outputColumns || []).map((c) => ({
                id: c.alias || c.name,
                header: c.alias || c.name,
                accessorKey: c.alias || c.name,
            }));
        return {
            success: true,
            queryId: saved.id,
            queryName: saved.name,
            data: rows,
            columns: resultColumns,
            outputColumns: saved.outputColumns,
            rowCount: rows.length,
            executionTimeMs,
            generatedSql: generated.sql,
        };
    }
    /**
     * Get execution history of a query
     */
    async getExecutionHistory(queryId) {
        const rows = await query(`SELECT qeh.*, u.full_name as executed_by_name
       FROM query_execution_history qeh
       LEFT JOIN users u ON qeh.executed_by_user_id = u.id
       WHERE qeh.query_id = ?
       ORDER BY qeh.executed_at DESC
       LIMIT 50`, [queryId]);
        return rows.map((r) => ({
            id: r.id,
            executionTimeMs: r.execution_time_ms,
            rowCount: r.row_count,
            status: r.status,
            errorMessage: r.error_message,
            executedByName: r.executed_by_name || 'System / API',
            executedAt: r.executed_at,
        }));
    }
}
export const queriesService = new QueriesService();
//# sourceMappingURL=queries.service.js.map