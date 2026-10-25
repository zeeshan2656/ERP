import { env } from '../../config/env.js';
import { query, withTransaction } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { RowDataPacket } from 'mysql2/promise';
import {
  CreateTableDto,
  AlterTableDto,
  TableDataQueryDto,
  ColumnDefinitionDto,
  ForeignKeyDto,
  IndexDto,
  RecordFilterRule,
} from './database.schema.js';

export const PROTECTED_SYSTEM_TABLES = new Set([
  'schema_migrations',
  'users',
  'roles',
  'role_permissions',
  'audit_logs',
  'system_settings',
  'media_files',
  'module_registry',
]);

const SENSITIVE_COLUMN_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /hash/i,
  /auth_key/i,
];

export class DatabaseService {
  /**
   * Safely sanitize and quote a MySQL identifier (table or column name).
   * Prevents SQL injection in DDL and dynamic queries.
   */
  quoteIdentifier(identifier: string): string {
    if (!/^[a-zA-Z0-9_]{1,64}$/.test(identifier)) {
      throw new Error(`Invalid MySQL identifier name: '${identifier}'`);
    }
    return `\`${identifier}\``;
  }

  /**
   * Database Overview: server stats, total tables, estimated rows, and sizes.
   */
  async getDatabaseOverview() {
    const dbName = env.DB_NAME;

    // 1. MySQL Server Version
    const versionRows = await query<RowDataPacket[]>('SELECT VERSION() as version, @@version_comment as comment');
    const serverVersion = versionRows[0]?.version || 'MySQL';
    const serverComment = versionRows[0]?.comment || '';

    // 2. Table Summary & Storage Statistics
    const statRows = await query<RowDataPacket[]>(
      `SELECT
         COUNT(*) as total_tables,
         COALESCE(SUM(TABLE_ROWS), 0) as total_rows,
         COALESCE(SUM(DATA_LENGTH), 0) as total_data_bytes,
         COALESCE(SUM(INDEX_LENGTH), 0) as total_index_bytes
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );

    const stats = statRows[0] || {
      total_tables: 0,
      total_rows: 0,
      total_data_bytes: 0,
      total_index_bytes: 0,
    };

    const dataBytes = Number(stats.total_data_bytes) || 0;
    const indexBytes = Number(stats.total_index_bytes) || 0;
    const totalBytes = dataBytes + indexBytes;

    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return {
      databaseName: dbName,
      serverVersion: `${serverVersion} (${serverComment})`.trim(),
      totalTables: Number(stats.total_tables) || 0,
      totalRows: Number(stats.total_rows) || 0,
      dataSize: formatBytes(dataBytes),
      indexSize: formatBytes(indexBytes),
      totalSize: formatBytes(totalBytes),
      dataBytes,
      indexBytes,
      totalBytes,
    };
  }

  /**
   * List all tables in the current database with row counts and primary keys.
   */
  async listTables() {
    const dbName = env.DB_NAME;

    const tables = await query<RowDataPacket[]>(
      `SELECT
         t.TABLE_NAME as table_name,
         t.ENGINE as engine,
         COALESCE(t.TABLE_ROWS, 0) as row_count,
         COALESCE(t.DATA_LENGTH, 0) as data_bytes,
         COALESCE(t.INDEX_LENGTH, 0) as index_bytes,
         t.TABLE_COLLATION as collation,
         t.TABLE_COMMENT as table_comment,
         t.CREATE_TIME as created_at,
         t.UPDATE_TIME as updated_at,
         (SELECT COUNT(*) FROM information_schema.COLUMNS c
          WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME) as column_count,
         (SELECT kcu.COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE kcu
          WHERE kcu.TABLE_SCHEMA = t.TABLE_SCHEMA AND kcu.TABLE_NAME = t.TABLE_NAME
            AND kcu.CONSTRAINT_NAME = 'PRIMARY' LIMIT 1) as primary_key
       FROM information_schema.TABLES t
       WHERE t.TABLE_SCHEMA = ?
       ORDER BY t.TABLE_NAME ASC`,
      [dbName]
    );

    return tables.map((t) => ({
      tableName: t.table_name,
      engine: t.engine || 'InnoDB',
      rowCount: Number(t.row_count) || 0,
      dataBytes: Number(t.data_bytes) || 0,
      indexBytes: Number(t.index_bytes) || 0,
      collation: t.collation || 'utf8mb4_unicode_ci',
      comment: t.table_comment || '',
      columnCount: Number(t.column_count) || 0,
      primaryKey: t.primary_key || null,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      isSystemTable: PROTECTED_SYSTEM_TABLES.has(t.table_name),
    }));
  }

  /**
   * Detailed Table Structure: columns, keys, indexes, and foreign keys.
   */
  async getTableStructure(tableName: string) {
    this.quoteIdentifier(tableName); // Validate name
    const dbName = env.DB_NAME;

    // 1. Columns
    const columns = await query<RowDataPacket[]>(
      `SELECT
         COLUMN_NAME as column_name,
         ORDINAL_POSITION as ordinal_position,
         DATA_TYPE as data_type,
         COLUMN_TYPE as column_type,
         IS_NULLABLE as is_nullable,
         COLUMN_DEFAULT as column_default,
         COLUMN_KEY as column_key,
         EXTRA as extra,
         COLUMN_COMMENT as column_comment
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [dbName, tableName]
    );

    if (columns.length === 0) {
      throw new Error(`Table '${tableName}' does not exist in database '${dbName}'`);
    }

    // 2. Indexes
    const indexRows = await query<RowDataPacket[]>(
      `SELECT
         INDEX_NAME as index_name,
         COLUMN_NAME as column_name,
         NON_UNIQUE as non_unique,
         SEQ_IN_INDEX as seq_in_index,
         INDEX_TYPE as index_type
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY INDEX_NAME ASC, SEQ_IN_INDEX ASC`,
      [dbName, tableName]
    );

    const indexMap = new Map<string, { name: string; isUnique: boolean; type: string; columns: string[] }>();
    indexRows.forEach((row) => {
      if (!indexMap.has(row.index_name)) {
        indexMap.set(row.index_name, {
          name: row.index_name,
          isUnique: row.non_unique === 0,
          type: row.index_type,
          columns: [],
        });
      }
      indexMap.get(row.index_name)!.columns.push(row.column_name);
    });

    // 3. Foreign Keys & References
    const fkRows = await query<RowDataPacket[]>(
      `SELECT
         kcu.CONSTRAINT_NAME as constraint_name,
         kcu.COLUMN_NAME as column_name,
         kcu.REFERENCED_TABLE_NAME as referenced_table,
         kcu.REFERENCED_COLUMN_NAME as referenced_column,
         rc.UPDATE_RULE as on_update,
         rc.DELETE_RULE as on_delete
       FROM information_schema.KEY_COLUMN_USAGE kcu
       INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
         ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
         AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
       WHERE kcu.TABLE_SCHEMA = ? AND kcu.TABLE_NAME = ?
         AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY kcu.CONSTRAINT_NAME ASC`,
      [dbName, tableName]
    );

    // 4. Inbound Relationships (other tables referencing this table)
    const inboundFkRows = await query<RowDataPacket[]>(
      `SELECT
         kcu.TABLE_NAME as referencing_table,
         kcu.COLUMN_NAME as referencing_column,
         kcu.CONSTRAINT_NAME as constraint_name,
         kcu.REFERENCED_COLUMN_NAME as referenced_column,
         rc.DELETE_RULE as on_delete,
         rc.UPDATE_RULE as on_update
       FROM information_schema.KEY_COLUMN_USAGE kcu
       INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
         ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
         AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
       WHERE kcu.TABLE_SCHEMA = ? AND kcu.REFERENCED_TABLE_NAME = ?
       ORDER BY kcu.TABLE_NAME ASC`,
      [dbName, tableName]
    );

    const primaryKeyColumns = columns
      .filter((c) => c.column_key === 'PRI')
      .map((c) => c.column_name);

    return {
      tableName,
      isSystemTable: PROTECTED_SYSTEM_TABLES.has(tableName),
      primaryKey: primaryKeyColumns,
      columns: columns.map((c) => {
        const isPrimaryKey = c.column_key === 'PRI';
        const isUnique = c.column_key === 'UNI';
        const isAutoIncrement = (c.extra || '').toLowerCase().includes('auto_increment');

        return {
          name: c.column_name,
          ordinalPosition: c.ordinal_position,
          dataType: c.data_type.toUpperCase(),
          columnType: c.column_type,
          isNullable: c.is_nullable === 'YES',
          defaultValue: c.column_default,
          isPrimaryKey,
          isUnique,
          isAutoIncrement,
          comment: c.column_comment || '',
        };
      }),
      indexes: Array.from(indexMap.values()),
      foreignKeys: fkRows.map((fk) => ({
        constraintName: fk.constraint_name,
        columnName: fk.column_name,
        referencedTable: fk.referenced_table,
        referencedColumn: fk.referenced_column,
        onUpdate: fk.on_update,
        onDelete: fk.on_delete,
      })),
      inboundRelationships: inboundFkRows.map((ifk) => ({
        referencingTable: ifk.referencing_table,
        referencingColumn: ifk.referencing_column,
        constraintName: ifk.constraint_name,
        referencedColumn: ifk.referenced_column,
        onDelete: ifk.on_delete,
        onUpdate: ifk.on_update,
      })),
    };
  }

