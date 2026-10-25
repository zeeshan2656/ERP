import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { sqlGeneratorService } from '../../modules/queries/sql-generator.service.js';
export const SAMPLE_QUERIES = [
    // 1. Simple Table Query
    {
        id: 'e0000000-0000-0000-0000-000000000001',
        name: 'Active Users Directory',
        slug: 'sample-users-directory',
        description: 'Lists system user accounts with contact details, status, and creation timestamps from the users table.',
        category: 'Sample Queries',
        status: 'published',
        visualDefinition: {
            tables: [
                {
                    id: 'tbl_users',
                    tableName: 'users',
                    alias: 'users',
                    position: { x: 60, y: 40 },
                },
            ],
            joins: [],
            gridColumns: [
                { id: 'gc_u_1', field: 'username', tableName: 'users', tableAlias: 'users', columnName: 'username', alias: 'username', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_u_2', field: 'full_name', tableName: 'users', tableAlias: 'users', columnName: 'full_name', alias: 'full_name', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_u_3', field: 'email', tableName: 'users', tableAlias: 'users', columnName: 'email', alias: 'email', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_u_4', field: 'is_active', tableName: 'users', tableAlias: 'users', columnName: 'is_active', alias: 'is_active', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_u_5', field: 'created_at', tableName: 'users', tableAlias: 'users', columnName: 'created_at', alias: 'created_at', isVisible: true, sortOrder: 'DESC', sortPriority: 10, criteria: '', orCriteria: [] },
            ],
            limit: 100,
        },
    },
    // 2. Two-Table Join
    {
        id: 'e0000000-0000-0000-0000-000000000002',
        name: 'User Accounts & Assigned Roles',
        slug: 'sample-user-roles',
        description: 'Demonstrates an INNER JOIN matching users.role_id with roles.id to display user names and security role titles.',
        category: 'Sample Queries',
        status: 'published',
        visualDefinition: {
            tables: [
                {
                    id: 'tbl_users',
                    tableName: 'users',
                    alias: 'users',
                    position: { x: 50, y: 40 },
                },
                {
                    id: 'tbl_roles',
                    tableName: 'roles',
                    alias: 'roles',
                    position: { x: 380, y: 40 },
                },
            ],
            joins: [
                {
                    id: 'j_users_roles',
                    sourceTableAlias: 'users',
                    sourceColumn: 'role_id',
                    targetTableAlias: 'roles',
                    targetColumn: 'id',
                    joinType: 'INNER',
                },
            ],
            gridColumns: [
                { id: 'gc_ur_1', field: 'username', tableName: 'users', tableAlias: 'users', columnName: 'username', alias: 'username', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_ur_2', field: 'full_name', tableName: 'users', tableAlias: 'users', columnName: 'full_name', alias: 'full_name', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_ur_3', field: 'email', tableName: 'users', tableAlias: 'users', columnName: 'email', alias: 'email', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_ur_4', field: 'name', tableName: 'roles', tableAlias: 'roles', columnName: 'name', alias: 'role_name', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_ur_5', field: 'slug', tableName: 'roles', tableAlias: 'roles', columnName: 'slug', alias: 'role_slug', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
            ],
            limit: 100,
        },
    },
    // 3. Multiple-Table Join (3 tables)
    {
        id: 'e0000000-0000-0000-0000-000000000003',
        name: 'User Role Permissions Matrix',
        slug: 'sample-permissions-matrix',
        description: 'Joins 3 related tables (users -> roles -> role_permissions) to inspect user permissions across all system modules.',
        category: 'Sample Queries',
        status: 'published',
        visualDefinition: {
            tables: [
                {
                    id: 'tbl_users',
                    tableName: 'users',
                    alias: 'users',
                    position: { x: 40, y: 40 },
                },
                {
                    id: 'tbl_roles',
                    tableName: 'roles',
                    alias: 'roles',
                    position: { x: 360, y: 40 },
                },
                {
                    id: 'tbl_perm',
                    tableName: 'role_permissions',
                    alias: 'role_permissions',
                    position: { x: 680, y: 40 },
                },
            ],
            joins: [
                {
                    id: 'j_u_r',
                    sourceTableAlias: 'users',
                    sourceColumn: 'role_id',
                    targetTableAlias: 'roles',
                    targetColumn: 'id',
                    joinType: 'INNER',
                },
                {
                    id: 'j_r_rp',
                    sourceTableAlias: 'roles',
                    sourceColumn: 'id',
                    targetTableAlias: 'role_permissions',
                    targetColumn: 'role_id',
                    joinType: 'INNER',
                },
            ],
            gridColumns: [
                { id: 'gc_m_1', field: 'username', tableName: 'users', tableAlias: 'users', columnName: 'username', alias: 'username', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_m_2', field: 'name', tableName: 'roles', tableAlias: 'roles', columnName: 'name', alias: 'role_name', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_m_3', field: 'module_key', tableName: 'role_permissions', tableAlias: 'role_permissions', columnName: 'module_key', alias: 'module_key', isVisible: true, sortOrder: 'ASC', sortPriority: 10, criteria: '', orCriteria: [] },
                { id: 'gc_m_4', field: 'can_view', tableName: 'role_permissions', tableAlias: 'role_permissions', columnName: 'can_view', alias: 'can_view', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_m_5', field: 'can_add', tableName: 'role_permissions', tableAlias: 'role_permissions', columnName: 'can_add', alias: 'can_add', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_m_6', field: 'can_edit', tableName: 'role_permissions', tableAlias: 'role_permissions', columnName: 'can_edit', alias: 'can_edit', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_m_7', field: 'can_delete', tableName: 'role_permissions', tableAlias: 'role_permissions', columnName: 'can_delete', alias: 'can_delete', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
            ],
            limit: 100,
        },
    },
    // 4. Filtered Query
    {
        id: 'e0000000-0000-0000-0000-000000000004',
        name: 'Authentication Audit Trail',
        slug: 'sample-auth-audit-trail',
        description: 'Retrieves security audit logs filtered specifically for authentication entity events (logins and logouts).',
        category: 'Sample Queries',
        status: 'published',
        visualDefinition: {
            tables: [
                {
                    id: 'tbl_audit',
                    tableName: 'audit_logs',
                    alias: 'audit_logs',
                    position: { x: 60, y: 40 },
                },
            ],
            joins: [],
            gridColumns: [
                { id: 'gc_a_1', field: 'id', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'id', alias: 'log_id', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_a_2', field: 'action', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'action', alias: 'action', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_a_3', field: 'entity_type', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'entity_type', alias: 'entity_type', isVisible: true, sortOrder: '', criteria: 'auth', orCriteria: [] },
                { id: 'gc_a_4', field: 'ip_address', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'ip_address', alias: 'ip_address', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_a_5', field: 'created_at', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'created_at', alias: 'timestamp', isVisible: true, sortOrder: 'DESC', sortPriority: 10, criteria: '', orCriteria: [] },
            ],
            limit: 100,
        },
    },
    // 5. Sorted Query
    {
        id: 'e0000000-0000-0000-0000-000000000005',
        name: 'Recent System Audit History',
        slug: 'sample-recent-audit-logs',
        description: 'Chronological timeline of system changes joined with the acting username, sorted with most recent events first.',
        category: 'Sample Queries',
        status: 'published',
        visualDefinition: {
            tables: [
                {
                    id: 'tbl_audit',
                    tableName: 'audit_logs',
                    alias: 'audit_logs',
                    position: { x: 50, y: 40 },
                },
                {
                    id: 'tbl_user',
                    tableName: 'users',
                    alias: 'users',
                    position: { x: 380, y: 40 },
                },
            ],
            joins: [
                {
                    id: 'j_audit_user',
                    sourceTableAlias: 'audit_logs',
                    sourceColumn: 'user_id',
                    targetTableAlias: 'users',
                    targetColumn: 'id',
                    joinType: 'INNER',
                },
            ],
            gridColumns: [
                { id: 'gc_s_1', field: 'created_at', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'created_at', alias: 'created_at', isVisible: true, sortOrder: 'DESC', sortPriority: 10, criteria: '', orCriteria: [] },
                { id: 'gc_s_2', field: 'username', tableName: 'users', tableAlias: 'users', columnName: 'username', alias: 'operator_username', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_s_3', field: 'action', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'action', alias: 'action', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_s_4', field: 'entity_type', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'entity_type', alias: 'entity_type', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_s_5', field: 'ip_address', tableName: 'audit_logs', tableAlias: 'audit_logs', columnName: 'ip_address', alias: 'ip_address', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
            ],
            limit: 100,
        },
    },
    // 6. Calculated Fields Query
    {
        id: 'e0000000-0000-0000-0000-000000000006',
        name: 'User Badges with Formatted Display',
        slug: 'sample-user-badges-calc',
        description: 'Demonstrates Access formula syntax CONCAT([users].[full_name], \' (\', [roles].[name], \')\') to compute a custom display badge.',
        category: 'Sample Queries',
        status: 'published',
        visualDefinition: {
            tables: [
                {
                    id: 'tbl_users',
                    tableName: 'users',
                    alias: 'users',
                    position: { x: 50, y: 40 },
                },
                {
                    id: 'tbl_roles',
                    tableName: 'roles',
                    alias: 'roles',
                    position: { x: 380, y: 40 },
                },
            ],
            joins: [
                {
                    id: 'j_u_r_calc',
                    sourceTableAlias: 'users',
                    sourceColumn: 'role_id',
                    targetTableAlias: 'roles',
                    targetColumn: 'id',
                    joinType: 'INNER',
                },
            ],
            gridColumns: [
                { id: 'gc_c_1', field: 'username', tableName: 'users', tableAlias: 'users', columnName: 'username', alias: 'username', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_c_2', field: 'name', tableName: 'roles', tableAlias: 'roles', columnName: 'name', alias: 'role_name', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                { id: 'gc_c_3', field: 'email', tableName: 'users', tableAlias: 'users', columnName: 'email', alias: 'email', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
                {
                    id: 'gc_c_4',
                    field: 'user_badge',
                    tableName: '',
                    tableAlias: '',
                    columnName: '',
                    alias: 'user_badge',
                    isCalculated: true,
                    calculatedFormula: "CONCAT([users].[full_name], ' (', [roles].[name], ')')",
                    outputType: 'VARCHAR',
                    isVisible: true,
                    sortOrder: '',
                    criteria: '',
                    orCriteria: [],
                },
            ],
            limit: 100,
        },
    },
    // 7. Aggregate Query
    {
        id: 'e0000000-0000-0000-0000-000000000007',
        name: 'User Count by Role',
        slug: 'sample-users-by-role-agg',
        description: 'Demonstrates GROUP BY with COUNT(users.id) to aggregate assigned user counts per security role.',
        category: 'Sample Queries',
        status: 'published',
        visualDefinition: {
            tables: [
                {
                    id: 'tbl_roles',
                    tableName: 'roles',
                    alias: 'roles',
                    position: { x: 50, y: 40 },
                },
                {
                    id: 'tbl_users',
                    tableName: 'users',
                    alias: 'users',
                    position: { x: 380, y: 40 },
                },
            ],
            joins: [
                {
                    id: 'j_r_u_agg',
                    sourceTableAlias: 'roles',
                    sourceColumn: 'id',
                    targetTableAlias: 'users',
                    targetColumn: 'role_id',
                    joinType: 'LEFT',
                },
            ],
            gridColumns: [
                { id: 'gc_agg_1', field: 'name', tableName: 'roles', tableAlias: 'roles', columnName: 'name', alias: 'role_name', isVisible: true, sortOrder: 'ASC', sortPriority: 10, criteria: '', orCriteria: [] },
                { id: 'gc_agg_2', field: 'id', tableName: 'users', tableAlias: 'users', columnName: 'id', alias: 'user_count', aggregate: 'COUNT', isVisible: true, sortOrder: '', criteria: '', orCriteria: [] },
            ],
            limit: 100,
        },
    },
];
/**
 * Idempotently seed default sample queries into saved_queries
 */
export async function seedDefaultSampleQueries() {
    try {
        for (const sample of SAMPLE_QUERIES) {
            // Check if query with slug already exists
            const existing = await query('SELECT id FROM saved_queries WHERE slug = ? OR id = ? LIMIT 1', [sample.slug, sample.id]);
            if (existing.length === 0) {
                const generated = sqlGeneratorService.generate(sample.visualDefinition);
                const outputColumns = sample.visualDefinition.gridColumns
                    ?.filter((c) => c.isVisible !== false)
                    .map((c) => ({
                    id: c.id,
                    name: c.columnName || c.alias,
                    alias: c.alias,
                    table: c.tableName,
                    tableAlias: c.tableAlias,
                    type: c.outputType || 'VARCHAR',
                    isCalculated: !!c.isCalculated,
                }));
                await query(`INSERT INTO saved_queries (
            id, name, slug, description, category, status,
            visual_definition, generated_sql, parameters, output_columns,
            created_by_user_id, updated_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`, [
                    sample.id,
                    sample.name,
                    sample.slug,
                    sample.description,
                    sample.category,
                    sample.status,
                    JSON.stringify(sample.visualDefinition),
                    generated.sql,
                    JSON.stringify([]),
                    JSON.stringify(outputColumns || []),
                ]);
                logger.info(`Seeded sample query: '${sample.name}' (${sample.slug})`);
            }
        }
    }
    catch (err) {
        logger.error('Failed to seed default sample queries:', { error: err.message });
    }
}
//# sourceMappingURL=default-queries.seed.js.map