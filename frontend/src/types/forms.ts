export type FormType = 'single' | 'continuous' | 'tabular' | 'popup' | 'fullscreen' | 'readonly';

export type FormDisplayMode = 'embedded' | 'dialog' | 'fullscreen';

export type FormStatus = 'draft' | 'published';

export type FormSourceType = 'table' | 'query' | 'view' | 'none';

export type FormControlType =
  // Data Entry Controls
  | 'text'
  | 'textarea'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'time'
  | 'datetime'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'select'
  | 'lookup'
  | 'lov'
  | 'autocomplete'
  | 'email'
  | 'phone'
  | 'password'
  | 'url'
  | 'hidden'
  | 'readonly'
  // Display & Layout Controls
  | 'label'
  | 'heading'
  | 'description'
  | 'divider'
  | 'spacer'
  | 'container'
  | 'section'
  | 'tabs'
  | 'accordion'
  | 'columns'
  | 'grid'
  | 'image'
  | 'icon'
  | 'html'
  // Advanced Data Controls
  | 'datagrid'
  | 'continuous_grid'
  | 'record_nav'
  | 'search'
  | 'file_upload'
  | 'calculated'
  | 'button'
  | 'action_menu'
  | 'master_detail';

export type BorderStyleType =
  | 'none'
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'inset'
  | 'outset'
  | 'groove'
  | 'ridge';

export type BoxAppearancePreset =
  | 'default'
  | 'flat'
  | 'outlined'
  | 'filled'
  | 'inset' // recessed 3D effect (MS Access / APEX)
  | 'outset' // raised 3D effect
  | 'raised' // elevated shadow
  | 'recessed' // inner shadow recessed
  | 'borderless';

export type ShadowElevation = 'none' | 'subtle' | 'medium' | 'strong';

export interface FormControlStyling {
  // Box Preset & Visual Style
  boxAppearance?: BoxAppearancePreset;
  shadowElevation?: ShadowElevation;

  // Borders
  borderStyle?: BorderStyleType;
  borderWidth?: string; // e.g. '1px', '2px', '3px'
  borderColor?: string;
  borderRadius?: string; // e.g. '0px', '4px', '8px', '9999px'

  // Colors
  bgColor?: string;
  textColor?: string;

  // Typography
  fontFamily?: string;
  fontSize?: string; // e.g. '11px', '12px', '13px', '14px', '16px'
  fontWeight?: string; // '400', '500', '600', '700'
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: 'left' | 'center' | 'right';

  // Sizing & Spacing
  padding?: string; // e.g. '6px 10px', '10px 14px'
  margin?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;

  // Interactive States
  focusBorderColor?: string;
  focusBgColor?: string;
  focusRingColor?: string;
  hoverBorderColor?: string;
  hoverBgColor?: string;

  // Disabled / ReadOnly Styling
  disabledBgColor?: string;
  disabledTextColor?: string;
  readOnlyBgColor?: string;
  readOnlyTextColor?: string;

  // Layout & Visibility
  isHidden?: boolean;
  labelPosition?: 'above' | 'left' | 'right' | 'hidden';
  labelWidth?: string;
  customCss?: string;

  // Element-Specific Styling
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'custom';
  sectionBgColor?: string;
  sectionTextColor?: string;
  sectionBorderColor?: string;
  gridHeaderBg?: string;
  gridHeaderTextColor?: string;
  gridRowStriped?: boolean;
  gridCellPadding?: 'compact' | 'normal' | 'spacious';
}

export interface FormControlValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  precision?: number;
  pattern?: string;
  mask?: string;
  customRule?: string;
  errorMessage?: string;
}

export interface LookupDependentFieldMapping {
  sourceColumn: string;
  targetField: string;
}

export interface LookupConfig {
  sourceType?: 'table' | 'query' | 'static';
  sourceTable?: string;
  sourceQueryId?: string;
  returnColumn: string;
  displayColumn: string;
  searchColumn?: string;
  filter?: string;
  orderBy?: string;
  placeholder?: string;
  isSearchable?: boolean;
  allowEmpty?: boolean;
  dependentField?: string;
  staticOptions?: Array<{ key: string; label: string }>;
  dependentMappings?: LookupDependentFieldMapping[];
}

export interface DetailGridColumn {
  field: string;
  label: string;
  width?: string;
  editable?: boolean;
  required?: boolean;
  type?: 'text' | 'number' | 'currency' | 'date' | 'select';
  precision?: number;
}

export type SummaryCalculationType = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'FORMULA';
export type SummaryDisplayFormat = 'currency' | 'number' | 'percentage';