  /**
   * Helper to format a single column's DDL definition clause.
   */
  private formatColumnDdl(col: ColumnDefinitionDto): string {
    const quotedName = this.quoteIdentifier(col.name);
    let typePart: string = col.dataType;

    if (col.length !== undefined && col.length !== null && String(col.length).trim() !== '') {
      typePart = `${col.dataType}(${col.length})`;
    } else if (col.dataType === 'VARCHAR') {
      typePart = 'VARCHAR(255)';
    } else if (col.dataType === 'DECIMAL') {
      typePart = 'DECIMAL(10,2)';
    }

    const nullPart = col.isNullable ? 'NULL' : 'NOT NULL';
    const autoIncPart = col.isAutoIncrement ? 'AUTO_INCREMENT' : '';

    let defaultPart = '';
    if (col.defaultValue !== undefined && col.defaultValue !== null && col.defaultValue.trim() !== '') {
      const val = col.defaultValue.trim();
      if (
        val.toUpperCase() === 'CURRENT_TIMESTAMP' ||
        val.toUpperCase() === 'NOW()' ||
        val.toUpperCase() === 'NULL' ||
        !isNaN(Number(val))
      ) {
        defaultPart = `DEFAULT ${val}`;
      } else {
        defaultPart = `DEFAULT '${val.replace(/'/g, "''")}'`;
      }
    }

    const commentPart = col.comment ? `COMMENT '${col.comment.replace(/'/g, "''")}'` : '';

    return [quotedName, typePart, nullPart, autoIncPart, defaultPart, commentPart]
      .filter((part) => part.length > 0)
      .join(' ');
  }

