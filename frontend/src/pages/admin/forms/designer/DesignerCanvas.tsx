import React, { useRef } from 'react';
import { FormControl, FormCanvasLayout, FormType } from '../../../../types/index.ts';
import { createDefaultControl } from './designerCatalog.ts';
import {
  Copy,
  Trash2,
  GripHorizontal,
  Plus,
  Minus,
  Table,
  CheckSquare,
  Calendar,
  ToggleLeft,
  ChevronDown,
  Layers,
  Search,
  Upload,
  Play,
  Calculator,
} from 'lucide-react';

export interface DesignerCanvasProps {
  controls: FormControl[];
  selectedControlId: string | null;
  onSelectControl: (id: string | null) => void;
  onUpdateControl: (id: string, updates: Partial<FormControl>) => void;
  onDeleteControl: (id: string) => void;
  onDuplicateControl: (id: string) => void;
  onAddControl: (control: FormControl) => void;
  layout: FormCanvasLayout;
  zoomLevel: number;
  showGridLines: boolean;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  formType: FormType;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  controls,
  selectedControlId,
  onSelectControl,
  onUpdateControl,
  onDeleteControl,
  onDuplicateControl,
  onAddControl,
  layout,
  zoomLevel,
  showGridLines,
  deviceMode,
  formType,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle Drop from Toolbox or Fields
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.type) {
        const newCtrl = createDefaultControl(data.type, data.defaultLabel);
        onAddControl(newCtrl);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // Calculate container max width based on device mode
  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  // Render individual control in designer mode
  const renderControlMock = (ctrl: FormControl) => {
    const isSelected = ctrl.id === selectedControlId;

    return (
      <div
        key={ctrl.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectControl(ctrl.id);
        }}
        style={{
          gridColumn: `span ${Math.min(12, Math.max(1, ctrl.colSpan || 6))}`,
          position: 'relative',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm, 4px)',
          border: isSelected ? '2px solid var(--brand-primary, #0067b8)' : '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: isSelected ? 'var(--brand-primary-subtle, rgba(0,103,184,0.03))' : 'var(--bg-surface, #ffffff)',
          boxShadow: isSelected ? '0 0 0 3px rgba(0, 103, 184, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          cursor: 'pointer',
        }}
      >
        {/* Selection Mini Toolbar */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '-26px',
              right: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              border: '1px solid var(--brand-primary, #0067b8)',
              borderRadius: '4px',
              padding: '2px 4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-primary)', padding: '0 4px' }}>
              {ctrl.type} ({ctrl.colSpan || 6}/12)
            </span>

            {/* Decrease ColSpan */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateControl(ctrl.id, { colSpan: Math.max(1, (ctrl.colSpan || 6) - 1) });
              }}
              title="Decrease width (-1 column)"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', color: 'var(--text-secondary)' }}
            >
              <Minus size={11} />
            </button>

            {/* Increase ColSpan */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateControl(ctrl.id, { colSpan: Math.min(12, (ctrl.colSpan || 6) + 1) });
              }}
              title="Increase width (+1 column)"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', color: 'var(--text-secondary)' }}
            >
              <Plus size={11} />
            </button>

            {/* Duplicate */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateControl(ctrl.id);
              }}
              title="Duplicate control"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', color: 'var(--text-secondary)' }}
            >
              <Copy size={11} />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteControl(ctrl.id);
              }}
              title="Delete control"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', color: 'var(--status-danger-text, #ef4444)' }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}

        {/* Control Content Mockup */}
        {ctrl.type === 'section' ? (
          <div style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {ctrl.label || 'Section Header'}
            </h3>
          </div>
        ) : ctrl.type === 'heading' ? (
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
            {ctrl.label || 'Heading'}
          </h2>
        ) : ctrl.type === 'divider' ? (
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />
        ) : ctrl.type === 'spacer' ? (
          <div style={{ height: ctrl.height || '24px', backgroundColor: 'var(--surface-2)', borderRadius: '3px', opacity: 0.4 }} />
        ) : ctrl.type === 'datagrid' || ctrl.type === 'master_detail' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                <Table size={14} style={{ color: 'var(--brand-primary)' }} />
                <span>{ctrl.label || 'Detail Records Grid'}</span>
                {ctrl.detailGridConfig?.detailTable && (
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    {ctrl.detailGridConfig.detailTable}
                  </span>
                )}
              </div>
              <button
                type="button"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--surface-0)',
                  color: 'var(--brand-primary)',
                  cursor: 'pointer',
                }}
              >
                + Add Row
              </button>
            </div>

            {/* Table Mockup */}
            <div
              style={{
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                fontSize: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--surface-2, rgba(0,0,0,0.04))',
                  fontWeight: 600,
                  padding: '6px 10px',
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {(ctrl.detailGridConfig?.columns && ctrl.detailGridConfig.columns.length > 0) ? (
                  ctrl.detailGridConfig.columns.map((c) => (
                    <div key={c.field} style={{ flex: 1, minWidth: c.width || '100px' }}>
                      {c.label || c.field}
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ flex: 2 }}>Item Name</div>
                    <div style={{ flex: 1 }}>SKU</div>
                    <div style={{ flex: 1 }}>Qty</div>
                    <div style={{ flex: 1 }}>Price ($)</div>
                    <div style={{ flex: 1 }}>Total ($)</div>
                  </>
                )}
                <div style={{ width: '50px', textAlign: 'right' }}>Actions</div>
              </div>

              <div style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '11px' }}>
                Master-Detail Grid: child rows load dynamically when master record is selected.
              </div>
            </div>
          </div>
        ) : ctrl.type === 'button' ? (
          <div style={{ display: 'flex', justifyContent: ctrl.alignment || 'flex-start' }}>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--brand-primary, #0067b8)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <Play size={12} />
              <span>{ctrl.label || 'Action Button'}</span>
            </button>
          </div>
        ) : ctrl.type === 'switch' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {ctrl.label}
              {ctrl.validation?.required && <span style={{ color: 'red' }}> *</span>}
            </span>
            <div
              style={{
                width: '32px',
                height: '18px',
                borderRadius: '9px',
                backgroundColor: 'var(--surface-2, #cbd5e1)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                }}
              />
            </div>
          </div>
        ) : ctrl.type === 'checkbox' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-0)',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {ctrl.label}
              {ctrl.validation?.required && <span style={{ color: 'red' }}> *</span>}
            </span>
          </div>
        ) : (
          <div>
            {ctrl.styling?.labelPosition !== 'hidden' && (
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'var(--text-primary)',
                }}
              >
                {ctrl.label}
                {ctrl.validation?.required && <span style={{ color: 'var(--status-danger-text, #ef4444)' }}> *</span>}
                {ctrl.fieldBinding && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                    ({ctrl.fieldBinding})
                  </span>
                )}
              </label>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--border-subtle, #cbd5e1)',
                backgroundColor: 'var(--surface-0, #ffffff)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                minHeight: ctrl.type === 'textarea' ? '60px' : '30px',
              }}
            >
              {ctrl.type === 'date' ? (
                <>
                  <Calendar size={13} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                  <span>YYYY-MM-DD</span>
                </>
              ) : ctrl.type === 'select' || ctrl.type === 'lookup' ? (
                <>
                  <span style={{ flex: 1 }}>{ctrl.placeholder || `Select ${ctrl.label}...`}</span>
                  <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
                </>
              ) : (
                <span>{ctrl.placeholder || `Enter ${ctrl.label.toLowerCase()}...`}</span>
              )}
            </div>

            {ctrl.helpText && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {ctrl.helpText}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelectControl(null)}
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'var(--bg-canvas, #f8fafc)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundImage: showGridLines
          ? 'radial-gradient(var(--border-subtle, #cbd5e1) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '16px 16px',
      }}
    >
      {/* Resizable Canvas Workspace */}
      <div
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width: getDeviceWidth(),
          maxWidth: '100%',
          minHeight: '600px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: 'var(--radius-md, 6px)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          boxShadow: deviceMode !== 'desktop' ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
          padding: layout.padding || '24px',
          boxSizing: 'border-box',
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: 'width 0.2s ease, transform 0.1s ease',
        }}
      >
        {/* Blank Canvas State */}
        {controls.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              border: '2px dashed var(--border-subtle, #cbd5e1)',
              borderRadius: 'var(--radius-md, 6px)',
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--surface-2, rgba(0,0,0,0.01))',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-primary-subtle, rgba(0,103,184,0.08))',
                color: 'var(--brand-primary, #0067b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Plus size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Completely Blank Canvas
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 0 16px', lineHeight: 1.5 }}>
              Drag controls from the <strong>Toolbox</strong> on the left, or click fields in the <strong>Data Fields</strong> panel to design your layout from scratch.
            </p>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}>
                12-Column Responsive Grid
              </span>
              <span style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}>
                Master-Detail Supported
              </span>
            </div>
          </div>
        ) : (
          /* 12-Column Grid Layout */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: `${layout.gap ?? 16}px`,
              alignItems: 'start',
            }}
          >
            {controls.map(renderControlMock)}
          </div>
        )}
      </div>
    </div>
  );
};
