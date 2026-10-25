import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { TableStructure } from '../../../types/database.ts';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: TableStructure | null;
  record: Record<string, any> | null;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  structure,
  record,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!structure || !record) return null;

  const handleCopy = (key: string, value: any) => {
    const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Details: ${structure.tableName}`}
      description={`Viewing record with primary key ${structure.primaryKey.map((pk) => `${pk} = ${record[pk]}`).join(', ')}`}
      maxWidth="840px"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '520px',
          overflowY: 'auto',
          paddingRight: '6px',
        }}
      >
        {structure.columns.map((col) => {
          const rawVal = record[col.name];
          const isMasked = record[`__isMasked_${col.name}`] || rawVal === '••••••••';
          const isObject = typeof rawVal === 'object' && rawVal !== null;

          return (
            <div
              key={col.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: col.isPrimaryKey ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {col.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {col.columnType}
                  </span>
                  {col.isPrimaryKey && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: 'var(--brand-primary)',
                        backgroundColor: 'rgba(0, 103, 184, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      PRIMARY KEY
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(col.name, rawVal)}
                  title="Copy value"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: copiedKey === col.name ? 'var(--status-success)' : 'var(--text-muted)',
                  }}
                >
                  {copiedKey === col.name ? (
                    <>
                      <Check size={13} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy
                    </>
                  )}
                </button>
              </div>

              {isObject ? (
                <pre
                  style={{
                    margin: '4px 0 0',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    color: 'var(--text-primary)',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(rawVal, null, 2)}
                </pre>
              ) : (
                <div
                  style={{
                    fontSize: '13px',
                    color: rawVal === null ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontFamily: col.dataType === 'JSON' || col.isPrimaryKey ? 'monospace' : 'inherit',
                    fontStyle: rawVal === null ? 'italic' : 'normal',
                    wordBreak: 'break-all',
                  }}
                >
                  {rawVal === null ? 'NULL' : isMasked ? '•••••••• (Protected Secret)' : String(rawVal)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
