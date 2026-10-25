import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import { QueryParameter } from '../../../../types/index.ts';
import { Play, RotateCcw } from 'lucide-react';

interface ParameterPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: QueryParameter[];
  onExecute: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
  isLoading?: boolean;
}

export const ParameterPromptModal: React.FC<ParameterPromptModalProps> = ({
  isOpen,
  onClose,
  parameters,
  onExecute,
  initialValues = {},
  isLoading = false,
}) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const init: Record<string, any> = {};
      parameters.forEach((param) => {
        if (initialValues[param.name] !== undefined) {
          init[param.name] = initialValues[param.name];
        } else if (param.defaultValue !== undefined && param.defaultValue !== null) {
          init[param.name] = param.defaultValue;
        } else {
          init[param.name] = param.dataType === 'boolean' ? false : '';
        }
      });
      setValues(init);
      setErrors({});
    }
  }, [isOpen, parameters, initialValues]);

  const handleChange = (name: string, val: any) => {
    setValues((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleReset = () => {
    const init: Record<string, any> = {};
    parameters.forEach((param) => {
      init[param.name] = param.defaultValue !== undefined ? param.defaultValue : (param.dataType === 'boolean' ? false : '');
    });
    setValues(init);
    setErrors({});
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors: Record<string, string> = {};

    parameters.forEach((p) => {
      const v = values[p.name];
      if (p.isRequired && (v === undefined || v === '' || v === null)) {
        newErrors[p.name] = `${p.label || p.name} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert values according to dataType
    const parsedValues: Record<string, unknown> = {};
    parameters.forEach((p) => {
      const v = values[p.name];
      if (v === '' || v === null || v === undefined) {
        parsedValues[p.name] = null;
      } else if (p.dataType === 'number') {
        parsedValues[p.name] = Number(v);
      } else if (p.dataType === 'boolean') {
        parsedValues[p.name] = Boolean(v === true || v === 'true' || v === 1);
      } else {
        parsedValues[p.name] = v;
      }
    });

    onExecute(parsedValues);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Runtime Query Parameters"
      description="Provide input parameters required to execute this query."
      maxWidth="500px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button
            variant="ghost"
            leftIcon={<RotateCcw size={14} />}
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset Defaults
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<Play size={14} />}
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Run Query
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {parameters.map((param) => {
          const err = errors[param.name];
          if (param.dataType === 'boolean') {
            return (
              <div key={param.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  style={{
                    fontSize: 'var(--font-size-sm, 14px)',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {param.label || param.name}
                  {param.isRequired && <span style={{ color: 'var(--status-danger)', marginLeft: '4px' }}>*</span>}
                </label>
                <div style={{ width: '100%' }}>
                  <Select
                    value={values[param.name] ? 'true' : 'false'}
                    onChange={(e) => handleChange(param.name, e.target.value === 'true')}
                    options={[
                      { value: 'true', label: 'True / Yes' },
                      { value: 'false', label: 'False / No' },
                    ]}
                  />
                </div>
                {err && <span style={{ fontSize: '12px', color: 'var(--status-danger)' }}>{err}</span>}
              </div>
            );
          }

          if (param.dataType === 'date') {
            return (
              <Input
                key={param.id}
                type="date"
                label={param.label || param.name}
                required={param.isRequired}
                value={values[param.name] || ''}
                onChange={(e) => handleChange(param.name, e.target.value)}
                error={err}
              />
            );
          }

          if (param.dataType === 'number') {
            return (
              <Input
                key={param.id}
                type="number"
                step="any"
                label={param.label || param.name}
                required={param.isRequired}
                placeholder={`Enter number for :${param.name}`}
                value={values[param.name] !== undefined ? values[param.name] : ''}
                onChange={(e) => handleChange(param.name, e.target.value)}
                error={err}
              />
            );
          }

          return (
            <Input
              key={param.id}
              type="text"
              label={param.label || param.name}
              required={param.isRequired}
              placeholder={`Enter value for :${param.name}`}
              value={values[param.name] || ''}
              onChange={(e) => handleChange(param.name, e.target.value)}
              error={err}
            />
          );
        })}
      </form>
    </Modal>
  );
};