  /**
   * Generates safe CREATE TABLE SQL statement from visual DTO.
   */
  generateCreateTableSql(dto: CreateTableDto): string {
    const quotedTableName = this.quoteIdentifier(dto.tableName);
    const definitions: string[] = [];

    // 1. Column Definitions
    dto.columns.forEach((col) => {
      definitions.push(`  ${this.formatColumnDdl(col)}`);
    });

    // 2. Primary Key
    const pkColumns = dto.columns.filter((c) => c.isPrimaryKey).map((c) => this.quoteIdentifier(c.name));
    if (pkColumns.length > 0) {
      definitions.push(`  PRIMARY KEY (${pkColumns.join(', ')})`);
    }

    // 3. Unique Keys from column flags
    dto.columns
      .filter((c) => c.isUnique && !c.isPrimaryKey)
      .forEach((c) => {
        const quotedCol = this.quoteIdentifier(c.name);
        definitions.push(`  UNIQUE KEY ${this.quoteIdentifier(`uk_${dto.tableName}_${c.name}`)} (${quotedCol})`);
      });

    // 4. Custom Indexes
    dto.indexes?.forEach((idx) => {
      const quotedCols = idx.columns.map((c) => this.quoteIdentifier(c)).join(', ');
      const prefix = idx.isUnique ? 'UNIQUE KEY' : 'INDEX';
      definitions.push(`  ${prefix} ${this.quoteIdentifier(idx.name)} (${quotedCols})`);
    });

    // 5. Foreign Keys
    dto.foreignKeys?.forEach((fk) => {
      const fkName = fk.name || `fk_${dto.tableName}_${fk.columnName}`;
      definitions.push(
        `  CONSTRAINT ${this.quoteIdentifier(fkName)} FOREIGN KEY (${this.quoteIdentifier(
          fk.columnName
        )}) REFERENCES ${this.quoteIdentifier(fk.referencedTable)} (${this.quoteIdentifier(
          fk.referencedColumn
        )}) ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`
      );
    });

    const commentPart = dto.comment ? ` COMMENT='${dto.comment.replace(/'/g, "''")}'` : '';

    return `CREATE TABLE ${quotedTableName} (\n${definitions.join(
      ',\n'
    )}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci${commentPart};`;
  }

