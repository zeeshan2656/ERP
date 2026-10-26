import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { SavedForm } from '../../../../types/index.ts';
import { Copy } from 'lucide-react';

export interface DuplicateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: SavedForm | null;
  onConfirmDuplicate: (formId: string, newName: string) => Promise<void>;
  isLoading?: boolean;
}

export const DuplicateFormModal: React.FC<DuplicateFormModalProps> = ({
  isOpen,
  onClose,
  form,
  onConfirmDuplicate,
  isLoading = false,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (form) {
      setName(`${form.name} (Copy)`);
    }
  }, [form]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form || !name.trim()) return;
    await onConfirmDuplicate(form.id, name.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen && !!form}
      onClose={onClose}
      title="Duplicate Form"
      description="Create a clone of this form with all controls, master-detail configurations, and layout settings."
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
            leftIcon={<Copy size={13} />}
          >
            Duplicate Form
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            New Form Name <span style={{ color: 'var(--status-danger-text, #ef4444)' }}>*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sales Orders (Q2 Clone)"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
};
