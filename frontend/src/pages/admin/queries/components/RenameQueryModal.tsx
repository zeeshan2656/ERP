import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { SavedQuery } from '../../../../types/index.ts';
import { Edit2 } from 'lucide-react';

export interface RenameQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: SavedQuery | null;
  onConfirmRename: (queryId: string, newName: string, newDescription?: string) => Promise<void>;
  isLoading?: boolean;
}

export const RenameQueryModal: React.FC<RenameQueryModalProps> = ({
  isOpen,
  onClose,
  query,
  onConfirmRename,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (query) {
      setName(query.name);
      setDescription(query.description || '');
    }
  }, [query]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query || !name.trim()) return;
    await onConfirmRename(query.id, name.trim(), description.trim() || undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen && !!query}
      onClose={onClose}
      title="Rename Query"
      description="Update the display name and description of this saved query."
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
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Query Name <span style={{ color: 'var(--primary)' }}>*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Query Name..."
            autoFocus
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional query description..."
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
      </form>
    </Modal>
  );
};
