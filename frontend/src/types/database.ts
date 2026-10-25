export interface DatabaseOverview {
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
}

export interface TableSummary {
  tableName: string;
  engine: string;
  rowCount: number;
  dataBytes: number;
  indexBytes: number;
  collation: string;
  comment: string;
  columnCount: number;
  primaryKey: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isSystemTable: boolean;
}

export interface TableColumn {
  name: string;
  ordinalPosition: number;
  dataType: string;
  columnType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  comment: string;
}

export interface TableIndex {
  name: string;
  isUnique: boolean;
  type: string;
  columns: string[];
}

export interface TableForeignKey {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onUpdate: string;
  onDelete: string;
}

export interface InboundRelationship {
  referencingTable: string;
  referencingColumn: string;
  constraintName: string;
  referencedColumn: string;
  onDelete: string;
  onUpdate: string;
}

export interface TableStructure {
  tableName: string;
  isSystemTable: boolean;
  primaryKey: string[];
  columns: TableColumn[];
  indexes: TableIndex[];
  foreignKeys: TableForeignKey[];
  inboundRelationships: InboundRelationship[];
}

export interface ColumnDefinitionInput {
  name: string;
  dataType: string;
  length?: string | number | null;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  isNullable?: boolean;
  defaultValue?: string | null;
  isUnique?: boolean;
  comment?: string | null;
}

export interface ForeignKeyInput {
  name?: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
  onUpdate?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
}

export interface IndexInput {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface CreateTableInput {
  tableName: string;
  comment?: string | null;
  columns: ColumnDefinitionInput[];
  foreignKeys?: ForeignKeyInput[];
  indexes?: IndexInput[];
}

export interface AlterTableInput {
  action:
    | 'addColumn'
    | 'modifyColumn'
    | 'dropColumn'
    | 'addIndex'
    | 'dropIndex'
    | 'addForeignKey'
    | 'dropForeignKey'
    | 'renameTable';
  column?: ColumnDefinitionInput;
  oldColumnName?: string;
  columnName?: string;
  index?: IndexInput;
  indexName?: string;
  foreignKey?: ForeignKeyInput;
  foreignKeyName?: string;
  newTableName?: string;
}

export interface ForeignKeyOption {
  value: string | number;
  label: string;
}
