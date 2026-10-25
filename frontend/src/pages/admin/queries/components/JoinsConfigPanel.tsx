import React, { useState } from 'react';
import {
  QueryJoin,
  QueryTableNode,
  QueryJoinType,
} from '../../../../types/index.ts';
import { TableStructure } from '../../../../types/database.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import {
  Link2,
  Trash2,
  Plus,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface JoinsConfigPanelProps {
  joins: QueryJoin[];
  tables: QueryTableNode[];
  tableStructures: Record<string, TableStructure>;
  onAddJoin: (join: Omit<QueryJoin, 'id'>) => void;
  onRemoveJoin: (joinId: string) => void;
  onUpdateJoinType: (joinId: string, joinType: QueryJoinType) => void;
  onAutoSuggestJoins: () => void;
}

export const JoinsConfigPanel: React.FC<JoinsConfigPanelProps> = ({
  joins,
  tables,
  tableStructures,
  onAddJoin,
  onRemoveJoin,
  onUpdateJoinType,
  onAutoSuggestJoins,
}) => {
  // Manual join creation form state
  const [sourceTableAlias, setSourceTableAlias] = useState('');
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetTableAlias, setTargetTableAlias] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [joinType, setJoinType] = useState<QueryJoinType>('INNER');

  const sourceTable = tables.find((t) => t.alias === sourceTableAlias);
  const targetTable = tables.find((t) => t.alias === targetTableAlias);

  const sourceColumns = sourceTable ? tableStructures[sourceTable.tableName]?.columns || [] : [];
  const targetColumns = targetTable ? tableStructures[targetTable.tableName]?.columns || [] : [];

  const handleCreateJoin = () => {
    if (!sourceTableAlias || !sourceColumn || !targetTableAlias || !targetColumn) return;
    if (sourceTableAlias === targetTableAlias) return;

    onAddJoin({
      sourceTableAlias,
      sourceColumn,
      targetTableAlias,
      targetColumn,
      joinType,
    });

    setSourceColumn('');
    setTargetColumn('');
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
            Table Relationships & Joins ({joins.length})
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Configure INNER, LEFT, RIGHT, or CROSS joins between matching table columns.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Sparkles size={14} />}
          onClick={onAutoSuggestJoins}
          disabled={tables.length < 2}
        >
          Auto-Suggest Foreign Key Joins
        </Button>
      </div>

      {/* Manual Join Form */}
      {tables.length >= 2 && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-card, 8px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Add Join Condition:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr 1fr 1.2fr 1.2fr auto',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {/* Source Table */}
            <Select
              value={sourceTableAlias}
              onChange={(e) => {
                setSourceTableAlias(e.target.value);
                setSourceColumn('');
              }}
              options={[
                { value: '', label: 'Source Table...' },
                ...tables.map((t) => ({ value: t.alias, label: `${t.alias} (${t.tableName})` })),
              ]}
            />

            {/* Source Column */}
            <Select
              value={sourceColumn}
              onChange={(e) => setSourceColumn(e.target.value)}
              disabled={!sourceTableAlias}
              options={[
                { value: '', label: 'Source Column...' },
                ...sourceColumns.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />

            {/* Join Type */}
            <Select
              value={joinType}
              onChange={(e) => setJoinType(e.target.value as QueryJoinType)}
              options={[
                { value: 'INNER', label: 'INNER JOIN' },
                { value: 'LEFT', label: 'LEFT JOIN' },
                { value: 'RIGHT', label: 'RIGHT JOIN' },
                { value: 'CROSS', label: 'CROSS JOIN' },
              ]}
            />

            {/* Target Table */}
            <Select
              value={targetTableAlias}
              onChange={(e) => {
                setTargetTableAlias(e.target.value);
                setTargetColumn('');
              }}
              options={[
                { value: '', label: 'Target Table...' },
                ...tables
                  .filter((t) => t.alias !== sourceTableAlias)
                  .map((t) => ({ value: t.alias, label: `${t.alias} (${t.tableName})` })),
              ]}
            />

            {/* Target Column */}
            <Select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              disabled={!targetTableAlias}
              options={[
                { value: '', label: 'Target Column...' },
                ...targetColumns.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />

            {/* Add Button */}
            <Button
              variant="primary"
              leftIcon={<Plus size={14} />}
              disabled={!sourceTableAlias || !sourceColumn || !targetTableAlias || !targetColumn}
              onClick={handleCreateJoin}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Joins Table */}
      {joins.length === 0 ? (
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
          <Link2 size={28} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
          <div>No relationships or joins configured.</div>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            {tables.length < 2
              ? 'Add at least 2 tables to canvas to configure joins.'
              : 'Use the connector pins on the Canvas or the form above to connect tables.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--border-default)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: '8px 10px' }}>Source Column</th>
                <th style={{ padding: '8px 10px', width: '160px' }}>Join Type</th>
                <th style={{ padding: '8px 10px' }}>Target Column</th>
                <th style={{ padding: '8px 10px', width: '80px', textAlign: 'center' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {joins.map((join) => (
                <tr
                  key={join.id}
                  style={{ borderBottom: '1px solid var(--border-subtle, var(--border-default))' }}
                >
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant="neutral">
                        {join.sourceTableAlias}
                      </Badge>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {join.sourceColumn}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <select
                      value={join.joinType}
                      onChange={(e) => onUpdateJoinType(join.id, e.target.value as QueryJoinType)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <option value="INNER">INNER JOIN</option>
                      <option value="LEFT">LEFT JOIN</option>
                      <option value="RIGHT">RIGHT JOIN</option>
                      <option value="CROSS">CROSS JOIN</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant="neutral">
                        {join.targetTableAlias}
                      </Badge>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {join.targetColumn}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onRemoveJoin(join.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      title="Remove join"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
