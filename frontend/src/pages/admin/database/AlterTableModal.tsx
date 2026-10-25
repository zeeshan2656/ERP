import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Select } from '../../../components/ui/Select.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { api } from '../../../api/client.ts';
import { TableStructure, TableColumn, AlterTableInput } from '../../../types/database.ts';
import { AlertTriangle, Code, Sparkles } from 'lucide-react';

interface AlterTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: TableStructure | null;
  onSuccess: () => void;
  initialAction?: 'addColumn' | 'modifyColumn' | 'dropColumn' | 'addIndex' | 'dropIndex';
  targetColumn?: TableColumn | null;
}

const DATA_TYPES = [
  { value: 'VARCHAR', label: 'VARCHAR' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'INT', label: 'INT' },
  { value: 'BIGINT', label: 'BIGINT' },
  { value: 'DECIMAL', label: 'DECIMAL' },
  { value: 'BOOLEAN', label: 'BOOLEAN' },
  { value: 'DATE', label: 'DATE' },
  { value: 'DATETIME', label: 'DATETIME' },
  { value: 'TIMESTAMP', label: 'TIMESTAMP' },
  { value: 'JSON', label: 'JSON' },
];

export const AlterTableModal: React.FC<AlterTableModalProps> = ({
  isOpen,
  onClose,
  structure,
  onSuccess,
  initialAction = 'addColumn',
  targetColumn = null,
}) => {
  const { showToast } = useToast();

  const [action, setAction] = useState<
    'addColumn' | 'modifyColumn' | 'dropColumn' | 'addIndex' | 'dropIndex'
  >(initialAction);

  // Column Form States
  const [columnName, setColumnName] = useState('');
  const [oldColumnName, setOldColumnName] = useState('');
  const [dataType, setDataType] = useState('VARCHAR');
  const [length, setLength] = useState('255');
  const [isNullable, setIsNullable] = useState(true);
  const [defaultValue, setDefaultValue] = useState('');
  const [comment, setComment] = useState('');

  // Index Form States
  const [indexName, setIndexName] = useState('');
  const [indexColumns, setIndexColumns] = useState<string[]>([]);
  const [isUniqueIndex, setIsUniqueIndex] = useState(false);

  // SQL Preview & State
  const [previewSql, setPreviewSql] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDropText, setConfirmDropText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAction(initialAction);
      setIsPreviewOpen(false);
      setPreviewSql('');
      setConfirmDropText('');

      if (targetColumn && initialAction === 'modifyColumn') {
        setColumnName(targetColumn.name);
        setOldColumnName(targetColumn.name);
        setDataType(targetColumn.dataType);
        setLength(targetColumn.columnType.includes('(') ? targetColumn.columnType.split('(')[1].replace(')', '') : '');
        setIsNullable(targetColumn.isNullable);
        setDefaultValue(targetColumn.defaultValue || '');
        setComment(targetColumn.comment || '');
      } else if (targetColumn && initialAction === 'dropColumn') {
        setColumnName(targetColumn.name);
      } else {
        setColumnName('');
        setOldColumnName('');
        setDataType('VARCHAR');
        setLength('255');
        setIsNullable(true);
        setDefaultValue('');
        setComment('');
      }

      setIndexName('');
      setIndexColumns([]);
      setIsUniqueIndex(false);
    }
  }, [isOpen, initialAction, targetColumn]);

  if (!structure) return null;

  const buildPayload = (): AlterTableInput => {
    if (action === 'addColumn') {
      return {
        action: 'addColumn',
        column: {
          name: columnName.trim(),
          dataType,
          length: length.trim() || null,
          isNullable,
          defaultValue: defaultValue.trim() || null,
          comment: comment.trim() || null,
        },
      };
    }

    if (action === 'modifyColumn') {
      return {
        action: 'modifyColumn',
        oldColumnName: oldColumnName.trim(),
        column: {
          name: columnName.trim(),
          dataType,
          length: length.trim() || null,
          isNullable,
          defaultValue: defaultValue.trim() || null,
          comment: comment.trim() || null,
        },
      };
    }

    if (action === 'dropColumn') {
      return {
        action: 'dropColumn',
        columnName: columnName.trim(),
      };
    }

    if (action === 'addIndex') {
      return {
        action: 'addIndex',
        index: {
          name: indexName.trim(),
          columns: indexColumns,
          isUnique: isUniqueIndex,
        },
      };
    }

    if (action === 'dropIndex') {
      return {
        action: 'dropIndex',
        indexName: indexName.trim(),
      };
    }

    throw new Error('Unsupported alter action');
  };

  const handlePreview = async () => {
    try {
      const payload = buildPayload();
      const res = await api.post<{ sql: string }>('/database/preview-sql', {
        mode: 'alter',
        tableName: structure.tableName,
        payload,
      });
      if (res.data?.sql) {
        setPreviewSql(res.data.sql);
        setIsPreviewOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate preview', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (action === 'dropColumn' && confirmDropText.trim() !== columnName.trim()) {
      showToast(`Please type '${columnName}' to confirm dropping the column`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await api.put(`/database/tables/${structure.tableName}`, payload);
      showToast(`Table '${structure.tableName}' altered successfully!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to alter table', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Alter Table Structure: ${structure.tableName}`}
      description="Safely add, modify, or remove columns and indexes with live SQL previews"
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Action Selector */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Operation Type
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['addColumn', 'modifyColumn', 'dropColumn', 'addIndex', 'dropIndex'] as const).map((act) => {
              const isSelected = action === act;
              const labels = {
                addColumn: 'Add Column',
                modifyColumn: 'Modify Column',
                dropColumn: 'Drop Column',
                addIndex: 'Add Index',
                dropIndex: 'Drop Index',
              };
              return (
                <button
                  key={act}
                  type="button"
                  onClick={() => {
                    setAction(act);
                    setIsPreviewOpen(false);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: isSelected ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {labels[act]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. Add / Modify Column Section */}
        {(action === 'addColumn' || action === 'modifyColumn') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {action === 'modifyColumn' && (
              <Select
                label="Target Column to Modify *"
                value={oldColumnName}
                onChange={(e) => {
                  setOldColumnName(e.target.value);
                  const found = structure.columns.find((c) => c.name === e.target.value);
                  if (found) {
                    setColumnName(found.name);
                    setDataType(found.dataType);
                    setIsNullable(found.isNullable);
                    setDefaultValue(found.defaultValue || '');
                    setComment(found.comment || '');
                  }
                }}
                options={structure.columns.map((c) => ({ value: c.name, label: `${c.name} (${c.columnType})` }))}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Input
                label="Column Name *"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="e.g. status_code, billing_address"
              />
              <Select
                label="Data Type *"
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                options={DATA_TYPES}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'center' }}>
              <Input
                label="Length / Precision"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 255 or 10,2"
              />
              <Input
                label="Default Value"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="e.g. NULL, 'active', 0"
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  marginTop: '22px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isNullable}
                  onChange={(e) => setIsNullable(e.target.checked)}
                />
                Permit NULL Values
              </label>
            </div>

            <Input
              label="Column Comment / Description"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Internal documentation notes for this field"
            />
          </div>
        )}

        {/* 2. Drop Column Section */}
        {action === 'dropColumn' && (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'rgba(217, 56, 58, 0.08)',
              border: '1px solid var(--status-danger)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger)' }}>
              <AlertTriangle size={18} />
              <strong style={{ fontSize: '14px' }}>Destructive Schema Modification</strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              Dropping a column will permanently delete the column and all data stored within it across every existing row. This operation cannot be rolled back.
            </p>

            <Select
              label="Select Column to Drop *"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              options={structure.columns.map((c) => ({ value: c.name, label: `${c.name} (${c.columnType})` }))}
            />

            <Input
              label={`Type '${columnName}' to confirm permanent deletion:`}
              value={confirmDropText}
              onChange={(e) => setConfirmDropText(e.target.value)}
              placeholder={columnName}
            />
          </div>
        )}

        {/* 3. Add Index Section */}
        {action === 'addIndex' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Index Name *"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
              placeholder={`e.g. idx_${structure.tableName}_search`}
            />

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Included Columns *
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {structure.columns.map((col) => {
                  const isChecked = indexColumns.includes(col.name);
                  return (
                    <label
                      key={col.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        border: '1px solid var(--border-default)',
                        backgroundColor: isChecked ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setIndexColumns((p) => [...p, col.name]);
                          else setIndexColumns((p) => p.filter((c) => c !== col.name));
                        }}
                      />
                      {col.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isUniqueIndex}
                onChange={(e) => setIsUniqueIndex(e.target.checked)}
              />
              Enforce UNIQUE Constraint
            </label>
          </div>
        )}

        {/* 4. Drop Index Section */}
        {action === 'dropIndex' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Select Index to Drop *"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
              options={structure.indexes
                .filter((idx) => idx.name !== 'PRIMARY')
                .map((idx) => ({
                  value: idx.name,
                  label: `${idx.name} (${idx.columns.join(', ')}) ${idx.isUnique ? '[UNIQUE]' : ''}`,
                }))}
            />
          </div>
        )}

        {/* Live SQL Preview Box */}
        {isPreviewOpen && (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> Executable ALTER TABLE Preview
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '10px',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '12px',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {previewSql}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Code size={14} />}
            onClick={handlePreview}
          >
            Preview SQL
          </Button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={action === 'dropColumn' ? 'danger' : 'primary'}
              isLoading={isSubmitting}
            >
              {action === 'dropColumn' ? 'Confirm & Drop Column' : 'Execute Modification'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
