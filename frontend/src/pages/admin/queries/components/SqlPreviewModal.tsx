import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Copy, Check, AlertTriangle, Code } from 'lucide-react';
import { useToast } from '../../../../components/ui/Toast.tsx';

interface SqlPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sql: string;
  warnings?: string[];
  title?: string;
}

export const SqlPreviewModal: React.FC<SqlPreviewModalProps> = ({
  isOpen,
  onClose,
  sql,
  warnings = [],
  title = 'Generated SQL Query',
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      showToast('SQL copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy SQL to clipboard', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Read-only view of the compiled MySQL statement produced by the visual query engine."
      maxWidth="720px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button
            variant="outline"
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy SQL'}
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {warnings.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: 'var(--text-warning, #eab308)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
              <strong>Query Warning:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'relative',
            backgroundColor: 'var(--bg-app, #0f172a)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md, 6px)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.03))',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code size={14} /> MySQL Dialect
            </span>
            <span>{sql ? `${sql.length} characters` : '0 characters'}</span>
          </div>

          <pre
            style={{
              margin: 0,
              padding: '16px',
              maxHeight: '380px',
              overflowY: 'auto',
              fontSize: '13px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {sql || '-- No SQL generated yet. Add tables and output columns to generate query.'}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
