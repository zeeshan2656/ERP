export type ThemeStyle = 'general' | 'soft-ui' | 'enterprise' | 'glassmorphism';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';
export type ThemeDensity = 'comfortable' | 'compact';

export type SemanticButtonVariant =
  | 'primary'
  | 'secondary'
  | 'save'
  | 'update'
  | 'cancel'
  | 'delete'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'success'
  | 'warning'
  | 'info';

export interface PageAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: SemanticButtonVariant;
  onClick: () => void | Promise<void>;
  permission?: { module: string; action: 'view' | 'add' | 'edit' | 'delete' };
  visible?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  shortcut?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  avatarPath?: string | null;
  isActive: boolean;
  themePreference?: string;
  customThemeTokens?: Record<string, string> | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  userCount: number;
  permissions?: RolePermission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  moduleKey: string;
  moduleName?: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ModuleItem {
  id: string;
  moduleKey: string;
  name: string;
  description?: string | null;
  iconName: string;
  routePath: string;
  menuPosition: number;
  isCore: boolean;
  isEnabled: boolean;
  permissionKey: string;
  category: string;
}

export interface BrandingConfig {
  productName: string;
  companyName: string;
  tagline: string;
  footerText: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  loginBackgroundUrl: string;

  // The 3 Independent Theme Axes
  themeStyle: ThemeStyle;
  themeMode: ThemeMode;
  densityMode: ThemeDensity;

  // Persistent Project-Wide Application Zoom
  appZoom: number;

  // Legacy Theme Field
  activeTheme?: string;

  allowUserThemeOverride: boolean;
  fontFamily: string;
  baseFontSize: string;
  borderRadius: string;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  headerColor: string;
  canvasColor: string;

  // Semantic Button Colors
  btnSaveColor?: string;
  btnUpdateColor?: string;
  btnCancelColor?: string;
  btnDeleteColor?: string;
  btnSuccessColor?: string;
  btnWarningColor?: string;
  btnInfoColor?: string;

  // Soft UI Tokens
  softUiDistance?: string;
  softUiBlur?: string;
  softUiIntensity?: number;
  softUiLightBg?: string;
  softUiLightShadowDark?: string;
  softUiLightShadowLight?: string;
  softUiDarkBg?: string;
  softUiDarkShadowDark?: string;
  softUiDarkShadowLight?: string;

  // Radius Tokens
  radiusGlobal?: string;
  radiusButtons?: string;
  radiusInputs?: string;
  radiusCards?: string;
  radiusSidebar?: string;
  radiusHeader?: string;
  radiusDialogs?: string;
  radiusTables?: string;
  radiusBadges?: string;
  radiusTabs?: string;
  radiusToasts?: string;
  radiusImages?: string;
  radiusControls?: string;
}

export interface AppearanceSettings {
  themeStyle: ThemeStyle;
  themeMode: ThemeMode;
  densityMode: ThemeDensity;
  appZoom: number;
  activeTheme?: string;

  allowUserThemeOverride: boolean;
  fontFamily: string;
  baseFontSize: string;
  borderRadius: string;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  headerColor: string;
  canvasColor: string;

  // Semantic Button Colors
  btnSaveColor: string;
  btnUpdateColor: string;
  btnCancelColor: string;
  btnDeleteColor: string;
  btnSuccessColor: string;
  btnWarningColor: string;
  btnInfoColor: string;

  // Soft UI Tokens
  softUiDistance: string;
  softUiBlur: string;
  softUiIntensity: number;
  softUiLightBg: string;
  softUiLightShadowDark: string;
  softUiLightShadowLight: string;
  softUiDarkBg: string;
  softUiDarkShadowDark: string;
  softUiDarkShadowLight: string;

  // Radius Tokens
  radiusGlobal: string;
  radiusButtons: string;
  radiusInputs: string;
  radiusCards: string;
  radiusSidebar: string;
  radiusHeader: string;
  radiusDialogs: string;
  radiusTables: string;
  radiusBadges: string;
  radiusTabs: string;
  radiusToasts: string;
  radiusImages: string;
  radiusControls: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  username: string | null;
  userFullName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==========================================
// VISUAL QUERY BUILDER TYPES
// ==========================================

export interface QueryTableNode {
  id: string; // unique instance ID on canvas
  tableName: string;
  alias: string;
  position: { x: number; y: number };
}

export type QueryAggregateFunc = 'NONE' | 'COUNT' | 'COUNT_DISTINCT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

export interface QueryColumn {
  id: string;
  tableAlias: string;
  tableName: string;
  columnName: string;
  alias?: string;
  dataType?: string;
  aggregate?: QueryAggregateFunc;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface QueryCalculatedColumn {
  id: string;
  alias: string;
  formula: string;
  outputType?: 'VARCHAR' | 'INT' | 'DECIMAL' | 'BOOLEAN' | 'DATETIME';
  isVisible?: boolean;
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
  aggregate?: QueryAggregateFunc;
}

export type QueryJoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';

export type QueryJoinOperator = '=' | '<>' | '>' | '<' | '>=' | '<=';

export interface QueryJoin {
  id: string;
  sourceTableAlias: string;
  sourceColumn: string;
  targetTableAlias: string;
  targetColumn: string;
  joinType: QueryJoinType;
  operator?: QueryJoinOperator;
  leftTableId?: string;
  leftTable?: string;
  leftTableAlias?: string;
  leftColumn?: string;
  rightTableId?: string;
  rightTable?: string;
  rightTableAlias?: string;
  rightColumn?: string;
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_EQUAL'
  | 'LESS_EQUAL'
  | 'LIKE'
  | 'NOT_LIKE'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'IN'
  | 'NOT_IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL'
  | 'BETWEEN';

export interface QueryCondition {
  id: string;
  tableAlias: string;
  columnName: string;
  operator: ConditionOperator;
  value?: any;
  valueTo?: any; // For BETWEEN
  isParameter?: boolean;
  parameterName?: string;
}

export interface QueryConditionGroup {
  id: string;
  logicalOperator: 'AND' | 'OR';
  conditions: (QueryCondition | QueryConditionGroup)[];
}

export interface QueryOrderBy {
  id: string;
  columnOrAlias: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryParameter {
  id: string;
  name: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  isRequired?: boolean;
  defaultValue?: any;
}

export interface VisualQueryDefinition {
  tables: QueryTableNode[];
  joins: QueryJoin[];
  columns: QueryColumn[];
  gridColumns?: AccessGridColumn[];
  calculatedColumns?: QueryCalculatedColumn[];
  filters?: QueryConditionGroup;
  groupBy?: string[];
  having?: QueryConditionGroup;
  orderBy?: QueryOrderBy[];
  distinct?: boolean;
  limit?: number;
  offset?: number;
}

export interface SavedQuery {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  status: 'draft' | 'published';
  visualDefinition: VisualQueryDefinition;
  generatedSql: string;
  parameters: QueryParameter[];
  outputColumns: Array<{
    id: string;
    name: string;
    alias: string;
    table: string;
    tableAlias: string;
    type: string;
    isCalculated: boolean;
  }>;
  sourceTables?: string[];
  columnCount?: number;
  parameterCount?: number;
  isTemplate?: boolean;
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryExecutionHistoryItem {
  id: string;
  executionTimeMs: number;
  rowCount: number;
  status: 'success' | 'error';
  errorMessage?: string | null;
  executedByName: string;
  executedAt: string;
}

export * from './forms.ts';

