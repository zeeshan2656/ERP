import { z } from 'zod';

export const FormTypeEnum = z.enum([
  'single',
  'continuous',
  'tabular',
  'popup',
  'fullscreen',
  'readonly',
]);

export const FormStatusEnum = z.enum(['draft', 'published']);

export const FormSourceTypeEnum = z.enum(['table', 'query', 'view', 'none']);

export const FormControlTypeEnum = z.enum([
  // Data Entry Controls
  'text',
  'textarea',
  'number',
  'decimal',
  'currency',
  'percentage',
  'date',
  'time',
  'datetime',
  'checkbox',
  'switch',
  'radio',
  'select',
  'lookup',
  'lov',
  'autocomplete',
  'email',
  'phone',
  'password',
  'url',
  'hidden',
  'readonly',

  // Display & Layout Controls
  'label',
  'heading',
  'description',
  'divider',
  'spacer',
  'container',
  'section',
  'tabs',
  'accordion',
  'columns',
  'grid',
  'image',
  'icon',
  'html',

  // Advanced Data Controls
  'datagrid',
  'continuous_grid',
  'record_nav',
  'search',
  'file_upload',
  'calculated',
  'button',
  'action_menu',
  'master_detail',
]);

export const FormControlSchema = z.object({
  id: z.string(),
  type: FormControlTypeEnum,
  name: z.string(),
  label: z.string(),
  fieldBinding: z.string().optional().nullable(),
  placeholder: z.string().optional().nullable(),
  defaultValue: z.any().optional(),
  helpText: z.string().optional().nullable(),
  tooltip: z.string().optional().nullable(),
  col: z.number().int().min(1).max(12).default(1),
  row: z.number().int().min(1).default(1),
  colSpan: z.number().int().min(1).max(12).default(6),
  rowSpan: z.number().int().min(1).default(1),
  width: z.string().optional().nullable(),
  height: z.string().optional().nullable(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  styling: z
    .object({
      textColor: z.string().optional(),
      bgColor: z.string().optional(),
      borderColor: z.string().optional(),
      borderWidth: z.string().optional(),
      borderRadius: z.string().optional(),
      fontSize: z.string().optional(),
      fontWeight: z.string().optional(),
      labelPosition: z.enum(['above', 'left', 'right', 'hidden']).optional(),
      padding: z.string().optional(),
      customCss: z.string().optional(),
    })
    .optional(),
  validation: z
    .object({
      required: z.boolean().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      precision: z.number().optional(),
      pattern: z.string().optional(),
      mask: z.string().optional(),
      customRule: z.string().optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
  visibility: z.enum(['always', 'conditional', 'hidden']).default('always'),
  disabled: z.boolean().optional().default(false),
  readOnly: z.boolean().optional().default(false),
  lookupConfig: z
    .object({
      sourceType: z.enum(['table', 'query', 'static']).optional().default('table'),
      sourceTable: z.string().optional(),
      sourceQueryId: z.string().optional(),
      returnColumn: z.string().optional().default('id'),
      displayColumn: z.string().optional().default('name'),
      searchColumn: z.string().optional(),
      filter: z.string().optional(),
      orderBy: z.string().optional(),
      placeholder: z.string().optional(),
      isSearchable: z.boolean().optional().default(true),
      allowEmpty: z.boolean().optional().default(true),
      dependentField: z.string().optional(),
      staticOptions: z.array(z.object({ key: z.string(), label: z.string() })).optional(),
      dependentMappings: z
        .array(
          z.object({
            sourceColumn: z.string(),
            targetField: z.string(),
          })
        )
        .optional()
        .default([]),
    })
    .optional(),
  detailGridConfig: z
    .object({
      detailTable: z.string(),
      foreignKeyColumn: z.string(),
      masterKeyColumn: z.string(),
      gridTitle: z.string().optional(),
      columns: z
        .array(
          z.object({
            field: z.string(),
            label: z.string(),
            width: z.string().optional(),
            editable: z.boolean().optional().default(true),
            required: z.boolean().optional().default(false),
            type: z.string().optional(),
            precision: z.number().optional(),
          })
        )
        .optional()
        .default([]),
      allowAdd: z.boolean().optional().default(true),
      allowEdit: z.boolean().optional().default(true),
      allowDelete: z.boolean().optional().default(true),
      defaultPageSize: z.number().optional().default(10),
      cascadeDelete: z.boolean().optional().default(true),
    })
    .optional(),
  buttonAction: z
    .object({
      actionType: z.enum([
        'submit',
        'reset',
        'navigate',
        'calculate',
        'open_modal',
        'custom',
      ]),
      targetFormId: z.string().optional(),
      message: z.string().optional(),
      expression: z.string().optional(),
    })
    .optional(),
  calculatedConfig: z
    .object({
      formula: z.string(),
      targetFields: z.array(z.string()).optional(),
    })
    .optional(),
});

export const CanvasLayoutSchema = z.object({
  width: z.union([z.string(), z.number()]).default('100%'),
  padding: z.string().default('24px'),
  columns: z.number().int().min(1).max(24).default(12),
  gap: z.number().int().min(0).max(64).default(16),
  snapToGrid: z.boolean().default(true),
  gridSize: z.number().int().min(4).max(64).default(8),
  showGridLines: z.boolean().default(true),
  zoomLevel: z.number().min(0.5).max(2.0).default(1.0),
});

export const MasterDetailConfigSchema = z.object({
  masterTable: z.string(),
  masterPrimaryKey: z.string(),
  details: z.array(
    z.object({
      id: z.string(),
      gridControlId: z.string(),
      detailTable: z.string(),
      foreignKeyColumn: z.string(),
      masterKeyColumn: z.string(),
      relationshipType: z.enum(['one_to_many', 'one_to_one']).default('one_to_many'),
      cascadeDelete: z.boolean().default(true),
      columns: z.array(z.any()).optional().default([]),
    })
  ),
});

export const FormDisplayModeEnum = z.enum(['embedded', 'dialog', 'fullscreen']);

export const CreateFormSchema = z.object({
  name: z.string().min(1, 'Form name is required').max(150),
  slug: z.string().max(150).optional(),
  description: z.string().optional().nullable(),
  category: z.string().max(80).default('General'),
  form_type: FormTypeEnum.default('single'),
  display_mode: FormDisplayModeEnum.optional().default('embedded'),
  status: FormStatusEnum.default('draft'),
  source_type: FormSourceTypeEnum.default('table'),
  source_name: z.string().optional().nullable(),
  canvas_layout: CanvasLayoutSchema.default({}),
  controls: z.array(FormControlSchema).default([]),
  master_detail_config: MasterDetailConfigSchema.optional().nullable(),
  actions_config: z.any().optional().nullable(),
});

export const UpdateFormSchema = CreateFormSchema.partial();

export const FormRecordQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).default('ASC'),
  search: z.string().optional(),
  filters: z.string().optional(), // JSON encoded filter rules
});

export const LookupQuerySchema = z.object({
  sourceType: z.enum(['table', 'query', 'static']).default('table'),
  sourceName: z.string().min(1, 'Source name is required'),
  returnColumn: z.string().min(1, 'Return column is required'),
  displayColumn: z.string().min(1, 'Display column is required'),
  search: z.string().optional(),
  filter: z.string().optional(),
  orderBy: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type FormControl = z.infer<typeof FormControlSchema>;
export type CanvasLayout = z.infer<typeof CanvasLayoutSchema>;
export type MasterDetailConfig = z.infer<typeof MasterDetailConfigSchema>;
export type CreateFormInput = z.infer<typeof CreateFormSchema>;
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>;
export type FormRecordQuery = z.infer<typeof FormRecordQuerySchema>;
export type LookupQuery = z.infer<typeof LookupQuerySchema>;
