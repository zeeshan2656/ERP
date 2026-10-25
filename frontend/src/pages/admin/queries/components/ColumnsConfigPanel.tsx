import React from 'react';
import {
  QueryColumn,
  QueryAggregateFunc,
  QueryOrderBy,
} from '../../../../types/index.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  SlidersHorizontal,
} from 'lucide-react';

interface ColumnsConfigPanelProps {
  columns: QueryColumn[];
  orderBy: QueryOrderBy[];
  onUpdateColumn: (colId: string, updates: Partial<QueryColumn>) => void;
  onRemoveColumn: (colId: string) => void;
  onMoveColumn: (fromIndex: number, toIndex: number) => void;
  onUpdateOrderBy: (colAlias: string, direction: 'ASC' | 'DESC' | 'NONE') => void;
}

export const ColumnsConfigPanel: React.FC<ColumnsConfigPanelProps> = ({
  columns,
  orderBy,
  onUpdateColumn,
  onRemoveColumn,
  onMoveColumn,
  onUpdateOrderBy,
}) => {
  const getSortDirection = (col: QueryColumn): 'ASC' | 'DESC' | 'NONE' => {
    const alias = col.alias || `${col.tableAlias}_${col.columnName}`;
    const found = orderBy.find((o) => o.columnOrAlias === alias || o.columnOrAlias === `${col.tableAlias}.${col.columnName}`);
    return found ? found.direction : 'NONE';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-card, 8px)',
        border: '1px solid var(--border-default)',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Selected Output Columns ({columns.length})
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Configure output column names, aliases, SQL aggregates, and sorting orders.
          </p>
        </div>
      </div>

      {columns.length === 0 ? (
        <div
          style={{
            padding: '36px',
            textAlign: 'center',
            border: '1px dashed var(--border-default)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          No columns selected yet. Go to the <strong>Canvas & Tables</strong> tab to check columns you wish to include in your query.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--border-default)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: '8px 10px', width: '60px' }}>Order</th>
                <th style={{ padding: '8px 10px' }}>Table & Source Column</th>
                <th style={{ padding: '8px 10px' }}>Type</th>
                <th style={{ padding: '8px 10px' }}>Output Alias</th>
                <th style={{ padding: '8px 10px', width: '150px' }}>Aggregate</th>
                <th style={{ padding: '8px 10px', width: '130px' }}>Sort Order</th>
                <th style={{ padding: '8px 10px', width: '70px', textAlign: 'center' }}>Visible</th>
                <th style={{ padding: '8px 10px', width: '60px', textAlign: 'center' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => {
                const sortDir = getSortDirection(col);
                const isVisible = col.isVisible !== false;

                return (
                  <tr
                    key={col.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, var(--border-default))',
                      backgroundColor: isVisible ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Reorder Buttons */}
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => onMoveColumn(idx, idx - 1)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            padding: '2px',
                          }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === columns.length - 1}
                          onClick={() => onMoveColumn(idx, idx + 1)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: idx === columns.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: idx === columns.length - 1 ? 'not-allowed' : 'pointer',
                            padding: '2px',
                          }}
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Table & Column */}
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Badge variant="neutral">
                          {col.tableAlias}
                        </Badge>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {col.columnName}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ({col.tableName})
                        </span>
                      </div>
                    </td>

                    {/* Data Type */}
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {col.dataType || 'VARCHAR'}
                      </span>
                    </td>

                    {/* Output Alias */}
                    <td style={{ padding: '6px 10px' }}>
                      <input
                        type="text"
                        value={col.alias || ''}
                        placeholder={`${col.tableAlias}_${col.columnName}`}
                        onChange={(e) => onUpdateColumn(col.id, { alias: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid var(--border-default)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      />
                    </td>

                    {/* Aggregate Function */}
                    <td style={{ padding: '6px 10px' }}>
                      <select
                        value={col.aggregate || 'NONE'}
                        onChange={(e) => onUpdateColumn(col.id, { aggregate: e.target.value as QueryAggregateFunc })}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid var(--border-default)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      >
                        <option value="NONE">None</option>
                        <option value="COUNT">COUNT()</option>
                        <option value="COUNT_DISTINCT">COUNT(DISTINCT)</option>
                        <option value="SUM">SUM()</option>
                        <option value="AVG">AVG()</option>
                        <option value="MIN">MIN()</option>
                        <option value="MAX">MAX()</option>
                      </select>
                    </td>

                    {/* Sort Order */}
                    <td style={{ padding: '6px 10px' }}>
                      <select
                        value={sortDir}
                        onChange={(e) =>
                          onUpdateOrderBy(
                            col.alias || `${col.tableAlias}_${col.columnName}`,
                            e.target.value as any
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '12px',
                          border: '1px solid var(--border-default)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      >
                        <option value="NONE">No Sort</option>
                        <option value="ASC">Ascending (ASC)</option>
                        <option value="DESC">Descending (DESC)</option>
                      </select>
                    </td>

                    {/* Visibility */}
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onUpdateColumn(col.id, { isVisible: !isVisible })}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: isVisible ? 'var(--primary-color)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                        title={isVisible ? 'Visible in results' : 'Hidden from results'}
                      >
                        {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </td>

                    {/* Remove */}
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onRemoveColumn(col.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                        title="Remove column"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
