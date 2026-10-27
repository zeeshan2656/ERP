import React, { useState } from 'react';
import {
  FormControl,
  FormControlType,
  FormCanvasLayout,
  FormType,
  FormDisplayMode,
  FormStatus,
  SourceSchema,
  EligibleDataSourcesResponse,
  MasterDetailConfig,
  LookupDependentFieldMapping,
  DetailGridSummaryField,
} from '../../../../types/index.ts';
import {
  Sliders,
  Type,
  Palette,
  CheckCircle2,
  Table,
  Play,
  Settings,
  Layers,
  Trash2,
  Copy,
  Plus,
  AlertTriangle,
  Database,
  ArrowRight,
  ShieldCheck,
  Search,
  Check,
  RefreshCw,
  Info,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Square,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { RESET_STYLING } from '../../../../utils/formStyling.ts';
import { BoxAppearancePreset, BorderStyleType, ShadowElevation, FormControlStyling } from '../../../../types/forms.ts';

export const COMPONENT_TYPE_OPTIONS: Array<{ value: FormControlType; label: string }> = [
  { value: 'text', label: 'Text / Single-line Text' },
  { value: 'textarea', label: 'Multiline Text / Text Area' },
  { value: 'number', label: 'Integer / Whole Number' },
  { value: 'decimal', label: 'Decimal / Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'date', label: 'Date Picker' },
  { value: 'time', label: 'Time Picker' },
  { value: 'datetime', label: 'Date and Time Picker' },
  { value: 'checkbox', label: 'Checkbox / Boolean' },
  { value: 'switch', label: 'Switch / Toggle' },
  { value: 'select', label: 'Dropdown / Select List' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'lookup', label: 'Lookup Field' },
  { value: 'lov', label: 'LOV (List of Values)' },
  { value: 'readonly', label: 'Read-only / Display Field' },
];

export interface CompatibilityInfo {
  status: 'compatible' | 'warning' | 'incompatible';
  badgeText: string;
  message: string;
  hint: string;
}

export function evaluateCompatibility(
  dbDataType: string | undefined,
  componentType: FormControlType
): CompatibilityInfo {
  if (!dbDataType) {
    return {
      status: 'compatible',
      badgeText: 'Unbound UI Field',
      message: 'This control is not bound to a database column. It stores state locally or via custom action.',
      hint: 'Select a database column binding if you want this field saved to the database.',
    };
  }

  const dt = dbDataType.toLowerCase();

  // Numbers (int, bigint, tinyint, smallint)
  if (dt.includes('int')) {
    if (componentType === 'number') {
      return {
        status: 'compatible',
        badgeText: 'Direct Match',
        message: `Database column is ${dbDataType.toUpperCase()}. Visual Integer input maps directly without conversion.`,
        hint: 'Direct numeric storage in database.',
      };
    }
    if (componentType === 'text') {
      return {
        status: 'warning',
        badgeText: 'Safe Visual Coercion',
        message: `Database column is ${dbDataType.toUpperCase()}. Visual Text input accepts strings, which are validated as integers on save.`,
        hint: 'Database schema remains intact. Numeric validation is enforced on form submission.',
      };
    }
    if (componentType === 'date' || componentType === 'datetime') {
      return {
        status: 'warning',
        badgeText: 'Safe Timestamp Coercion',
        message: `Database column is ${dbDataType.toUpperCase()} (e.g. Unix epoch or integer timestamp). Date Picker converts between Date and numeric integer.`,
        hint: 'Database column type is preserved. Values convert safely.',
      };
    }
    if (componentType === 'checkbox' || componentType === 'switch') {
      return {
        status: 'compatible',
        badgeText: 'Direct Boolean Match',
        message: `Database column is ${dbDataType.toUpperCase()}. Boolean toggle stores 1 (true) or 0 (false).`,
        hint: 'Direct boolean-to-integer mapping.',
      };
    }
    if (['select', 'lookup', 'lov', 'radio'].includes(componentType)) {
      return {
        status: 'compatible',
        badgeText: 'Foreign Key Compatible',
        message: `Database column is ${dbDataType.toUpperCase()}. The lookup return column should map to an integer key (e.g. id).`,
        hint: 'Stores integer key in database while displaying descriptive label to user.',
      };
    }
    if (['decimal', 'currency'].includes(componentType)) {
      return {
        status: 'warning',
        badgeText: 'Integer Rounding Notice',
        message: `Database column is ${dbDataType.toUpperCase()}. Any decimal fractional part will be rounded before saving to database.`,
        hint: 'To store fractional cents or decimals, ensure database column is DECIMAL/FLOAT.',
      };
    }
    return {
      status: 'warning',
      badgeText: 'Custom Coercion',
      message: `Database column is ${dbDataType.toUpperCase()}. Visual component '${componentType}' will be safely validated and coerced.`,
      hint: 'Physical database schema is preserved.',
    };
  }

  // Floating point / Decimal
  if (dt.includes('decimal') || dt.includes('float') || dt.includes('double') || dt.includes('numeric')) {
    if (['decimal', 'currency', 'percentage', 'number'].includes(componentType)) {
      return {
        status: 'compatible',
        badgeText: 'Direct Match',
        message: `Database column is ${dbDataType.toUpperCase()}. Visual component '${componentType}' maps directly with exact numeric precision.`,
        hint: 'Direct floating point / decimal database storage.',
      };
    }
    if (componentType === 'text') {
      return {
        status: 'warning',
        badgeText: 'Safe Decimal Coercion',
        message: `Database column is ${dbDataType.toUpperCase()}. Text input is parsed to decimal on submission.`,
        hint: 'Database schema remains intact.',
      };
    }
    return {
      status: 'warning',
      badgeText: 'Numeric Coercion',
      message: `Database column is ${dbDataType.toUpperCase()}. Component '${componentType}' will be safely validated as numeric.`,
      hint: 'Database schema remains intact.',
    };
  }

  // Dates and Timestamps
  if (dt.includes('date') || dt.includes('time')) {
    if (['date', 'datetime', 'time'].includes(componentType)) {
      return {
        status: 'compatible',
        badgeText: 'Direct Match',
        message: `Database column is ${dbDataType.toUpperCase()}. Visual '${componentType}' picker formats date/time according to standard ISO-8601 rules.`,
        hint: 'Direct temporal storage.',
      };
    }
    if (componentType === 'text') {
      return {
        status: 'warning',
        badgeText: 'Safe Date String Coercion',
        message: `Database column is ${dbDataType.toUpperCase()}. Text input accepts date formatted strings (YYYY-MM-DD).`,
        hint: 'Validated against date pattern before persisting.',
      };
    }
    return {
      status: 'warning',
      badgeText: 'Temporal Warning',
      message: `Database column is ${dbDataType.toUpperCase()}. Visual '${componentType}' should provide a valid date or timestamp representation.`,
      hint: 'Ensure submitted values match expected date/time formats.',
    };
  }

  // String / Varchar / Text
  if (dt.includes('char') || dt.includes('text') || dt.includes('blob')) {
    return {
      status: 'compatible',
      badgeText: 'Fully Compatible',
      message: `Database column is ${dbDataType.toUpperCase()}. All visual text, dropdown, lookup, and formatted inputs are safely serializable into text columns.`,
      hint: 'Direct textual storage in database.',
    };
  }

  // Boolean
  if (dt.includes('bool')) {
    if (['checkbox', 'switch'].includes(componentType)) {
      return {
        status: 'compatible',
        badgeText: 'Direct Match',
        message: `Database column is ${dbDataType.toUpperCase()}. Boolean toggle maps directly.`,
        hint: 'Direct boolean storage.',
      };
    }
  }

  return {
    status: 'compatible',
    badgeText: 'Compatible',
    message: `Database column is ${dbDataType.toUpperCase()}. Visual component '${componentType}' is active.`,
    hint: 'Physical database schema is preserved.',
  };
}

export interface DesignerPropertiesPanelProps {
  allControls?: FormControl[];
  selectedControl: FormControl | null;
  onUpdateControl: (id: string, updates: Partial<FormControl>) => void;
  onDeleteControl: (id: string) => void;
  onDuplicateControl: (id: string) => void;
  formName: string;
  onFormNameChange: (val: string) => void;
  formDescription: string;
  onFormDescriptionChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  formType: FormType;
  onFormTypeChange: (val: FormType) => void;
  displayMode?: FormDisplayMode;
  onDisplayModeChange?: (val: FormDisplayMode) => void;
  layout: FormCanvasLayout;
  onUpdateLayout: (updates: Partial<FormCanvasLayout>) => void;
  sourceSchema: SourceSchema | null;
  eligibleSources: EligibleDataSourcesResponse;
  masterDetailConfig: MasterDetailConfig | null;
  onUpdateMasterDetailConfig: (cfg: MasterDetailConfig | null) => void;
}

export const DesignerPropertiesPanel: React.FC<DesignerPropertiesPanelProps> = ({
  allControls = [],
  selectedControl,
  onUpdateControl,
  onDeleteControl,
  onDuplicateControl,
  formName,
  onFormNameChange,
  formDescription,
  onFormDescriptionChange,
  category,
  onCategoryChange,
  formType,
  onFormTypeChange,
  displayMode,
  onDisplayModeChange,
  layout,
  onUpdateLayout,
  sourceSchema,
  eligibleSources,
  masterDetailConfig,
  onUpdateMasterDetailConfig,
}) => {
  const [controlTab, setControlTab] = useState<'general' | 'appearance' | 'validation' | 'data' | 'actions'>('general');

  const effectiveDisplayMode: FormDisplayMode =
    displayMode || layout.displayMode || (formType === 'fullscreen' ? 'fullscreen' : formType === 'popup' ? 'dialog' : 'embedded');

  const otherControls = (allControls || []).filter((c) => c.id !== selectedControl?.id);
  const boundColumn = selectedControl ? sourceSchema?.columns.find((col) => col.name === selectedControl.fieldBinding) : null;
  const physicalDbType = boundColumn ? boundColumn.columnType || boundColumn.dataType : null;

  const handleComponentTypeChange = (newType: FormControlType) => {
    if (!selectedControl) return;
    const updates: Partial<FormControl> = { type: newType };
    if (['lookup', 'lov', 'select', 'radio'].includes(newType)) {
      if (!selectedControl.lookupConfig) {
        updates.lookupConfig = {
          sourceType: 'table',
          sourceTable: eligibleSources.tables[0]?.name || '',
          returnColumn: 'id',
          displayColumn: 'name',
          isSearchable: true,
          allowEmpty: true,
          placeholder: `-- Select ${selectedControl.label || 'Option'} --`,
          dependentMappings: [],
        };
      }
    }
    onUpdateControl(selectedControl.id, updates);
  };

  const renderLookupConfiguration = (ctrl: FormControl) => {
    const cfg = ctrl.lookupConfig || {
      sourceType: 'table',
      sourceTable: eligibleSources.tables[0]?.name || '',
      returnColumn: 'id',
      displayColumn: 'name',
      isSearchable: true,
      allowEmpty: true,
      placeholder: '',
      dependentMappings: [],
    };

    const updateCfg = (updates: Partial<typeof cfg>) => {
      onUpdateControl(ctrl.id, {
        lookupConfig: {
          ...cfg,
          ...updates,
        },
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
          <Search size={13} style={{ color: 'var(--brand-primary)' }} />
          <span>Lookup & LOV Source Settings</span>
        </div>

        {/* Source Type Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            Lookup Data Source
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {(['table', 'query', 'static'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => updateCfg({ sourceType: st })}
                style={{
                  padding: '5px 4px',
                  fontSize: '11px',
                  fontWeight: (cfg.sourceType || 'table') === st ? 700 : 500,
                  borderRadius: '4px',
                  border: (cfg.sourceType || 'table') === st ? '1px solid var(--brand-primary)' : '1px solid var(--border-default, #cbd5e1)',
                  backgroundColor: (cfg.sourceType || 'table') === st ? 'var(--brand-primary-subtle, rgba(0,103,184,0.1))' : 'var(--surface-0)',
                  color: (cfg.sourceType || 'table') === st ? 'var(--brand-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {st === 'table' ? 'DB Table' : st === 'query' ? 'Saved Query' : 'Static LOV'}
              </button>
            ))}
          </div>
        </div>

        {/* SOURCE === TABLE */}
        {(cfg.sourceType === 'table' || !cfg.sourceType) && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Source Database Table
              </label>
              <select
                value={cfg.sourceTable || ''}
                onChange={(e) => updateCfg({ sourceTable: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid var(--input-border, #64748b)',
                  backgroundColor: 'var(--input-bg, var(--surface-1))',
                  color: 'var(--input-text, var(--text-primary))',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">-- Select Source Table --</option>
                {eligibleSources.tables.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Return Column (Key)
                </label>
                <input
                  value={cfg.returnColumn || 'id'}
                  onChange={(e) => updateCfg({ returnColumn: e.target.value })}
                  placeholder="e.g. id"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--input-border, #64748b)',
                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                    color: 'var(--input-text, var(--text-primary))',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Display Column (Label)
                </label>
                <input
                  value={cfg.displayColumn || 'name'}
                  onChange={(e) => updateCfg({ displayColumn: e.target.value })}
                  placeholder="e.g. name"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--input-border, #64748b)',
                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                    color: 'var(--input-text, var(--text-primary))',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Filter (SQL WHERE clause)
              </label>
              <input
                value={cfg.filter || ''}
                onChange={(e) => updateCfg({ filter: e.target.value })}
                placeholder="e.g. status = 'active'"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  borderRadius: '4px',
                  border: '1px solid var(--input-border, #64748b)',
                  backgroundColor: 'var(--input-bg, var(--surface-1))',
                  color: 'var(--input-text, var(--text-primary))',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Sort Order (ORDER BY)
              </label>
              <input
                value={cfg.orderBy || ''}
                onChange={(e) => updateCfg({ orderBy: e.target.value })}
                placeholder="e.g. name ASC"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  borderRadius: '4px',
                  border: '1px solid var(--input-border, #64748b)',
                  backgroundColor: 'var(--input-bg, var(--surface-1))',
                  color: 'var(--input-text, var(--text-primary))',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </>
        )}

        {/* SOURCE === QUERY */}
        {cfg.sourceType === 'query' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Saved Query from Query Builder
              </label>
              <select
                value={cfg.sourceQueryId || cfg.sourceTable || ''}
                onChange={(e) => updateCfg({ sourceQueryId: e.target.value, sourceTable: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid var(--input-border, #64748b)',
                  backgroundColor: 'var(--input-bg, var(--surface-1))',
                  color: 'var(--input-text, var(--text-primary))',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">-- Select Saved Query --</option>
                {eligibleSources.queries.map((q) => (
                  <option key={q.id || q.name} value={q.id || q.name}>
                    {q.label} ({q.columnCount || 0} columns)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Return Column (Key)
                </label>
                <input
                  value={cfg.returnColumn || 'id'}
                  onChange={(e) => updateCfg({ returnColumn: e.target.value })}
                  placeholder="e.g. id"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--input-border, #64748b)',
                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                    color: 'var(--input-text, var(--text-primary))',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Display Column (Label)
                </label>
                <input
                  value={cfg.displayColumn || 'name'}
                  onChange={(e) => updateCfg({ displayColumn: e.target.value })}
                  placeholder="e.g. label"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--input-border, #64748b)',
                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                    color: 'var(--input-text, var(--text-primary))',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Filter (SQL WHERE clause)
              </label>
              <input
                value={cfg.filter || ''}
                onChange={(e) => updateCfg({ filter: e.target.value })}
                placeholder="e.g. status = 'active'"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  borderRadius: '4px',
                  border: '1px solid var(--input-border, #64748b)',
                  backgroundColor: 'var(--input-bg, var(--surface-1))',
                  color: 'var(--input-text, var(--text-primary))',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </>
        )}

        {/* SOURCE === STATIC */}
        {cfg.sourceType === 'static' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Static List Options
              </label>
              <button
                type="button"
                onClick={() => {
                  const opts = cfg.staticOptions || [];
                  const newKey = `opt_${opts.length + 1}`;
                  updateCfg({
                    staticOptions: [...opts, { key: newKey, label: `Option ${opts.length + 1}` }],
                  });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid var(--brand-primary)',
                  backgroundColor: 'transparent',
                  color: 'var(--brand-primary)',
                  cursor: 'pointer',
                }}
              >
                <Plus size={10} /> Add Option
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(cfg.staticOptions || []).length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                  No static options yet. Click "+ Add Option" above.
                </div>
              ) : (
                cfg.staticOptions!.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      value={opt.key}
                      onChange={(e) => {
                        const copy = [...cfg.staticOptions!];
                        copy[oIdx] = { ...copy[oIdx], key: e.target.value };
                        updateCfg({ staticOptions: copy });
                      }}
                      placeholder="Stored Key"
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '11px',
                        borderRadius: '3px',
                        border: '1px solid var(--input-border, #64748b)',
                        backgroundColor: 'var(--input-bg, var(--surface-1))',
                        color: 'var(--input-text, var(--text-primary))',
                      }}
                    />
                    <input
                      value={opt.label}
                      onChange={(e) => {
                        const copy = [...cfg.staticOptions!];
                        copy[oIdx] = { ...copy[oIdx], label: e.target.value };
                        updateCfg({ staticOptions: copy });
                      }}
                      placeholder="Display Label"
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: '11px',
                        borderRadius: '3px',
                        border: '1px solid var(--input-border, #64748b)',
                        backgroundColor: 'var(--input-bg, var(--surface-1))',
                        color: 'var(--input-text, var(--text-primary))',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = cfg.staticOptions!.filter((_, i) => i !== oIdx);
                        updateCfg({ staticOptions: copy });
                      }}
                      style={{ border: 'none', background: 'none', color: 'var(--status-danger-text, #ef4444)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Usability & Dropdown Behaviors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle, #e2e8f0)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cfg.isSearchable !== false}
              onChange={(e) => updateCfg({ isSearchable: e.target.checked })}
            />
            Searchable Dropdown (Filter on type)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cfg.allowEmpty !== false}
              onChange={(e) => updateCfg({ allowEmpty: e.target.checked })}
            />
            Allow Empty / Null Selection
          </label>
        </div>
      </div>
    );
  };

  const renderDependentMappings = (ctrl: FormControl) => {
    const mappings = ctrl.lookupConfig?.dependentMappings || [];
    const otherControlsList = (allControls || []).filter((c) => c.id !== ctrl.id);

    const updateMappings = (newMappings: LookupDependentFieldMapping[]) => {
      onUpdateControl(ctrl.id, {
        lookupConfig: {
          returnColumn: 'id',
          displayColumn: 'name',
          ...ctrl.lookupConfig,
          dependentMappings: newMappings,
        },
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
              ⚡ Dependent Fields & Auto-Population
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Selecting an item populates other form fields automatically
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const defaultTarget = otherControlsList[0]?.fieldBinding || otherControlsList[0]?.name || '';
              updateMappings([...mappings, { sourceColumn: '', targetField: defaultTarget }]);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 600,
              padding: '3px 7px',
              borderRadius: '4px',
              border: '1px solid var(--brand-primary)',
              backgroundColor: 'var(--brand-primary-subtle, rgba(0,103,184,0.08))',
              color: 'var(--brand-primary)',
              cursor: 'pointer',
            }}
          >
            <Plus size={10} /> Add Mapping
          </button>
        </div>

        {mappings.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            No dependent field mappings configured.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mappings.map((m, mIdx) => (
              <div
                key={mIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface-0)',
                  border: '1px solid var(--border-default, #cbd5e1)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <input
                    value={m.sourceColumn}
                    onChange={(e) => {
                      const copy = [...mappings];
                      copy[mIdx] = { ...copy[mIdx], sourceColumn: e.target.value };
                      updateMappings(copy);
                    }}
                    placeholder="Lookup Col (e.g. email)"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '11px',
                      borderRadius: '3px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-1))',
                      color: 'var(--input-text, var(--text-primary))',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <select
                    value={m.targetField}
                    onChange={(e) => {
                      const copy = [...mappings];
                      copy[mIdx] = { ...copy[mIdx], targetField: e.target.value };
                      updateMappings(copy);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '11px',
                      borderRadius: '3px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-1))',
                      color: 'var(--input-text, var(--text-primary))',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Choose Field --</option>
                    {otherControlsList.map((oc) => (
                      <option key={oc.id} value={oc.fieldBinding || oc.name}>
                        {oc.label} ({oc.fieldBinding || oc.name})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const copy = mappings.filter((_, i) => i !== mIdx);
                    updateMappings(copy);
                  }}
                  title="Remove mapping"
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--status-danger-text, #ef4444)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // If no control is selected, render Form Settings Inspector
  if (!selectedControl) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderLeft: '1px solid var(--border-subtle, #e2e8f0)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--surface-2, rgba(0,0,0,0.02))',
            fontWeight: 700,
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          <Settings size={15} style={{ color: 'var(--brand-primary, #0067b8)' }} />
          <span>Form Configuration</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>
              Form Title
            </label>
            <input
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              placeholder="e.g. Sales Orders Master-Detail"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--input-border, #64748b)',
                backgroundColor: 'var(--input-bg, var(--surface-1))',
                color: 'var(--input-text, var(--text-primary))',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Explicit Form Display Mode Setting */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>
              Display Mode
            </label>
            <select
              value={effectiveDisplayMode}
              onChange={(e) => {
                const newMode = e.target.value as FormDisplayMode;
                if (onDisplayModeChange) onDisplayModeChange(newMode);
                onUpdateLayout({
                  displayMode: newMode,
                  width: newMode === 'fullscreen' ? '100%' : (layout.width || '100%'),
                });
                if (newMode === 'fullscreen' && formType !== 'fullscreen') {
                  onFormTypeChange('fullscreen');
                } else if (newMode === 'dialog' && formType !== 'popup') {
                  onFormTypeChange('popup');
                } else if (newMode === 'embedded' && (formType === 'fullscreen' || formType === 'popup')) {
                  onFormTypeChange('single');
                }
              }}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--input-border, #64748b)',
                backgroundColor: 'var(--input-bg, var(--surface-1))',
                color: 'var(--input-text, var(--text-primary))',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              <option value="embedded">🖥️ Embedded Form (Dashboard Layout)</option>
              <option value="dialog">🪟 Dialog / Popup Form (Modal Overlay)</option>
              <option value="fullscreen">⛶ Full-Screen Form (Full Viewport Edge-to-Edge)</option>
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {effectiveDisplayMode === 'fullscreen' && 'Opens in dedicated full-viewport interface, completely replacing the dashboard view.'}
              {effectiveDisplayMode === 'dialog' && 'Opens in an accessible modal dialog overlay with responsive backdrop.'}
              {effectiveDisplayMode === 'embedded' && 'Standard view embedded inside the normal dashboard layout.'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>
              Form Type
            </label>
            <select
              value={formType}
              onChange={(e) => {
                const newType = e.target.value as FormType;
                onFormTypeChange(newType);
                if (newType === 'fullscreen') {
                  if (onDisplayModeChange) onDisplayModeChange('fullscreen');
                  onUpdateLayout({ displayMode: 'fullscreen', width: '100%' });
                } else if (newType === 'popup') {
                  if (onDisplayModeChange) onDisplayModeChange('dialog');
                  onUpdateLayout({ displayMode: 'dialog' });
                }
              }}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--input-border, #64748b)',
                backgroundColor: 'var(--input-bg, var(--surface-1))',
                color: 'var(--input-text, var(--text-primary))',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              <option value="single">Single Record Form</option>
              <option value="continuous">Continuous Form</option>
              <option value="tabular">Tabular / Grid Form</option>
              <option value="popup">Popup / Dialog Form</option>
              <option value="fullscreen">Full-Screen Form</option>
              <option value="readonly">Read-Only View</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>
              Category
            </label>
            <input
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="General, Sales, Inventory..."
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--input-border, #64748b)',
                backgroundColor: 'var(--input-bg, var(--surface-1))',
                color: 'var(--input-text, var(--text-primary))',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => onFormDescriptionChange(e.target.value)}
              placeholder="Brief description of this form..."
              rows={3}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--input-border, #64748b)',
                backgroundColor: 'var(--input-bg, var(--surface-1))',
                color: 'var(--input-text, var(--text-primary))',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '6px 0' }} />

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>
              Canvas Padding
            </label>
            <select
              value={layout.padding || '24px'}
              onChange={(e) => onUpdateLayout({ padding: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--input-border, #64748b)',
                backgroundColor: 'var(--input-bg, var(--surface-1))',
                color: 'var(--input-text, var(--text-primary))',
                outline: 'none',
              }}
            >
              <option value="12px">Compact (12px)</option>
              <option value="20px">Standard (20px)</option>
              <option value="24px">Comfortable (24px)</option>
              <option value="32px">Spacious (32px)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-primary)' }}>
              Grid Spacing (Gap)
            </label>
            <select
              value={layout.gap || 16}
              onChange={(e) => onUpdateLayout({ gap: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--input-border, #64748b)',
                backgroundColor: 'var(--input-bg, var(--surface-1))',
                color: 'var(--input-text, var(--text-primary))',
                outline: 'none',
              }}
            >
              <option value={8}>8px - Very Dense</option>
              <option value={12}>12px - Dense</option>
              <option value={16}>16px - Standard</option>
              <option value={20}>20px - Relaxed</option>
              <option value={24}>24px - Spacious</option>
            </select>
          </div>

          <div style={{ marginTop: '12px', padding: '10px', borderRadius: '4px', backgroundColor: 'var(--surface-2)', fontSize: '11px', color: 'var(--text-muted)' }}>
            💡 Click any control on the canvas to inspect and configure its field bindings, validation rules, and layout dimensions.
          </div>
        </div>
      </div>
    );
  }

  // Selected Control Inspector
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-surface, #ffffff)',
        borderLeft: '1px solid var(--border-subtle, #e2e8f0)',
        overflow: 'hidden',
      }}
    >
      {/* Header with Control Title & Quick Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: 'var(--surface-2, rgba(0,0,0,0.02))',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedControl.label || selectedControl.type}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Type: <span style={{ color: 'var(--brand-primary)' }}>{selectedControl.type}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onDuplicateControl(selectedControl.id)}
            title="Duplicate"
            style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onDeleteControl(selectedControl.id)}
            title="Delete"
            style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', color: 'var(--status-danger-text, #ef4444)', cursor: 'pointer' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: 'var(--surface-2, rgba(0,0,0,0.01))',
        }}
      >
        <button
          onClick={() => setControlTab('general')}
          style={{
            flex: 1,
            padding: '8px 2px',
            fontSize: '11px',
            fontWeight: controlTab === 'general' ? 700 : 500,
            border: 'none',
            borderBottom: controlTab === 'general' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            background: 'none',
            color: controlTab === 'general' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          General
        </button>

        <button
          onClick={() => setControlTab('appearance')}
          style={{
            flex: 1,
            padding: '8px 2px',
            fontSize: '11px',
            fontWeight: controlTab === 'appearance' ? 700 : 500,
            border: 'none',
            borderBottom: controlTab === 'appearance' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            background: 'none',
            color: controlTab === 'appearance' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Styling
        </button>

        <button
          onClick={() => setControlTab('validation')}
          style={{
            flex: 1,
            padding: '8px 2px',
            fontSize: '11px',
            fontWeight: controlTab === 'validation' ? 700 : 500,
            border: 'none',
            borderBottom: controlTab === 'validation' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            background: 'none',
            color: controlTab === 'validation' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Validation
        </button>

        {(selectedControl.type === 'datagrid' || selectedControl.type === 'master_detail' || selectedControl.type === 'lookup' || selectedControl.type === 'select' || (selectedControl.type as string) === 'lov' || selectedControl.type === 'radio') && (
          <button
            onClick={() => setControlTab('data')}
            style={{
              flex: 1,
              padding: '8px 2px',
              fontSize: '11px',
              fontWeight: controlTab === 'data' ? 700 : 500,
              border: 'none',
              borderBottom: controlTab === 'data' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: 'none',
              color: controlTab === 'data' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {selectedControl.type.includes('grid') || selectedControl.type.includes('master') ? 'Detail Grid' : 'Lookup & LOV'}
          </button>
        )}

        {selectedControl.type === 'button' && (
          <button
            onClick={() => setControlTab('actions')}
            style={{
              flex: 1,
              padding: '8px 2px',
              fontSize: '11px',
              fontWeight: controlTab === 'actions' ? 700 : 500,
              border: 'none',
              borderBottom: controlTab === 'actions' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              background: 'none',
              color: controlTab === 'actions' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Actions
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* TAB: GENERAL */}
        {controlTab === 'general' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Display Label
              </label>
              <input
                value={selectedControl.label}
                onChange={(e) => onUpdateControl(selectedControl.id, { label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: 'var(--surface-0, #ffffff)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* DEDICATED FIELD TYPE & DATA BINDING SECTION */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--border-default, #cbd5e1)',
                backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', color: 'var(--brand-primary, #0067b8)' }}>
                  <Database size={14} />
                  <span>Field Type & Data Binding</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-2, rgba(0,0,0,0.05))',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Schema Preserved
                </span>
              </div>

              {/* Visual Component Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Visual Input / Component Type
                </label>
                <select
                  value={selectedControl.type}
                  onChange={(e) => handleComponentTypeChange(e.target.value as FormControlType)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--input-border, #64748b)',
                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                    color: 'var(--input-text, var(--text-primary))',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  {COMPONENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Physical DB Column Binding Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Database Column Binding
                </label>
                <select
                  value={selectedControl.fieldBinding || ''}
                  onChange={(e) => onUpdateControl(selectedControl.id, { fieldBinding: e.target.value || null })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--input-border, #64748b)',
                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                    color: 'var(--input-text, var(--text-primary))',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Unbound (UI State Only) --</option>
                  {sourceSchema?.columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.dataType}) {col.isPrimaryKey ? '★ PK' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Database Compatibility Assessment Card */}
              {(() => {
                const compatibility = evaluateCompatibility(physicalDbType || undefined, selectedControl.type);
                return (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border:
                        compatibility.status === 'compatible'
                          ? '1px solid rgba(22, 163, 74, 0.35)'
                          : compatibility.status === 'warning'
                          ? '1px solid rgba(234, 179, 8, 0.45)'
                          : '1px solid rgba(239, 68, 68, 0.45)',
                      backgroundColor:
                        compatibility.status === 'compatible'
                          ? 'rgba(22, 163, 74, 0.08)'
                          : compatibility.status === 'warning'
                          ? 'rgba(234, 179, 8, 0.1)'
                          : 'rgba(239, 68, 68, 0.08)',
                      color:
                        compatibility.status === 'compatible'
                          ? 'var(--status-success-text, #16a34a)'
                          : compatibility.status === 'warning'
                          ? 'var(--status-warning-text, #ca8a04)'
                          : 'var(--status-danger-text, #ef4444)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      {compatibility.status === 'compatible' ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                      <span>{compatibility.badgeText}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {compatibility.message}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                      Physical DB schema is preserved. Values convert safely on submit.
                    </div>
                  </div>
                );
              })()}

              {/* Inline Lookup / LOV Configuration if applicable */}
              {(['lookup', 'lov', 'select', 'radio'].includes(selectedControl.type)) && (
                <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--border-default, #cbd5e1)' }}>
                  {renderLookupConfiguration(selectedControl)}
                  {renderDependentMappings(selectedControl)}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Column Span (1-12)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={selectedControl.colSpan || 6}
                  onChange={(e) => onUpdateControl(selectedControl.id, { colSpan: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '36px' }}>
                  {selectedControl.colSpan || 6} / 12
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Placeholder Text
              </label>
              <input
                value={selectedControl.placeholder || ''}
                onChange={(e) => onUpdateControl(selectedControl.id, { placeholder: e.target.value })}
                placeholder="Hint inside input..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: 'var(--surface-0, #ffffff)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Help Text / Subtitle
              </label>
              <input
                value={selectedControl.helpText || ''}
                onChange={(e) => onUpdateControl(selectedControl.id, { helpText: e.target.value })}
                placeholder="Instructions shown below input..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: 'var(--surface-0, #ffffff)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Checkbox Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedControl.validation?.required)}
                  onChange={(e) =>
                    onUpdateControl(selectedControl.id, {
                      validation: { ...selectedControl.validation, required: e.target.checked },
                    })
                  }
                />
                Required Field (*)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedControl.readOnly)}
                  onChange={(e) => onUpdateControl(selectedControl.id, { readOnly: e.target.checked })}
                />
                Read-Only (Non-editable)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedControl.disabled)}
                  onChange={(e) => onUpdateControl(selectedControl.id, { disabled: e.target.checked })}
                />
                Disabled
              </label>
            </div>
          </>
        )}

        {/* TAB: APPEARANCE & ADVANCED VISUAL STYLING */}
        {controlTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header with Reset Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-default, #cbd5e1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', color: 'var(--brand-primary, #0067b8)' }}>
                <Palette size={14} />
                <span>Element Appearance & Styling</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateControl(selectedControl.id, { styling: { ...RESET_STYLING } })}
                title="Reset all styling properties to theme default"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-default, #cbd5e1)',
                  backgroundColor: 'var(--surface-0, #ffffff)',
                  color: 'var(--text-secondary, #64748b)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>

            {/* 1. BOX APPEARANCE PRESETS (Oracle APEX & MS Access 3D / Flat) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                <span>Box Appearance & 3D Style</span>
                <span style={{ fontSize: '10px', color: 'var(--brand-primary)', fontWeight: 600 }}>APEX & Access Style</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                {([
                  { key: 'default', label: 'Default', desc: 'Theme input' },
                  { key: 'inset', label: 'Inset (3D)', desc: 'Recessed 3D entry' },
                  { key: 'outset', label: 'Outset (3D)', desc: 'Raised 3D element' },
                  { key: 'flat', label: 'Flat', desc: 'No border, soft bg' },
                  { key: 'outlined', label: 'Outlined', desc: 'Accent border' },
                  { key: 'filled', label: 'Filled', desc: 'Solid filled surface' },
                  { key: 'raised', label: 'Raised', desc: 'Elevated shadow' },
                  { key: 'recessed', label: 'Recessed', desc: 'Inner soft shadow' },
                  { key: 'borderless', label: 'Borderless', desc: 'Clean transparent' },
                ] as const).map((preset) => {
                  const isActive = (selectedControl.styling?.boxAppearance || 'default') === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() =>
                        onUpdateControl(selectedControl.id, {
                          styling: {
                            ...(selectedControl.styling || {}),
                            boxAppearance: preset.key,
                            ...(preset.key === 'inset'
                              ? { borderStyle: 'inset', borderWidth: selectedControl.styling?.borderWidth || '2px' }
                              : preset.key === 'outset'
                              ? { borderStyle: 'outset', borderWidth: selectedControl.styling?.borderWidth || '2px' }
                              : {}),
                          },
                        })
                      }
                      style={{
                        padding: '6px 4px',
                        fontSize: '11px',
                        fontWeight: isActive ? 700 : 500,
                        borderRadius: '4px',
                        border: isActive ? '1.5px solid var(--brand-primary, #0067b8)' : '1px solid var(--border-default, #cbd5e1)',
                        backgroundColor: isActive ? 'var(--brand-primary-subtle, rgba(0,103,184,0.1))' : 'var(--surface-0, #ffffff)',
                        color: isActive ? 'var(--brand-primary, #0067b8)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{preset.label}</span>
                      <span style={{ fontSize: '9px', opacity: 0.75, fontWeight: 400 }}>{preset.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. BORDERS & CORNERS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                Borders & Corners
              </div>

              {/* Border Style */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Border Style
                </label>
                <select
                  value={selectedControl.styling?.borderStyle || 'solid'}
                  onChange={(e) =>
                    onUpdateControl(selectedControl.id, {
                      styling: { ...(selectedControl.styling || {}), borderStyle: e.target.value as BorderStyleType },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid var(--input-border, #64748b)',
                    backgroundColor: 'var(--input-bg, var(--surface-0))',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="solid">Solid</option>
                  <option value="inset">Inset (Recessed 3D)</option>
                  <option value="outset">Outset (Raised 3D)</option>
                  <option value="groove">Groove</option>
                  <option value="ridge">Ridge</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="none">None (No Border)</option>
                </select>
              </div>

              {/* Border Width & Radius */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Border Width
                  </label>
                  <select
                    value={selectedControl.styling?.borderWidth || '1px'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), borderWidth: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="0px">0px (None)</option>
                    <option value="1px">1px (Thin)</option>
                    <option value="2px">2px (Medium 3D)</option>
                    <option value="3px">3px (Thick)</option>
                    <option value="4px">4px (Heavy)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Border Radius
                  </label>
                  <select
                    value={selectedControl.styling?.borderRadius || '4px'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), borderRadius: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="0px">Square (0px)</option>
                    <option value="2px">Slight (2px)</option>
                    <option value="4px">Standard (4px)</option>
                    <option value="8px">Rounded (8px)</option>
                    <option value="12px">Large (12px)</option>
                    <option value="9999px">Pill / Fully Rounded</option>
                  </select>
                </div>
              </div>

              {/* Border Color */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Border Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="color"
                    value={selectedControl.styling?.borderColor || '#64748b'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), borderColor: e.target.value },
                      })
                    }
                    style={{ width: '28px', height: '26px', padding: '0', border: '1px solid var(--border-default)', borderRadius: '3px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={selectedControl.styling?.borderColor || ''}
                    placeholder="Theme default (#64748b)"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), borderColor: e.target.value },
                      })
                    }
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3. COLORS & BACKGROUND */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                Colors & Background
              </div>

              {/* Background Color */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Background Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="color"
                    value={selectedControl.styling?.bgColor || '#ffffff'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), bgColor: e.target.value },
                      })
                    }
                    style={{ width: '28px', height: '26px', padding: '0', border: '1px solid var(--border-default)', borderRadius: '3px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={selectedControl.styling?.bgColor || ''}
                    placeholder="Default (or hex/rgba)"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), bgColor: e.target.value },
                      })
                    }
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), bgColor: 'transparent' },
                      })
                    }
                    title="Set Transparent Background"
                    style={{ fontSize: '10px', padding: '4px 6px', borderRadius: '3px', border: '1px solid var(--border-default)', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Text Foreground Color */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Text Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="color"
                    value={selectedControl.styling?.textColor || '#0f172a'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), textColor: e.target.value },
                      })
                    }
                    style={{ width: '28px', height: '26px', padding: '0', border: '1px solid var(--border-default)', borderRadius: '3px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={selectedControl.styling?.textColor || ''}
                    placeholder="Theme text default"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), textColor: e.target.value },
                      })
                    }
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Shadow & Elevation */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Shadow & Elevation
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {(['none', 'subtle', 'medium', 'strong'] as const).map((elev) => {
                    const isElv = (selectedControl.styling?.shadowElevation || 'none') === elev;
                    return (
                      <button
                        key={elev}
                        type="button"
                        onClick={() =>
                          onUpdateControl(selectedControl.id, {
                            styling: { ...(selectedControl.styling || {}), shadowElevation: elev as ShadowElevation },
                          })
                        }
                        style={{
                          padding: '4px',
                          fontSize: '10px',
                          fontWeight: isElv ? 700 : 500,
                          borderRadius: '3px',
                          border: isElv ? '1px solid var(--brand-primary)' : '1px solid var(--border-default, #cbd5e1)',
                          backgroundColor: isElv ? 'var(--brand-primary-subtle, rgba(0,103,184,0.1))' : 'var(--surface-0)',
                          color: isElv ? 'var(--brand-primary)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {elev}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. TYPOGRAPHY & TEXT FORMATTING */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                Typography & Font
              </div>

              {/* Font Family & Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Font Family
                  </label>
                  <select
                    value={selectedControl.styling?.fontFamily || 'inherit'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), fontFamily: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="inherit">Default (System)</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="'Segoe UI', sans-serif">Segoe UI</option>
                    <option value="monospace">Monospace (Code)</option>
                    <option value="Georgia, serif">Georgia (Serif)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Font Size
                  </label>
                  <select
                    value={selectedControl.styling?.fontSize || '12px'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), fontSize: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="11px">11px (Compact)</option>
                    <option value="12px">12px (Standard)</option>
                    <option value="13px">13px (Medium)</option>
                    <option value="14px">14px (Comfortable)</option>
                    <option value="16px">16px (Large)</option>
                    <option value="18px">18px (Header)</option>
                  </select>
                </div>
              </div>

              {/* Bold, Italic, Underline & Alignment */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                {/* Format Buttons */}
                <div style={{ display: 'inline-flex', borderRadius: '4px', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), isBold: !selectedControl.styling?.isBold },
                      })
                    }
                    style={{
                      padding: '5px 9px',
                      background: selectedControl.styling?.isBold ? 'var(--brand-primary-subtle, rgba(0,103,184,0.15))' : 'var(--surface-0)',
                      color: selectedControl.styling?.isBold ? 'var(--brand-primary)' : 'var(--text-primary)',
                      border: 'none',
                      borderRight: '1px solid var(--border-default)',
                      cursor: 'pointer',
                    }}
                    title="Bold"
                  >
                    <Bold size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), isItalic: !selectedControl.styling?.isItalic },
                      })
                    }
                    style={{
                      padding: '5px 9px',
                      background: selectedControl.styling?.isItalic ? 'var(--brand-primary-subtle, rgba(0,103,184,0.15))' : 'var(--surface-0)',
                      color: selectedControl.styling?.isItalic ? 'var(--brand-primary)' : 'var(--text-primary)',
                      border: 'none',
                      borderRight: '1px solid var(--border-default)',
                      cursor: 'pointer',
                    }}
                    title="Italic"
                  >
                    <Italic size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), isUnderline: !selectedControl.styling?.isUnderline },
                      })
                    }
                    style={{
                      padding: '5px 9px',
                      background: selectedControl.styling?.isUnderline ? 'var(--brand-primary-subtle, rgba(0,103,184,0.15))' : 'var(--surface-0)',
                      color: selectedControl.styling?.isUnderline ? 'var(--brand-primary)' : 'var(--text-primary)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Underline"
                  >
                    <Underline size={12} />
                  </button>
                </div>

                {/* Text Alignment */}
                <div style={{ display: 'inline-flex', borderRadius: '4px', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const isAlign = (selectedControl.styling?.textAlign || (['number', 'currency'].includes(selectedControl.type) ? 'right' : 'left')) === align;
                    return (
                      <button
                        key={align}
                        type="button"
                        onClick={() =>
                          onUpdateControl(selectedControl.id, {
                            styling: { ...(selectedControl.styling || {}), textAlign: align },
                          })
                        }
                        style={{
                          padding: '5px 8px',
                          background: isAlign ? 'var(--brand-primary-subtle, rgba(0,103,184,0.15))' : 'var(--surface-0)',
                          color: isAlign ? 'var(--brand-primary)' : 'var(--text-primary)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title={`Align ${align}`}
                      >
                        {align === 'left' ? <AlignLeft size={12} /> : align === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. PADDING, MARGINS & SIZING */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                Padding, Sizing & Spacing
              </div>

              {/* Internal Padding */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Internal Padding
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[
                    { label: 'Compact', val: '4px 8px' },
                    { label: 'Standard', val: '7px 10px' },
                    { label: 'Spacious', val: '10px 14px' },
                  ].map((p) => {
                    const isPad = (selectedControl.styling?.padding || '7px 10px') === p.val;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          onUpdateControl(selectedControl.id, {
                            styling: { ...(selectedControl.styling || {}), padding: p.val },
                          })
                        }
                        style={{
                          padding: '4px 2px',
                          fontSize: '10px',
                          fontWeight: isPad ? 700 : 500,
                          borderRadius: '3px',
                          border: isPad ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                          backgroundColor: isPad ? 'var(--brand-primary-subtle, rgba(0,103,184,0.1))' : 'var(--surface-0)',
                          color: isPad ? 'var(--brand-primary)' : 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Width & Height */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Width
                  </label>
                  <input
                    value={selectedControl.styling?.width || selectedControl.width || ''}
                    placeholder="100% or e.g. 250px"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), width: e.target.value },
                        width: e.target.value || null,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Height
                  </label>
                  <input
                    value={selectedControl.styling?.height || selectedControl.height || ''}
                    placeholder="Auto or e.g. 36px"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), height: e.target.value },
                        height: e.target.value || null,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 6. INTERACTIVE & FOCUS STATES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                Focus & Hover States
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Focus Border
                  </label>
                  <input
                    type="text"
                    value={selectedControl.styling?.focusBorderColor || ''}
                    placeholder="var(--brand-primary)"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), focusBorderColor: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Focus Glow / Ring
                  </label>
                  <input
                    type="text"
                    value={selectedControl.styling?.focusRingColor || ''}
                    placeholder="rgba(0,103,184,0.25)"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), focusRingColor: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Hover States */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Hover Border
                  </label>
                  <input
                    type="text"
                    value={selectedControl.styling?.hoverBorderColor || ''}
                    placeholder="e.g. #334155"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), hoverBorderColor: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Hover Background
                  </label>
                  <input
                    type="text"
                    value={selectedControl.styling?.hoverBgColor || ''}
                    placeholder="e.g. #f1f5f9"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), hoverBgColor: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Disabled & Read-Only State Overrides */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Disabled Bg Color
                  </label>
                  <input
                    type="text"
                    value={selectedControl.styling?.disabledBgColor || ''}
                    placeholder="Theme default"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), disabledBgColor: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Read-Only Bg Color
                  </label>
                  <input
                    type="text"
                    value={selectedControl.styling?.readOnlyBgColor || ''}
                    placeholder="Theme default"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), readOnlyBgColor: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 7. ELEMENT-SPECIFIC PROPERTIES */}
            {selectedControl.type === 'button' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
                <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                  Button Visual Properties
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Button Variant Style
                  </label>
                  <select
                    value={selectedControl.styling?.buttonVariant || 'primary'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), buttonVariant: e.target.value as any },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="primary">Primary (Brand Accent)</option>
                    <option value="secondary">Secondary (Neutral)</option>
                    <option value="outline">Outline (Bordered)</option>
                    <option value="danger">Danger (Red Warning)</option>
                    <option value="ghost">Ghost (Subtle Hover)</option>
                  </select>
                </div>
              </div>
            )}

            {(selectedControl.type === 'section' || selectedControl.type === 'heading') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
                <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                  Section & Heading Typography
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                    Divider / Border Color
                  </label>
                  <input
                    type="text"
                    value={selectedControl.styling?.sectionBorderColor || ''}
                    placeholder="Theme default (var(--border-default))"
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        styling: { ...(selectedControl.styling || {}), sectionBorderColor: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border, #64748b)',
                      backgroundColor: 'var(--input-bg, var(--surface-0))',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            )}

            {(selectedControl.type === 'datagrid' || selectedControl.type === 'master_detail') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
                <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                  Detail Grid Visuals
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      Header Background
                    </label>
                    <input
                      type="text"
                      value={selectedControl.styling?.gridHeaderBg || ''}
                      placeholder="var(--table-header-bg)"
                      onChange={(e) =>
                        onUpdateControl(selectedControl.id, {
                          styling: { ...(selectedControl.styling || {}), gridHeaderBg: e.target.value },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid var(--input-border, #64748b)',
                        backgroundColor: 'var(--input-bg, var(--surface-0))',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      Cell Density
                    </label>
                    <select
                      value={selectedControl.styling?.gridCellPadding || 'normal'}
                      onChange={(e) =>
                        onUpdateControl(selectedControl.id, {
                          styling: { ...(selectedControl.styling || {}), gridCellPadding: e.target.value as any },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid var(--input-border, #64748b)',
                        backgroundColor: 'var(--input-bg, var(--surface-0))',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="compact">Compact (3px 6px)</option>
                      <option value="normal">Normal (5px 8px)</option>
                      <option value="spacious">Spacious (8px 12px)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 8. LABEL POSITION */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: 'var(--text-primary)' }}>
                Label Position
              </label>
              <select
                value={selectedControl.styling?.labelPosition || 'above'}
                onChange={(e) =>
                  onUpdateControl(selectedControl.id, {
                    styling: { ...(selectedControl.styling || {}), labelPosition: e.target.value as any },
                  })
                }
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid var(--input-border, #64748b)',
                  backgroundColor: 'var(--input-bg, var(--surface-0))',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="above">Above Input</option>
                <option value="left">Left of Input (Access Classic)</option>
                <option value="hidden">Hidden (No Label)</option>
              </select>
            </div>

            {/* 9. VISIBILITY & RUNTIME DISPLAY */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))', borderRadius: '6px', border: '1px solid var(--border-default, #cbd5e1)' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Element Visibility</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Show or hide this element in published runtime</div>
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: selectedControl.styling?.isHidden ? 'var(--status-warning-text, #b45309)' : 'var(--status-success-text, #16a34a)' }}>
                <input
                  type="checkbox"
                  checked={!selectedControl.styling?.isHidden}
                  onChange={(e) =>
                    onUpdateControl(selectedControl.id, {
                      styling: { ...(selectedControl.styling || {}), isHidden: !e.target.checked },
                    })
                  }
                />
                <span>{selectedControl.styling?.isHidden ? 'Hidden at Runtime' : 'Visible'}</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB: VALIDATION */}
        {controlTab === 'validation' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Minimum Length
              </label>
              <input
                type="number"
                value={selectedControl.validation?.minLength ?? ''}
                onChange={(e) =>
                  onUpdateControl(selectedControl.id, {
                    validation: { ...selectedControl.validation, minLength: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                placeholder="e.g. 3"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: 'var(--surface-0, #ffffff)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Maximum Length
              </label>
              <input
                type="number"
                value={selectedControl.validation?.maxLength ?? ''}
                onChange={(e) =>
                  onUpdateControl(selectedControl.id, {
                    validation: { ...selectedControl.validation, maxLength: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                placeholder="e.g. 100"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: 'var(--surface-0, #ffffff)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Regex Validation Pattern
              </label>
              <input
                value={selectedControl.validation?.pattern || ''}
                onChange={(e) =>
                  onUpdateControl(selectedControl.id, {
                    validation: { ...selectedControl.validation, pattern: e.target.value || undefined },
                  })
                }
                placeholder="e.g. ^[A-Z]{2}-\d{4}$"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: 'var(--surface-0, #ffffff)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </>
        )}

        {/* TAB: DATA / MASTER-DETAIL */}
        {controlTab === 'data' && (
          <>
            {/* If Lookup / LOV / Select / Radio Control */}
            {(['lookup', 'lov', 'select', 'radio'].includes(selectedControl.type)) && (
              <div>
                {renderLookupConfiguration(selectedControl)}
                {renderDependentMappings(selectedControl)}
              </div>
            )}

            {/* If DataGrid or Master-Detail Container */}
            {(selectedControl.type === 'datagrid' || selectedControl.type === 'master_detail') && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>
                  Master-Detail Relationship Configuration
                </h4>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                    Detail Table (Child)
                  </label>
                  <select
                    value={selectedControl.detailGridConfig?.detailTable || ''}
                    onChange={(e) => {
                      const newTable = e.target.value;
                      onUpdateControl(selectedControl.id, {
                        detailGridConfig: {
                          foreignKeyColumn: 'order_id',
                          masterKeyColumn: 'id',
                          columns: [],
                          ...selectedControl.detailGridConfig,
                          detailTable: newTable,
                        },
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--surface-0)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">-- Choose child table --</option>
                    {eligibleSources.tables.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.rowCount} records)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                    Child Foreign Key Column
                  </label>
                  <input
                    value={selectedControl.detailGridConfig?.foreignKeyColumn || ''}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        detailGridConfig: {
                          detailTable: '',
                          masterKeyColumn: 'id',
                          columns: [],
                          ...selectedControl.detailGridConfig,
                          foreignKeyColumn: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. order_id"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                    Master Primary Key Column
                  </label>
                  <input
                    value={selectedControl.detailGridConfig?.masterKeyColumn || 'id'}
                    onChange={(e) =>
                      onUpdateControl(selectedControl.id, {
                        detailGridConfig: {
                          detailTable: '',
                          foreignKeyColumn: '',
                          columns: [],
                          ...selectedControl.detailGridConfig,
                          masterKeyColumn: e.target.value,
                        },
                      })
                    }
                    placeholder="id"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedControl.detailGridConfig?.allowAdd ?? true}
                      onChange={(e) =>
                        onUpdateControl(selectedControl.id, {
                          detailGridConfig: {
                            detailTable: '',
                            foreignKeyColumn: '',
                            masterKeyColumn: 'id',
                            columns: [],
                            ...selectedControl.detailGridConfig,
                            allowAdd: e.target.checked,
                          },
                        })
                      }
                    />
                    Allow Adding New Rows
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedControl.detailGridConfig?.allowEdit ?? true}
                      onChange={(e) =>
                        onUpdateControl(selectedControl.id, {
                          detailGridConfig: {
                            detailTable: '',
                            foreignKeyColumn: '',
                            masterKeyColumn: 'id',
                            columns: [],
                            ...selectedControl.detailGridConfig,
                            allowEdit: e.target.checked,
                          },
                        })
                      }
                    />
                    Allow Inline Editing
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedControl.detailGridConfig?.allowDelete ?? true}
                      onChange={(e) =>
                        onUpdateControl(selectedControl.id, {
                          detailGridConfig: {
                            detailTable: '',
                            foreignKeyColumn: '',
                            masterKeyColumn: 'id',
                            columns: [],
                            ...selectedControl.detailGridConfig,
                            allowDelete: e.target.checked,
                          },
                        })
                      }
                    />
                    Allow Deleting Rows
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedControl.detailGridConfig?.cascadeDelete ?? true}
                      onChange={(e) =>
                        onUpdateControl(selectedControl.id, {
                          detailGridConfig: {
                            detailTable: '',
                            foreignKeyColumn: '',
                            masterKeyColumn: 'id',
                            columns: [],
                            ...selectedControl.detailGridConfig,
                            cascadeDelete: e.target.checked,
                          },
                        })
                      }
                    />
                    Cascade Delete with Master
                  </label>
                </div>

                {/* Default Visible Rows Configuration */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-default, #cbd5e1)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Default Visible Rows
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                    Number of visible rows shown in the detail grid container before scrolling.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={selectedControl.detailGridConfig?.defaultVisibleRows ?? 5}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(50, parseInt(e.target.value) || 5));
                        onUpdateControl(selectedControl.id, {
                          detailGridConfig: {
                            detailTable: '',
                            foreignKeyColumn: '',
                            masterKeyColumn: 'id',
                            columns: [],
                            ...selectedControl.detailGridConfig,
                            defaultVisibleRows: val,
                          },
                        });
                      }}
                      style={{
                        width: '80px',
                        padding: '6px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid var(--input-border, #64748b)',
                        backgroundColor: 'var(--input-bg, var(--surface-0))',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      rows (empty grid renders this many blank rows)
                    </span>
                  </div>
                </div>

                {/* Enable Totals & Summary Calculations */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-default, #cbd5e1)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <span>Enable Column Totals & Calculations</span>
                    <input
                      type="checkbox"
                      checked={selectedControl.detailGridConfig?.enableTotals ?? false}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const existingSummary = selectedControl.detailGridConfig?.summaryFields || [];
                        const initialSummary = enabled && existingSummary.length === 0
                          ? [
                              {
                                id: `sum_${Date.now()}`,
                                label: 'Grand Total',
                                sourceColumn: 'line_total',
                                calculationType: 'SUM' as const,
                                format: 'currency' as const,
                                decimalPlaces: 2,
                                prefix: '$',
                                targetFieldBinding: 'total_amount',
                              },
                            ]
                          : existingSummary;

                        onUpdateControl(selectedControl.id, {
                          detailGridConfig: {
                            detailTable: '',
                            foreignKeyColumn: '',
                            masterKeyColumn: 'id',
                            columns: [],
                            ...selectedControl.detailGridConfig,
                            enableTotals: enabled,
                            summaryFields: initialSummary,
                          },
                        });
                      }}
                    />
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                    Calculate totals, subtotals, or formulas below the grid and sync with master record fields.
                  </p>

                  {selectedControl.detailGridConfig?.enableTotals && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                      {/* List of Configured Summary Fields */}
                      {(selectedControl.detailGridConfig.summaryFields || []).map((summary, sIdx) => {
                        const detailCols = (selectedControl.detailGridConfig?.columns && selectedControl.detailGridConfig.columns.length > 0)
                          ? selectedControl.detailGridConfig.columns
                          : [
                              { field: 'quantity', label: 'Qty' },
                              { field: 'unit_price', label: 'Unit Price' },
                              { field: 'discount', label: 'Discount' },
                              { field: 'line_total', label: 'Line Total' },
                            ];

                        const updateSummary = (patch: Partial<DetailGridSummaryField>) => {
                          const updatedList = [...(selectedControl.detailGridConfig?.summaryFields || [])];
                          updatedList[sIdx] = { ...updatedList[sIdx], ...patch };
                          onUpdateControl(selectedControl.id, {
                            detailGridConfig: {
                              detailTable: '',
                              foreignKeyColumn: '',
                              masterKeyColumn: 'id',
                              columns: [],
                              ...selectedControl.detailGridConfig,
                              summaryFields: updatedList,
                            },
                          });
                        };

                        const removeSummary = () => {
                          const updatedList = (selectedControl.detailGridConfig?.summaryFields || []).filter((_, i) => i !== sIdx);
                          onUpdateControl(selectedControl.id, {
                            detailGridConfig: {
                              detailTable: '',
                              foreignKeyColumn: '',
                              masterKeyColumn: 'id',
                              columns: [],
                              ...selectedControl.detailGridConfig,
                              summaryFields: updatedList,
                            },
                          });
                        };

                        return (
                          <div
                            key={summary.id || sIdx}
                            style={{
                              padding: '10px',
                              backgroundColor: 'var(--surface-0, #ffffff)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-default, #cbd5e1)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary, #0067b8)' }}>
                                #{sIdx + 1}: {summary.label || 'Summary Field'}
                              </span>
                              <button
                                type="button"
                                onClick={removeSummary}
                                title="Remove summary field"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--status-danger-text, #ef4444)',
                                  padding: '2px',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Label */}
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                Summary Label
                              </label>
                              <input
                                type="text"
                                value={summary.label || ''}
                                onChange={(e) => updateSummary({ label: e.target.value })}
                                placeholder="e.g. Grand Total, Total Qty"
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  fontSize: '11px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--input-border, #64748b)',
                                  backgroundColor: 'var(--input-bg, var(--surface-1))',
                                  color: 'var(--text-primary)',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>

                            {/* Calculation Type & Source Column */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Calculation Type
                                </label>
                                <select
                                  value={summary.calculationType || 'SUM'}
                                  onChange={(e) => updateSummary({ calculationType: e.target.value as any })}
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--input-border, #64748b)',
                                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  <option value="SUM">SUM (Total)</option>
                                  <option value="COUNT">COUNT (Rows)</option>
                                  <option value="AVG">AVG (Average)</option>
                                  <option value="MIN">MIN (Minimum)</option>
                                  <option value="MAX">MAX (Maximum)</option>
                                  <option value="FORMULA">FORMULA (Expression)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Detail Column
                                </label>
                                <select
                                  value={summary.sourceColumn || ''}
                                  onChange={(e) => updateSummary({ sourceColumn: e.target.value })}
                                  disabled={summary.calculationType === 'FORMULA'}
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--input-border, #64748b)',
                                    backgroundColor: summary.calculationType === 'FORMULA' ? 'var(--surface-2)' : 'var(--input-bg, var(--surface-1))',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  <option value="">-- Choose column --</option>
                                  {detailCols.map((col) => (
                                    <option key={col.field} value={col.field}>
                                      {col.label || col.field}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Formula Input (shown when FORMULA calculation type is chosen) */}
                            {summary.calculationType === 'FORMULA' && (
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Formula Expression
                                </label>
                                <input
                                  type="text"
                                  value={summary.formula || ''}
                                  onChange={(e) => updateSummary({ formula: e.target.value })}
                                  placeholder="e.g. SUM(quantity * unit_price)"
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    borderRadius: '4px',
                                    border: '1px solid var(--input-border, #64748b)',
                                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                                    color: 'var(--text-primary)',
                                    boxSizing: 'border-box',
                                  }}
                                />
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                  Supported: SUM(quantity * unit_price), SUM(line_total - discount)
                                </span>
                              </div>
                            )}

                            {/* Format & Decimals */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Display Format
                                </label>
                                <select
                                  value={summary.format || 'currency'}
                                  onChange={(e) =>
                                    updateSummary({
                                      format: e.target.value as any,
                                      prefix: e.target.value === 'currency' ? '$' : '',
                                    })
                                  }
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--input-border, #64748b)',
                                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  <option value="currency">Currency ($1,234.56)</option>
                                  <option value="number">Number (1,234)</option>
                                  <option value="percentage">Percentage (15%)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Decimal Places
                                </label>
                                <select
                                  value={summary.decimalPlaces ?? (summary.format === 'currency' ? 2 : 0)}
                                  onChange={(e) => updateSummary({ decimalPlaces: parseInt(e.target.value) || 0 })}
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--input-border, #64748b)',
                                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  <option value="0">0 decimals</option>
                                  <option value="1">1 decimal</option>
                                  <option value="2">2 decimals</option>
                                  <option value="3">3 decimals</option>
                                  <option value="4">4 decimals</option>
                                </select>
                              </div>
                            </div>

                            {/* Prefix & Suffix */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Prefix
                                </label>
                                <input
                                  type="text"
                                  value={summary.prefix || ''}
                                  onChange={(e) => updateSummary({ prefix: e.target.value })}
                                  placeholder="$"
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--input-border, #64748b)',
                                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                                    color: 'var(--text-primary)',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                  Suffix
                                </label>
                                <input
                                  type="text"
                                  value={summary.suffix || ''}
                                  onChange={(e) => updateSummary({ suffix: e.target.value })}
                                  placeholder="e.g. items, USD"
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--input-border, #64748b)',
                                    backgroundColor: 'var(--input-bg, var(--surface-1))',
                                    color: 'var(--text-primary)',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                            </div>

                            {/* Sync to Master Field */}
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                Sync to Master Record Field (Optional)
                              </label>
                              <select
                                value={summary.targetFieldBinding || ''}
                                onChange={(e) => updateSummary({ targetFieldBinding: e.target.value || undefined })}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  fontSize: '11px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--input-border, #64748b)',
                                  backgroundColor: 'var(--input-bg, var(--surface-1))',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <option value="">-- None (display total only) --</option>
                                {sourceSchema?.columns?.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name} ({c.dataType})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Summary Field Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentList = selectedControl.detailGridConfig?.summaryFields || [];
                          const newField: DetailGridSummaryField = {
                            id: `sum_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            label: currentList.length === 0 ? 'Grand Total' : 'Subtotal',
                            sourceColumn: 'line_total',
                            calculationType: 'SUM',
                            format: 'currency',
                            decimalPlaces: 2,
                            prefix: '$',
                          };
                          onUpdateControl(selectedControl.id, {
                            detailGridConfig: {
                              detailTable: '',
                              foreignKeyColumn: '',
                              masterKeyColumn: 'id',
                              columns: [],
                              ...selectedControl.detailGridConfig,
                              summaryFields: [...currentList, newField],
                            },
                          });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: '1px dashed var(--brand-primary, #0067b8)',
                          backgroundColor: 'var(--brand-primary-subtle, rgba(0,103,184,0.06))',
                          color: 'var(--brand-primary, #0067b8)',
                          cursor: 'pointer',
                          marginTop: '4px',
                        }}
                      >
                        <Plus size={13} /> Add Summary / Total Field
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: ACTIONS */}
        {controlTab === 'actions' && (
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              Button Action Type
            </label>
            <select
              value={selectedControl.buttonAction?.actionType || 'submit'}
              onChange={(e) =>
                onUpdateControl(selectedControl.id, {
                  buttonAction: {
                    ...selectedControl.buttonAction,
                    actionType: e.target.value as any,
                  },
                })
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-0)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="submit">Save / Submit Record</option>
              <option value="reset">Clear / Reset Form</option>
              <option value="calculate">Compute Calculations</option>
              <option value="navigate">Navigate URL</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
