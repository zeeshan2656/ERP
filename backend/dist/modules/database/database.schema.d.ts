import { z } from 'zod';
export declare const identifierRegex: RegExp;
export declare const supportedDataTypes: readonly ["VARCHAR", "CHAR", "TEXT", "MEDIUMTEXT", "LONGTEXT", "INT", "TINYINT", "SMALLINT", "BIGINT", "DECIMAL", "FLOAT", "DOUBLE", "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "TIME", "JSON"];
export declare const ColumnDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    dataType: z.ZodEnum<["VARCHAR", "CHAR", "TEXT", "MEDIUMTEXT", "LONGTEXT", "INT", "TINYINT", "SMALLINT", "BIGINT", "DECIMAL", "FLOAT", "DOUBLE", "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "TIME", "JSON"]>;
    length: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    isPrimaryKey: z.ZodDefault<z.ZodBoolean>;
    isAutoIncrement: z.ZodDefault<z.ZodBoolean>;
    isNullable: z.ZodDefault<z.ZodBoolean>;
    defaultValue: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isUnique: z.ZodDefault<z.ZodBoolean>;
    comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
    isPrimaryKey: boolean;
    isAutoIncrement: boolean;
    isNullable: boolean;
    isUnique: boolean;
    length?: string | number | null | undefined;
    defaultValue?: string | null | undefined;
    comment?: string | null | undefined;
}, {
    name: string;
    dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
    length?: string | number | null | undefined;
    isPrimaryKey?: boolean | undefined;
    isAutoIncrement?: boolean | undefined;
    isNullable?: boolean | undefined;
    defaultValue?: string | null | undefined;
    isUnique?: boolean | undefined;
    comment?: string | null | undefined;
}>;
export declare const ForeignKeySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    columnName: z.ZodString;
    referencedTable: z.ZodString;
    referencedColumn: z.ZodString;
    onDelete: z.ZodDefault<z.ZodEnum<["RESTRICT", "CASCADE", "SET NULL", "NO ACTION"]>>;
    onUpdate: z.ZodDefault<z.ZodEnum<["RESTRICT", "CASCADE", "SET NULL", "NO ACTION"]>>;
}, "strip", z.ZodTypeAny, {
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
    onDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
    onUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
    name?: string | undefined;
}, {
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
    name?: string | undefined;
    onDelete?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
    onUpdate?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
}>;
export declare const IndexSchema: z.ZodObject<{
    name: z.ZodString;
    columns: z.ZodArray<z.ZodString, "many">;
    isUnique: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isUnique: boolean;
    columns: string[];
}, {
    name: string;
    columns: string[];
    isUnique?: boolean | undefined;
}>;
export declare const CreateTableSchema: z.ZodObject<{
    tableName: z.ZodString;
    comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    columns: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        dataType: z.ZodEnum<["VARCHAR", "CHAR", "TEXT", "MEDIUMTEXT", "LONGTEXT", "INT", "TINYINT", "SMALLINT", "BIGINT", "DECIMAL", "FLOAT", "DOUBLE", "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "TIME", "JSON"]>;
        length: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        isPrimaryKey: z.ZodDefault<z.ZodBoolean>;
        isAutoIncrement: z.ZodDefault<z.ZodBoolean>;
        isNullable: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        isUnique: z.ZodDefault<z.ZodBoolean>;
        comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        isPrimaryKey: boolean;
        isAutoIncrement: boolean;
        isNullable: boolean;
        isUnique: boolean;
        length?: string | number | null | undefined;
        defaultValue?: string | null | undefined;
        comment?: string | null | undefined;
    }, {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        length?: string | number | null | undefined;
        isPrimaryKey?: boolean | undefined;
        isAutoIncrement?: boolean | undefined;
        isNullable?: boolean | undefined;
        defaultValue?: string | null | undefined;
        isUnique?: boolean | undefined;
        comment?: string | null | undefined;
    }>, "many">;
    foreignKeys: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        columnName: z.ZodString;
        referencedTable: z.ZodString;
        referencedColumn: z.ZodString;
        onDelete: z.ZodDefault<z.ZodEnum<["RESTRICT", "CASCADE", "SET NULL", "NO ACTION"]>>;
        onUpdate: z.ZodDefault<z.ZodEnum<["RESTRICT", "CASCADE", "SET NULL", "NO ACTION"]>>;
    }, "strip", z.ZodTypeAny, {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        onUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        name?: string | undefined;
    }, {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        name?: string | undefined;
        onDelete?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
        onUpdate?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
    }>, "many">>>;
    indexes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
        isUnique: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        isUnique: boolean;
        columns: string[];
    }, {
        name: string;
        columns: string[];
        isUnique?: boolean | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    columns: {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        isPrimaryKey: boolean;
        isAutoIncrement: boolean;
        isNullable: boolean;
        isUnique: boolean;
        length?: string | number | null | undefined;
        defaultValue?: string | null | undefined;
        comment?: string | null | undefined;
    }[];
    tableName: string;
    foreignKeys: {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        onUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        name?: string | undefined;
    }[];
    indexes: {
        name: string;
        isUnique: boolean;
        columns: string[];
    }[];
    comment?: string | null | undefined;
}, {
    columns: {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        length?: string | number | null | undefined;
        isPrimaryKey?: boolean | undefined;
        isAutoIncrement?: boolean | undefined;
        isNullable?: boolean | undefined;
        defaultValue?: string | null | undefined;
        isUnique?: boolean | undefined;
        comment?: string | null | undefined;
    }[];
    tableName: string;
    comment?: string | null | undefined;
    foreignKeys?: {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        name?: string | undefined;
        onDelete?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
        onUpdate?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
    }[] | undefined;
    indexes?: {
        name: string;
        columns: string[];
        isUnique?: boolean | undefined;
    }[] | undefined;
}>;
export declare const AlterTableSchema: z.ZodObject<{
    action: z.ZodEnum<["addColumn", "modifyColumn", "dropColumn", "addIndex", "dropIndex", "addForeignKey", "dropForeignKey", "renameTable"]>;
    column: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        dataType: z.ZodEnum<["VARCHAR", "CHAR", "TEXT", "MEDIUMTEXT", "LONGTEXT", "INT", "TINYINT", "SMALLINT", "BIGINT", "DECIMAL", "FLOAT", "DOUBLE", "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "TIME", "JSON"]>;
        length: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        isPrimaryKey: z.ZodDefault<z.ZodBoolean>;
        isAutoIncrement: z.ZodDefault<z.ZodBoolean>;
        isNullable: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        isUnique: z.ZodDefault<z.ZodBoolean>;
        comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        isPrimaryKey: boolean;
        isAutoIncrement: boolean;
        isNullable: boolean;
        isUnique: boolean;
        length?: string | number | null | undefined;
        defaultValue?: string | null | undefined;
        comment?: string | null | undefined;
    }, {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        length?: string | number | null | undefined;
        isPrimaryKey?: boolean | undefined;
        isAutoIncrement?: boolean | undefined;
        isNullable?: boolean | undefined;
        defaultValue?: string | null | undefined;
        isUnique?: boolean | undefined;
        comment?: string | null | undefined;
    }>>;
    oldColumnName: z.ZodOptional<z.ZodString>;
    columnName: z.ZodOptional<z.ZodString>;
    index: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        columns: z.ZodArray<z.ZodString, "many">;
        isUnique: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        isUnique: boolean;
        columns: string[];
    }, {
        name: string;
        columns: string[];
        isUnique?: boolean | undefined;
    }>>;
    indexName: z.ZodOptional<z.ZodString>;
    foreignKey: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        columnName: z.ZodString;
        referencedTable: z.ZodString;
        referencedColumn: z.ZodString;
        onDelete: z.ZodDefault<z.ZodEnum<["RESTRICT", "CASCADE", "SET NULL", "NO ACTION"]>>;
        onUpdate: z.ZodDefault<z.ZodEnum<["RESTRICT", "CASCADE", "SET NULL", "NO ACTION"]>>;
    }, "strip", z.ZodTypeAny, {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        onUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        name?: string | undefined;
    }, {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        name?: string | undefined;
        onDelete?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
        onUpdate?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
    }>>;
    foreignKeyName: z.ZodOptional<z.ZodString>;
    newTableName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "addColumn" | "modifyColumn" | "dropColumn" | "addIndex" | "dropIndex" | "addForeignKey" | "dropForeignKey" | "renameTable";
    columnName?: string | undefined;
    column?: {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        isPrimaryKey: boolean;
        isAutoIncrement: boolean;
        isNullable: boolean;
        isUnique: boolean;
        length?: string | number | null | undefined;
        defaultValue?: string | null | undefined;
        comment?: string | null | undefined;
    } | undefined;
    oldColumnName?: string | undefined;
    index?: {
        name: string;
        isUnique: boolean;
        columns: string[];
    } | undefined;
    indexName?: string | undefined;
    foreignKey?: {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        onUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
        name?: string | undefined;
    } | undefined;
    foreignKeyName?: string | undefined;
    newTableName?: string | undefined;
}, {
    action: "addColumn" | "modifyColumn" | "dropColumn" | "addIndex" | "dropIndex" | "addForeignKey" | "dropForeignKey" | "renameTable";
    columnName?: string | undefined;
    column?: {
        name: string;
        dataType: "TIMESTAMP" | "DATETIME" | "DATE" | "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" | "INT" | "TINYINT" | "SMALLINT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "TIME" | "JSON";
        length?: string | number | null | undefined;
        isPrimaryKey?: boolean | undefined;
        isAutoIncrement?: boolean | undefined;
        isNullable?: boolean | undefined;
        defaultValue?: string | null | undefined;
        isUnique?: boolean | undefined;
        comment?: string | null | undefined;
    } | undefined;
    oldColumnName?: string | undefined;
    index?: {
        name: string;
        columns: string[];
        isUnique?: boolean | undefined;
    } | undefined;
    indexName?: string | undefined;
    foreignKey?: {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        name?: string | undefined;
        onDelete?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
        onUpdate?: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION" | undefined;
    } | undefined;
    foreignKeyName?: string | undefined;
    newTableName?: string | undefined;
}>;
export declare const RecordFilterRuleSchema: z.ZodObject<{
    column: z.ZodString;
    operator: z.ZodEnum<["equals", "notEquals", "contains", "notContains", "startsWith", "endsWith", "gt", "gte", "lt", "lte", "between", "in", "isNull", "isNotNull"]>;
    value: z.ZodOptional<z.ZodAny>;
    secondValue: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    column: string;
    operator: "endsWith" | "startsWith" | "equals" | "notEquals" | "contains" | "notContains" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "isNull" | "isNotNull";
    value?: any;
    secondValue?: any;
}, {
    column: string;
    operator: "endsWith" | "startsWith" | "equals" | "notEquals" | "contains" | "notContains" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "isNull" | "isNotNull";
    value?: any;
    secondValue?: any;
}>;
export declare const TableDataQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["ASC", "DESC", "asc", "desc"]>>;
    search: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc" | "ASC" | "DESC";
    search?: string | undefined;
    sortBy?: string | undefined;
    filters?: string | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | "ASC" | "DESC" | undefined;
    filters?: string | undefined;
}>;
export declare const RecordUpsertSchema: z.ZodObject<{
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, any>;
}, {
    data: Record<string, any>;
}>;
export type ColumnDefinitionDto = z.infer<typeof ColumnDefinitionSchema>;
export type ForeignKeyDto = z.infer<typeof ForeignKeySchema>;
export type IndexDto = z.infer<typeof IndexSchema>;
export type CreateTableDto = z.infer<typeof CreateTableSchema>;
export type AlterTableDto = z.infer<typeof AlterTableSchema>;
export type RecordFilterRule = z.infer<typeof RecordFilterRuleSchema>;
export type TableDataQueryDto = z.infer<typeof TableDataQuerySchema>;
export type RecordUpsertDto = z.infer<typeof RecordUpsertSchema>;
