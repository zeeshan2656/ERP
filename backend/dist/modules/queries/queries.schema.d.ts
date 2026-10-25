import { z } from 'zod';
export interface QueryTableNode {
    id: string;
    tableName: string;
    alias: string;
    position: {
        x: number;
        y: number;
    };
}
export interface QueryColumn {
    id: string;
    tableId: string;
    tableName: string;
    tableAlias: string;
    columnName: string;
    alias?: string;
    dataType?: string;
    aggregate?: 'COUNT' | 'COUNT_DISTINCT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
    sortOrder?: 'ASC' | 'DESC';
    sortPriority?: number;
    isVisible?: boolean;
    isGroupBy?: boolean;
}
export interface QueryCalculatedColumn {
    id: string;
    alias: string;
    formula: string;
    outputType?: 'VARCHAR' | 'INT' | 'DECIMAL' | 'DATE' | 'BOOLEAN';
    aggregate?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
    sortOrder?: 'ASC' | 'DESC';
    sortPriority?: number;
    isVisible?: boolean;
    isGroupBy?: boolean;
}
export interface QueryJoin {
    id: string;
    leftTableId?: string;
    leftTable?: string;
    leftTableAlias?: string;
    leftColumn?: string;
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS' | 'FULL';
    rightTableId?: string;
    rightTable?: string;
    rightTableAlias?: string;
    rightColumn?: string;
    sourceTableAlias?: string;
    sourceColumn?: string;
    targetTableAlias?: string;
    targetColumn?: string;
    operator?: '=' | '<>' | '>' | '<' | '>=' | '<=';
    additionalConditions?: string;
}
export interface QueryFilterCondition {
    id: string;
    tableAlias?: string;
    columnName?: string;
    isCalculated?: boolean;
    calculatedId?: string;
    operator: 'equals' | 'doesNotEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'contains' | 'doesNotContain' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'between' | 'isNull' | 'isNotNull';
    value?: any;
    value2?: any;
    isParameter?: boolean;
    parameterName?: string;
}
export interface QueryFilterGroup {
    id: string;
    logicalOperator: 'AND' | 'OR';
    conditions: (QueryFilterCondition | QueryFilterGroup)[];
}
export interface QueryParameter {
    id: string;
    name: string;
    label: string;
    dataType: 'string' | 'number' | 'date' | 'boolean' | 'select';
    isRequired: boolean;
    defaultValue?: any;
    lovSourceTable?: string;
    lovSourceColumn?: string;
}
export interface AccessGridColumn {
    id: string;
    field: string;
    tableName: string;
    tableAlias: string;
    columnName: string;
    alias: string;
    sortOrder?: 'ASC' | 'DESC' | '';
    sortPriority?: number;
    isVisible: boolean;
    criteria?: string;
    orCriteria?: string[];
    isCalculated?: boolean;
    calculatedFormula?: string;
    outputType?: 'VARCHAR' | 'INT' | 'DECIMAL' | 'BOOLEAN' | 'DATETIME';
    aggregate?: 'NONE' | 'COUNT' | 'COUNT_DISTINCT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}
export interface VisualQueryDefinition {
    tables: QueryTableNode[];
    columns?: QueryColumn[];
    gridColumns?: AccessGridColumn[];
    calculatedColumns?: QueryCalculatedColumn[];
    joins: QueryJoin[];
    whereFilters?: QueryFilterGroup;
    havingFilters?: QueryFilterGroup;
    groupByColumns?: string[];
    isDistinct?: boolean;
    limit?: number;
    offset?: number;
}
export declare const CreateQuerySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published"]>>;
    visualDefinition: z.ZodRecord<z.ZodString, z.ZodAny>;
    parameters: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "published";
    name: string;
    category: string;
    visualDefinition: Record<string, any>;
    parameters: Record<string, any>[];
    description?: string | null | undefined;
}, {
    name: string;
    visualDefinition: Record<string, any>;
    status?: "draft" | "published" | undefined;
    description?: string | null | undefined;
    category?: string | undefined;
    parameters?: Record<string, any>[] | undefined;
}>;
export declare const UpdateQuerySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "published"]>>;
    visualDefinition: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    parameters: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "published" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    category?: string | undefined;
    visualDefinition?: Record<string, any> | undefined;
    parameters?: Record<string, any>[] | undefined;
}, {
    status?: "draft" | "published" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    category?: string | undefined;
    visualDefinition?: Record<string, any> | undefined;
    parameters?: Record<string, any>[] | undefined;
}>;
export declare const ExecuteQuerySchema: z.ZodObject<{
    parameters: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    parameterValues: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    parameters: Record<string, any>;
    offset: number;
    parameterValues?: Record<string, any> | undefined;
}, {
    limit?: number | undefined;
    parameters?: Record<string, any> | undefined;
    parameterValues?: Record<string, any> | undefined;
    offset?: number | undefined;
}>;
export declare const PreviewSqlSchema: z.ZodObject<{
    visualDefinition: z.ZodRecord<z.ZodString, z.ZodAny>;
    parameters: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    visualDefinition: Record<string, any>;
    parameters: Record<string, any>;
}, {
    visualDefinition: Record<string, any>;
    parameters?: Record<string, any> | undefined;
}>;
