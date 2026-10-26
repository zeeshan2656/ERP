import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { FormControl, FormCanvasLayout, FormType } from '../../../../types/index.ts';
import {
  Eye,
  CheckCircle,
  Table,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  formType: FormType;
  controls: FormControl[];
  layout: FormCanvasLayout;
}

export const FormPreviewModal: React.FC<FormPreviewModalProps> = ({
  isOpen,
  onClose,
  formName,
  formType,
  controls,
  layout,
}) => {
  // Local state for interactive preview
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [detailRows, setDetailRows] = useState<Record<string, any[]>>({});
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleInputChange = (field: string, val: any, ctrl?: FormControl) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      if (ctrl?.lookupConfig?.dependentMappings && ctrl.lookupConfig.dependentMappings.length > 0) {
        const staticOpt = ctrl.lookupConfig.staticOptions?.find((o) => String(o.key) === String(val));
        if (staticOpt) {
          ctrl.lookupConfig.dependentMappings.forEach((m) => {
            if (m.sourceColumn && m.targetField) {
              next[m.targetField] = (staticOpt as any)[m.sourceColumn] || `${staticOpt.label} (${m.sourceColumn})`;
            }
          });
        } else {
          ctrl.lookupConfig.dependentMappings.forEach((m) => {
            if (m.sourceColumn && m.targetField) {
              if (m.sourceColumn.toLowerCase().includes('email')) {
                next[m.targetField] = `${String(val).toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer'}@example.com`;
              } else if (m.sourceColumn.toLowerCase().includes('phone')) {
                next[m.targetField] = '+1 (555) 019-2834';
              } else if (m.sourceColumn.toLowerCase().includes('address')) {
                next[m.targetField] = '742 Evergreen Terrace, Springfield';
              } else {
                next[m.targetField] = `Auto-populated ${m.sourceColumn} for ${val}`;
              }
            }
          });
        }
      }
      return next;
    });
  };

  const handleAddDetailRow = (gridId: string, defaultCols: any[]) => {
    const newRow: Record<string, any> = { _tempId: Date.now() };
    defaultCols.forEach((col) => {
      newRow[col.field] = col.type === 'number' ? 1 : col.type === 'currency' ? 0 : '';
    });
    setDetailRows((prev) => ({
      ...prev,
      [gridId]: [...(prev[gridId] || []), newRow],
    }));
  };

  const handleRemoveDetailRow = (gridId: string, index: number) => {
    setDetailRows((prev) => ({
      ...prev,
      [gridId]: (prev[gridId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleDetailCellChange = (gridId: string, index: number, field: string, val: any) => {
    setDetailRows((prev) => {
      const current = [...(prev[gridId] || [])];
      if (current[index]) {
        current[index] = { ...current[index], [field]: val };

        // Auto-calculate line total if quantity and unit_price exist!
        if (field === 'quantity' || field === 'unit_price') {
          const qty = Number(current[index].quantity) || 0;
          const price = Number(current[index].unit_price) || 0;
          current[index].line_total = (qty * price).toFixed(2);
        }
      }
      return { ...prev, [gridId]: current };
    });
  };

  const handleTestSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmittedMessage('Preview validation passed! Form submission simulated successfully.');
    setTimeout(() => setSubmittedMessage(null), 4000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Preview: ${formName || 'Untitled Form'}`}
      description="Interactive testing mode. Real-time layout, field validations, and detail grids are active without modifying database records."
      maxWidth="900px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Form Type: <strong>{formType}</strong> • {controls.length} controls rendered
          </div>
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {submittedMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm, 4px)',
              backgroundColor: 'rgba(22, 163, 74, 0.12)',
              color: 'var(--status-success-text, #16a34a)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <CheckCircle size={15} />
            <span>{submittedMessage}</span>
          </div>
        )}

        <form onSubmit={handleTestSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: `${layout.gap ?? 16}px`,
              padding: layout.padding || '16px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
            }}
          >
            {controls.map((ctrl) => {
              const colSpan = Math.min(12, Math.max(1, ctrl.colSpan || 6));
              const fieldKey = ctrl.fieldBinding || ctrl.name;
              const val = formData[fieldKey] ?? ctrl.defaultValue ?? '';

              if (ctrl.type === 'section') {
                return (
                  <div
                    key={ctrl.id}
                    style={{
                      gridColumn: `span ${colSpan}`,
                      borderBottom: '2px solid var(--border-subtle)',
                      paddingBottom: '6px',
                      marginTop: '4px',
                    }}
                  >
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {ctrl.label}
                    </h3>
                  </div>
                );
              }

              if (ctrl.type === 'heading') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
                      {ctrl.label}
                    </h2>
                  </div>
                );
              }

              if (ctrl.type === 'divider') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />
                  </div>
                );
              }

              if (ctrl.type === 'datagrid' || ctrl.type === 'master_detail') {
                const gridRows = detailRows[ctrl.id] || [];
                const cols = ctrl.detailGridConfig?.columns || [
                  { field: 'item_name', label: 'Item Name', width: '240px' },
                  { field: 'quantity', label: 'Qty', width: '90px', type: 'number' },
                  { field: 'unit_price', label: 'Unit Price ($)', width: '120px', type: 'currency' },
                  { field: 'line_total', label: 'Line Total ($)', width: '130px', type: 'currency' },
                ];

                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        <Table size={14} style={{ color: 'var(--brand-primary)' }} />
                        <span>{ctrl.label || 'Detail Records'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddDetailRow(ctrl.id, cols)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 9px',
                          borderRadius: '4px',
                          border: '1px solid var(--brand-primary)',
                          backgroundColor: 'var(--brand-primary-subtle, rgba(0,103,184,0.08))',
                          color: 'var(--brand-primary, #0067b8)',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={11} />
                        Add Detail Row
                      </button>
                    </div>

                    <div style={{ borderRadius: '4px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                            {cols.map((c) => (
                              <th key={c.field} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {c.label || c.field}
                              </th>
                            ))}
                            <th style={{ width: '40px', padding: '6px 8px', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {gridRows.length === 0 ? (
                            <tr>
                              <td colSpan={cols.length + 1} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No detail records yet. Click <strong>Add Detail Row</strong> to test in-grid continuous entry.
                              </td>
                            </tr>
                          ) : (
                            gridRows.map((row, rIdx) => (
                              <tr key={row._tempId || rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                {cols.map((c) => (
                                  <td key={c.field} style={{ padding: '4px 6px' }}>
                                    <input
                                      type={c.type === 'number' || c.type === 'currency' ? 'number' : 'text'}
                                      value={row[c.field] ?? ''}
                                      onChange={(e) => handleDetailCellChange(ctrl.id, rIdx, c.field, e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '4px 6px',
                                        fontSize: '12px',
                                        borderRadius: '3px',
                                        border: '1px solid var(--border-subtle)',
                                        backgroundColor: 'var(--surface-0)',
                                        color: 'var(--text-primary)',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                      }}
                                    />
                                  </td>
                                ))}
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDetailRow(ctrl.id, rIdx)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-danger-text, #ef4444)' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              if (ctrl.type === 'button') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, display: 'flex', justifyContent: ctrl.alignment || 'flex-start' }}>
                    <Button type={ctrl.buttonAction?.actionType === 'submit' ? 'submit' : 'button'} variant="primary" size="md">
                      {ctrl.label || 'Submit Form'}
                    </Button>
                  </div>
                );
              }

              if (ctrl.type === 'switch') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ctrl.label}
                      {ctrl.validation?.required && <span style={{ color: 'red' }}> *</span>}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handleInputChange(fieldKey, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                );
              }

              if (ctrl.type === 'checkbox') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handleInputChange(fieldKey, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ctrl.label}
                    </span>
                  </div>
                );
              }

              return (
                <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                  {ctrl.styling?.labelPosition !== 'hidden' && (
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      {ctrl.label}
                      {ctrl.validation?.required && <span style={{ color: 'var(--status-danger-text, #ef4444)' }}> *</span>}
                    </label>
                  )}

                  {ctrl.type === 'textarea' ? (
                    <textarea
                      value={val}
                      onChange={(e) => handleInputChange(fieldKey, e.target.value, ctrl)}
                      placeholder={ctrl.placeholder || `Enter ${ctrl.label.toLowerCase()}...`}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        border: '1px solid var(--border-subtle, #cbd5e1)',
                        backgroundColor: 'var(--surface-0, #ffffff)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : ctrl.type === 'select' || ctrl.type === 'lookup' || (ctrl.type as string) === 'lov' ? (
                    <select
                      value={val}
                      onChange={(e) => handleInputChange(fieldKey, e.target.value, ctrl)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        border: '1px solid var(--border-subtle, #cbd5e1)',
                        backgroundColor: 'var(--surface-0, #ffffff)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">{ctrl.placeholder || `-- Select ${ctrl.label} --`}</option>
                      {ctrl.lookupConfig?.staticOptions && ctrl.lookupConfig.staticOptions.length > 0 ? (
                        ctrl.lookupConfig.staticOptions.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="cust_101">Acme Corporation (cust_101)</option>
                          <option value="cust_102">Global Tech Industries (cust_102)</option>
                          <option value="cust_103">Apex Logistics (cust_103)</option>
                        </>
                      )}
                    </select>
                  ) : ctrl.type === 'radio' ? (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '4px 0' }}>
                      {(ctrl.lookupConfig?.staticOptions && ctrl.lookupConfig.staticOptions.length > 0
                        ? ctrl.lookupConfig.staticOptions
                        : [
                            { key: 'yes', label: 'Yes' },
                            { key: 'no', label: 'No' },
                          ]
                      ).map((opt) => (
                        <label key={opt.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="radio"
                            name={`preview_radio_${ctrl.id}`}
                            value={opt.key}
                            checked={String(val) === String(opt.key)}
                            onChange={() => handleInputChange(fieldKey, opt.key, ctrl)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : ctrl.type === 'currency' ? (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', pointerEvents: 'none' }}>
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={val}
                        onChange={(e) => handleInputChange(fieldKey, e.target.value, ctrl)}
                        placeholder={ctrl.placeholder || '0.00'}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 24px',
                          fontSize: '12px',
                          borderRadius: 'var(--radius-sm, 4px)',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--surface-0, #ffffff)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ) : ctrl.type === 'readonly' ? (
                    <div
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        border: '1px solid var(--border-subtle, #cbd5e1)',
                        backgroundColor: 'var(--surface-2, rgba(0,0,0,0.03))',
                        color: 'var(--text-primary)',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {String(val || '—')}
                    </div>
                  ) : (
                    <input
                      type={
                        ctrl.type === 'date'
                          ? 'date'
                          : ctrl.type === 'datetime'
                          ? 'datetime-local'
                          : ctrl.type === 'time'
                          ? 'time'
                          : ctrl.type === 'number' || ctrl.type === 'decimal'
                          ? 'number'
                          : 'text'
                      }
                      value={val}
                      onChange={(e) => handleInputChange(fieldKey, e.target.value, ctrl)}
                      placeholder={ctrl.placeholder || `Enter ${ctrl.label.toLowerCase()}...`}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        border: '1px solid var(--border-subtle, #cbd5e1)',
                        backgroundColor: 'var(--surface-0, #ffffff)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {ctrl.helpText && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {ctrl.helpText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </form>
      </div>
    </Modal>
  );
};
