import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  QueryTableNode,
  QueryJoin,
  QueryJoinType,
  QueryJoinOperator,
} from '../../../../types/index.ts';
import { TableStructure } from '../../../../types/database.ts';
import { Link2, Trash2, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';

interface JoinPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  join: QueryJoin | null;
  tables?: QueryTableNode[];
  tableStructures?: Record<string, TableStructure>;
  onUpdateJoin: (joinId: string, updates: Partial<QueryJoin>) => void;
  onDeleteJoin: (joinId: string) => void;
}

const COMPARISON_OPERATORS: { value: QueryJoinOperator; label: string }[] = [
  { value: '=', label: '= (Equal to)' },
  { value: '<>', label: '<> (Not Equal to)' },
  { value: '<', label: '< (Less Than)' },
  { value: '>', label: '> (Greater Than)' },
  { value: '<=', label: '<= (Less Than or Equal)' },
  { value: '>=', label: '>= (Greater Than or Equal)' },
];

export const JoinPropertiesModal: React.FC<JoinPropertiesModalProps> = ({
  isOpen,
  onClose,
  join,
  tables = [],
  tableStructures = {},
  onUpdateJoin,
  onDeleteJoin,
}) => {
  const [sourceTableAlias, setSourceTableAlias] = useState('');
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetTableAlias, setTargetTableAlias] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [operator, setOperator] = useState<QueryJoinOperator>('=');
  const [selectedType, setSelectedType] = useState<QueryJoinType>('INNER');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (join) {
      setSourceTableAlias(join.sourceTableAlias || (join as any).leftTableAlias || '');
      setSourceColumn(join.sourceColumn || (join as any).leftColumn || '');
      setTargetTableAlias(join.targetTableAlias || (join as any).rightTableAlias || '');
      setTargetColumn(join.targetColumn || (join as any).rightColumn || '');
      setOperator(join.operator || '=');
      setSelectedType(join.joinType || 'INNER');
      setValidationError(null);
    }
  }, [join]);

  if (!join) return null;

  // Resolve source columns from table structures
  const sourceTableNode = tables.find((t) => t.alias === sourceTableAlias);
  const sourceStructure = sourceTableNode ? tableStructures[sourceTableNode.tableName] : null;
  const sourceCols = sourceStructure?.columns || [];

  // Resolve target columns from table structures
  const targetTableNode = tables.find((t) => t.alias === targetTableAlias);
  const targetStructure = targetTableNode ? tableStructures[targetTableNode.tableName] : null;
  const targetCols = targetStructure?.columns || [];

  const handleSourceTableChange = (newAlias: string) => {
    setSourceTableAlias(newAlias);
    const node = tables.find((t) => t.alias === newAlias);
    const struct = node ? tableStructures[node.tableName] : null;
    const firstCol = struct?.columns?.[0]?.name || '';
    setSourceColumn(firstCol);
    setValidationError(null);
  };

  const handleTargetTableChange = (newAlias: string) => {
    setTargetTableAlias(newAlias);
    const node = tables.find((t) => t.alias === newAlias);
    const struct = node ? tableStructures[node.tableName] : null;
    const firstCol = struct?.columns?.[0]?.name || '';
    setTargetColumn(firstCol);
    setValidationError(null);
  };

  const handleSave = () => {
    if (!sourceTableAlias || !sourceColumn) {
      setValidationError('Please select a valid source table and column.');
      return;
    }
    if (!targetTableAlias || !targetColumn) {
      setValidationError('Please select a valid target table and column.');
      return;
    }
    if (sourceTableAlias === targetTableAlias && sourceColumn === targetColumn) {
      setValidationError('A column cannot be joined with itself in the same table.');
      return;
    }

    onUpdateJoin(join.id, {
      sourceTableAlias,
      sourceColumn,
      targetTableAlias,
      targetColumn,
      operator,
      joinType: selectedType,
      leftTableAlias: sourceTableAlias,
      leftColumn: sourceColumn,
      rightTableAlias: targetTableAlias,
      rightColumn: targetColumn,
    });
    onClose();
  };

  const handleDelete = () => {
    onDeleteJoin(join.id);
    onClose();
  };

  const displaySource = sourceTableNode?.tableName || sourceTableAlias;
  const displayTarget = targetTableNode?.tableName || targetTableAlias;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Properties (Relationship Configuration)"
      description="Configure joined tables, columns, comparison operator, and join type."
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="danger" size="sm" onClick={handleDelete} leftIcon={<Trash2 size={13} />}>
            Delete Join
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Apply & Save Join
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Validation Warning */}
        {validationError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--status-danger, #ef4444)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={15} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Live Join Preview Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-input, 6px)',
            border: '1px solid var(--border-default)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <div style={{ color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
            [{sourceTableAlias || 'Table A'}].[{sourceColumn || 'column'}]
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            {operator}
          </span>
          <div style={{ color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
            [{targetTableAlias || 'Table B'}].[{targetColumn || 'column'}]
          </div>
          <span
            style={{
              marginLeft: '8px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--primary-subtle, rgba(0, 102, 204, 0.1))',
              border: '1px solid var(--brand-primary)',
              color: 'var(--brand-primary)',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {selectedType} JOIN
          </span>
        </div>

        {/* Table, Column & Operator Selectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 90px 1fr',
            gap: '12px',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Source Table & Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Source Table & Column
            </label>
            <select
              value={sourceTableAlias}
              onChange={(e) => handleSourceTableChange(e.target.value)}
              style={{
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            >
              {tables.map((t) => (
                <option key={t.alias} value={t.alias}>
                  {t.tableName} ({t.alias})
                </option>
              ))}
            </select>
            <select
              value={sourceColumn}
              onChange={(e) => {
                setSourceColumn(e.target.value);
                setValidationError(null);
              }}
              style={{
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
              }}
            >
              {sourceCols.length > 0 ? (
                sourceCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.dataType}) {c.isPrimaryKey ? '★ PK' : ''}
                  </option>
                ))
              ) : (
                <option value={sourceColumn}>{sourceColumn}</option>
              )}
            </select>
          </div>

          {/* Comparison Operator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Operator
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as QueryJoinOperator)}
              style={{
                width: '100%',
                padding: '6px 4px',
                fontSize: '13px',
                fontWeight: 700,
                textAlign: 'center',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            >
              {COMPARISON_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Table & Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Target Table & Column
            </label>
            <select
              value={targetTableAlias}
              onChange={(e) => handleTargetTableChange(e.target.value)}
              style={{
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            >
              {tables.map((t) => (
                <option key={t.alias} value={t.alias}>
                  {t.tableName} ({t.alias})
                </option>
              ))}
            </select>
            <select
              value={targetColumn}
              onChange={(e) => {
                setTargetColumn(e.target.value);
                setValidationError(null);
              }}
              style={{
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
              }}
            >
              {targetCols.length > 0 ? (
                targetCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.dataType}) {c.isPrimaryKey ? '★ PK' : ''}
                  </option>
                ))
              ) : (
                <option value={targetColumn}>{targetColumn}</option>
              )}
            </select>
          </div>
        </div>

        {/* 4 Access-Style Join Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
            Join Type
          </div>

          {/* Option 1: INNER JOIN */}
          <div
            onClick={() => setSelectedType('INNER')}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-card, 6px)',
              border:
                selectedType === 'INNER'
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-default)',
              backgroundColor:
                selectedType === 'INNER'
                  ? 'var(--primary-subtle, rgba(0, 102, 204, 0.08))'
                  : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              checked={selectedType === 'INNER'}
              onChange={() => setSelectedType('INNER')}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                1: Only include rows where the joined fields from both tables are equal. (INNER JOIN)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Standard relationship. Returns rows only when matching values exist in both{' '}
                <code style={{ color: 'var(--brand-primary)' }}>{displaySource}</code> and{' '}
                <code style={{ color: 'var(--brand-primary)' }}>{displayTarget}</code>.
              </div>
            </div>
          </div>

          {/* Option 2: LEFT JOIN */}
          <div
            onClick={() => setSelectedType('LEFT')}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-card, 6px)',
              border:
                selectedType === 'LEFT'
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-default)',
              backgroundColor:
                selectedType === 'LEFT'
                  ? 'var(--primary-subtle, rgba(0, 102, 204, 0.08))'
                  : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              checked={selectedType === 'LEFT'}
              onChange={() => setSelectedType('LEFT')}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                2: Include ALL records from '{displaySource}' and only those records from '{displayTarget}' where joined fields match. (LEFT OUTER JOIN)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Returns every record from <code style={{ color: 'var(--brand-primary)' }}>{displaySource}</code>, even if there are no matching records in <code style={{ color: 'var(--brand-primary)' }}>{displayTarget}</code>.
              </div>
            </div>
          </div>

          {/* Option 3: RIGHT JOIN */}
          <div
            onClick={() => setSelectedType('RIGHT')}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-card, 6px)',
              border:
                selectedType === 'RIGHT'
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-default)',
              backgroundColor:
                selectedType === 'RIGHT'
                  ? 'var(--primary-subtle, rgba(0, 102, 204, 0.08))'
                  : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              checked={selectedType === 'RIGHT'}
              onChange={() => setSelectedType('RIGHT')}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                3: Include ALL records from '{displayTarget}' and only those records from '{displaySource}' where joined fields match. (RIGHT OUTER JOIN)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Returns every record from <code style={{ color: 'var(--brand-primary)' }}>{displayTarget}</code>, even if there are no matching records in <code style={{ color: 'var(--brand-primary)' }}>{displaySource}</code>.
              </div>
            </div>
          </div>

          {/* Option 4: FULL OUTER JOIN */}
          <div
            onClick={() => setSelectedType('FULL')}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-card, 6px)',
              border:
                selectedType === 'FULL'
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-default)',
              backgroundColor:
                selectedType === 'FULL'
                  ? 'var(--primary-subtle, rgba(0, 102, 204, 0.08))'
                  : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              checked={selectedType === 'FULL'}
              onChange={() => setSelectedType('FULL')}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                4: Include ALL records from BOTH '{displaySource}' and '{displayTarget}'. (FULL OUTER JOIN)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Returns all rows from both tables. <em>(Note: MySQL engine does not natively support single-statement FULL JOIN; use LEFT or RIGHT joins if running against standard MySQL)</em>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
