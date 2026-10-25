import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import { QueryParameter } from '../../../../types/index.ts';
import { Plus, Trash2, Sliders } from 'lucide-react';

interface ParametersConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: QueryParameter[];
  onSave: (parameters: QueryParameter[]) => void;
}

export const ParametersConfigModal: React.FC<ParametersConfigModalProps> = ({
  isOpen,
  onClose,
  parameters,
  onSave,
}) => {
  const [params, setParams] = useState<QueryParameter[]>(parameters);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDataType, setNewDataType] = useState<'string' | 'number' | 'boolean' | 'date'>('string');
  const [newIsRequired, setNewIsRequired] = useState(false);
  const [newDefaultValue, setNewDefaultValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) {
      setError('Parameter Name is required.');
      return;
    }
    const cleanName = newName.trim().replace(/[^a-zA-Z0-9_]/g, '_');
    if (params.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      setError(`Parameter with name '${cleanName}' already exists.`);
      return;
    }

    const param: QueryParameter = {
      id: `param_${Date.now()}`,
      name: cleanName,
      label: newLabel.trim() || cleanName,
      dataType: newDataType,
      isRequired: newIsRequired,
      defaultValue: newDefaultValue.trim() ? newDefaultValue.trim() : undefined,
    };

    setParams([...params, param]);
    setNewName('');
    setNewLabel('');
    setNewDefaultValue('');
    setError(null);
  };

  const handleRemove = (id: string) => {
    setParams(params.filter((p) => p.id !== id));
  };

  const handleSaveAll = () => {
    onSave(params);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Query Parameters Configuration"
      description="Define reusable parameters that users are prompted for when executing this query."
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAll}>
            Save Parameters
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--status-danger, #ef4444)',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}

        {/* Add Parameter Row */}
        <div
          style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Add New Parameter:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
            <Input
              label="Name (:param)"
              placeholder="e.g. status"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              label="Label"
              placeholder="e.g. User Status"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>Data Type</label>
              <Select
                value={newDataType}
                onChange={(e) => setNewDataType(e.target.value as any)}
                options={[
                  { value: 'string', label: 'String' },
                  { value: 'number', label: 'Number' },
                  { value: 'boolean', label: 'Boolean' },
                  { value: 'date', label: 'Date' },
                ]}
              />
            </div>
            <Input
              label="Default (opt)"
              placeholder="Default val"
              value={newDefaultValue}
              onChange={(e) => setNewDefaultValue(e.target.value)}
            />
            <Button variant="primary" leftIcon={<Plus size={14} />} onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>

        {/* List of parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Configured Parameters ({params.length}):
          </div>
          {params.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No parameters defined. Add parameters above to bind in WHERE filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {params.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color)', fontFamily: 'monospace' }}>
                      :{p.name}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{p.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({p.dataType})</span>
                    {p.defaultValue !== undefined && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Default: <code>{String(p.defaultValue)}</code>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    title="Remove parameter"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
