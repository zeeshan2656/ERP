import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Select } from '../../../components/ui/Select.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { api } from '../../../api/client.ts';
import { TableStructure, TableColumn, ForeignKeyOption } from '../../../types/database.ts';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: TableStructure | null;
  record?: Record<string, any> | null;
  onSuccess: () => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  structure,
  record = null,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const isEditing = Boolean(record);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [foreignOptions, setForeignOptions] = useState<Record<string, ForeignKeyOption[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && structure) {
      setFormErrors({});
      const initial: Record<string, any> = {};

      structure.columns.forEach((col) => {
        if (record && record[col.name] !== undefined) {
          if (col.dataType === 'JSON' && typeof record[col.name] === 'object' && record[col.name] !== null) {
            initial[col.name] = JSON.stringify(record[col.name], null, 2);
          } else {
            initial[col.name] = record[col.name];
          }
        } else {
          if (col.defaultValue && col.defaultValue !== 'CURRENT_TIMESTAMP') {
            initial[col.name] = col.defaultValue;
          } else if (col.dataType === 'BOOLEAN') {
            initial[col.name] = false;
          } else {
            initial[col.name] = '';
          }
        }
      });

      setFormData(initial);

      // Load Foreign Key Options if any
      structure.foreignKeys.forEach((fk) => {
        api
          .get<ForeignKeyOption[]>(
            `/database/foreign-options?table=${encodeURIComponent(fk.referencedTable)}&column=${encodeURIComponent(
              fk.referencedColumn
            )}`
          )
          .then((res) => {
            if (res.data) {
              setForeignOptions((prev) => ({ ...prev, [fk.columnName]: res.data! }));
            }
          })
          .catch(() => {});
      });
    }
  }, [isOpen, structure, record]);

  if (!structure) return null;

  const handleChange = (columnName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [columnName]: value }));
    if (formErrors[columnName]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[columnName];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    structure.columns.forEach((col) => {
      // Primary Key check
      if (col.isPrimaryKey && col.isAutoIncrement && !isEditing) {
        return; // Auto-increment handles PK
      }

      const val = formData[col.name];
      if (!col.isNullable && (val === undefined || val === null || val === '') && !col.defaultValue) {
        errors[col.name] = `${col.name} is required`;
      }

      // JSON syntax check
      if (col.dataType === 'JSON' && val && typeof val === 'string') {
        try {
          JSON.parse(val);
        } catch {
          errors[col.name] = 'Invalid JSON format';
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payloadData: Record<string, any> = {};

      structure.columns.forEach((col) => {
        let val = formData[col.name];
        if (col.dataType === 'JSON' && typeof val === 'string' && val.trim()) {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        payloadData[col.name] = val;
      });

      if (isEditing) {
        const pkCol = structure.primaryKey[0];
        const pkVal = record![pkCol];
        await api.put(`/database/tables/${structure.tableName}/data/${encodeURIComponent(pkVal)}`, {
          data: payloadData,
        });
        showToast('Record updated successfully!', 'success');
      } else {
        await api.post(`/database/tables/${structure.tableName}/data`, {
          data: payloadData,
        });
        showToast('Record inserted successfully!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (col: TableColumn) => {
    const isPk = col.isPrimaryKey;
    const isAutoInc = col.isAutoIncrement;
    const isReadOnly = (isEditing && isPk) || (!isEditing && isPk && isAutoInc);
    const value = formData[col.name] ?? '';
    const hasFk = structure.foreignKeys.find((fk) => fk.columnName === col.name);

    if (hasFk && foreignOptions[col.name]) {
      const options = [
        ...(col.isNullable ? [{ value: '', label: '(None / Null)' }] : []),
        ...foreignOptions[col.name].map((opt) => ({
          value: String(opt.value),
          label: `${opt.label} (${opt.value})`,
        })),
      ];

      return (
        <div key={col.name}>
          <Select
            label={`${col.name} ${!col.isNullable ? '*' : ''} (FK: ${hasFk.referencedTable}.${hasFk.referencedColumn})`}
            value={value}
            onChange={(e) => handleChange(col.name, e.target.value)}
            options={options}
            disabled={isReadOnly}
          />
          {col.comment && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{col.comment}</span>
          )}
        </div>
      );
    }

    if (col.dataType === 'BOOLEAN' || (col.dataType === 'TINYINT' && col.columnType.includes('(1)'))) {
      return (
        <div key={col.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            {col.name} {col.isPrimaryKey ? '(Primary Key)' : ''}
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              cursor: isReadOnly ? 'not-allowed' : 'pointer',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={isReadOnly}
              onChange={(e) => handleChange(col.name, e.target.checked)}
            />
            <span>{value ? 'True / Enabled (1)' : 'False / Disabled (0)'}</span>
          </label>
        </div>
      );
    }

    if (col.dataType === 'JSON' || col.dataType === 'TEXT' || col.dataType === 'LONGTEXT') {
      return (
        <div key={col.name} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            {col.name} {!col.isNullable ? '*' : ''} ({col.dataType})
          </label>
          <textarea
            rows={col.dataType === 'JSON' ? 4 : 3}
            value={value}
            disabled={isReadOnly}
            onChange={(e) => handleChange(col.name, e.target.value)}
            placeholder={col.dataType === 'JSON' ? '{\n  "key": "value"\n}' : col.comment || `Enter ${col.name}`}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: `1px solid ${formErrors[col.name] ? 'var(--status-danger)' : 'var(--border-default)'}`,
              backgroundColor: isReadOnly ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontFamily: col.dataType === 'JSON' ? 'Consolas, monospace' : 'inherit',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />
          {formErrors[col.name] && (
            <span style={{ fontSize: '12px', color: 'var(--status-danger)' }}>{formErrors[col.name]}</span>
          )}
          {col.comment && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{col.comment}</span>
          )}
        </div>
      );
    }

    const inputType = ['DATE', 'DATETIME', 'TIMESTAMP'].includes(col.dataType)
      ? col.dataType === 'DATE'
        ? 'date'
        : 'datetime-local'
      : ['INT', 'BIGINT', 'SMALLINT', 'DECIMAL', 'FLOAT', 'DOUBLE'].includes(col.dataType)
      ? 'number'
      : 'text';

    return (
      <div key={col.name}>
        <Input
          label={`${col.name} ${!col.isNullable && !isReadOnly ? '*' : ''} ${isPk ? '(PK)' : ''}`}
          type={inputType}
          value={value}
          disabled={isReadOnly}
          onChange={(e) => handleChange(col.name, e.target.value)}
          error={formErrors[col.name]}
          placeholder={isAutoInc && !isEditing ? '(Auto-generated ID)' : col.comment || col.columnType}
        />
        {col.comment && !formErrors[col.name] && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{col.comment}</span>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Record in ${structure.tableName}` : `Insert Record into ${structure.tableName}`}
      description="Values are validated against column constraints, types, and foreign key relations"
      maxWidth="820px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            maxHeight: '460px',
            overflowY: 'auto',
            paddingRight: '6px',
          }}
        >
          {structure.columns.map(renderField)}
        </div>

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
            {isEditing ? 'Save Changes' : 'Insert Record'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
