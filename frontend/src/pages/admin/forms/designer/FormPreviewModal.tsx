import React, { useState, useRef } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { FormControl, FormCanvasLayout, FormType, DetailGridColumn } from '../../../../types/index.ts';
import { calculateSummaryFieldValue } from '../../../../utils/formCalculations.ts';
import {
  computeControlStyles,
  computeLabelStyles,
  computeSectionStyles,
  computeButtonStyles,
} from '../../../../utils/formStyling.ts';
import {
  useFormEnterNavigation,
  handleDetailGridEnterNavigation,
} from '../../../../hooks/useFormEnterNavigation.ts';
import {
  Eye,
  CheckCircle,
  Table,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const DEFAULT_PREVIEW_GRID_COLUMNS: DetailGridColumn[] = [
  { field: 'item_name', label: 'Item Name', width: 'auto', editable: true },
  { field: 'sku', label: 'SKU', width: '130px', editable: true },
  { field: 'quantity', label: 'Qty', width: '80px', type: 'number', editable: true },
  { field: 'unit_price', label: 'Unit Price ($)', width: '120px', type: 'currency', editable: true },
  { field: 'line_total', label: 'Line Total ($)', width: '130px', type: 'currency', editable: false },
];

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
  const formRef = useRef<HTMLFormElement>(null);

  // Global Enter-Key Navigation hook for interactive preview
  useFormEnterNavigation({
    containerRef: formRef,
    enabled: isOpen,
    onShowValidationToast: (msg) => setSubmittedMessage(`Validation alert: ${msg}`),
  });

  // Local state for interactive preview
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [detailRows, setDetailRows] = useState<Record<string, any[]>>(() => {
    const initial: Record<string, any[]> = {};
    controls.forEach((ctrl) => {
      if (ctrl.type === 'datagrid' || ctrl.type === 'master_detail') {
        const count = Math.max(1, ctrl.detailGridConfig?.defaultVisibleRows || 5);
        const cols: DetailGridColumn[] =
          ctrl.detailGridConfig?.columns && ctrl.detailGridConfig.columns.length > 0
            ? ctrl.detailGridConfig.columns
            : DEFAULT_PREVIEW_GRID_COLUMNS;
        const rows: any[] = [];
        for (let i = 0; i < count; i++) {
          const row: Record<string, any> = { _tempId: Date.now() + i };
          cols.forEach((c) => {
            row[c.field] = c.type === 'number' ? 0 : c.type === 'currency' ? 0.0 : '';
          });
          rows.push(row);
        }
        initial[ctrl.id] = rows;
      }
    });
    return initial;
  });
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
      newRow[col.field] = col.type === 'number' ? 0 : col.type === 'currency' ? 0.0 : '';
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

        // Auto-calculate line total if quantity, unit_price, or discount exist
        if (field === 'quantity' || field === 'unit_price' || field === 'discount') {
          const qty = Number(current[index].quantity) || 0;
          const price = Number(current[index].unit_price) || 0;
          const discount = Number(current[index].discount) || 0;
          current[index].line_total = Math.max(0, (qty * price) - discount).toFixed(2);
        }
      }

      // Sync summary field with targetFieldBinding to master formData if present
      const ctrl = controls.find((c) => c.id === gridId);
      if (ctrl?.detailGridConfig?.summaryFields) {
        ctrl.detailGridConfig.summaryFields.forEach((sf) => {
          if (sf.targetFieldBinding) {
            const res = calculateSummaryFieldValue(current, sf);
            setFormData((fd) => ({ ...fd, [sf.targetFieldBinding!]: res.rawValue }));
          }
        });
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

        <form ref={formRef} onSubmit={handleTestSubmit}>
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
              if (ctrl.styling?.isHidden) return null;

              const colSpan = Math.min(12, Math.max(1, ctrl.colSpan || 6));
              const fieldKey = ctrl.fieldBinding || ctrl.name;
              const val = formData[fieldKey] ?? ctrl.defaultValue ?? '';
              const controlStyles = computeControlStyles(ctrl);
              const labelStyles = computeLabelStyles(ctrl);
              const sectionStyles = computeSectionStyles(ctrl);
              const buttonStyles = computeButtonStyles(ctrl);

              if (ctrl.type === 'section') {
                return (
                  <div
                    key={ctrl.id}
                    style={{
                      gridColumn: `span ${colSpan}`,
                      ...sectionStyles.containerStyle,
                    }}
                  >
                    <h3 style={sectionStyles.headingStyle}>
                      {ctrl.label}
                    </h3>
                  </div>
                );
              }

              if (ctrl.type === 'heading') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                    <h2
                      style={{
                        fontSize: ctrl.styling?.fontSize || '16px',
                        fontWeight: ctrl.styling?.isBold ? 800 : ctrl.styling?.fontWeight ? ctrl.styling.fontWeight : 700,
                        fontStyle: ctrl.styling?.isItalic ? 'italic' : 'normal',
                        textDecoration: ctrl.styling?.isUnderline ? 'underline' : 'none',
                        margin: '4px 0',
                        color: ctrl.styling?.textColor || 'var(--text-primary)',
                        fontFamily: ctrl.styling?.fontFamily || 'inherit',
                        textAlign: ctrl.styling?.textAlign || 'left',
                      }}
                    >
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
                const cols: DetailGridColumn[] =
                  ctrl.detailGridConfig?.columns && ctrl.detailGridConfig.columns.length > 0
                    ? ctrl.detailGridConfig.columns
                    : DEFAULT_PREVIEW_GRID_COLUMNS;

                const defaultRowsCount = Math.max(1, ctrl.detailGridConfig?.defaultVisibleRows || 5);
                const rowHeight = ctrl.styling?.gridCellPadding === 'compact' ? 32 : ctrl.styling?.gridCellPadding === 'spacious' ? 44 : 38;
                const headerHeight = ctrl.styling?.gridCellPadding === 'compact' ? 34 : ctrl.styling?.gridCellPadding === 'spacious' ? 46 : 40;
                const gridMaxHeight = headerHeight + (defaultRowsCount * rowHeight);

                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        <Table size={14} style={{ color: 'var(--brand-primary)' }} />
                        <span>{ctrl.label || 'Detail Records'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                          ({gridRows.length} rows, {defaultRowsCount} visible)
                        </span>
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

                    <div
                      className="apex-detail-grid-scroll-wrapper"
                      style={{
                        maxHeight: `${gridMaxHeight}px`,
                        overflowY: gridRows.length > defaultRowsCount ? 'auto' : 'hidden',
                        overflowX: 'auto',
                        borderRadius: ctrl.detailGridConfig?.enableTotals
                          ? `${ctrl.styling?.borderRadius || '4px'} ${ctrl.styling?.borderRadius || '4px'} 0 0`
                          : ctrl.styling?.borderRadius || '4px',
                        border: ctrl.styling?.borderColor ? `${ctrl.styling?.borderWidth || '1px'} ${ctrl.styling?.borderStyle || 'solid'} ${ctrl.styling?.borderColor}` : '1px solid var(--border-subtle)',
                        width: '100%',
                        minWidth: 0,
                        backgroundColor: 'var(--bg-surface, #ffffff)',
                        position: 'relative',
                        boxSizing: 'border-box',
                      }}
                    >
                      <table style={{ width: '100%', minWidth: '100%', borderCollapse: 'collapse', fontSize: ctrl.styling?.fontSize || '12px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 3 }}>
                          <tr
                            style={{
                              backgroundColor: ctrl.styling?.gridHeaderBg || 'var(--surface-2)',
                              borderBottom: '1px solid var(--border-subtle)',
                            }}
                          >
                            {cols.map((c, colIdx) => (
                              <th
                                key={c.field || colIdx}
                                style={{
                                  width: c.width || (colIdx === 0 ? 'auto' : undefined),
                                  minWidth: c.width && c.width !== 'auto' ? c.width : '100px',
                                  padding: ctrl.styling?.gridCellPadding === 'compact' ? '4px 8px' : ctrl.styling?.gridCellPadding === 'spacious' ? '10px 14px' : '6px 10px',
                                  textAlign: c.type === 'number' || c.type === 'currency' ? 'right' : 'left',
                                  fontWeight: 600,
                                  color: ctrl.styling?.gridHeaderTextColor || 'var(--text-secondary)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {c.label || c.field}
                              </th>
                            ))}
                            <th style={{ width: '40px', minWidth: '40px', padding: '6px 8px', textAlign: 'center' }}></th>
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
                              <tr
                                key={row._tempId || rIdx}
                                style={{
                                  borderBottom: '1px solid var(--border-subtle)',
                                  backgroundColor: ctrl.styling?.gridRowStriped && rIdx % 2 === 1 ? 'var(--surface-1, rgba(0,0,0,0.02))' : undefined,
                                }}
                              >
                                {cols.map((c, cIdx) => (
                                  <td
                                    key={c.field || cIdx}
                                    style={{
                                      padding: ctrl.styling?.gridCellPadding === 'compact' ? '3px 6px' : ctrl.styling?.gridCellPadding === 'spacious' ? '8px 12px' : '4px 6px',
                                      textAlign: c.type === 'number' || c.type === 'currency' ? 'right' : 'left',
                                    }}
                                  >
                                    <input
                                      type={c.type === 'number' || c.type === 'currency' ? 'number' : 'text'}
                                      step={c.type === 'currency' ? '0.01' : c.type === 'number' ? '1' : undefined}
                                      value={row[c.field] ?? ''}
                                      onChange={(e) => handleDetailCellChange(ctrl.id, rIdx, c.field, e.target.value)}
                                      data-grid-cell="true"
                                      data-grid-id={ctrl.id}
                                      data-row-idx={rIdx}
                                      data-col-idx={cIdx}
                                      onKeyDown={(e) => {
                                        handleDetailGridEnterNavigation({
                                          event: e,
                                          gridId: ctrl.id,
                                          rowIndex: rIdx,
                                          colIndex: cIdx,
                                          totalRows: gridRows.length,
                                          columns: cols,
                                          allowAdd: true,
                                          onAddRow: () => handleAddDetailRow(ctrl.id, cols),
                                        });
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '4px 6px',
                                        fontSize: '12px',
                                        borderRadius: '3px',
                                        border: '1px solid var(--border-subtle)',
                                        backgroundColor: 'var(--surface-0)',
                                        color: 'var(--text-primary)',
                                        textAlign: c.type === 'number' || c.type === 'currency' ? 'right' : 'left',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                      }}
                                    />
                                  </td>
                                ))}
                                <td style={{ textAlign: 'center', width: '40px', minWidth: '40px' }}>
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

                    {/* Summary / Totals Bar in Preview */}
                    {ctrl.detailGridConfig?.enableTotals && (
                      <div
                        className="apex-detail-grid-totals-bar"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          flexWrap: 'wrap',
                          gap: '10px',
                          padding: '6px 12px',
                          backgroundColor: 'var(--surface-1, rgba(0,0,0,0.02))',
                          border: ctrl.styling?.borderColor ? `${ctrl.styling?.borderWidth || '1px'} ${ctrl.styling?.borderStyle || 'solid'} ${ctrl.styling?.borderColor}` : '1px solid var(--border-subtle)',
                          borderTop: 'none',
                          borderRadius: `0 0 ${ctrl.styling?.borderRadius || '4px'} ${ctrl.styling?.borderRadius || '4px'}`,
                          boxSizing: 'border-box',
                          width: '100%',
                        }}
                      >
                        {ctrl.detailGridConfig.summaryFields && ctrl.detailGridConfig.summaryFields.length > 0 ? (
                          ctrl.detailGridConfig.summaryFields.map((field) => {
                            const summary = calculateSummaryFieldValue(gridRows, field);
                            return (
                              <div
                                key={field.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--bg-surface, #ffffff)',
                                  border: '1px solid var(--border-subtle)',
                                  fontSize: '11px',
                                }}
                              >
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{field.label}:</span>
                                <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                                  {summary.formattedValue}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Rows: {gridRows.length}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (ctrl.type === 'button') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, display: 'flex', justifyContent: ctrl.alignment || 'flex-start' }}>
                    <button
                      type={ctrl.buttonAction?.actionType === 'submit' ? 'submit' : 'button'}
                      style={buttonStyles}
                    >
                      {ctrl.label || 'Submit Form'}
                    </button>
                  </div>
                );
              }

              if (ctrl.type === 'switch') {
                return (
                  <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={labelStyles}>
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
                    <span style={labelStyles}>
                      {ctrl.label}
                    </span>
                  </div>
                );
              }

              return (
                <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                  {ctrl.styling?.labelPosition !== 'hidden' && (
                    <label style={labelStyles}>
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
                      style={controlStyles}
                    />
                  ) : ctrl.type === 'select' || ctrl.type === 'lookup' || (ctrl.type as string) === 'lov' ? (
                    <select
                      value={val}
                      onChange={(e) => handleInputChange(fieldKey, e.target.value, ctrl)}
                      style={{
                        ...controlStyles,
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
                        style={controlStyles}
                      />
                    </div>
                  ) : ctrl.type === 'readonly' ? (
                    <div
                      style={{
                        ...controlStyles,
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
                      style={controlStyles}
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
