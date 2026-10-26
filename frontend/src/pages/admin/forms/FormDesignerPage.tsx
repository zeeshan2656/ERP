import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsApi } from '../../../api/forms.ts';
import {
  SavedForm,
  FormControl,
  FormCanvasLayout,
  FormType,
  FormDisplayMode,
  FormStatus,
  FormSourceType,
  SourceSchema,
  EligibleDataSourcesResponse,
  MasterDetailConfig,
} from '../../../types/index.ts';
import { useToast } from '../../../components/ui/Toast.tsx';
import { FormDesignerHeader } from './designer/FormDesignerHeader.tsx';
import { DesignerToolboxPanel } from './designer/DesignerToolboxPanel.tsx';
import { DesignerCanvas } from './designer/DesignerCanvas.tsx';
import { DesignerPropertiesPanel } from './designer/DesignerPropertiesPanel.tsx';
import { FormPreviewModal } from './designer/FormPreviewModal.tsx';
import { createDefaultControl } from './designer/designerCatalog.ts';

interface HistorySnapshot {
  controls: FormControl[];
  layout: FormCanvasLayout;
  masterDetailConfig: MasterDetailConfig | null;
}

export const FormDesignerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isNewForm = !id || id === 'new';

  // Form Metadata State
  const [currentFormId, setCurrentFormId] = useState<string | null>(isNewForm ? null : id);
  const [formName, setFormName] = useState<string>(isNewForm ? 'Untitled Blank Form' : '');
  const [formDescription, setFormDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [formType, setFormType] = useState<FormType>('single');
  const [displayMode, setDisplayMode] = useState<FormDisplayMode>('embedded');
  const [status, setStatus] = useState<FormStatus>('draft');
  const [sourceType, setSourceType] = useState<FormSourceType>('table');
  const [sourceName, setSourceName] = useState<string>('');

  // Canvas & Controls State - starts completely blank!
  const [controls, setControls] = useState<FormControl[]>([]);
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [layout, setLayout] = useState<FormCanvasLayout>({
    width: '100%',
    padding: '24px',
    columns: 12,
    gap: 16,
    snapToGrid: true,
    gridSize: 8,
    showGridLines: true,
    zoomLevel: 1.0,
  });
  const [masterDetailConfig, setMasterDetailConfig] = useState<MasterDetailConfig | null>(null);

  // Designer View State
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Data Sources & Schema Discovery State
  const [eligibleSources, setEligibleSources] = useState<EligibleDataSourcesResponse>({ tables: [], queries: [] });
  const [sourceSchema, setSourceSchema] = useState<SourceSchema | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(false);
  const [isLoadingForm, setIsLoadingForm] = useState<boolean>(!isNewForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Undo / Redo History
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Push Snapshot to History
  const pushHistory = useCallback(
    (newControls: FormControl[], newLayout: FormCanvasLayout, newMasterDetail: MasterDetailConfig | null) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, { controls: newControls, layout: newLayout, masterDetailConfig: newMasterDetail }].slice(-25);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 24));
    },
    [historyIndex]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex - 1];
      setControls(target.controls);
      setLayout(target.layout);
      setMasterDetailConfig(target.masterDetailConfig);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex + 1];
      setControls(target.controls);
      setLayout(target.layout);
      setMasterDetailConfig(target.masterDetailConfig);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  // Fetch Eligible Data Sources
  useEffect(() => {
    const loadSources = async () => {
      try {
        const res = await formsApi.listEligibleDataSources();
        setEligibleSources(res);
      } catch (err) {
        console.error('Failed to load eligible data sources:', err);
      }
    };
    loadSources();
  }, []);

  // Fetch Schema when source changes
  const loadSchema = useCallback(
    async (type: FormSourceType, name: string) => {
      if (!name || type === 'none') {
        setSourceSchema(null);
        return;
      }
      setIsLoadingSchema(true);
      try {
        const schema = await formsApi.getSourceSchema(type, name);
        setSourceSchema(schema);
      } catch (err: any) {
        showToast(err.message || 'Failed to load source schema', 'error');
        setSourceSchema(null);
      } finally {
        setIsLoadingSchema(false);
      }
    },
    [showToast]
  );

  // Handle Source Selection Change
  const handleSourceChange = (newType: FormSourceType, newName: string) => {
    setSourceType(newType);
    setSourceName(newName);
    if (newName) {
      loadSchema(newType, newName);
    } else {
      setSourceSchema(null);
    }
  };

  // Load Existing Form
  useEffect(() => {
    if (isNewForm) {
      // Start with a completely blank canvas!
      setControls([]);
      setSelectedControlId(null);
      pushHistory([], layout, null);
      return;
    }

    const loadForm = async () => {
      setIsLoadingForm(true);
      try {
        const form = await formsApi.getForm(id);
        setCurrentFormId(form.id);
        setFormName(form.name);
        setFormDescription(form.description || '');
        setCategory(form.category || 'General');
        setFormType(form.form_type || 'single');
        setDisplayMode(form.display_mode || (form.form_type === 'fullscreen' ? 'fullscreen' : form.form_type === 'popup' ? 'dialog' : 'embedded'));
        setStatus(form.status || 'draft');
        setSourceType(form.source_type || 'table');
        setSourceName(form.source_name || '');

        const initialControls = form.controls || [];
        const initialLayout = { ...layout, ...(form.canvasLayout || {}) };
        const initialMasterDetail = form.masterDetailConfig || null;

        setControls(initialControls);
        setLayout(initialLayout);
        setMasterDetailConfig(initialMasterDetail);

        if (form.source_name && form.source_type) {
          loadSchema(form.source_type, form.source_name);
        }

        pushHistory(initialControls, initialLayout, initialMasterDetail);
      } catch (err: any) {
        showToast(err.message || 'Failed to load form definition', 'error');
        navigate('/admin/forms');
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadForm();
  }, [id, isNewForm, navigate, showToast, loadSchema]);

  // Controls Management Handlers
  const handleAddControl = (newControl: FormControl) => {
    const updated = [...controls, newControl];
    setControls(updated);
    setSelectedControlId(newControl.id);
    pushHistory(updated, layout, masterDetailConfig);
  };

  const handleUpdateControl = (controlId: string, updates: Partial<FormControl>) => {
    const updated = controls.map((ctrl) => (ctrl.id === controlId ? { ...ctrl, ...updates } : ctrl));
    setControls(updated);
    pushHistory(updated, layout, masterDetailConfig);
  };

  const handleDeleteControl = (controlId: string) => {
    const updated = controls.filter((ctrl) => ctrl.id !== controlId);
    setControls(updated);
    if (selectedControlId === controlId) {
      setSelectedControlId(null);
    }
    pushHistory(updated, layout, masterDetailConfig);
  };

  const handleDuplicateControl = (controlId: string) => {
    const target = controls.find((ctrl) => ctrl.id === controlId);
    if (!target) return;

    const cloned: FormControl = {
      ...JSON.parse(JSON.stringify(target)),
      id: `ctrl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: `${target.label} (Copy)`,
      name: `${target.name}_copy`,
    };

    const targetIndex = controls.findIndex((ctrl) => ctrl.id === controlId);
    const updated = [...controls];
    updated.splice(targetIndex + 1, 0, cloned);

    setControls(updated);
    setSelectedControlId(cloned.id);
    pushHistory(updated, layout, masterDetailConfig);
  };

  // Keyboard Shortcuts (Delete, Escape, Ctrl+Z, Ctrl+Y, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedControlId) {
        e.preventDefault();
        handleDeleteControl(selectedControlId);
      } else if (e.key === 'Escape') {
        setSelectedControlId(null);
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      } else if (e.ctrlKey && e.key === 'd' && selectedControlId) {
        e.preventDefault();
        handleDuplicateControl(selectedControlId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedControlId, handleUndo, handleRedo]);

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const payload: Partial<SavedForm> = {
        name: formName.trim() || 'Untitled Form',
        description: formDescription,
        category,
        form_type: formType,
        display_mode: displayMode,
        status: 'draft',
        source_type: sourceType,
        source_name: sourceName || null,
        canvasLayout: layout,
        controls,
        masterDetailConfig,
      };

      if (currentFormId) {
        const updated = await formsApi.updateForm(currentFormId, payload);
        setStatus('draft');
        showToast(`Draft '${updated.name}' saved successfully`, 'success');
      } else {
        const created = await formsApi.createForm(payload);
        setCurrentFormId(created.id);
        setStatus('draft');
        showToast(`Form '${created.name}' created as draft`, 'success');
        navigate(`/admin/forms/designer/${created.id}`, { replace: true });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save form draft', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Form
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // 1. Save changes first
      const payload: Partial<SavedForm> = {
        name: formName.trim() || 'Untitled Form',
        description: formDescription,
        category,
        form_type: formType,
        display_mode: displayMode,
        source_type: sourceType,
        source_name: sourceName || null,
        canvasLayout: layout,
        controls,
        masterDetailConfig,
      };

      let formIdToPublish = currentFormId;
      if (formIdToPublish) {
        await formsApi.updateForm(formIdToPublish, payload);
      } else {
        const created = await formsApi.createForm(payload);
        formIdToPublish = created.id;
        setCurrentFormId(created.id);
        navigate(`/admin/forms/designer/${created.id}`, { replace: true });
      }

      // 2. Publish
      const published = await formsApi.publishForm(formIdToPublish);
      setStatus('published');
      showToast(`Form '${published.name}' published successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to publish form', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Navigate to Run Form
  const handleRunForm = () => {
    if (currentFormId) {
      const isFs = displayMode === 'fullscreen' || formType === 'fullscreen';
      navigate(`/admin/forms/run/${currentFormId}${isFs ? '?fullscreen=true' : ''}`);
    }
  };

  // Check if form has Master-Detail
  const hasMasterDetail = Boolean(
    controls.some((c) => c.type === 'datagrid' || c.type === 'master_detail') ||
      (masterDetailConfig && masterDetailConfig.details?.length > 0)
  );

  const selectedControl = controls.find((c) => c.id === selectedControlId) || null;

  if (isLoadingForm) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading form definition...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-canvas, #f8fafc)',
      }}
    >
      {/* Top Designer Header */}
      <FormDesignerHeader
        formName={formName}
        onFormNameChange={setFormName}
        formType={formType}
        onFormTypeChange={setFormType}
        status={status}
        isSaving={isSaving}
        isPublishing={isPublishing}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        showGridLines={showGridLines}
        onToggleGridLines={() => setShowGridLines(!showGridLines)}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        onSave={handleSaveDraft}
        onPublish={handlePublish}
        onPreview={() => setIsPreviewOpen(true)}
        onRunForm={currentFormId ? handleRunForm : undefined}
        isNewForm={!currentFormId}
        hasMasterDetail={hasMasterDetail}
      />

      {/* 3-Column Studio Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          flex: 1,
          height: 'calc(100% - 50px)',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left Panel: Toolbox, Data Fields, Source */}
        <DesignerToolboxPanel
          onAddControl={handleAddControl}
          sourceType={sourceType}
          sourceName={sourceName}
          onSourceChange={handleSourceChange}
          sourceSchema={sourceSchema}
          eligibleSources={eligibleSources}
          isLoadingSchema={isLoadingSchema}
          onReloadSchema={() => loadSchema(sourceType, sourceName)}
        />

        {/* Center Panel: Visual 12-Column Canvas */}
        <DesignerCanvas
          controls={controls}
          selectedControlId={selectedControlId}
          onSelectControl={setSelectedControlId}
          onUpdateControl={handleUpdateControl}
          onDeleteControl={handleDeleteControl}
          onDuplicateControl={handleDuplicateControl}
          onAddControl={handleAddControl}
          layout={layout}
          zoomLevel={zoomLevel}
          showGridLines={showGridLines}
          deviceMode={deviceMode}
          formType={formType}
        />

        {/* Right Panel: Context-Sensitive Properties Inspector */}
        <DesignerPropertiesPanel
          allControls={controls}
          selectedControl={selectedControl}
          onUpdateControl={handleUpdateControl}
          onDeleteControl={handleDeleteControl}
          onDuplicateControl={handleDuplicateControl}
          formName={formName}
          onFormNameChange={setFormName}
          formDescription={formDescription}
          onFormDescriptionChange={setFormDescription}
          category={category}
          onCategoryChange={setCategory}
          formType={formType}
          onFormTypeChange={setFormType}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          layout={layout}
          onUpdateLayout={(updates) => {
            const next = { ...layout, ...updates };
            setLayout(next);
            pushHistory(controls, next, masterDetailConfig);
          }}
          sourceSchema={sourceSchema}
          eligibleSources={eligibleSources}
          masterDetailConfig={masterDetailConfig}
          onUpdateMasterDetailConfig={setMasterDetailConfig}
        />
      </div>

      {/* Live Interactive Preview Modal */}
      <FormPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        formName={formName}
        formType={formType}
        controls={controls}
        layout={layout}
      />
    </div>
  );
};
