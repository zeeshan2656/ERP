import React from 'react';
import { AccessGridColumn, QueryTableNode } from '../../../../types/index.ts';
import { TableStructure } from '../../../../types/database.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react';

interface AccessQueryGridProps {
  gridColumns: AccessGridColumn[];
  tables: QueryTableNode[];
  tableStructures: Record<string, TableStructure>;
  onUpdateGridColumn: (colId: string, updates: Partial<AccessGridColumn>) => void;
  onRemoveGridColumn: (colId: string) => void;
  onMoveGridColumn: (fromIndex: number, toIndex: number) => void;
  onAddEmptyColumn: () => void;
  onOpenCalculatedFieldModal: (col?: AccessGridColumn) => void;
  onClearGrid: () => void;
}

export const AccessQueryGrid: React.FC<AccessQueryGridProps> = ({
  gridColumns,
  tables,
  tableStructures,
  onUpdateGridColumn,
  onRemoveGridColumn,
  onMoveGridColumn,
  onAddEmptyColumn,
  onOpenCalculatedFieldModal,
  onClearGrid,
}) => {
  // Build flattened list of all available columns across all active tables
  const availableColumns = React.useMemo(() => {
    const list: { tableAlias: string; tableName: string; columnName: string; dataType?: string }[] = [];
    tables.forEach((t) => {
      const struct = tableStructures[t.tableName];
      (struct?.columns || []).forEach((c) => {
        list.push({
          tableAlias: t.alias,
          tableName: t.tableName,
          columnName: c.name,
          dataType: c.dataType,
        });
      });
    });
    return list;
  }, [tables, tableStructures]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-default)',
        userSelect: 'none',
      }}
    >
      {/* Grid Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-default)',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Query Design Grid
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            ({gridColumns.length} field{gridColumns.length === 1 ? '' : 's'})
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            • Tip: Double-click columns above to add them here
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenCalculatedFieldModal()}
            leftIcon={<Sparkles size={13} />}
          >
            Add Calculated Field
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onAddEmptyColumn}
            leftIcon={<Plus size={13} />}
          >
            Add Column
          </Button>

          {gridColumns.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearGrid}
              style={{ color: 'var(--status-danger, #ef4444)' }}
            >
              Clear Grid
            </Button>
          )}
        </div>
      </div>

      {/* Access Design Table Container */}
      <div
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          display: 'flex',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <table
          style={{
            borderCollapse: 'collapse',
            fontSize: '12px',
            textAlign: 'left',
            tableLayout: 'fixed',
            minWidth: '100%',
          }}
        >
          <thead>
            {/* Action Bar Header Row for Columns */}
            <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-default)' }}>
              <th
                style={{
                  width: '120px',
                  minWidth: '120px',
                  maxWidth: '120px',
                  padding: '6px 10px',
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 4,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Design Row
              </th>

              {gridColumns.map((col, index) => (
                <th
                  key={col.id}
                  style={{
                    width: '190px',
                    minWidth: '190px',
                    padding: '4px 6px',
                    borderRight: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        disabled={index === 0}
                        onClick={() => onMoveGridColumn(index, index - 1)}
                        title="Move Left"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.3 : 0.8,
                          color: 'var(--text-muted)',
                          padding: '2px',
                        }}
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        disabled={index === gridColumns.length - 1}
                        onClick={() => onMoveGridColumn(index, index + 1)}
                        title="Move Right"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: index === gridColumns.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === gridColumns.length - 1 ? 0.3 : 0.8,
                          color: 'var(--text-muted)',
                          padding: '2px',
                        }}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Col {index + 1}
                    </span>

                    <button
                      onClick={() => onRemoveGridColumn(col.id)}
                      title="Remove column from query"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '2px',
                        borderRadius: '3px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-danger, #ef4444)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </th>
              ))}

              {/* Trailing empty column spacer */}
              <th
                style={{
                  width: '180px',
                  minWidth: '180px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-app)',
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddEmptyColumn}
                  style={{ width: '100%', fontSize: '11px', border: '1px dashed var(--border-default)' }}
                  leftIcon={<Plus size={12} />}
                >
                  New Field...
                </Button>
              </th>
            </tr>
          </thead>

          <tbody>
            {/* ROW 1: Field */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                Field:
              </td>
              {gridColumns.map((col) => (
                <td key={col.id} style={{ padding: '4px', borderRight: '1px solid var(--border-subtle)' }}>
                  {col.isCalculated ? (
                    <div
                      onClick={() => onOpenCalculatedFieldModal(col)}
                      title="Click to edit formula"
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--primary-subtle, rgba(0, 102, 204, 0.08))',
                        border: '1px solid var(--primary)',
                        borderRadius: '4px',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{col.alias || col.calculatedFormula}</span>
                      <Calculator size={12} />
                    </div>
                  ) : (
                    <select
                      value={`${col.tableAlias}.${col.columnName}`}
                      onChange={(e) => {
                        const [tAlias, cName] = e.target.value.split('.');
                        const match = availableColumns.find(
                          (ac) => ac.tableAlias === tAlias && ac.columnName === cName
                        );
                        if (match) {
                          onUpdateGridColumn(col.id, {
                            tableAlias: match.tableAlias,
                            tableName: match.tableName,
                            columnName: match.columnName,
                            field: match.columnName,
                            alias: col.alias || match.columnName,
                          });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    >
                      <option value="">(Select Field)</option>
                      {availableColumns.map((ac) => (
                        <option
                          key={`${ac.tableAlias}.${ac.columnName}`}
                          value={`${ac.tableAlias}.${ac.columnName}`}
                        >
                          {ac.tableAlias}.{ac.columnName}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              ))}
              <td style={{ backgroundColor: 'var(--bg-surface)' }} />
            </tr>

            {/* ROW 2: Table */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                Table:
              </td>
              {gridColumns.map((col) => (
                <td
                  key={col.id}
                  style={{
                    padding: '4px 8px',
                    borderRight: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                >
                  {col.isCalculated ? (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>(Calculated)</span>
                  ) : (
                    col.tableName || col.tableAlias || '-'
                  )}
                </td>
              ))}
              <td style={{ backgroundColor: 'var(--bg-app)' }} />
            </tr>

            {/* ROW 3: Alias */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                Alias:
              </td>
              {gridColumns.map((col) => (
                <td key={col.id} style={{ padding: '4px', borderRight: '1px solid var(--border-subtle)' }}>
                  <input
                    type="text"
                    value={col.alias || ''}
                    placeholder={col.columnName || 'Custom alias...'}
                    onChange={(e) => onUpdateGridColumn(col.id, { alias: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </td>
              ))}
              <td style={{ backgroundColor: 'var(--bg-surface)' }} />
            </tr>

            {/* ROW 4: Sort */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                Sort:
              </td>
              {gridColumns.map((col) => (
                <td key={col.id} style={{ padding: '4px', borderRight: '1px solid var(--border-subtle)' }}>
                  <select
                    value={col.sortOrder || ''}
                    onChange={(e) => onUpdateGridColumn(col.id, { sortOrder: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">(not sorted)</option>
                    <option value="ASC">Ascending</option>
                    <option value="DESC">Descending</option>
                  </select>
                </td>
              ))}
              <td style={{ backgroundColor: 'var(--bg-app)' }} />
            </tr>

            {/* ROW 5: Show */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                Show:
              </td>
              {gridColumns.map((col) => (
                <td
                  key={col.id}
                  style={{
                    padding: '4px',
                    borderRight: '1px solid var(--border-subtle)',
                    textAlign: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={col.isVisible !== false}
                    onChange={(e) => onUpdateGridColumn(col.id, { isVisible: e.target.checked })}
                    title="Include in query output (SELECT clause)"
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </td>
              ))}
              <td style={{ backgroundColor: 'var(--bg-surface)' }} />
            </tr>

            {/* ROW 6: Criteria */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                Criteria:
              </td>
              {gridColumns.map((col) => (
                <td key={col.id} style={{ padding: '4px', borderRight: '1px solid var(--border-subtle)' }}>
                  <input
                    type="text"
                    value={col.criteria || ''}
                    placeholder='e.g. > 100 or "Active"'
                    onChange={(e) => onUpdateGridColumn(col.id, { criteria: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </td>
              ))}
              <td style={{ backgroundColor: 'var(--bg-app)' }} />
            </tr>

            {/* ROW 7: Or (1) */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                or:
              </td>
              {gridColumns.map((col) => {
                const orVal = col.orCriteria && col.orCriteria[0] ? col.orCriteria[0] : '';
                return (
                  <td key={col.id} style={{ padding: '4px', borderRight: '1px solid var(--border-subtle)' }}>
                    <input
                      type="text"
                      value={orVal}
                      placeholder="Alternative condition..."
                      onChange={(e) => {
                        const updatedOr = [...(col.orCriteria || [])];
                        updatedOr[0] = e.target.value;
                        onUpdateGridColumn(col.id, { orCriteria: updatedOr });
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '12px',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </td>
                );
              })}
              <td style={{ backgroundColor: 'var(--bg-surface)' }} />
            </tr>

            {/* ROW 8: Or (2) */}
            <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-app)' }}>
              <td
                style={{
                  padding: '6px 10px',
                  fontWeight: 600,
                  borderRight: '2px solid var(--border-default)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                or:
              </td>
              {gridColumns.map((col) => {
                const orVal = col.orCriteria && col.orCriteria[1] ? col.orCriteria[1] : '';
                return (
                  <td key={col.id} style={{ padding: '4px', borderRight: '1px solid var(--border-subtle)' }}>
                    <input
                      type="text"
                      value={orVal}
                      placeholder="Alternative condition..."
                      onChange={(e) => {
                        const updatedOr = [...(col.orCriteria || [])];
                        updatedOr[1] = e.target.value;
                        onUpdateGridColumn(col.id, { orCriteria: updatedOr });
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '12px',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </td>
                );
              })}
              <td style={{ backgroundColor: 'var(--bg-app)' }} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