  /**
   * Executes CREATE TABLE.
   */
  async createTable(dto: CreateTableDto) {
    if (PROTECTED_SYSTEM_TABLES.has(dto.tableName)) {
      throw new Error(`Cannot create table with reserved system name '${dto.tableName}'`);
    }

    const sql = this.generateCreateTableSql(dto);
    logger.info(`Executing CREATE TABLE: ${dto.tableName}`);
    await query(sql);

    return {
      success: true,
      tableName: dto.tableName,
      sql,
      message: `Table '${dto.tableName}' created successfully.`,
    };
  }

  /**
   * Generates ALTER TABLE SQL statements.
   */
  generateAlterTableSql(tableName: string, dto: AlterTableDto): string[] {
    const quotedTable = this.quoteIdentifier(tableName);
    const statements: string[] = [];

    switch (dto.action) {
      case 'addColumn': {
        if (!dto.column) throw new Error('Column definition is required for addColumn action');
        statements.push(`ALTER TABLE ${quotedTable} ADD COLUMN ${this.formatColumnDdl(dto.column)};`);
        if (dto.column.isPrimaryKey) {
          statements.push(`ALTER TABLE ${quotedTable} ADD PRIMARY KEY (${this.quoteIdentifier(dto.column.name)});`);
        }
        if (dto.column.isUnique) {
          statements.push(
            `ALTER TABLE ${quotedTable} ADD UNIQUE KEY ${this.quoteIdentifier(
              `uk_${tableName}_${dto.column.name}`
            )} (${this.quoteIdentifier(dto.column.name)});`
          );
        }
        break;
      }
      case 'modifyColumn': {
        if (!dto.column) throw new Error('Column definition is required for modifyColumn action');
        const oldName = dto.oldColumnName || dto.column.name;
        if (oldName !== dto.column.name) {
          statements.push(
            `ALTER TABLE ${quotedTable} CHANGE COLUMN ${this.quoteIdentifier(oldName)} ${this.formatColumnDdl(
              dto.column
            )};`
          );
        } else {
          statements.push(`ALTER TABLE ${quotedTable} MODIFY COLUMN ${this.formatColumnDdl(dto.column)};`);
        }
        break;
      }
      case 'dropColumn': {
        if (!dto.columnName) throw new Error('Column name is required for dropColumn action');
        statements.push(`ALTER TABLE ${quotedTable} DROP COLUMN ${this.quoteIdentifier(dto.columnName)};`);
        break;
      }
      case 'addIndex': {
        if (!dto.index) throw new Error('Index definition is required for addIndex action');
        const cols = dto.index.columns.map((c) => this.quoteIdentifier(c)).join(', ');
        const prefix = dto.index.isUnique ? 'UNIQUE KEY' : 'INDEX';
        statements.push(
          `ALTER TABLE ${quotedTable} ADD ${prefix} ${this.quoteIdentifier(dto.index.name)} (${cols});`
        );
        break;
      }
      case 'dropIndex': {
        if (!dto.indexName) throw new Error('Index name is required for dropIndex action');
        statements.push(`ALTER TABLE ${quotedTable} DROP INDEX ${this.quoteIdentifier(dto.indexName)};`);
        break;
      }
      case 'addForeignKey': {
        if (!dto.foreignKey) throw new Error('Foreign key definition is required for addForeignKey action');
        const fk = dto.foreignKey;
        const fkName = fk.name || `fk_${tableName}_${fk.columnName}`;
        statements.push(
          `ALTER TABLE ${quotedTable} ADD CONSTRAINT ${this.quoteIdentifier(
            fkName
          )} FOREIGN KEY (${this.quoteIdentifier(fk.columnName)}) REFERENCES ${this.quoteIdentifier(
            fk.referencedTable
          )} (${this.quoteIdentifier(fk.referencedColumn)}) ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate};`
        );
        break;
      }
      case 'dropForeignKey': {
        if (!dto.foreignKeyName) throw new Error('Foreign key name is required for dropForeignKey action');
        statements.push(`ALTER TABLE ${quotedTable} DROP FOREIGN KEY ${this.quoteIdentifier(dto.foreignKeyName)};`);
        break;
      }
      case 'renameTable': {
        if (!dto.newTableName) throw new Error('New table name is required for renameTable action');
        statements.push(`RENAME TABLE ${quotedTable} TO ${this.quoteIdentifier(dto.newTableName)};`);
        break;
      }
    }

    return statements;
  }

