import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { FormType, FormStatus } from '../../../../types/index.ts';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Play,
  Eye,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  Edit2,
} from 'lucide-react';

export interface FormDesignerHeaderProps {
  formName: string;
  onFormNameChange: (newName: string) => void;
  formType: FormType;
  onFormTypeChange: (newType: FormType) => void;
  status: FormStatus;
  isSaving: boolean;
  isPublishing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  showGridLines: boolean;
  onToggleGridLines: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  onDeviceModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onPreview: () => void;
  onRunForm?: () => void;
  isNewForm: boolean;
  hasMasterDetail?: boolean;
}

export const FormDesignerHeader: React.FC<FormDesignerHeaderProps> = ({
  formName,
  onFormNameChange,
  formType,
  onFormTypeChange,
  status,
  isSaving,
  isPublishing,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomLevel,
  onZoomChange,
  showGridLines,
  onToggleGridLines,
  snapToGrid,
  onToggleSnapToGrid,
  deviceMode,
  onDeviceModeChange,
  onSave,
  onPublish,
  onPreview,
  onRunForm,
  isNewForm,
  hasMasterDetail,
}) => {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(formName);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onFormNameChange(tempTitle.trim());
    } else {
      setTempTitle(formName);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        backgroundColor: 'var(--bg-surface, #ffffff)',
        borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        gap: '12px',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Left: Back, Editable Title, Type Selector, Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <button
          onClick={() => navigate('/admin/forms')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm, 4px)',
            border: '1px solid var(--border-subtle, #cbd5e1)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary, #475569)',
            cursor: 'pointer',
          }}
          title="Back to Forms Library"
        >
          <ArrowLeft size={15} />
        </button>

        {/* Editable Title */}
        {isEditingTitle ? (
          <input
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTempTitle(formName);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            style={{
              fontSize: '15px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid var(--brand-primary, #0067b8)',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-primary)',
              outline: 'none',
              minWidth: '220px',
            }}
          />
        ) : (
          <div
            onClick={() => {
              setTempTitle(formName);
              setIsEditingTitle(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '15px',
              color: 'var(--text-primary)',
            }}
            title="Click to rename form"
          >
            <span>{formName || 'Untitled Blank Form'}</span>
            <Edit2 size={12} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Form Type Selector */}
        <select
          value={formType}
          onChange={(e) => onFormTypeChange(e.target.value as FormType)}
          style={{
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm, 4px)',
            border: '1px solid var(--border-subtle, #cbd5e1)',
            backgroundColor: 'var(--surface-2, rgba(0,0,0,0.04))',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <option value="single">Single Record Form</option>
          <option value="continuous">Continuous Form</option>
          <option value="tabular">Tabular / Grid Form</option>
          <option value="popup">Popup / Dialog Form</option>
          <option value="fullscreen">Full-Screen Form</option>
          <option value="readonly">Read-Only View</option>
        </select>

        {/* Badges */}
        {hasMasterDetail && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--brand-primary, #6366f1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <Layers size={11} />
            Master-Detail
          </span>
        )}

        <Badge variant={status === 'published' ? 'success' : 'neutral'}>
          {status === 'published' ? 'Published' : 'Draft'}
        </Badge>
      </div>

      {/* Center: Device Mode & Zoom & Grid Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', borderRight: '1px solid var(--border-subtle, #e2e8f0)', paddingRight: '8px' }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: canUndo ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.4,
            }}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: canRedo ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.4,
            }}
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Device Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface-2, rgba(0,0,0,0.04))',
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '2px',
          }}
        >
          <button
            onClick={() => onDeviceModeChange('desktop')}
            title="Desktop Layout (100%)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: deviceMode === 'desktop' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color: deviceMode === 'desktop' ? 'var(--brand-primary, #0067b8)' : 'var(--text-muted)',
              fontWeight: deviceMode === 'desktop' ? 600 : 400,
              fontSize: '11px',
              cursor: 'pointer',
              boxShadow: deviceMode === 'desktop' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Monitor size={13} />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => onDeviceModeChange('tablet')}
            title="Tablet Layout (768px)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: deviceMode === 'tablet' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color: deviceMode === 'tablet' ? 'var(--brand-primary, #0067b8)' : 'var(--text-muted)',
              fontWeight: deviceMode === 'tablet' ? 600 : 400,
              fontSize: '11px',
              cursor: 'pointer',
              boxShadow: deviceMode === 'tablet' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Tablet size={13} />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => onDeviceModeChange('mobile')}
            title="Mobile Layout (375px)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: deviceMode === 'mobile' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color: deviceMode === 'mobile' ? 'var(--brand-primary, #0067b8)' : 'var(--text-muted)',
              fontWeight: deviceMode === 'mobile' ? 600 : 400,
              fontSize: '11px',
              cursor: 'pointer',
              boxShadow: deviceMode === 'mobile' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Smartphone size={13} />
            <span>Mobile</span>
          </button>
        </div>

        {/* Grid & Snap Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', borderLeft: '1px solid var(--border-subtle, #e2e8f0)', paddingLeft: '8px' }}>
          <button
            onClick={onToggleGridLines}
            title={showGridLines ? 'Hide Grid' : 'Show Grid'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: showGridLines ? 'var(--brand-primary-subtle, rgba(0,103,184,0.1))' : 'transparent',
              color: showGridLines ? 'var(--brand-primary, #0067b8)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <Grid size={13} />
          </button>
          <button
            onClick={onToggleSnapToGrid}
            title={snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: snapToGrid ? 'var(--brand-primary-subtle, rgba(0,103,184,0.1))' : 'transparent',
              color: snapToGrid ? 'var(--brand-primary, #0067b8)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <Magnet size={13} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={() => onZoomChange(Math.max(0.6, zoomLevel - 0.1))}
            title="Zoom Out"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <ZoomOut size={13} />
          </button>
          <span
            onClick={() => onZoomChange(1.0)}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              minWidth: '38px',
              textAlign: 'center',
            }}
            title="Click to reset zoom (100%)"
          >
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(1.6, zoomLevel + 0.1))}
            title="Zoom In"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* Right: Preview, Run, Save, Publish */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          leftIcon={<Eye size={13} />}
          title="Open interactive form preview"
        >
          Preview
        </Button>

        {onRunForm && !isNewForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRunForm}
            leftIcon={<Play size={13} />}
            title="Open Form in live runtime data-entry mode"
          >
            Run
          </Button>
        )}

        <Button
          size="sm"
          variant="secondary"
          onClick={onSave}
          isLoading={isSaving}
          leftIcon={<Save size={13} />}
        >
          Save Draft
        </Button>

        <Button
          size="sm"
          variant="primary"
          onClick={onPublish}
          isLoading={isPublishing}
          leftIcon={<CheckCircle size={13} />}
        >
          Publish
        </Button>
      </div>
    </div>
  );
};
