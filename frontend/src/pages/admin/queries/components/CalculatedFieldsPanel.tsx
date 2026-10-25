import React, { useState } from 'react';
import {
  QueryCalculatedColumn,
  QueryTableNode,
} from '../../../../types/index.ts';
import { TableStructure } from '../../../../types/database.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { FormulaEditorModal } from './FormulaEditorModal.tsx';
import {
  Plus,
  Trash2,
  Edit2,
  Code2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface CalculatedFieldsPanelProps {
  calculatedColumns: QueryCalculatedColumn[];
  tables: QueryTableNode[];
  tableStructures: Record<string, TableStructure>;
  onAddCalculatedColumn: (col: QueryCalculatedColumn) => void;
  onUpdateCalculatedColumn: (col: QueryCalculatedColumn) => void;
  onRemoveCalculatedColumn: (id: string) => void;
}

export const CalculatedFieldsPanel: React.FC<CalculatedFieldsPanelProps> = ({
  calculatedColumns,
  tables,
  tableStructures,
  onAddCalculatedColumn,
  onUpdateCalculatedColumn,
  onRemoveCalculatedColumn,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<QueryCalculatedColumn | null>(null);

  const handleOpenAdd = () => {
    setEditingCol(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: QueryCalculatedColumn) => {
    setEditingCol(col);
    setIsModalOpen(true);
  };

  const handleSaveModal = (col: QueryCalculatedColumn) => {
    if (editingCol) {
      onUpdateCalculatedColumn(col);
    } else {
      onAddCalculatedColumn(col);
    }
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
            Calculated Columns & Formulas ({calculatedColumns.length})
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Define custom expressions, string concatenations, math logic, or conditional CASE statements.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={14} />} onClick={handleOpenAdd}>
          Add Calculated Field
        </Button>
      </div>

      {calculatedColumns.length === 0 ? (
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
          <Code2 size={28} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
          <div>No calculated columns created yet.</div>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            Click <strong>Add Calculated Field</strong> to build expressions like <code>CONCAT(first_name, ' ', last_name)</code> or <code>price * quantity</code>.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
          {calculatedColumns.map((col) => {
            const isVisible = col.isVisible !== false;

            return (
              <div
                key={col.id}
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-card, 8px)',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.02))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--primary-color)' }} />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {col.alias}
                    </span>
                    <Badge variant="neutral">
                      {col.outputType || 'VARCHAR'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCalculatedColumn({ ...col, isVisible: !isVisible })
                      }
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: isVisible ? 'var(--primary-color)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title={isVisible ? 'Visible in output' : 'Hidden from output'}
                    >
                      {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(col)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Edit formula"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCalculatedColumn(col.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Delete calculated column"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    wordBreak: 'break-all',
                    lineHeight: 1.4,
                  }}
                >
                  {col.formula}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <FormulaEditorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
          editingColumn={editingCol}
          tables={tables}
          tableStructures={tableStructures}
        />
      )}
    </div>
  );
};
