import React, { useState, useMemo } from 'react';
import {
  FormControlType,
  FormControl,
  FormSourceType,
  SourceSchema,
  EligibleDataSourcesResponse,
} from '../../../../types/index.ts';
import { TOOLBOX_CATALOG, ToolboxItemDef, createDefaultControl } from './designerCatalog.ts';
import { Badge } from '../../../../components/ui/Badge.tsx';
import {
  Wrench,
  Database,
  Search,
  Key,
  Layers,
  Table,
  Plus,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Lock,
  CheckCircle,
} from 'lucide-react';

export interface DesignerToolboxPanelProps {
  onAddControl: (control: FormControl) => void;
  sourceType: FormSourceType;
  sourceName: string;
  onSourceChange: (type: FormSourceType, name: string) => void;
  sourceSchema: SourceSchema | null;
  eligibleSources: EligibleDataSourcesResponse;
  isLoadingSchema: boolean;
  onReloadSchema: () => void;
}

export const DesignerToolboxPanel: React.FC<DesignerToolboxPanelProps> = ({
  onAddControl,
  sourceType,
  sourceName,
  onSourceChange,
  sourceSchema,
  eligibleSources,
  isLoadingSchema,
  onReloadSchema,
}) => {
  const [activeTab, setActiveTab] = useState<'toolbox' | 'fields' | 'source'>('toolbox');
  const [toolboxSearch, setToolboxSearch] = useState('');
  const [fieldsSearch, setFieldsSearch] = useState('');

  // Expandable Category States
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    data_entry: true,
    layout: true,
    advanced: true,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Filtered Toolbox Items
  const filteredCatalog = useMemo(() => {
    if (!toolboxSearch.trim()) return TOOLBOX_CATALOG;
    const q = toolboxSearch.toLowerCase().trim();
    return TOOLBOX_CATALOG.filter(
      (item) => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );
  }, [toolboxSearch]);

  const dataEntryItems = filteredCatalog.filter((i) => i.category === 'data_entry');
  const layoutItems = filteredCatalog.filter((i) => i.category === 'layout');
  const advancedItems = filteredCatalog.filter((i) => i.category === 'advanced');

  // Filtered Schema Fields
  const filteredFields = useMemo(() => {
    if (!sourceSchema || !sourceSchema.columns) return [];
    if (!fieldsSearch.trim()) return sourceSchema.columns;
    const q = fieldsSearch.toLowerCase().trim();
    return sourceSchema.columns.filter((col) => col.name.toLowerCase().includes(q) || col.dataType.toLowerCase().includes(q));
  }, [sourceSchema, fieldsSearch]);

  // Convert Schema Column to pre-bound Form Control
  const handleAddFieldAsControl = (col: (typeof filteredFields)[0]) => {
    let ctrlType: FormControlType = 'text';
    const typeUpper = col.dataType.toUpperCase();

    if (col.foreignKey) {
      ctrlType = 'lookup';
    } else if (typeUpper.includes('INT') && (typeUpper.includes('TINYINT(1)') || col.columnType === 'tinyint(1)')) {
      ctrlType = 'switch';
    } else if (typeUpper.includes('INT')) {
      ctrlType = 'number';
    } else if (typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC') || typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE')) {
      ctrlType = col.name.toLowerCase().includes('price') || col.name.toLowerCase().includes('amount') || col.name.toLowerCase().includes('total')
        ? 'currency'
        : 'decimal';
    } else if (typeUpper === 'DATE') {
      ctrlType = 'date';
    } else if (typeUpper === 'TIME') {
      ctrlType = 'time';
    } else if (typeUpper.includes('DATETIME') || typeUpper.includes('TIMESTAMP')) {
      ctrlType = 'datetime';
    } else if (typeUpper.includes('TEXT')) {
      ctrlType = 'textarea';
    } else if (col.name.toLowerCase().includes('email')) {
      ctrlType = 'email';
    } else if (col.name.toLowerCase().includes('phone')) {
      ctrlType = 'phone';
    } else if (col.name.toLowerCase().includes('password')) {
      ctrlType = 'password';
    } else if (col.name.toLowerCase().includes('url') || col.name.toLowerCase().includes('link')) {
      ctrlType = 'url';
    }

    // Capitalize field name as label
    const formattedLabel = col.name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const ctrl = createDefaultControl(ctrlType, formattedLabel, col.name);
    if (col.isPrimaryKey) {
      ctrl.readOnly = true;
    }
    if (!col.isNullable && !col.isAutoIncrement) {
      if (ctrl.validation) ctrl.validation.required = true;
    }

    // If Foreign Key, prepopulate lookup config
    if (col.foreignKey) {
      ctrl.lookupConfig = {
        sourceTable: col.foreignKey.referencedTable,
        returnColumn: col.foreignKey.referencedColumn,
        displayColumn: 'name', // sensible default
      };
    }

    onAddControl(ctrl);
  };

  const renderToolboxGroup = (title: string, categoryKey: string, items: ToolboxItemDef[]) => {
    if (items.length === 0) return null;
    const isOpen = openCategories[categoryKey] ?? true;

    return (
      <div style={{ marginBottom: '12px' }}>
        <div
          onClick={() => toggleCategory(categoryKey)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '4px',
            backgroundColor: 'var(--surface-2, rgba(0,0,0,0.03))',
            marginBottom: '6px',
          }}
        >
          <span>{title} ({items.length})</span>
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>

        {isOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
            {items.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: item.type, defaultLabel: item.defaultLabel }));
                  }}
                  onClick={() => onAddControl(createDefaultControl(item.type, item.defaultLabel))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary)',
                    cursor: 'grab',
                    fontSize: '12px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-primary, #0067b8)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-primary-subtle, rgba(0,103,184,0.04))';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle, #e2e8f0)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface, #ffffff)';
                  }}
                  title={`${item.label} — Drag to canvas or click to add`}
                >
                  <IconComp size={15} style={{ color: 'var(--brand-primary, #0067b8)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </div>
                  </div>
                  <Plus size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-surface, #ffffff)',
        borderRight: '1px solid var(--border-subtle, #e2e8f0)',
        overflow: 'hidden',
      }}
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: 'var(--surface-2, rgba(0,0,0,0.02))',
        }}
      >
        <button
          onClick={() => setActiveTab('toolbox')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: activeTab === 'toolbox' ? 700 : 500,
            border: 'none',
            borderBottom: activeTab === 'toolbox' ? '2px solid var(--brand-primary, #0067b8)' : '2px solid transparent',
            backgroundColor: activeTab === 'toolbox' ? 'var(--bg-surface, #ffffff)' : 'transparent',
            color: activeTab === 'toolbox' ? 'var(--brand-primary, #0067b8)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Wrench size={13} />
          <span>Toolbox</span>
        </button>

        <button
          onClick={() => setActiveTab('fields')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: activeTab === 'fields' ? 700 : 500,
            border: 'none',
            borderBottom: activeTab === 'fields' ? '2px solid var(--brand-primary, #0067b8)' : '2px solid transparent',
            backgroundColor: activeTab === 'fields' ? 'var(--bg-surface, #ffffff)' : 'transparent',
            color: activeTab === 'fields' ? 'var(--brand-primary, #0067b8)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Layers size={13} />
          <span>Data Fields</span>
          {sourceSchema?.columns && (
            <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
              {sourceSchema.columns.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('source')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: activeTab === 'source' ? 700 : 500,
            border: 'none',
            borderBottom: activeTab === 'source' ? '2px solid var(--brand-primary, #0067b8)' : '2px solid transparent',
            backgroundColor: activeTab === 'source' ? 'var(--bg-surface, #ffffff)' : 'transparent',
            color: activeTab === 'source' ? 'var(--brand-primary, #0067b8)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Database size={13} />
          <span>Source</span>
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* TAB 1: TOOLBOX */}
        {activeTab === 'toolbox' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search
                size={13}
                style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                value={toolboxSearch}
                onChange={(e) => setToolboxSearch(e.target.value)}
                placeholder="Search controls..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 28px',
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

            {renderToolboxGroup('Data Entry Controls', 'data_entry', dataEntryItems)}
            {renderToolboxGroup('Display & Layout Controls', 'layout', layoutItems)}
            {renderToolboxGroup('Advanced Data Controls', 'advanced', advancedItems)}
          </div>
        )}

        {/* TAB 2: DATA FIELDS */}
        {activeTab === 'fields' && (
          <div>
            {!sourceName ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
                <Database size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No Data Source Connected
                </div>
                <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                  Select a database table or query in the Source tab to discover available columns.
                </div>
                <button
                  onClick={() => setActiveTab('source')}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--brand-primary)',
                    backgroundColor: 'transparent',
                    color: 'var(--brand-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Configure Source
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Table: <span style={{ color: 'var(--brand-primary)' }}>{sourceName}</span>
                  </div>
                  <button
                    onClick={onReloadSchema}
                    disabled={isLoadingSchema}
                    title="Reload schema from database"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={11} className={isLoadingSchema ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search
                    size={13}
                    style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    value={fieldsSearch}
                    onChange={(e) => setFieldsSearch(e.target.value)}
                    placeholder="Filter fields..."
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 28px',
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {filteredFields.map((col) => (
                    <div
                      key={col.name}
                      onClick={() => handleAddFieldAsControl(col)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 9px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-primary)';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-primary-subtle, rgba(0,103,184,0.04))';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle, #e2e8f0)';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface, #ffffff)';
                      }}
                      title="Click to insert bound input control onto canvas"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        {col.isPrimaryKey ? (
                          <Key size={13} style={{ color: 'var(--status-warning-text, #f59e0b)', flexShrink: 0 }} />
                        ) : col.foreignKey ? (
                          <Layers size={13} style={{ color: 'var(--brand-primary, #6366f1)', flexShrink: 0 }} />
                        ) : (
                          <Table size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {col.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {col.isPrimaryKey && (
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--status-warning-text, #b45309)' }}>
                            PK
                          </span>
                        )}
                        {col.foreignKey && (
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--brand-primary, #6366f1)' }}>
                            FK
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {col.dataType}
                        </span>
                        <Plus size={12} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DATA SOURCE CONFIGURATION */}
        {activeTab === 'source' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Source Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'table'}
                    onChange={() => onSourceChange('table', '')}
                  />
                  Database Table
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'query'}
                    onChange={() => onSourceChange('query', '')}
                  />
                  Saved Query
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'none'}
                    onChange={() => onSourceChange('none', '')}
                  />
                  None (Unbound)
                </label>
              </div>
            </div>

            {sourceType === 'table' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Select Database Table
                </label>
                <select
                  value={sourceName}
                  onChange={(e) => onSourceChange('table', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Choose a table --</option>
                  {eligibleSources.tables.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.rowCount} rows, {t.columnCount} cols)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sourceType === 'query' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Select Saved Query
                </label>
                <select
                  value={sourceName}
                  onChange={(e) => onSourceChange('query', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Choose a query --</option>
                  {eligibleSources.queries.map((q) => (
                    <option key={q.name} value={q.name}>
                      {q.label} ({q.columnCount} columns)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source Status & Metadata Card */}
            {sourceName && sourceSchema && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--surface-2, rgba(0,0,0,0.02))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <CheckCircle size={14} style={{ color: 'var(--status-success-text, #16a34a)' }} />
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                    Source Connected
                  </span>
                </div>

                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong>Primary Key:</strong>{' '}
                    <code style={{ fontSize: '11px', padding: '1px 4px', borderRadius: '3px', background: 'var(--surface-0)' }}>
                      {sourceSchema.primaryKey || 'None'}
                    </code>
                  </div>
                  <div>
                    <strong>Total Columns:</strong> {sourceSchema.columns.length}
                  </div>
                  <div>
                    <strong>CRUD Status:</strong>{' '}
                    <Badge variant={sourceSchema.isEditable ? 'success' : 'neutral'}>
                      {sourceSchema.isEditable ? 'Full Read/Write CRUD' : 'Read-Only Source'}
                    </Badge>
                  </div>
                  {sourceSchema.inboundRelations.length > 0 && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                      <strong>Child Detail Tables:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {sourceSchema.inboundRelations.map((rel) => (
                          <span
                            key={rel.childTable}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              color: 'var(--brand-primary, #6366f1)',
                            }}
                          >
                            {rel.childTable} ({rel.childForeignKey})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
