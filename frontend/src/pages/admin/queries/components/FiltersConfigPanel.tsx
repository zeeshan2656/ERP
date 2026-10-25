import React from 'react';
import {
  QueryConditionGroup,
  QueryCondition,
  ConditionOperator,
  QueryTableNode,
  QueryParameter,
} from '../../../../types/index.ts';
import { TableStructure } from '../../../../types/database.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import {
  Plus,
  Trash2,
  Filter,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface FiltersConfigPanelProps {
  filters: QueryConditionGroup;
  tables: QueryTableNode[];
  tableStructures: Record<string, TableStructure>;
  parameters: QueryParameter[];
  onChangeFilters: (newFilters: QueryConditionGroup) => void;
  title?: string;
  description?: string;
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  EQUALS: '= (Equals)',
  NOT_EQUALS: '!= (Not Equals)',
  GREATER_THAN: '> (Greater Than)',
  LESS_THAN: '< (Less Than)',
  GREATER_EQUAL: '>= (Greater or Equal)',
  LESS_EQUAL: '<= (Less or Equal)',
  LIKE: 'LIKE (Contains)',
  NOT_LIKE: 'NOT LIKE (Does Not Contain)',
  STARTS_WITH: 'STARTS WITH',
  ENDS_WITH: 'ENDS WITH',
  IN: 'IN (Comma separated)',
  NOT_IN: 'NOT IN (Comma separated)',
  IS_NULL: 'IS NULL',
  IS_NOT_NULL: 'IS NOT NULL',
  BETWEEN: 'BETWEEN',
};

