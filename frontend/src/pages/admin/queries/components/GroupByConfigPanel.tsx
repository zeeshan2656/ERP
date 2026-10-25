import React from 'react';
import {
  QueryColumn,
  QueryTableNode,
  QueryConditionGroup,
  QueryParameter,
} from '../../../../types/index.ts';
import { TableStructure } from '../../../../types/database.ts';
import { FiltersConfigPanel } from './FiltersConfigPanel.tsx';
import { Layers, CheckSquare, Square } from 'lucide-react';

interface GroupByConfigPanelProps {
  groupBy: string[];
  onChangeGroupBy: (newGroupBy: string[]) => void;
  having?: QueryConditionGroup;
  onChangeHaving: (newHaving: QueryConditionGroup) => void;
  distinct?: boolean;
  onChangeDistinct: (distinct: boolean) => void;
  columns: QueryColumn[];
  tables: QueryTableNode[];
  tableStructures: Record<string, TableStructure>;
  parameters: QueryParameter[];
}

export const GroupByConfigPanel: React.FC<GroupByConfigPanelProps> = ({
  groupBy,
  onChangeGroupBy,
  having,
  onChangeHaving,
  distinct,
  onChangeDistinct,
  columns,
  tables,
  tableStructures,
  parameters,
}) => {
  const toggleGroupByCol = (colIdentifier: string) => {
    if (groupBy.includes(colIdentifier)) {
      onChangeGroupBy(groupBy.filter((c) => c !== colIdentifier));
    } else {
      onChangeGroupBy([...groupBy, colIdentifier]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Group By Columns Selection Card */}
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
              GROUP BY Fields & Distinct Rows
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Specify column grouping for aggregation and eliminate duplicate rows.
            </p>
          </div>

          {/* DISTINCT Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <input
              type="checkbox"
              checked={!!distinct}
              onChange={(e) => onChangeDistinct(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
            <span>DISTINCT (Return unique rows only)</span>
          </label>
        </div>

        {/* Column Group Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Select columns to GROUP BY:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
            {tables.map((t) => {
              const cols = tableStructures[t.tableName]?.columns || [];
              return cols.map((c) => {
                const idStr = `${t.alias}.${c.name}`;
                const isGrouped = groupBy.includes(idStr);

                return (
                  <label
                    key={idStr}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-default)',
                      backgroundColor: isGrouped ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isGrouped}
                      onChange={() => toggleGroupByCol(idStr)}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                    />
                    <span style={{ fontWeight: isGrouped ? 600 : 400, color: 'var(--text-primary)' }}>
                      {t.alias}.{c.name}
                    </span>
                  </label>
                );
              });
            })}
          </div>
        </div>
      </div>

      {/* HAVING Conditions */}
      <FiltersConfigPanel
        filters={having || { id: 'having_root', logicalOperator: 'AND', conditions: [] }}
        tables={tables}
        tableStructures={tableStructures}
        parameters={parameters}
        onChangeFilters={onChangeHaving}
        title="HAVING Filter Conditions"
        description="Filter aggregated query results after GROUP BY evaluation (e.g. COUNT(*) > 5 or SUM(amount) > 1000)."
      />
    </div>
  );
};
