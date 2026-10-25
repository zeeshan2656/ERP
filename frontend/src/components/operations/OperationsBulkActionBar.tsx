import React, { useState } from 'react';
import {
  Trash2,
  Download,
  X,
  CheckSquare,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Badge } from '../ui/Badge.tsx';

export interface OperationsBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onBulkDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
  onBulkExportCsv?: () => void;
  onBulkExportJson?: () => void;
  deleteLabel?: string;
  customActions?: React.ReactNode;
  protectedCount?: number;
}

/**
 * Enterprise Floating Bulk Action Bar for Operations Modules
 * Displays when records are selected in either Table View or Card View.
 * Provides unified bulk actions (delete, export, custom) and confirmation dialogs.
 */
export const OperationsBulkActionBar: React.FC<OperationsBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onBulkDelete,
  isDeleting = false,
  onBulkExportCsv,
  onBulkExportJson,
  deleteLabel = 'Delete Selected',
  customActions,
  protectedCount = 0,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (selectedCount === 0) return null;

  const deletableCount = selectedCount - protectedCount;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: 'var(--brand-primary, #3b82f6)',
          color: 'var(--brand-primary-text, #ffffff)',
          borderRadius: 'var(--radius-card, 8px)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.15))',
          marginBottom: '14px',
          gap: '12px',
          flexWrap: 'wrap',
          animation: 'fadeIn 0.15s ease-in-out',
        }}
      >
        {/* Left: Selection Counter & Select All */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckSquare size={16} />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>
              {selectedCount} of {totalCount} record{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          {onSelectAll && selectedCount < totalCount && (
            <button
              type="button"
              onClick={onSelectAll}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Select all {totalCount}
            </button>
          )}

          {protectedCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {protectedCount} system/template item{protectedCount > 1 ? 's' : ''} protected
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {customActions}

          {onBulkExportCsv && (
            <button
              type="button"
              onClick={onBulkExportCsv}
              title="Export selected to CSV"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FileSpreadsheet size={13} />
              Export CSV
            </button>
          )}

          {onBulkExportJson && (
            <button
              type="button"
              onClick={onBulkExportJson}
              title="Export selected to JSON"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FileCode size={13} />
              Export JSON
            </button>
          )}

          {onBulkDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={deletableCount === 0 || isDeleting}
              title={
                deletableCount === 0
                  ? 'Selected records are protected system templates and cannot be deleted.'
                  : deleteLabel
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: deletableCount === 0 ? 'rgba(239, 68, 68, 0.4)' : '#ef4444',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: deletableCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={13} />
              {deleteLabel} ({deletableCount})
            </button>
          )}

          <button
            type="button"
            onClick={onClearSelection}
            title="Deselect all records"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '4px',
              marginLeft: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Bulk Deletion"
          description={`Are you sure you want to permanently delete ${deletableCount} selected record${
            deletableCount > 1 ? 's' : ''
          }? This action cannot be undone.`}
          maxWidth="460px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                leftIcon={<Trash2 size={14} />}
                isLoading={isDeleting}
                onClick={async () => {
                  if (onBulkDelete) {
                    await onBulkDelete();
                  }
                  setIsDeleteModalOpen(false);
                }}
              >
                Delete {deletableCount} Record{deletableCount > 1 ? 's' : ''}
              </Button>
            </div>
          }
        >
          {protectedCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-warning, #eab308)',
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>
                <b>Note:</b> {protectedCount} selected record{protectedCount > 1 ? 's are' : ' is a'} protected
                system template and will NOT be deleted.
              </span>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};
