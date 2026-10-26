import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { formsApi } from '../../../api/forms.ts';
import {
  SavedForm,
  FormControl,
  FormType,
  FormDisplayMode,
  FormRecordResult,
  SingleRecordDetailsResult,
  LookupItem,
} from '../../../types/index.ts';
import { AdminLayoutOutletContext } from '../../../components/layout/AdminLayout.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  Edit2,
  Table,
  CheckCircle,
  AlertTriangle,
  Play,
  Layers,
  Search,
  Calendar,
  Clock,
  DollarSign,
  Hash,
  Maximize2,
  Minimize2,
  X,
  LayoutTemplate,
} from 'lucide-react';

export const FormRuntimePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const outletContext = useOutletContext<AdminLayoutOutletContext | undefined>();
  const isLayoutFullScreen = outletContext?.isFullScreenLayout;
  const setIsFullScreenLayout = outletContext?.setIsFullScreenLayout;

  const [form, setForm] = useState<SavedForm | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [formLoadError, setFormLoadError] = useState<string | null>(null);

  // Stable URL query parameters for fullscreen
  const isFsFromUrl = searchParams.get('mode') === 'fullscreen' || searchParams.get('fullscreen') === 'true';

  // Full-Screen State (Default on if URL query or layout context is fullscreen)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(() => {
    return isFsFromUrl || Boolean(isLayoutFullScreen);
  });

  // Keep a stable ref for toast notifications to avoid triggering effect re-runs
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Sync full-screen state with AdminLayout ONLY when values actually differ
  useEffect(() => {
    if (setIsFullScreenLayout && isLayoutFullScreen !== isFullScreen) {
      setIsFullScreenLayout(isFullScreen);
    }
  }, [isFullScreen, isLayoutFullScreen, setIsFullScreenLayout]);

  // Clean reset to false ONLY upon unmounting FormRuntimePage
  useEffect(() => {
    return () => {
      setIsFullScreenLayout?.(false);
    };
  }, [setIsFullScreenLayout]);

  // Runtime Records State
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(50);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Active Record Edit State (Single Form)
  const [activeRecord, setActiveRecord] = useState<Record<string, any>>({});
  const [activeDetails, setActiveDetails] = useState<Record<string, any[]>>({});
  const [deletedDetailIds, setDeletedDetailIds] = useState<Record<string, (string | number)[]>>({});
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Lookup LOV Caches (gridControlId -> options with full row data)
  const [lookupOptions, setLookupOptions] = useState<Record<string, LookupItem[]>>({});

  // 1. Load Form Definition (stable effect, no infinite re-runs)
  const fetchForm = useCallback(async () => {
    if (!id) return;
    setIsLoadingForm(true);
    setFormLoadError(null);
    try {
      const data = await formsApi.getForm(id);
      setForm(data);

      // Check if form is configured for full-screen mode
      if (
        data.display_mode === 'fullscreen' ||
        data.form_type === 'fullscreen' ||
        isFsFromUrl
      ) {
        setIsFullScreen(true);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to load form definition';
      setFormLoadError(msg);
      showToastRef.current(msg, 'error');
    } finally {
      setIsLoadingForm(false);
    }
  }, [id, isFsFromUrl]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // 2. Fetch Records List
  const sourceName = form?.source_name;
  const fetchRecordsList = useCallback(async () => {
    if (!id || !sourceName) return;
    setIsLoadingRecords(true);
    try {
      const res: FormRecordResult = await formsApi.fetchRecords(id, {
        page: currentPage,
        limit,
        search: searchTerm || undefined,
      });

      setRecords(res.data || []);
      setTotalRecords(res.pagination?.total || 0);

      if (res.data && res.data.length > 0) {
        setCurrentRecordIndex(0);
      } else {
        setActiveRecord({});
        setActiveDetails({});
      }
    } catch (err: any) {
      showToastRef.current(err.message || 'Failed to load records', 'error');
    } finally {
      setIsLoadingRecords(false);
    }
  }, [id, sourceName, currentPage, limit, searchTerm]);

  useEffect(() => {
    if (id && sourceName) {
      fetchRecordsList();
    }
  }, [id, sourceName, fetchRecordsList]);

  // 3. Load Active Master Record with its Master-Detail Child Rows (deduplicated by PK)
  const primaryKeyCol = form?.sourceSchema?.primaryKey || 'id';
  const currentRecord = records[currentRecordIndex];
  const currentRecordPkVal = currentRecord?.[primaryKeyCol];
  const lastLoadedPkRef = useRef<any>(null);

  const loadActiveRecordDetails = useCallback(
    async (recordId: string | number) => {
      if (!id) return;
      try {
        const detailsRes: SingleRecordDetailsResult = await formsApi.getRecordWithDetails(id, recordId);
        setActiveRecord(detailsRes.master || {});
        setActiveDetails(detailsRes.details || {});
        setDeletedDetailIds({});
        setIsNewRecord(false);
      } catch (err: any) {
        showToastRef.current(err.message || 'Failed to load record details', 'error');
      }
    },
    [id]
  );

  useEffect(() => {
    if (currentRecord) {
      if (currentRecordPkVal !== undefined && currentRecordPkVal !== null) {
        if (lastLoadedPkRef.current !== currentRecordPkVal) {
          lastLoadedPkRef.current = currentRecordPkVal;
          loadActiveRecordDetails(currentRecordPkVal);
        }
      } else {
        lastLoadedPkRef.current = null;
        setActiveRecord(currentRecord);
        setActiveDetails({});
      }
    }
  }, [currentRecord, currentRecordPkVal, loadActiveRecordDetails]);

  // 4. Fetch Lookup Data for any Lookup / LOV Controls (deduplicated by form controls key)
  const formControlsKey = useMemo(() => {
    if (!form || !form.controls) return '';
    return form.controls
      .map(
        (c) =>
          `${c.id}:${c.type}:${c.lookupConfig?.sourceType || ''}:${c.lookupConfig?.sourceTable || ''}:${c.lookupConfig?.sourceQueryId || ''}`
      )
      .join('|');
  }, [form]);

  const lastLoadedLookupsKeyRef = useRef<string>('');

  useEffect(() => {
    if (!form || !form.controls || formControlsKey === lastLoadedLookupsKeyRef.current) return;
    lastLoadedLookupsKeyRef.current = formControlsKey;

    form.controls.forEach((ctrl) => {
      // If static options are configured
      if (ctrl.lookupConfig?.sourceType === 'static' && ctrl.lookupConfig.staticOptions) {
        setLookupOptions((prev) => ({
          ...prev,
          [ctrl.id]: ctrl.lookupConfig!.staticOptions!.map((o) => ({ key: o.key, label: o.label, data: o })),
        }));
        return;
      }

      // If table or query source
      const sourceType = ctrl.lookupConfig?.sourceType || 'table';
      const sourceName = ctrl.lookupConfig?.sourceTable || ctrl.lookupConfig?.sourceQueryId;

      if (ctrl.lookupConfig && sourceName) {
        formsApi
          .getLookupData({
            sourceType: sourceType as 'table' | 'query',
            sourceName,
            returnColumn: ctrl.lookupConfig.returnColumn || 'id',
            displayColumn: ctrl.lookupConfig.displayColumn || 'name',
            filter: ctrl.lookupConfig.filter,
            limit: 100,
          })
          .then((opts) => {
            setLookupOptions((prev) => ({ ...prev, [ctrl.id]: opts }));
          })
          .catch((err) => console.error(`Lookup load error for control '${ctrl.label}':`, err));
      }
    });
  }, [form, formControlsKey]);

  // Manual Refresh Handler
  const handleRefresh = useCallback(() => {
    lastLoadedPkRef.current = null;
    fetchRecordsList();
    showToastRef.current('Data refreshed', 'info');
  }, [fetchRecordsList]);

  // Close / Exit Action (Returns cleanly to previous navigation state)
  const handleClose = useCallback(() => {
    if (setIsFullScreenLayout) {
      setIsFullScreenLayout(false);
    }
    if (isFullScreen && form?.display_mode !== 'fullscreen' && !isFsFromUrl) {
      setIsFullScreen(false);
    } else {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/admin/forms');
      }
    }
  }, [isFullScreen, form?.display_mode, isFsFromUrl, navigate, setIsFullScreenLayout]);

  // Record Navigation Handlers
  const handleFirstRecord = () => setCurrentRecordIndex(0);
  const handlePrevRecord = () => setCurrentRecordIndex((prev) => Math.max(0, prev - 1));
  const handleNextRecord = () => setCurrentRecordIndex((prev) => Math.min(records.length - 1, prev + 1));
  const handleLastRecord = () => setCurrentRecordIndex(records.length - 1);

  // New Record action
  const handleNewRecord = () => {
    setIsNewRecord(true);
    const blank: Record<string, any> = {};
    form?.controls.forEach((c) => {
      const key = c.fieldBinding || c.name;
      if (c.defaultValue !== undefined && c.defaultValue !== null) {
        blank[key] = c.defaultValue;
      }
    });
    setActiveRecord(blank);
    setActiveDetails({});
    setDeletedDetailIds({});
  };

  // Master Field Change with Dependent Field Auto-population
  const handleMasterFieldChange = (field: string, val: any, ctrl?: FormControl) => {
    setActiveRecord((prev) => {
      const next = { ...prev, [field]: val };

      // Check for dependent field mappings if this control has lookup auto-population configured
      if (ctrl?.lookupConfig?.dependentMappings && ctrl.lookupConfig.dependentMappings.length > 0) {
        const opts = lookupOptions[ctrl.id] || [];
        const matched = opts.find((o) => String(o.key) === String(val));
        if (matched?.data) {
          ctrl.lookupConfig.dependentMappings.forEach((m) => {
            if (m.sourceColumn && m.targetField && matched.data![m.sourceColumn] !== undefined) {
              next[m.targetField] = matched.data![m.sourceColumn];
            }
          });
        }
      }

      return next;
    });
  };

  // Detail Row Changes
  const handleAddDetailRow = (gridId: string, defaultCols: any[]) => {
    const newRow: Record<string, any> = { _tempId: Date.now(), _isNew: true };
    defaultCols.forEach((col) => {
      newRow[col.field] = col.type === 'number' ? 1 : col.type === 'currency' ? 0.0 : '';
    });
    setActiveDetails((prev) => ({
      ...prev,
      [gridId]: [...(prev[gridId] || []), newRow],
    }));
  };

  const handleRemoveDetailRow = (gridId: string, index: number, row: any) => {
    const pk = row.id;
    if (pk) {
      setDeletedDetailIds((prev) => ({
        ...prev,
        [gridId]: [...(prev[gridId] || []), pk],
      }));
    }
    setActiveDetails((prev) => ({
      ...prev,
      [gridId]: (prev[gridId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleDetailCellChange = (gridId: string, index: number, field: string, val: any) => {
    setActiveDetails((prev) => {
      const current = [...(prev[gridId] || [])];
      if (current[index]) {
        current[index] = { ...current[index], [field]: val, _isDirty: true };

        // Auto-calculate line total if quantity and unit price are edited
        if (field === 'quantity' || field === 'unit_price') {
          const qty = Number(current[index].quantity) || 0;
          const price = Number(current[index].unit_price) || 0;
          current[index].line_total = (qty * price).toFixed(2);
        }
      }

      // Recompute Master Total Amount if line totals changed
      if (form?.controls.some((c) => c.fieldBinding === 'total_amount')) {
        const grandTotal = current.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
        setActiveRecord((m) => ({ ...m, total_amount: grandTotal.toFixed(2) }));
      }

      return { ...prev, [gridId]: current };
    });
  };

  // Save Record with Master-Detail in Transaction
  const handleSaveRecord = async () => {
    if (!id || !form) return;
    setIsSaving(true);
    try {
      const pkCol = form.sourceSchema?.primaryKey || 'id';
      const masterRecordId = isNewRecord ? undefined : activeRecord[pkCol];

      // Prepare detail changes
      const detailsPayload: Record<string, any> = {};

      Object.entries(activeDetails).forEach(([gridId, rows]) => {
        const inserted = rows.filter((r) => r._isNew);
        const updated = rows.filter((r) => !r._isNew && r._isDirty);
        const deleted = deletedDetailIds[gridId] || [];

        detailsPayload[gridId] = {
          inserted,
          updated,
          deleted,
        };
      });

      const payload = {
        master: activeRecord,
        details: detailsPayload,
      };

      if (masterRecordId) {
        await formsApi.updateRecordWithDetails(id, masterRecordId, payload);
        showToast('Record and line items updated successfully.', 'success');
      } else {
        await formsApi.createRecordWithDetails(id, payload);
        showToast('New record and line items created successfully.', 'success');
        setIsNewRecord(false);
      }

      await fetchRecordsList();
    } catch (err: any) {
      showToast(err.message || 'Failed to save record', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async () => {
    if (!id || !form) return;
    const pkCol = form.sourceSchema?.primaryKey || 'id';
    const pkVal = activeRecord[pkCol];
    if (!pkVal) return;

    setIsDeleting(true);
    try {
      await formsApi.deleteRecord(id, pkVal);
      showToast('Record deleted successfully.', 'success');
      setDeleteConfirmOpen(false);
      await fetchRecordsList();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Keyboard Shortcuts (Escape to exit/close, Ctrl+S save, Ctrl+N new, Alt+Left/Right record nav)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveRecord();
      } else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewRecord();
      } else if (!isInput && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevRecord();
      } else if (!isInput && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextRecord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleSaveRecord, handleNewRecord, handlePrevRecord, handleNextRecord]);

  if (isLoadingForm) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <RefreshCw size={20} className="animate-spin" style={{ marginRight: '8px' }} />
        Loading form runtime...
      </div>
    );
  }

  if (formLoadError || !form) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '400px',
          padding: '32px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            padding: '32px 24px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-default, #cbd5e1)',
            boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))',
          }}
        >
          <AlertTriangle size={36} style={{ color: 'var(--status-danger-text, #ef4444)', margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Unable to Load Form
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
            {formLoadError || 'The requested form definition could not be found or loaded.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/forms')}>
              Back to Forms List
            </Button>
            <Button variant="primary" size="sm" onClick={fetchForm} leftIcon={<RefreshCw size={13} />}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pkCol = form.sourceSchema?.primaryKey || 'id';
  const currentPkVal = activeRecord[pkCol];
  const effectiveDisplayMode: FormDisplayMode =
    form.display_mode || (form.form_type === 'fullscreen' ? 'fullscreen' : form.form_type === 'popup' ? 'dialog' : 'embedded');

  const isRecordCanvasForm = form.form_type !== 'continuous' && form.form_type !== 'tabular';

  // Dedicated Form Header (Rendered in Full-Screen, Dialog, and Embedded modes)
  const renderDedicatedFormHeader = (inFullScreen: boolean, inDialog?: boolean) => {
    return (
      <div
        className="apex-form-runtime-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: inFullScreen ? '12px 24px' : '10px 20px',
          backgroundColor: 'var(--header-bg, var(--surface-1))',
          borderBottom: '1px solid var(--border-default, #cbd5e1)',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          zIndex: 10,
        }}
      >
        {/* Left: Back / Title / Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button
            onClick={handleClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid var(--input-border, #64748b)',
              backgroundColor: 'var(--input-bg, var(--surface-1))',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={inFullScreen ? 'Close Full-Screen View (Esc)' : 'Back to Forms Library (Esc)'}
          >
            {inFullScreen ? <X size={16} /> : <ArrowLeft size={16} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <LayoutTemplate size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: inFullScreen ? '16px' : '15px',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {form.name}
                </span>

                <Badge variant={form.status === 'published' ? 'success' : 'neutral'}>
                  {form.status === 'published' ? 'Published' : 'Draft'}
                </Badge>

                {inFullScreen && (
                  <Badge variant="info">
                    ⛶ Full-Screen View
                  </Badge>
                )}

                {inDialog && (
                  <Badge variant="neutral">
                    🪟 Dialog Mode
                  </Badge>
                )}

                {form.hasMasterDetail && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(99, 102, 241, 0.14)',
                      color: 'var(--brand-primary, #6366f1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <Layers size={11} />
                    Master-Detail
                  </span>
                )}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                Source: <code>{form.source_name || 'None'}</code> • {form.category || 'General'}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Record Navigator (Access / APEX style) */}
        {isRecordCanvasForm && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--surface-2, rgba(0,0,0,0.04))',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid var(--input-border, #64748b)',
            }}
          >
            <button
              onClick={handleFirstRecord}
              disabled={currentRecordIndex === 0 || isNewRecord}
              title="First Record"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '26px',
                border: 'none',
                background: 'none',
                color: 'var(--text-primary)',
                cursor: currentRecordIndex === 0 || isNewRecord ? 'not-allowed' : 'pointer',
                opacity: currentRecordIndex === 0 || isNewRecord ? 0.35 : 1,
              }}
            >
              <ChevronsLeft size={15} />
            </button>

            <button
              onClick={handlePrevRecord}
              disabled={currentRecordIndex === 0 || isNewRecord}
              title="Previous Record (Alt+Left)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '26px',
                border: 'none',
                background: 'none',
                color: 'var(--text-primary)',
                cursor: currentRecordIndex === 0 || isNewRecord ? 'not-allowed' : 'pointer',
                opacity: currentRecordIndex === 0 || isNewRecord ? 0.35 : 1,
              }}
            >
              <ChevronLeft size={15} />
            </button>

            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', padding: '0 8px', minWidth: '90px', textAlign: 'center' }}>
              {isNewRecord
                ? '★ New Record'
                : totalRecords === 0
                ? '0 of 0'
                : `Record ${currentRecordIndex + 1} of ${totalRecords}`}
            </span>

            <button
              onClick={handleNextRecord}
              disabled={currentRecordIndex >= records.length - 1 || isNewRecord}
              title="Next Record (Alt+Right)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '26px',
                border: 'none',
                background: 'none',
                color: 'var(--text-primary)',
                cursor: currentRecordIndex >= records.length - 1 || isNewRecord ? 'not-allowed' : 'pointer',
                opacity: currentRecordIndex >= records.length - 1 || isNewRecord ? 0.35 : 1,
              }}
            >
              <ChevronRight size={15} />
            </button>

            <button
              onClick={handleLastRecord}
              disabled={currentRecordIndex >= records.length - 1 || isNewRecord}
              title="Last Record"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '26px',
                border: 'none',
                background: 'none',
                color: 'var(--text-primary)',
                cursor: currentRecordIndex >= records.length - 1 || isNewRecord ? 'not-allowed' : 'pointer',
                opacity: currentRecordIndex >= records.length - 1 || isNewRecord ? 0.35 : 1,
              }}
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        )}

        {/* Right: Actions (New Record, Save, Delete, Refresh, Designer, FullScreen Toggle, Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isRecordCanvasForm && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNewRecord}
                leftIcon={<Plus size={13} />}
                disabled={isNewRecord}
                title="Create New Record (Ctrl+N)"
              >
                New Record
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveRecord}
                isLoading={isSaving}
                leftIcon={<Save size={13} />}
                title="Save Changes (Ctrl+S)"
              >
                Save
              </Button>

              {!isNewRecord && currentPkVal && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteConfirmOpen(true)}
                  leftIcon={<Trash2 size={13} />}
                  title="Delete Record"
                >
                  Delete
                </Button>
              )}
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            leftIcon={<RefreshCw size={13} />}
            title="Refresh Data"
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/forms/designer/${form.id}`)}
            leftIcon={<Edit2 size={13} />}
            title="Open in Visual Form Designer"
          >
            Designer
          </Button>

          {/* Full-Screen Toggle Button */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm, 4px)',
              border: '1px solid var(--input-border, #64748b)',
              backgroundColor: isFullScreen ? 'var(--brand-primary)' : 'var(--input-bg, var(--surface-1))',
              color: isFullScreen ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isFullScreen ? 'Exit Full-Screen (Esc)' : 'Enter Full-Screen Mode'}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Dedicated Close Button */}
          <Button
            size="sm"
            variant={inFullScreen ? 'secondary' : 'outline'}
            onClick={handleClose}
            leftIcon={<X size={13} />}
            title="Close Form (Esc)"
          >
            Close
          </Button>
        </div>
      </div>
    );
  };

  // Form Content Rendering (Single Record, Master-Detail, Continuous, Tabular)
  const renderFormContent = (inFullScreen: boolean) => {
    return (
      <>
        {/* A. RECORD CANVAS FORM (Single, Full-Screen, Dialog, Readonly) */}
        {isRecordCanvasForm && (
          <div
            style={{
              width: inFullScreen ? '100%' : (form.canvasLayout.width || '100%'),
              maxWidth: inFullScreen ? 'none' : '1040px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--border-default, #cbd5e1)',
              padding: form.canvasLayout.padding || (inFullScreen ? '28px 32px' : '24px'),
              boxShadow: inFullScreen ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.05)',
              alignSelf: inFullScreen ? 'stretch' : 'flex-start',
              boxSizing: 'border-box',
            }}
          >
            {form.controls.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <LayoutTemplate size={40} style={{ margin: '0 auto 14px', opacity: 0.5, color: 'var(--brand-primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  No Fields Configured
                </h3>
                <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 18px', color: 'var(--text-secondary)' }}>
                  This form does not have any controls placed on the canvas yet. Open it in the Visual Form Designer to add fields and configure data bindings.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate(`/admin/forms/designer/${form.id}`)}
                  leftIcon={<Edit2 size={13} />}
                >
                  Open Visual Form Designer
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: `${form.canvasLayout.gap ?? 16}px`,
                  width: '100%',
                }}
              >
                {form.controls.map((ctrl) => {
                  const colSpan = Math.min(12, Math.max(1, ctrl.colSpan || 6));
                  const fieldKey = ctrl.fieldBinding || ctrl.name;
                  const val = activeRecord[fieldKey] ?? '';

                  if (ctrl.type === 'section') {
                    return (
                      <div
                        key={ctrl.id}
                        style={{
                          gridColumn: `span ${colSpan}`,
                          borderBottom: '2px solid var(--border-default, #cbd5e1)',
                          paddingBottom: '6px',
                          marginTop: '8px',
                        }}
                      >
                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {ctrl.label}
                        </h3>
                      </div>
                    );
                  }

                  if (ctrl.type === 'heading') {
                    return (
                      <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '6px 0', color: 'var(--text-primary)' }}>
                          {ctrl.label}
                        </h2>
                      </div>
                    );
                  }

                  if (ctrl.type === 'divider') {
                    return (
                      <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-default, #cbd5e1)', margin: '8px 0' }} />
                      </div>
                    );
                  }

                  if (ctrl.type === 'button') {
                    return (
                      <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => {
                            if (ctrl.buttonAction?.actionType === 'submit') {
                              handleSaveRecord();
                            } else if (ctrl.buttonAction?.actionType === 'reset') {
                              handleNewRecord();
                            }
                          }}
                        >
                          {ctrl.label || 'Action Button'}
                        </Button>
                      </div>
                    );
                  }

                  // MASTER-DETAIL CHILD GRID
                  if (ctrl.type === 'datagrid' || ctrl.type === 'master_detail') {
                    const gridRows = activeDetails[ctrl.id] || [];
                    const cols = ctrl.detailGridConfig?.columns || [
                      { field: 'item_name', label: 'Item Name', width: '260px' },
                      { field: 'sku', label: 'SKU', width: '130px' },
                      { field: 'quantity', label: 'Qty', width: '80px', type: 'number' },
                      { field: 'unit_price', label: 'Unit Price ($)', width: '120px', type: 'currency' },
                      { field: 'line_total', label: 'Line Total ($)', width: '130px', type: 'currency' },
                    ];

                    return (
                      <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}`, marginTop: '8px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                            <Table size={15} style={{ color: 'var(--brand-primary)' }} />
                            <span>{ctrl.label || 'Detail Line Items'}</span>
                            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                              ({gridRows.length} rows)
                            </span>
                          </div>

                          {ctrl.detailGridConfig?.allowAdd !== false && (
                            <button
                              type="button"
                              onClick={() => handleAddDetailRow(ctrl.id, cols)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-sm, 4px)',
                                border: '1px solid var(--brand-primary)',
                                backgroundColor: 'var(--brand-primary-subtle, rgba(0,103,184,0.08))',
                                color: 'var(--brand-primary, #0067b8)',
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={12} />
                              Add Row
                            </button>
                          )}
                        </div>

                        {/* Detail Grid Table */}
                        <div
                          style={{
                            borderRadius: 'var(--radius-sm, 4px)',
                            border: '1px solid var(--border-default, #cbd5e1)',
                            overflowX: 'auto',
                            width: '100%',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--table-header-bg, var(--surface-2))', borderBottom: '1px solid var(--border-default, #cbd5e1)' }}>
                                {cols.map((c) => (
                                  <th key={c.field} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                    {c.label || c.field}
                                  </th>
                                ))}
                                <th style={{ width: '40px', padding: '6px 8px', textAlign: 'center' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {gridRows.length === 0 ? (
                                <tr>
                                  <td colSpan={cols.length + 1} style={{ padding: '18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No line items for this record. Click <strong>Add Row</strong> to add items.
                                  </td>
                                </tr>
                              ) : (
                                gridRows.map((row, rIdx) => (
                                  <tr key={row._tempId || row.id || rIdx} style={{ borderBottom: '1px solid var(--border-default, #cbd5e1)' }}>
                                    {cols.map((c) => (
                                      <td key={c.field} style={{ padding: '4px 6px' }}>
                                        <input
                                          type={c.type === 'number' || c.type === 'currency' ? 'number' : 'text'}
                                          value={row[c.field] ?? ''}
                                          disabled={c.editable === false}
                                          onChange={(e) => handleDetailCellChange(ctrl.id, rIdx, c.field, e.target.value)}
                                          style={{
                                            width: '100%',
                                            padding: '5px 8px',
                                            fontSize: '12px',
                                            borderRadius: 'var(--radius-input, 3px)',
                                            border: '1px solid var(--input-border, #64748b)',
                                            backgroundColor: c.editable === false ? 'var(--surface-2)' : 'var(--input-bg, var(--surface-1))',
                                            color: 'var(--input-text, var(--text-primary))',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                          }}
                                        />
                                      </td>
                                    ))}
                                    <td style={{ textAlign: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDetailRow(ctrl.id, rIdx, row)}
                                        title="Delete row"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-danger-text, #ef4444)' }}
                                      >
                                        <Trash2 size={13} />
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

                  // STANDARD DATA ENTRY CONTROLS
                  const opts = lookupOptions[ctrl.id] || ctrl.lookupConfig?.staticOptions || [];

                  return (
                    <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
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
                          {ctrl.validation?.required && <span style={{ color: 'var(--status-danger)' }}> *</span>}
                        </label>
                      )}

                      {/* Multiline Textarea */}
                      {ctrl.type === 'textarea' ? (
                        <textarea
                          value={val}
                          onChange={(e) => handleMasterFieldChange(fieldKey, e.target.value, ctrl)}
                          placeholder={ctrl.placeholder || `Enter ${ctrl.label}...`}
                          rows={3}
                          disabled={ctrl.disabled || ctrl.readOnly}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: '12px',
                            borderRadius: 'var(--radius-input, var(--radius-sm, 4px))',
                            border: '1px solid var(--input-border, #64748b)',
                            backgroundColor: ctrl.readOnly ? 'var(--surface-2)' : 'var(--input-bg, var(--surface-1))',
                            color: 'var(--input-text, var(--text-primary))',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : ctrl.type === 'select' || ctrl.type === 'lookup' || (ctrl.type as string) === 'lov' ? (
                        /* Dropdown / Select / Lookup / LOV */
                        <select
                          value={val}
                          onChange={(e) => handleMasterFieldChange(fieldKey, e.target.value, ctrl)}
                          disabled={ctrl.disabled || ctrl.readOnly}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: '12px',
                            borderRadius: 'var(--radius-input, var(--radius-sm, 4px))',
                            border: '1px solid var(--input-border, #64748b)',
                            backgroundColor: ctrl.readOnly ? 'var(--surface-2)' : 'var(--input-bg, var(--surface-1))',
                            color: 'var(--input-text, var(--text-primary))',
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">{ctrl.placeholder || `-- Select ${ctrl.label} --`}</option>
                          {opts.length > 0 ? (
                            opts.map((opt) => (
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
                              <option value="paid">Paid</option>
                              <option value="unpaid">Unpaid</option>
                            </>
                          )}
                        </select>
                      ) : ctrl.type === 'radio' ? (
                        /* Radio Buttons */
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '6px 0' }}>
                          {(opts.length > 0 ? opts : [{ key: 'yes', label: 'Yes' }, { key: 'no', label: 'No' }]).map((opt) => (
                            <label key={opt.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                              <input
                                type="radio"
                                name={`radio_${ctrl.id}`}
                                value={opt.key}
                                checked={String(val) === String(opt.key)}
                                disabled={ctrl.disabled || ctrl.readOnly}
                                onChange={() => handleMasterFieldChange(fieldKey, opt.key, ctrl)}
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : ctrl.type === 'switch' ? (
                        /* Switch */
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ctrl.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) => handleMasterFieldChange(fieldKey, e.target.checked, ctrl)}
                            disabled={ctrl.disabled || ctrl.readOnly}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      ) : ctrl.type === 'checkbox' ? (
                        /* Checkbox */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) => handleMasterFieldChange(fieldKey, e.target.checked, ctrl)}
                            disabled={ctrl.disabled || ctrl.readOnly}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ctrl.label}
                          </span>
                        </div>
                      ) : ctrl.type === 'currency' ? (
                        /* Currency Input with $ prefix */
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', pointerEvents: 'none' }}>
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={val}
                            onChange={(e) => handleMasterFieldChange(fieldKey, e.target.value, ctrl)}
                            placeholder={ctrl.placeholder || '0.00'}
                            disabled={ctrl.disabled || ctrl.readOnly}
                            style={{
                              width: '100%',
                              padding: '7px 10px 7px 24px',
                              fontSize: '12px',
                              borderRadius: 'var(--radius-input, var(--radius-sm, 4px))',
                              border: '1px solid var(--input-border, #64748b)',
                              backgroundColor: ctrl.readOnly ? 'var(--surface-2)' : 'var(--input-bg, var(--surface-1))',
                              color: 'var(--input-text, var(--text-primary))',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      ) : ctrl.type === 'readonly' ? (
                        /* Read-only / Display Field */
                        <div
                          style={{
                            padding: '7px 10px',
                            fontSize: '12px',
                            borderRadius: 'var(--radius-input, var(--radius-sm, 4px))',
                            border: '1px solid var(--input-border, #64748b)',
                            backgroundColor: 'var(--surface-2, rgba(0,0,0,0.03))',
                            color: 'var(--text-primary)',
                            fontWeight: 500,
                            minHeight: '34px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {String(val || '—')}
                        </div>
                      ) : (
                        /* Date, Time, DateTime, Number, Decimal, Email, Phone, Password, Text */
                        <input
                          type={
                            ctrl.type === 'date'
                              ? 'date'
                              : ctrl.type === 'time'
                              ? 'time'
                              : ctrl.type === 'datetime'
                              ? 'datetime-local'
                              : ctrl.type === 'number' || ctrl.type === 'decimal'
                              ? 'number'
                              : ctrl.type === 'email'
                              ? 'email'
                              : ctrl.type === 'phone'
                              ? 'tel'
                              : ctrl.type === 'password'
                              ? 'password'
                              : 'text'
                          }
                          step={ctrl.type === 'decimal' ? '0.01' : ctrl.type === 'number' ? '1' : undefined}
                          value={val}
                          onChange={(e) => handleMasterFieldChange(fieldKey, e.target.value, ctrl)}
                          placeholder={ctrl.placeholder || `Enter ${ctrl.label}...`}
                          disabled={ctrl.disabled || ctrl.readOnly}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: '12px',
                            borderRadius: 'var(--radius-input, var(--radius-sm, 4px))',
                            border: '1px solid var(--input-border, #64748b)',
                            backgroundColor: ctrl.readOnly ? 'var(--surface-2)' : 'var(--input-bg, var(--surface-1))',
                            color: 'var(--input-text, var(--text-primary))',
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
            )}
          </div>
        )}

        {/* B. CONTINUOUS FORM VIEW (Stream of cards) */}
        {form.form_type === 'continuous' && (
          <div style={{ width: '100%', maxWidth: inFullScreen ? 'none' : '1040px', display: 'flex', flexDirection: 'column', gap: '14px', alignSelf: inFullScreen ? 'stretch' : 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {totalRecords} Continuous Records
              </span>
            </div>

            {records.map((rec, rIdx) => (
              <div
                key={rec.id || rIdx}
                style={{
                  padding: inFullScreen ? '20px 24px' : '16px 20px',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  borderRadius: 'var(--radius-md, 6px)',
                  border: '1px solid var(--border-default, #cbd5e1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                {form.controls.map((ctrl) => {
                  const colSpan = Math.min(12, Math.max(1, ctrl.colSpan || 6));
                  const fieldKey = ctrl.fieldBinding || ctrl.name;
                  const val = rec[fieldKey] ?? '';

                  return (
                    <div key={ctrl.id} style={{ gridColumn: `span ${colSpan}` }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {ctrl.label}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {String(val || '—')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* C. TABULAR / GRID FORM VIEW (Spreadsheet) */}
        {form.form_type === 'tabular' && (
          <div
            style={{
              width: '100%',
              maxWidth: inFullScreen ? 'none' : '1100px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '6px',
              border: '1px solid var(--border-default, #cbd5e1)',
              overflowX: 'auto',
              alignSelf: inFullScreen ? 'stretch' : 'flex-start',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header-bg, var(--surface-2))', borderBottom: '1px solid var(--border-default, #cbd5e1)' }}>
                  {form.controls.map((ctrl) => (
                    <th key={ctrl.id} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {ctrl.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((rec, rIdx) => (
                  <tr key={rec.id || rIdx} style={{ borderBottom: '1px solid var(--border-default, #cbd5e1)' }}>
                    {form.controls.map((ctrl) => {
                      const fieldKey = ctrl.fieldBinding || ctrl.name;
                      const val = rec[fieldKey] ?? '';
                      return (
                        <td key={ctrl.id} style={{ padding: '6px 10px' }}>
                          <input
                            value={val}
                            onChange={(e) => {
                              const updated = [...records];
                              updated[rIdx][fieldKey] = e.target.value;
                              setRecords(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              fontSize: '12px',
                              borderRadius: 'var(--radius-input, 3px)',
                              border: '1px solid var(--input-border, #64748b)',
                              backgroundColor: 'var(--input-bg, var(--surface-1))',
                              color: 'var(--input-text, var(--text-primary))',
                              outline: 'none',
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  // Delete Confirmation Modal
  const deleteModal = (
    <Modal
      isOpen={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      title="Delete Form Record"
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--status-danger)' }}>
          <AlertTriangle size={24} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            Are you sure you want to delete this record?
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          This will permanently delete record <strong>#{currentPkVal}</strong> and all related line items in a transactional database cascade. This action cannot be undone.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteRecord} isLoading={isDeleting}>
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );

  // 1. TRUE FULL-SCREEN FORM MODE
  if (isFullScreen) {
    return (
      <div
        className="apex-fullscreen-form-shell"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {renderDedicatedFormHeader(true, false)}

        <div
          className="apex-fullscreen-form-canvas"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {renderFormContent(true)}
        </div>

        {deleteModal}
      </div>
    );
  }

  // 2. DIALOG / POPUP FORM MODE
  if (effectiveDisplayMode === 'dialog') {
    return (
      <div
        className="apex-dialog-form-backdrop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          className="apex-dialog-form-modal"
          style={{
            width: '92%',
            maxWidth: '1150px',
            maxHeight: '90vh',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: 'var(--radius-dialog, 8px)',
            border: '1px solid var(--border-default, #cbd5e1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {renderDedicatedFormHeader(false, true)}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
          >
            {renderFormContent(false)}
          </div>
        </div>

        {deleteModal}
      </div>
    );
  }

  // 3. EMBEDDED FORM MODE (Normal Dashboard View)
  return (
    <div
      className="apex-embedded-form-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-canvas, #f8fafc)',
        overflow: 'hidden',
      }}
    >
      {renderDedicatedFormHeader(false, false)}

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
        {renderFormContent(false)}
      </div>

      {deleteModal}
    </div>
  );
};
