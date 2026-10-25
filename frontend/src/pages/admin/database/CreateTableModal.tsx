import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Select } from '../../../components/ui/Select.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { api } from '../../../api/client.ts';
import { ColumnDefinitionInput, CreateTableInput } from '../../../types/database.ts';
import { Plus, Trash2, Code, Key, Sparkles } from 'lucide-react';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tableName: string) => void;
}

const DATA_TYPES = [
  { value: 'VARCHAR', label: 'VARCHAR (Text up to 255/N chars)' },
  { value: 'TEXT', label: 'TEXT (Long narrative string)' },
  { value: 'INT', label: 'INT (Standard Integer)' },
  { value: 'BIGINT', label: 'BIGINT (Large Integer)' },
  { value: 'DECIMAL', label: 'DECIMAL (Financial/Currency)' },
  { value: 'BOOLEAN', label: 'BOOLEAN (True / False flag)' },
  { value: 'DATE', label: 'DATE (YYYY-MM-DD)' },
  { value: 'DATETIME', label: 'DATETIME (Date + Time)' },
  { value: 'TIMESTAMP', label: 'TIMESTAMP (Auto-updating time)' },
  { value: 'JSON', label: 'JSON (Structured document)' },
];

export const CreateTableModal: React.FC<CreateTableModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();

  const [tableName, setTableName] = useState('');
  const [comment, setComment] = useState('');
  const [columns, setColumns] = useState<ColumnDefinitionInput[]>([
    {
      name: 'id',
      dataType: 'VARCHAR',
      length: '36',
      isPrimaryKey: true,
      isAutoIncrement: false,
      isNullable: false,
      defaultValue: '',
      isUnique: true,
      comment: 'Primary Unique Identifier',
    },
    {
      name: 'created_at',
      dataType: 'TIMESTAMP',
      length: null,
      isPrimaryKey: false,
      isAutoIncrement: false,
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      isUnique: false,
      comment: 'Record creation timestamp',
    },
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSql, setPreviewSql] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTableName('');
      setComment('');
      setColumns([
        {
          name: 'id',
          dataType: 'VARCHAR',
          length: '36',
          isPrimaryKey: true,
          isAutoIncrement: false,
          isNullable: false,
          defaultValue: '',
          isUnique: true,
          comment: 'Primary Unique Identifier',
        },
        {
          name: 'created_at',
          dataType: 'TIMESTAMP',
          length: null,
          isPrimaryKey: false,
          isAutoIncrement: false,
          isNullable: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          isUnique: false,
          comment: 'Record creation timestamp',
        },
      ]);
      setPreviewSql('');
      setIsPreviewOpen(false);
      setFormErrors({});
    }
  }, [isOpen]);

  const handleAddColumn = () => {
    setColumns((prev) => [
      ...prev,
      {
        name: `column_${prev.length + 1}`,
        dataType: 'VARCHAR',
        length: '255',
        isPrimaryKey: false,
        isAutoIncrement: false,
        isNullable: true,
        defaultValue: '',
        isUnique: false,
        comment: '',
      },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) {
      showToast('A table must have at least one column', 'warning');
      return;
    }
    setColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index: number, field: keyof ColumnDefinitionInput, value: any) => {
    setColumns((prev) => {
      const updated = [...prev];
      const col = { ...updated[index], [field]: value };

      // Mutual exclusivity & auto configurations
      if (field === 'isPrimaryKey' && value === true) {
        col.isNullable = false;
        col.isUnique = true;
      }
      if (field === 'isAutoIncrement' && value === true) {
        col.isNullable = false;
        col.isPrimaryKey = true;
        col.dataType = 'INT';
      }
      if (field === 'dataType') {
        if (value === 'VARCHAR') col.length = '255';
        else if (value === 'DECIMAL') col.length = '10,2';
        else if (value === 'INT' || value === 'BIGINT' || value === 'TEXT' || value === 'JSON') col.length = null;
      }

      updated[index] = col;
      return updated;
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const validIdentifier = /^[a-zA-Z0-9_]{1,64}$/;

    if (!tableName.trim()) {
      errors.tableName = 'Table name is required';
    } else if (!validIdentifier.test(tableName.trim())) {
      errors.tableName = 'Table name must only contain alphanumeric characters and underscores';
    }

    const seenNames = new Set<string>();
    columns.forEach((col, idx) => {
      const colName = col.name.trim();
      if (!colName) {
        errors[`col_${idx}`] = 'Column name is required';
      } else if (!validIdentifier.test(colName)) {
        errors[`col_${idx}`] = 'Invalid column name format';
      } else if (seenNames.has(colName.toLowerCase())) {
        errors[`col_${idx}`] = `Duplicate column name '${colName}'`;
      }
      seenNames.add(colName.toLowerCase());
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchSqlPreview = async () => {
    if (!validate()) return;
    try {
      const payload: CreateTableInput = {
        tableName: tableName.trim(),
        comment: comment.trim() || null,
        columns,
      };
      const res = await api.post<{ sql: string }>('/database/preview-sql', {
        mode: 'create',
        payload,
      });
      if (res.data?.sql) {
        setPreviewSql(res.data.sql);
        setIsPreviewOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate SQL preview', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateTableInput = {
        tableName: tableName.trim(),
        comment: comment.trim() || null,
        columns,
      };

      await api.post('/database/tables', payload);
      showToast(`Table '${tableName}' created successfully!`, 'success');
      onSuccess(tableName.trim());
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create table', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Database Table"
      description="Define table schema, column types, primary keys, and constraints visually"
      maxWidth="1100px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Table Name and Comment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Table Name *"
            placeholder="e.g., customer_invoices, inventory_items"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            error={formErrors.tableName}
          />
          <Input
            label="Table Description / Comment"
            placeholder="e.g., Tracks customer order billings and statuses"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Columns Builder Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Columns & Data Types ({columns.length})
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Configure column names, types, nullability, defaults, and primary key status.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Code size={14} />}
              onClick={fetchSqlPreview}
            >
              Preview SQL
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleAddColumn}
            >
              Add Column
            </Button>
          </div>
        </div>

        {/* Column List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '380px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {columns.map((col, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 180px 90px 80px 80px 140px 1fr 40px',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: col.isPrimaryKey ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                border: `1px solid ${col.isPrimaryKey ? 'var(--brand-primary)' : 'var(--border-default)'}`,
              }}
            >
              {/* Column Name */}
              <div>
                <input
                  type="text"
                  placeholder="Column name"
                  value={col.name}
                  onChange={(e) => handleColumnChange(idx, 'name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: `1px solid ${formErrors[`col_${idx}`] ? 'var(--status-danger)' : 'var(--border-default)'}`,
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Data Type */}
              <div>
                <Select
                  value={col.dataType}
                  onChange={(e) => handleColumnChange(idx, 'dataType', e.target.value)}
                  options={DATA_TYPES}
                />
              </div>

              {/* Length */}
              <div>
                <input
                  type="text"
                  placeholder="Length"
                  value={col.length !== null && col.length !== undefined ? String(col.length) : ''}
                  onChange={(e) => handleColumnChange(idx, 'length', e.target.value || null)}
                  disabled={!['VARCHAR', 'CHAR', 'DECIMAL'].includes(col.dataType)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: ['VARCHAR', 'CHAR', 'DECIMAL'].includes(col.dataType)
                      ? 'var(--bg-surface)'
                      : 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                />
              </div>

              {/* Primary Key Check */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: col.isPrimaryKey ? '600' : '400',
                  color: col.isPrimaryKey ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={col.isPrimaryKey}
                  onChange={(e) => handleColumnChange(idx, 'isPrimaryKey', e.target.checked)}
                />
                <Key size={13} /> PK
              </label>

              {/* Nullable Check */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: col.isPrimaryKey ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={col.isNullable}
                  disabled={col.isPrimaryKey}
                  onChange={(e) => handleColumnChange(idx, 'isNullable', e.target.checked)}
                />
                Null
              </label>

              {/* Default Value */}
              <div>
                <input
                  type="text"
                  placeholder="Default value"
                  value={col.defaultValue || ''}
                  onChange={(e) => handleColumnChange(idx, 'defaultValue', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
              </div>

              {/* Column Comment */}
              <div>
                <input
                  type="text"
                  placeholder="Comment / Notes"
                  value={col.comment || ''}
                  onChange={(e) => handleColumnChange(idx, 'comment', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemoveColumn(idx)}
                title="Remove column"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--status-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} /> Executable DDL Query Preview
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '12px',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '12px',
                lineHeight: '1.5',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {previewSql}
            </pre>
          </div>
        )}

        {/* Actions Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Execute & Create Table
          </Button>
        </div>
      </form>
    </Modal>
  );
};