  /**
   * Executes ALTER TABLE operations safely.
   */
  async alterTable(tableName: string, dto: AlterTableDto) {
    if (PROTECTED_SYSTEM_TABLES.has(tableName) && (dto.action === 'dropColumn' || dto.action === 'renameTable')) {
      throw new Error(`Potentially destructive operation '${dto.action}' is forbidden on system table '${tableName}'`);
    }

    const statements = this.generateAlterTableSql(tableName, dto);

    await withTransaction(async (conn) => {
      for (const sql of statements) {
        logger.info(`Executing ALTER TABLE statement on '${tableName}': ${sql}`);
        await conn.query(sql);
      }
    });

    return {
      success: true,
      statements,
      message: `Table '${tableName}' successfully updated.`,
    };
  }

  /**
   * Drops a database table.
   */
  async dropTable(tableName: string) {
    if (PROTECTED_SYSTEM_TABLES.has(tableName)) {
      throw new Error(`Cannot drop core protected system table '${tableName}'`);
    }

    const quotedTable = this.quoteIdentifier(tableName);
    logger.warn(`Dropping table: ${tableName}`);
    await query(`DROP TABLE ${quotedTable};`);

    return {
      success: true,
      message: `Table '${tableName}' dropped successfully.`,
    };
  }

  /**
   * Fetch Table Records with server-side pagination, sorting, search, and Excel filters.
   */
  async fetchTableData(tableName: string, queryDto: TableDataQueryDto) {
    const quotedTable = this.quoteIdentifier(tableName);
    const { page, limit, sortBy, sortOrder, search, filters: rawFilters } = queryDto;

    // Get column structure for type checks
    const structure = await this.getTableStructure(tableName);
    const columnMap = new Map(structure.columns.map((c) => [c.name, c]));

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    // 1. Global Search across text-based columns
    if (search && search.trim()) {
      const searchTerms = search.trim();
      const searchableColumns = structure.columns.filter((c) =>
        ['VARCHAR', 'CHAR', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'].includes(c.dataType)
      );

      if (searchableColumns.length > 0) {
        const searchOrs = searchableColumns.map((col) => {
          params.push(`%${searchTerms}%`);
          return `${this.quoteIdentifier(col.name)} LIKE ?`;
        });
        whereClauses.push(`(${searchOrs.join(' OR ')})`);
      }
    }

    // 2. Structured Column Filter Rules
    if (rawFilters) {
      try {
        const parsedFilters: RecordFilterRule[] = JSON.parse(rawFilters);
        if (Array.isArray(parsedFilters)) {
          parsedFilters.forEach((filter) => {
            const col = columnMap.get(filter.column);
            if (!col) return;
            const quotedCol = this.quoteIdentifier(filter.column);

            switch (filter.operator) {
              case 'equals':
                whereClauses.push(`${quotedCol} = ?`);
                params.push(filter.value);
                break;
              case 'notEquals':
                whereClauses.push(`${quotedCol} != ?`);
                params.push(filter.value);
                break;
              case 'contains':
                whereClauses.push(`${quotedCol} LIKE ?`);
                params.push(`%${filter.value}%`);
                break;
              case 'notContains':
                whereClauses.push(`${quotedCol} NOT LIKE ?`);
                params.push(`%${filter.value}%`);
                break;
              case 'startsWith':
                whereClauses.push(`${quotedCol} LIKE ?`);
                params.push(`${filter.value}%`);
                break;
              case 'endsWith':
                whereClauses.push(`${quotedCol} LIKE ?`);
                params.push(`%${filter.value}`);
                break;
              case 'gt':
                whereClauses.push(`${quotedCol} > ?`);
                params.push(filter.value);
                break;
              case 'gte':
                whereClauses.push(`${quotedCol} >= ?`);
                params.push(filter.value);
                break;
              case 'lt':
                whereClauses.push(`${quotedCol} < ?`);
                params.push(filter.value);
                break;
              case 'lte':
                whereClauses.push(`${quotedCol} <= ?`);
                params.push(filter.value);
                break;
              case 'between':
                whereClauses.push(`${quotedCol} BETWEEN ? AND ?`);
                params.push(filter.value, filter.secondValue);
                break;
              case 'in':
                if (Array.isArray(filter.value) && filter.value.length > 0) {
                  const placeholders = filter.value.map(() => '?').join(', ');
                  whereClauses.push(`${quotedCol} IN (${placeholders})`);
                  params.push(...filter.value);
                }
                break;
              case 'isNull':
                whereClauses.push(`${quotedCol} IS NULL`);
                break;
              case 'isNotNull':
                whereClauses.push(`${quotedCol} IS NOT NULL`);
                break;
            }
          });
        }
      } catch (err) {
        logger.warn('Failed to parse table filter JSON', { err });
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 3. Count Total Matching Rows
    const countSql = `SELECT COUNT(*) as total FROM ${quotedTable} ${whereSql}`;
    const countRows = await query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total) || 0;

    // 4. Sorting
    let orderSql = '';
    if (sortBy && columnMap.has(sortBy)) {
      const dir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderSql = `ORDER BY ${this.quoteIdentifier(sortBy)} ${dir}`;
    } else if (structure.primaryKey.length > 0) {
      orderSql = `ORDER BY ${this.quoteIdentifier(structure.primaryKey[0])} DESC`;
    }

    // 5. Pagination
    const offset = (page - 1) * limit;
    const dataSql = `SELECT * FROM ${quotedTable} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];

    const rows = await query<RowDataPacket[]>(dataSql, dataParams);

    // 6. Mask sensitive column values
    const sanitizedRows = rows.map((row) => {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(row)) {
        const isSensitive = SENSITIVE_COLUMN_PATTERNS.some((pat) => pat.test(key));
        if (isSensitive && val !== null && val !== undefined) {
          sanitized[key] = '••••••••';
          sanitized[`__isMasked_${key}`] = true;
        } else {
          sanitized[key] = val;
        }
      }
      return sanitized;
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tableName,
      columns: structure.columns,
      primaryKey: structure.primaryKey,
      data: sanitizedRows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Inserts a record into the table.
   */
  async insertRecord(tableName: string, data: Record<string, unknown>) {
    const quotedTable = this.quoteIdentifier(tableName);
    const structure = await this.getTableStructure(tableName);
    const columnMap = new Map(structure.columns.map((c) => [c.name, c]));

    const cols: string[] = [];
    const placeholders: string[] = [];
    const values: unknown[] = [];

    for (const [key, val] of Object.entries(data)) {
      const colDef = columnMap.get(key);
      if (!colDef) continue; // Skip non-existent fields

      // Skip auto-increment primary key if not provided
      if (colDef.isAutoIncrement && (val === undefined || val === null || val === '')) {
        continue;
      }

      cols.push(this.quoteIdentifier(key));
      placeholders.push('?');

      if (colDef.dataType === 'JSON' && typeof val === 'object' && val !== null) {
        values.push(JSON.stringify(val));
      } else if (colDef.dataType === 'BOOLEAN' || colDef.dataType === 'TINYINT') {
        values.push(val === true || val === 1 || val === 'true' ? 1 : 0);
      } else if (val === '' && colDef.isNullable) {
        values.push(null);
      } else {
        values.push(val);
      }
    }

    if (cols.length === 0) {
      throw new Error('No valid columns provided for record insertion');
    }

    const sql = `INSERT INTO ${quotedTable} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const result = await query<any>(sql, values);

    return {
      success: true,
      insertId: result.insertId || null,
      message: 'Record inserted successfully.',
    };
  }

  /**
   * Updates an existing record by primary key.
   */
  async updateRecord(tableName: string, pkValue: string | number, data: Record<string, unknown>) {
    const quotedTable = this.quoteIdentifier(tableName);
    const structure = await this.getTableStructure(tableName);

    if (structure.primaryKey.length === 0) {
      throw new Error(`Table '${tableName}' has no primary key defined. Updating requires a primary key.`);
    }

    const pkCol = structure.primaryKey[0];
    const columnMap = new Map(structure.columns.map((c) => [c.name, c]));

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, val] of Object.entries(data)) {
      if (key === pkCol) continue; // Do not update primary key
      if (key.startsWith('__isMasked_')) continue; // Ignore masked markers
      if (val === '••••••••') continue; // Do not overwrite with mask string

      const colDef = columnMap.get(key);
      if (!colDef) continue;

      setClauses.push(`${this.quoteIdentifier(key)} = ?`);

      if (colDef.dataType === 'JSON' && typeof val === 'object' && val !== null) {
        values.push(JSON.stringify(val));
      } else if (colDef.dataType === 'BOOLEAN' || colDef.dataType === 'TINYINT') {
        values.push(val === true || val === 1 || val === 'true' ? 1 : 0);
      } else if (val === '' && colDef.isNullable) {
        values.push(null);
      } else {
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      return { success: true, message: 'No fields were modified.' };
    }

    values.push(pkValue);
    const sql = `UPDATE ${quotedTable} SET ${setClauses.join(', ')} WHERE ${this.quoteIdentifier(pkCol)} = ?`;

    await query(sql, values);

    return {
      success: true,
      message: 'Record updated successfully.',
    };
  }

  /**
   * Deletes a record by primary key with foreign key constraint handling.
   */
  async deleteRecord(tableName: string, pkValue: string | number) {
    const quotedTable = this.quoteIdentifier(tableName);
    const structure = await this.getTableStructure(tableName);

    if (structure.primaryKey.length === 0) {
      throw new Error(`Table '${tableName}' has no primary key defined. Deleting requires a primary key.`);
    }

    const pkCol = structure.primaryKey[0];

    try {
      const sql = `DELETE FROM ${quotedTable} WHERE ${this.quoteIdentifier(pkCol)} = ?`;
      await query(sql, [pkValue]);

      return {
        success: true,
        message: 'Record deleted successfully.',
      };
    } catch (err: any) {
      // Catch MySQL Foreign Key Constraint Violation (Error 1451)
      if (err.errno === 1451 || (err.message && err.message.includes('foreign key constraint fails'))) {
        throw new Error(
          `Cannot delete record: Other tables hold foreign key references to this row. Remove dependent child records first.`
        );
      }
      throw err;
    }
  }

  /**
   * Provides foreign key reference options (LOV) for foreign key fields.
   */
  async getForeignKeyOptions(referencedTable: string, referencedColumn: string) {
    const quotedTable = this.quoteIdentifier(referencedTable);
    const quotedCol = this.quoteIdentifier(referencedColumn);

    // Try finding an appropriate descriptive label column (name, title, label, username, full_name, email)
    const structure = await this.getTableStructure(referencedTable);
    const candidateLabelCol = structure.columns.find((c) =>
      ['name', 'title', 'label', 'full_name', 'username', 'email'].includes(c.name.toLowerCase())
    );

    const labelCol = candidateLabelCol ? this.quoteIdentifier(candidateLabelCol.name) : quotedCol;

    const sql = `SELECT DISTINCT ${quotedCol} as value, ${labelCol} as label FROM ${quotedTable} LIMIT 100`;
    const rows = await query<RowDataPacket[]>(sql);

    return rows.map((r) => ({
      value: r.value,
      label: r.label !== null && r.label !== undefined ? String(r.label) : String(r.value),
    }));
  }
}

export const databaseService = new DatabaseService();
