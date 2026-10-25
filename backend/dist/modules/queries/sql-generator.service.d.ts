import { VisualQueryDefinition } from './queries.schema.js';
export interface GeneratedSqlResult {
    sql: string;
    params: unknown[];
    warnings: string[];
}
export declare class SqlGeneratorService {
    /**
     * Safe identifier quoting helper
     */
    quote(identifier: string): string;
    /**
     * Quotes a table.column or alias.column reference
     */
    quoteQualified(tableAlias: string, columnName: string): string;
    /**
     * Validates a calculated column formula against an allowlisted grammar.
     * Disallows dangerous statements, subqueries, semicolons, comments, or arbitrary code.
     */
    /**
     * Validates a calculated column formula against an allowlisted grammar.
     * Disallows dangerous statements, subqueries, semicolons, comments, or arbitrary code.
     * Supports Microsoft Access bracket notation like [tableName].[columnName] or [columnName].
     */
    validateAndSanitizeFormula(formula: string, tableAliases: Set<string>): string;
    /**
     * Helper to parse Access-style criteria string into QueryFilterCondition
     */
    private parseCriteriaString;
    /**
     * Generates safe parameterized MySQL SQL from a Visual Query Definition.
     */
    generate(def: VisualQueryDefinition, parameterValues?: Record<string, unknown>): GeneratedSqlResult;
    /**
     * Recursively compiles a QueryFilterGroup (AND/OR tree) with parameter bindings
     */
    private buildFilterGroup;
    /**
     * Compiles an individual filter condition into parameterized SQL
     */
    private buildConditionClause;
}
export declare const sqlGeneratorService: SqlGeneratorService;
