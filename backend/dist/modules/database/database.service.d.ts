import { CreateTableDto, AlterTableDto, TableDataQueryDto } from './database.schema.js';
export declare const PROTECTED_SYSTEM_TABLES: Set<string>;
export declare class DatabaseService {
    /**
     * Safely sanitize and quote a MySQL identifier (table or column name).
     * Prevents SQL injection in DDL and dynamic queries.
     */
    quoteIdentifier(identifier: string): string;
    /**
     * Database Overview: server stats, total tables, estimated rows, and sizes.
     */
    getDatabaseOverview(): Promise<{
        databaseName: string;
        serverVersion: string;
        totalTables: number;
        totalRows: number;
        dataSize: string;
        indexSize: string;
        totalSize: string;
        dataBytes: number;
        indexBytes: number;
        totalBytes: number;
    }>;
    /**
     * List all tables in the current database with row counts and primary keys.
     */
    listTables(): Promise<{
        tableName: any;
        engine: any;
        rowCount: number;
        dataBytes: number;
        indexBytes: number;
        collation: any;
        comment: any;
        columnCount: number;
        primaryKey: any;
        createdAt: any;
        updatedAt: any;
        isSystemTable: boolean;
    }[]>;
    /**
     * Detailed Table Structure: columns, keys, indexes, and foreign keys.
     */
    getTableStructure(tableName: string): Promise<{
        tableName: string;
        isSystemTable: boolean;
        primaryKey: any[];
        columns: {
            name: any;
            ordinalPosition: any;
            dataType: any;
            columnType: any;
            isNullable: boolean;
            defaultValue: any;
            isPrimaryKey: boolean;
            isUnique: boolean;
            isAutoIncrement: any;
            comment: any;
        }[];
        indexes: {
            name: string;
            isUnique: boolean;
            type: string;
            columns: string[];
        }[];
        foreignKeys: {
            constraintName: any;
            columnName: any;
            referencedTable: any;
            referencedColumn: any;
            onUpdate: any;
            onDelete: any;
        }[];
        inboundRelationships: {
            referencingTable: any;
            referencingColumn: any;
            constraintName: any;
            referencedColumn: any;
            onDelete: any;
            onUpdate: any;
        }[];
    }>;
    /**
     * Helper to format a single column's DDL definition clause.
     */
    private formatColumnDdl;
    /**
     * Generates safe CREATE TABLE SQL statement from visual DTO.
     */
    generateCreateTableSql(dto: CreateTableDto): string;
    /**
     * Executes CREATE TABLE.
     */
    createTable(dto: CreateTableDto): Promise<{
        success: boolean;
        tableName: string;
        sql: string;
        message: string;
    }>;
    /**
     * Generates ALTER TABLE SQL statements.
     */
    generateAlterTableSql(tableName: string, dto: AlterTableDto): string[];
    /**
     * Executes ALTER TABLE operations safely.
     */
    alterTable(tableName: string, dto: AlterTableDto): Promise<{
        success: boolean;
        statements: string[];
        message: string;
    }>;
    /**
     * Drops a database table.
     */
    dropTable(tableName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Fetch Table Records with server-side pagination, sorting, search, and Excel filters.
     */
    fetchTableData(tableName: string, queryDto: TableDataQueryDto): Promise<{
        tableName: string;
        columns: {
            name: any;
            ordinalPosition: any;
            dataType: any;
            columnType: any;
            isNullable: boolean;
            defaultValue: any;
            isPrimaryKey: boolean;
            isUnique: boolean;
            isAutoIncrement: any;
            comment: any;
        }[];
        primaryKey: any[];
        data: Record<string, unknown>[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Inserts a record into the table.
     */
    insertRecord(tableName: string, data: Record<string, unknown>): Promise<{
        success: boolean;
        insertId: any;
        message: string;
    }>;
    /**
     * Updates an existing record by primary key.
     */
    updateRecord(tableName: string, pkValue: string | number, data: Record<string, unknown>): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Deletes a record by primary key with foreign key constraint handling.
     */
    deleteRecord(tableName: string, pkValue: string | number): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Provides foreign key reference options (LOV) for foreign key fields.
     */
    getForeignKeyOptions(referencedTable: string, referencedColumn: string): Promise<{
        value: any;
        label: string;
    }[]>;
}
export declare const databaseService: DatabaseService;
