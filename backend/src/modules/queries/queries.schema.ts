import { z } from 'zod';

export interface QueryTableNode {
  id: string;
  tableName: string;
  alias: string;
  position: { x: number; y: number };
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
  operator:
    | 'equals'
    | 'doesNotEqual'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'contains'
    | 'doesNotContain'
    | 'startsWith'
    | 'endsWith'
    | 'in'
    | 'notIn'
    | 'between'
    | 'isNull'
    | 'isNotNull';
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

// Zod schemas for API validation
export const CreateQuerySchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(80).default('General'),
  status: z.enum(['draft', 'published']).default('draft'),
  visualDefinition: z.record(z.any()),
  parameters: z.array(z.record(z.any())).optional().default([]),
});

export const UpdateQuerySchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(80).optional(),
  status: z.enum(['draft', 'published']).optional(),
  visualDefinition: z.record(z.any()).optional(),
  parameters: z.array(z.record(z.any())).optional(),
});

export const ExecuteQuerySchema = z.object({
  parameters: z.record(z.any()).optional().default({}),
  parameterValues: z.record(z.any()).optional(),
  limit: z.number().int().min(1).max(5000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export const PreviewSqlSchema = z.object({
  visualDefinition: z.record(z.any()),
  parameters: z.record(z.any()).optional().default({}),
});