export interface DetailGridSummaryField {
  id: string;
  label: string;
  sourceColumn?: string;
  calculationType: SummaryCalculationType;
  formula?: string; // e.g. "SUM(quantity * unit_price)"
  format?: SummaryDisplayFormat;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  targetFieldBinding?: string; // e.g. "total_amount" to sync with master record
  alignment?: 'left' | 'center' | 'right';
}

export interface DetailGridConfig {
  detailTable: string;
  foreignKeyColumn: string;
  masterKeyColumn: string;
  gridTitle?: string;
  columns: DetailGridColumn[];
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  defaultPageSize?: number;
  defaultVisibleRows?: number; // Configurable visible rows in detail grid (default 5)
  enableTotals?: boolean; // Enable summary / totals section below grid
  summaryFields?: DetailGridSummaryField[]; // Configured summary fields
  cascadeDelete?: boolean;
}

export interface ButtonActionConfig {
  actionType: 'submit' | 'reset' | 'navigate' | 'calculate' | 'open_modal' | 'custom';
  targetFormId?: string;
  message?: string;
  expression?: string;
}

export interface CalculatedConfig {
  formula: string;
  targetFields?: string[];
}

export interface FormControl {
  id: string;
  type: FormControlType;
  name: string;
  label: string;
  fieldBinding?: string | null;
  placeholder?: string | null;
  defaultValue?: any;
  helpText?: string | null;
  tooltip?: string | null;
  col: number; // 1-12
  row: number;
  colSpan: number; // 1-12
  rowSpan?: number;
  width?: string | null;
  height?: string | null;
  alignment?: 'left' | 'center' | 'right';
  styling?: FormControlStyling;
  validation?: FormControlValidation;
  visibility?: 'always' | 'conditional' | 'hidden';
  disabled?: boolean;
  readOnly?: boolean;
  lookupConfig?: LookupConfig;
  detailGridConfig?: DetailGridConfig;
  buttonAction?: ButtonActionConfig;
  calculatedConfig?: CalculatedConfig;
}

export interface FormCanvasLayout {
  width?: string | number;
  padding?: string;
  columns?: number;
  gap?: number;
  snapToGrid?: boolean;
  gridSize?: number;
  showGridLines?: boolean;
  zoomLevel?: number;
  displayMode?: FormDisplayMode;
}

export interface MasterDetailRelationship {
  id: string;
  gridControlId: string;
  detailTable: string;
  foreignKeyColumn: string;
  masterKeyColumn: string;
  relationshipType: 'one_to_many' | 'one_to_one';
  cascadeDelete: boolean;
  columns?: any[];
}

export interface MasterDetailConfig {
  masterTable: string;
  masterPrimaryKey: string;
  details: MasterDetailRelationship[];
}

export interface SavedForm {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  form_type: FormType;
  display_mode?: FormDisplayMode;
  status: FormStatus;
  source_type: FormSourceType;
  source_name?: string | null;
  canvasLayout: FormCanvasLayout;
  controls: FormControl[];
  masterDetailConfig?: MasterDetailConfig | null;
  actionsConfig?: any;
  controlCount?: number;
  hasMasterDetail?: boolean;
  version?: number;
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sourceSchema?: SourceSchema;
}

export interface SourceColumn {
  name: string;
  dataType: string;
  columnType: string;
  isNullable: boolean;
  defaultValue: any;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
  comment?: string;
  foreignKey?: {
    referencedTable: string;
    referencedColumn: string;
  } | null;
}

export interface SourceSchema {
  sourceType: FormSourceType;
  sourceName: string;
  columns: SourceColumn[];
  primaryKey: string | null;
  foreignKeys: Array<{
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
  inboundRelations: Array<{
    childTable: string;
    childForeignKey: string;
    parentPrimaryKey: string;
  }>;
  isEditable: boolean;
  queryId?: string;
  queryName?: string;
}

export interface EligibleDataSource {
  id?: string;
  name: string;
  type: 'table' | 'query';
  label: string;
  description: string;
  rowCount?: number;
  columnCount?: number;
  primaryKey?: string | null;
  isEditable?: boolean;
  status?: string;
}

export interface EligibleDataSourcesResponse {
  tables: EligibleDataSource[];
  queries: EligibleDataSource[];
}

export interface LookupItem {
  key: any;
  label: string;
  data?: Record<string, any>;
}

export interface FormRecordPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FormRecordResult {
  formId: string;
  formName: string;
  tableName: string;
  primaryKey: string | null;
  data: Record<string, any>[];
  pagination: FormRecordPagination;
}

export interface SingleRecordDetailsResult {
  master: Record<string, any>;
  details: Record<string, Record<string, any>[]>;
  primaryKey: string;
}