export const FiltersConfigPanel: React.FC<FiltersConfigPanelProps> = ({
  filters,
  tables,
  tableStructures,
  parameters,
  onChangeFilters,
  title = 'WHERE Filter Conditions',
  description = 'Filter query results with logical AND/OR condition groups and parameter bindings.',
}) => {
  // Helper to deep clone filters
  const cloneGroup = (g: QueryConditionGroup): QueryConditionGroup => JSON.parse(JSON.stringify(g));

  const handleAddCondition = (groupId: string) => {
    const updated = cloneGroup(filters);
    const targetGroup = findGroup(updated, groupId);
    if (!targetGroup) return;

    const firstTable = tables[0];
    const firstCol = firstTable ? tableStructures[firstTable.tableName]?.columns[0]?.name || 'id' : '';

    const newCond: QueryCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tableAlias: firstTable?.alias || '',
      columnName: firstCol,
      operator: 'EQUALS',
      value: '',
      isParameter: false,
    };

    targetGroup.conditions.push(newCond);
    onChangeFilters(updated);
  };

  const handleAddSubGroup = (groupId: string) => {
    const updated = cloneGroup(filters);
    const targetGroup = findGroup(updated, groupId);
    if (!targetGroup) return;

    const firstTable = tables[0];
    const firstCol = firstTable ? tableStructures[firstTable.tableName]?.columns[0]?.name || 'id' : '';

    const newSubGroup: QueryConditionGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      logicalOperator: targetGroup.logicalOperator === 'AND' ? 'OR' : 'AND',
      conditions: [
        {
          id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          tableAlias: firstTable?.alias || '',
          columnName: firstCol,
          operator: 'EQUALS',
          value: '',
          isParameter: false,
        },
      ],
    };

    targetGroup.conditions.push(newSubGroup);
    onChangeFilters(updated);
  };

  const handleRemoveItem = (parentId: string, itemId: string) => {
    const updated = cloneGroup(filters);
    const targetGroup = findGroup(updated, parentId);
    if (!targetGroup) return;

    targetGroup.conditions = targetGroup.conditions.filter((c: any) => c.id !== itemId);
    onChangeFilters(updated);
  };

  const handleUpdateCondition = (condId: string, updates: Partial<QueryCondition>) => {
    const updated = cloneGroup(filters);
    updateConditionInTree(updated, condId, updates);
    onChangeFilters(updated);
  };

  const handleToggleGroupOp = (groupId: string) => {
    const updated = cloneGroup(filters);
    const grp = findGroup(updated, groupId);
    if (grp) {
      grp.logicalOperator = grp.logicalOperator === 'AND' ? 'OR' : 'AND';
      onChangeFilters(updated);
    }
  };

  const findGroup = (group: QueryConditionGroup, id: string): QueryConditionGroup | null => {
    if (group.id === id) return group;
    for (const item of group.conditions) {
      if ('logicalOperator' in item) {
        const found = findGroup(item, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateConditionInTree = (
    group: QueryConditionGroup,
    condId: string,
    updates: Partial<QueryCondition>
  ) => {
    for (let i = 0; i < group.conditions.length; i++) {
      const item = group.conditions[i];
      if ('operator' in item && item.id === condId) {
        group.conditions[i] = { ...item, ...updates };
        return;
      } else if ('logicalOperator' in item) {
        updateConditionInTree(item, condId, updates);
      }
    }
  };

  const renderGroup = (group: QueryConditionGroup, isRoot = false) => {
    return (
      <div
        key={group.id}
        style={{
          border: isRoot ? 'none' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-card, 8px)',
          padding: isRoot ? '0' : '12px',
          backgroundColor: isRoot ? 'transparent' : 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.02))',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Group Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Match</span>
            <button
              type="button"
              onClick={() => handleToggleGroupOp(group.id)}
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border-default)',
                backgroundColor: group.logicalOperator === 'AND' ? 'var(--primary-color)' : '#f97316',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {group.logicalOperator === 'AND' ? 'ALL (AND)' : 'ANY (OR)'}
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>of the following conditions:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={12} />}
              onClick={() => handleAddCondition(group.id)}
            >
              Add Condition
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Layers size={12} />}
              onClick={() => handleAddSubGroup(group.id)}
            >
              Add Sub-Group
            </Button>
          </div>
        </div>

        {/* Group Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: isRoot ? '0' : '12px' }}>
          {group.conditions.map((item) => {
            if ('logicalOperator' in item) {
              return (
                <div key={item.id} style={{ position: 'relative' }}>
                  {renderGroup(item, false)}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(group.id, item.id)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    title="Remove group"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            }

            // Condition Item
            const cond = item as QueryCondition;
            const currentTable = tables.find((t) => t.alias === cond.tableAlias);
            const cols = currentTable ? tableStructures[currentTable.tableName]?.columns || [] : [];
            const isNoValueOperator = cond.operator === 'IS_NULL' || cond.operator === 'IS_NOT_NULL';
            const isBetween = cond.operator === 'BETWEEN';

            return (
              <div
                key={cond.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-default)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Table Alias */}
                <div style={{ width: '130px' }}>
                  <select
                    value={cond.tableAlias}
                    onChange={(e) => {
                      const newTable = tables.find((t) => t.alias === e.target.value);
                      const newCols = newTable ? tableStructures[newTable.tableName]?.columns || [] : [];
                      handleUpdateCondition(cond.id, {
                        tableAlias: e.target.value,
                        columnName: newCols[0]?.name || '',
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.alias}>
                        {t.alias} ({t.tableName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column */}
                <div style={{ width: '150px' }}>
                  <select
                    value={cond.columnName}
                    onChange={(e) => handleUpdateCondition(cond.id, { columnName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    {cols.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div style={{ width: '170px' }}>
                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      handleUpdateCondition(cond.id, { operator: e.target.value as ConditionOperator })
                    }
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                      <option key={op} value={op}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value Input or Parameter Binding */}
                {!isNoValueOperator && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '200px' }}>
                    {/* Toggle Parameter vs Static */}
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCondition(cond.id, {
                          isParameter: !cond.isParameter,
                          parameterName: !cond.isParameter && parameters[0] ? parameters[0].name : undefined,
                        })
                      }
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-default)',
                        backgroundColor: cond.isParameter ? 'var(--primary-color)' : 'var(--bg-surface)',
                        color: cond.isParameter ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      title="Switch between static literal value and bound runtime parameter"
                    >
                      {cond.isParameter ? ':Param' : 'Value'}
                    </button>

                    {cond.isParameter ? (
                      <div style={{ flex: 1 }}>
                        <select
                          value={cond.parameterName || ''}
                          onChange={(e) => handleUpdateCondition(cond.id, { parameterName: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            fontSize: '12px',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        >
                          <option value="">Select parameter...</option>
                          {parameters.map((p) => (
                            <option key={p.id} value={p.name}>
                              :{p.name} ({p.label})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={cond.value !== undefined ? cond.value : ''}
                          placeholder={isBetween ? 'From value...' : 'Filter value...'}
                          onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            fontSize: '12px',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        {isBetween && (
                          <input
                            type="text"
                            value={cond.valueTo !== undefined ? cond.valueTo : ''}
                            placeholder="To value..."
                            onChange={(e) => handleUpdateCondition(cond.id, { valueTo: e.target.value })}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              fontSize: '12px',
                              border: '1px solid var(--border-default)',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              outline: 'none',
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Remove Condition */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(group.id, cond.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Remove condition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}

          {group.conditions.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No filter conditions. Click <strong>Add Condition</strong> above to add filtering criteria.
            </div>
          )}
        </div>
      </div>
    );
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
      <div>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>

      {tables.length === 0 ? (
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
          Add tables to the canvas first to configure filter conditions.
        </div>
      ) : (
        renderGroup(filters, true)
      )}
    </div>
  );
};
