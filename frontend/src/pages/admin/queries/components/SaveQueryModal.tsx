import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { VisualQueryDefinition } from '../../../../types/index.ts';
import { Save, AlertTriangle, CheckCircle2, Layers, Table as TableIcon } from 'lucide-react';

export interface SaveQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'saveAs';
  initialName: string;
  initialDescription?: string;
  initialCategory?: string;
  initialStatus?: 'draft' | 'published';
  visualDefinition: VisualQueryDefinition;
  availableCategories?: string[];
  isSaving: boolean;
  onConfirmSave: (data: {
    name: string;
    description: string;
    category: string;
    status: 'draft' | 'published';
  }) => Promise<void>;
}

export const SaveQueryModal: React.FC<SaveQueryModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialName,
  initialDescription = '',
  initialCategory = 'General',
  initialStatus = 'draft',
  visualDefinition,
  availableCategories = ['General', 'Finance', 'Sales', 'Operations'],
  isSaving,
  onConfirmSave,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState<'draft' | 'published'>(initialStatus);
  const [customCategory, setCustomCategory] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'saveAs') {
        const cleanName = initialName.replace(/\s*\(Copy\)\s*$/, '');
        setName(`${cleanName} (Copy)`);
      } else {
        setName(initialName === 'Untitled Query' ? '' : initialName);
      }
      setDescription(initialDescription || '');
      setCategory(initialCategory || 'General');
      setStatus(initialStatus || 'draft');
      setCustomCategory('');
      validateQuery();
    }
  }, [isOpen, mode, initialName, initialDescription, initialCategory, initialStatus]);

  // Validate the visual query definition
  const validateQuery = () => {
    const errors: string[] = [];
    const tablesCount = visualDefinition.tables?.length || 0;
    if (tablesCount === 0) {
      errors.push('No tables added to designer canvas. At least one table is required.');
    }

    const visibleColsCount =
      visualDefinition.gridColumns?.filter((c) => c.isVisible !== false && (c.columnName || c.calculatedFormula)).length ||
      visualDefinition.columns?.filter((c) => c.isVisible !== false).length ||
      0;

    if (visibleColsCount === 0) {
      errors.push('No visible output columns selected in design grid.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Query name is required.');
    } else if (name.trim().length < 2) {
      errors.push('Query name must be at least 2 characters.');
    }

    const tablesCount = visualDefinition.tables?.length || 0;
    if (tablesCount === 0) {
      errors.push('At least one table must be added to the query design.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const effectiveCategory = category === '__custom__' ? customCategory.trim() || 'General' : category;

    await onConfirmSave({
      name: name.trim(),
      description: description.trim(),
      category: effectiveCategory,
      status,
    });
  };

  const isFormValid = name.trim().length >= 2 && (visualDefinition.tables?.length || 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'saveAs' ? 'Save Query Copy (Save As)' : 'Save Visual Query'}
      description={
        mode === 'saveAs'
          ? 'Save a new copy of this query definition with a new name and category.'
          : 'Save this visual query definition to your database library for future use and reports.'
      }
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Tables: {visualDefinition.tables?.length || 0} • Columns:{' '}
            {visualDefinition.gridColumns?.filter((c) => c.isVisible !== false).length || 0}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit()}
              isLoading={isSaving}
              disabled={!isFormValid}
              leftIcon={<Save size={14} />}
            >
              {mode === 'saveAs' ? 'Save Copy' : 'Save Query'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-error-subtle, rgba(239, 68, 68, 0.1))',
              border: '1px solid var(--border-error, #f87171)',
              borderRadius: 'var(--radius-input, 6px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-error, #dc2626)', fontSize: '12px' }}>
              <AlertTriangle size={15} />
              <span>Query Definition Notice</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Query Name */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Query Name <span style={{ color: 'var(--primary)' }}>*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Revenue by Customer"
            autoFocus
            required
          />
        </div>

        {/* Category & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Category
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                ...Array.from(new Set([...availableCategories, 'General', 'Sales', 'Finance', 'Operations', 'Sample Queries'])).map((c) => ({
                  value: c,
                  label: c,
                })),
                { value: '__custom__', label: '+ New Category...' },
              ]}
            />
            {category === '__custom__' && (
              <Input
                style={{ marginTop: '8px' }}
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name"
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              options={[
                { value: 'draft', label: 'Draft (In Progress)' },
                { value: 'published', label: 'Published (Ready to Run)' },
              ]}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what data this query pulls and how it should be used..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              fontFamily: 'inherit',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-input, 6px)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Query Summary Chips */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-subtle, rgba(0, 0, 0, 0.02))',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-input, 6px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Source Tables:</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {visualDefinition.tables && visualDefinition.tables.length > 0 ? (
                visualDefinition.tables.map((t) => (
                  <Badge key={t.id} variant="neutral">
                    {t.tableName}
                  </Badge>
                ))
              ) : (
                <span style={{ color: 'var(--text-error, #dc2626)', fontStyle: 'italic' }}>None</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Output Columns:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {visualDefinition.gridColumns?.filter((c) => c.isVisible !== false).length || 0} visible
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
