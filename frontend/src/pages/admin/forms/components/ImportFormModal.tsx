import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Upload, FileText, AlertCircle } from 'lucide-react';

export interface ImportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (definition: any) => Promise<void>;
  isLoading?: boolean;
}

export const ImportFormModal: React.FC<ImportFormModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  isLoading = false,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
        setParseError(null);
      } catch (err: any) {
        setParseError(`Failed to read file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setParseError(null);
    try {
      if (!jsonText.trim()) {
        setParseError('Please paste a JSON form definition or upload a JSON file.');
        return;
      }
      const parsed = JSON.parse(jsonText);
      await onConfirmImport(parsed);
      onClose();
    } catch (err: any) {
      setParseError(`Invalid JSON format: ${err.message}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Form Definition"
      description="Upload or paste an exported Apex Flow form definition (JSON)."
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!jsonText.trim()}
            leftIcon={<Upload size={13} />}
          >
            Import Form
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Upload JSON File
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{
              fontSize: '12px',
              padding: '6px',
              border: '1px dashed var(--border-subtle, #cbd5e1)',
              borderRadius: 'var(--radius-sm, 4px)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Or Paste JSON Definition
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setParseError(null);
            }}
            placeholder='{"apexFlowExport": "FormDefinition", "form": { "name": "...", ... }}'
            rows={8}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '12px',
              fontFamily: 'monospace',
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

        {parseError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm, 4px)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--status-danger-text, #ef4444)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={14} />
            <span>{parseError}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
