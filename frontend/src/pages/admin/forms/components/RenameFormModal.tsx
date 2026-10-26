import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { SavedForm } from '../../../../types/index.ts';
import { Edit2 } from 'lucide-react';

export interface RenameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: SavedForm | null;
  onConfirmRename: (formId: string, newName: string, newDescription?: string) => Promise<void>;
  isLoading?: boolean;
}

export const RenameFormModal: React.FC<RenameFormModalProps> = ({
  isOpen,
  onClose,
  form,
  onConfirmRename,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (form) {
      setName(form.name);
      setDescription(form.description || '');
    }
  }, [form]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form || !name.trim()) return;
    await onConfirmRename(form.id, name.trim(), description.trim() || undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen && !!form}
      onClose={onClose}
      title="Rename Form"
      description="Update the display name and description of this low-code form."
      maxWidth="460px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit()}
            isLoading={isLoading}
            disabled={!name.trim()}
            leftIcon={<Edit2 size={13} />}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Form Name <span style={{ color: 'var(--status-danger-text, #ef4444)' }}>*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sales Orders Master-Detail"
            autoFocus
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional summary of this form's purpose..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              fontFamily: 'inherit',
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </form>
    </Modal>
  );
};
