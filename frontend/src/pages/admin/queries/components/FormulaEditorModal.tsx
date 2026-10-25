import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import { QueryCalculatedColumn, QueryTableNode, AccessGridColumn } from '../../../../types/index.ts';
import { TableStructure } from '../../../../types/database.ts';
import { Code2, Plus, Sparkles, HelpCircle } from 'lucide-react';

interface FormulaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (calcCol: QueryCalculatedColumn) => void;
  editingColumn?: QueryCalculatedColumn | null;
  editingGridColumn?: AccessGridColumn | null;
  tables: QueryTableNode[];
  tableStructures: Record<string, TableStructure>;
}

const AVAILABLE_FUNCTIONS = [
  { name: 'CONCAT', snippet: 'CONCAT(str1, str2, ...)', doc: 'Concatenates strings together' },
  { name: 'UPPER', snippet: 'UPPER(str)', doc: 'Converts text to uppercase' },
  { name: 'LOWER', snippet: 'LOWER(str)', doc: 'Converts text to lowercase' },
  { name: 'TRIM', snippet: 'TRIM(str)', doc: 'Removes leading and trailing spaces' },
  { name: 'COALESCE', snippet: 'COALESCE(val1, val2, ...)', doc: 'Returns the first non-null value' },
  { name: 'IFNULL', snippet: 'IFNULL(val, default_val)', doc: 'Replaces null with a fallback value' },
  { name: 'CASE WHEN', snippet: 'CASE WHEN condition THEN val1 ELSE val2 END', doc: 'Conditional expression' },
  { name: 'ROUND', snippet: 'ROUND(number, 2)', doc: 'Rounds number to specified decimals' },
  { name: 'ABS', snippet: 'ABS(number)', doc: 'Absolute value' },
  { name: 'NOW', snippet: 'NOW()', doc: 'Current timestamp' },
  { name: 'DATEDIFF', snippet: 'DATEDIFF(date1, date2)', doc: 'Days between two dates' },
  { name: 'SUM', snippet: 'SUM(col)', doc: 'Sum aggregate' },
  { name: 'AVG', snippet: 'AVG(col)', doc: 'Average aggregate' },
  { name: 'COUNT', snippet: 'COUNT(col)', doc: 'Count aggregate' },
];

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingColumn,
  editingGridColumn,
  tables,
  tableStructures,
}) => {
  const [alias, setAlias] = useState('');
  const [formula, setFormula] = useState('');
  const [outputType, setOutputType] = useState<'VARCHAR' | 'INT' | 'DECIMAL' | 'BOOLEAN' | 'DATETIME'>('VARCHAR');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingGridColumn) {
        setAlias(editingGridColumn.alias || editingGridColumn.columnName || '');
        setFormula(editingGridColumn.calculatedFormula || '');
        setOutputType(editingGridColumn.outputType || 'VARCHAR');
      } else if (editingColumn) {
        setAlias(editingColumn.alias);
        setFormula(editingColumn.formula);
        setOutputType(editingColumn.outputType || 'VARCHAR');
      } else {
        setAlias('');
        setFormula('');
        setOutputType('VARCHAR');
      }
      setError(null);
    }
  }, [isOpen, editingColumn, editingGridColumn]);

  const insertSnippet = (snippet: string) => {
    setFormula((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const handleSave = () => {
    if (!alias.trim()) {
      setError('Column Alias is required.');
      return;
    }
    const cleanAlias = alias.trim().replace(/[^a-zA-Z0-9_]/g, '_');

    if (!formula.trim()) {
      setError('Formula expression is required.');
      return;
    }

    onSave({
      id: editingColumn?.id || `calc_${Date.now()}`,
      alias: cleanAlias,
      formula: formula.trim(),
      outputType,
      isVisible: editingColumn?.isVisible !== undefined ? editingColumn.isVisible : true,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingColumn ? 'Edit Calculated Column' : 'Add Calculated Column'}
      description="Define custom expressions, string formatting, arithmetic, or conditional CASE statements."
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Column
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--status-danger, #ef4444)',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Column Alias (Output Name)"
            required
            placeholder="e.g. user_display_title or profit_margin"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: 'var(--font-size-sm, 14px)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'var(--text-primary)',
              }}
            >
              Output Data Type
            </label>
            <div style={{ width: '100%' }}>
              <Select
                value={outputType}
                onChange={(e) => setOutputType(e.target.value as any)}
                options={[
                  { value: 'VARCHAR', label: 'VARCHAR (Text)' },
                  { value: 'INT', label: 'INT (Whole Number)' },
                  { value: 'DECIMAL', label: 'DECIMAL (Precision Number)' },
                  { value: 'BOOLEAN', label: 'BOOLEAN (True / False)' },
                  { value: 'DATETIME', label: 'DATETIME (Date & Time)' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Formula Input Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm, 14px)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              Formula Expression <span style={{ color: 'var(--status-danger)' }}>*</span>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Example: CONCAT(u.first_name, ' ', u.last_name)
            </span>
          </label>
          <textarea
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            rows={4}
            placeholder="Enter formula expression e.g. CONCAT(users.first_name, ' ', users.last_name) or (price * quantity) * 1.15"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              fontFamily: 'Consolas, Monaco, monospace',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-app, #0f172a)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md, 6px)',
              resize: 'vertical',
              lineHeight: 1.5,
              outline: 'none',
            }}
          />
        </div>

        {/* Quick Insert Palettes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Columns Palette */}
          <div
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md, 6px)',
              padding: '10px',
              backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.02))',
              maxHeight: '190px',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Available Columns (click to insert):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tables.map((t) => {
                const cols = tableStructures[t.tableName]?.columns || [];
                return (
                  <div key={t.id} style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary-color)' }}>
                      {t.alias} ({t.tableName})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {cols.map((col) => (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => insertSnippet(`${t.alias}.${col.name}`)}
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {tables.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Add tables to canvas to view columns.
                </div>
              )}
            </div>
          </div>

          {/* Functions Palette */}
          <div
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md, 6px)',
              padding: '10px',
              backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.02))',
              maxHeight: '190px',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Common Functions & Operators:
            </div>
            {/* Quick Math Operators */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['+', '-', '*', '/', '(', ')', '=', '!=', 'AND', 'OR'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => insertSnippet(op)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {op}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {AVAILABLE_FUNCTIONS.map((fn) => (
                <button
                  key={fn.name}
                  type="button"
                  onClick={() => insertSnippet(fn.snippet)}
                  title={fn.doc}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{fn.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{fn.doc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
