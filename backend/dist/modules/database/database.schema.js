import { z } from 'zod';
export const identifierRegex = /^[a-zA-Z0-9_]{1,64}$/;
export const supportedDataTypes = [
    // String / Text
    'VARCHAR',
    'CHAR',
    'TEXT',
    'MEDIUMTEXT',
    'LONGTEXT',
    // Integer
    'INT',
    'TINYINT',
    'SMALLINT',
    'BIGINT',
    // Numeric
    'DECIMAL',
    'FLOAT',
    'DOUBLE',
    // Boolean
    'BOOLEAN',
    // Date / Time
    'DATE',
    'DATETIME',
    'TIMESTAMP',
    'TIME',
    // Structured
    'JSON',
];
export const ColumnDefinitionSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Column name is required')
        .max(64, 'Column name cannot exceed 64 characters')
        .regex(identifierRegex, 'Column name must only contain alphanumeric characters and underscores'),
    dataType: z.enum(supportedDataTypes, {
        errorMap: () => ({ message: 'Invalid or unsupported MySQL data type' }),
    }),
    length: z.union([z.number(), z.string()]).optional().nullable(),
    isPrimaryKey: z.boolean().default(false),
    isAutoIncrement: z.boolean().default(false),
    isNullable: z.boolean().default(true),
    defaultValue: z.string().optional().nullable(),
    isUnique: z.boolean().default(false),
    comment: z.string().max(255).optional().nullable(),
});
export const ForeignKeySchema = z.object({
    name: z.string().regex(identifierRegex).optional(),
    columnName: z.string().regex(identifierRegex, 'Invalid foreign key column name'),
    referencedTable: z.string().regex(identifierRegex, 'Invalid referenced table name'),
    referencedColumn: z.string().regex(identifierRegex, 'Invalid referenced column name'),
    onDelete: z.enum(['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION']).default('RESTRICT'),
    onUpdate: z.enum(['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION']).default('RESTRICT'),
});
export const IndexSchema = z.object({
    name: z.string().regex(identifierRegex, 'Invalid index name'),
    columns: z.array(z.string().regex(identifierRegex)).min(1, 'At least one column is required for an index'),
    isUnique: z.boolean().default(false),
});
export const CreateTableSchema = z.object({
    tableName: z
        .string()
        .trim()
        .min(1, 'Table name is required')
        .max(64, 'Table name cannot exceed 64 characters')
        .regex(identifierRegex, 'Table name must only contain alphanumeric characters and underscores'),
    comment: z.string().max(255).optional().nullable(),
    columns: z.array(ColumnDefinitionSchema).min(1, 'At least one column is required to create a table'),
    foreignKeys: z.array(ForeignKeySchema).optional().default([]),
    indexes: z.array(IndexSchema).optional().default([]),
});
export const AlterTableSchema = z.object({
    action: z.enum([
        'addColumn',
        'modifyColumn',
        'dropColumn',
        'addIndex',
        'dropIndex',
        'addForeignKey',
        'dropForeignKey',
        'renameTable',
    ]),
    column: ColumnDefinitionSchema.optional(),
    oldColumnName: z.string().regex(identifierRegex).optional(),
    columnName: z.string().regex(identifierRegex).optional(),
    index: IndexSchema.optional(),
    indexName: z.string().regex(identifierRegex).optional(),
    foreignKey: ForeignKeySchema.optional(),
    foreignKeyName: z.string().regex(identifierRegex).optional(),
    newTableName: z.string().regex(identifierRegex).optional(),
});
export const RecordFilterRuleSchema = z.object({
    column: z.string().regex(identifierRegex),
    operator: z.enum([
        'equals',
        'notEquals',
        'contains',
        'notContains',
        'startsWith',
        'endsWith',
        'gt',
        'gte',
        'lt',
        'lte',
        'between',
        'in',
        'isNull',
        'isNotNull',
    ]),
    value: z.any().optional(),
    secondValue: z.any().optional(),
});
export const TableDataQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(500).default(25),
    sortBy: z.string().regex(identifierRegex).optional(),
    sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).default('ASC'),
    search: z.string().optional(),
    filters: z.string().optional(), // JSON-serialized Array<RecordFilterRule>
});
export const RecordUpsertSchema = z.object({
    data: z.record(z.any()),
});
//# sourceMappingURL=database.schema.js.map