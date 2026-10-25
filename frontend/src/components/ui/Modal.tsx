import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.tsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '540px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.55)', // Dimmed backdrop (no blur filter)
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--bg-surface)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--border-default)',
          borderRadius: 'var(--radius-dialog, var(--radius-lg, 8px))',
          boxShadow: 'var(--soft-raised, var(--shadow-lg))',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-md, 18px)',
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                style={{
                  fontSize: 'var(--font-size-sm, 14px)',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  margin: 0,
                }}
              >
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </Button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '14px 20px',
              borderTop: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-subtle)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
