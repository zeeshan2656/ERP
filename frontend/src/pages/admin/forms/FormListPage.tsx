import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formsApi } from '../../../api/forms.ts';
import { SavedForm, FormType } from '../../../types/index.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { Column } from '../../../components/ui/Table.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import {
  OperationsPageLayout,
  OperationsCard,
  RunIconButton,
  EditIconButton,
  DeleteIconButton,
  CopyIconButton,
  OperationsIconButton,
} from '../../../components/operations/index.ts';
import { RenameFormModal } from './components/RenameFormModal.tsx';
import { DuplicateFormModal } from './components/DuplicateFormModal.tsx';
import { ImportFormModal } from './components/ImportFormModal.tsx';
import {
  Plus,
  RefreshCw,
  Search,
  Play,
  Edit2,
  Copy,
  Trash2,
  Layers,
  Database,
  Download,
  Upload,
  AlertTriangle,
  LayoutTemplate,
  CheckCircle,
  Eye,
  FileSpreadsheet,
  Grid,
  Maximize2,
} from 'lucide-react';

export const FormListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [forms, setForms] = useState<SavedForm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Multi-Selection State
  const [selectedFormIds, setSelectedFormIds] = useState<(string | number)[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Modals state
  const [deleteConfirmForm, setDeleteConfirmForm] = useState<SavedForm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameTargetForm, setRenameTargetForm] = useState<SavedForm | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [duplicateTargetForm, setDuplicateTargetForm] = useState<SavedForm | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch forms & categories
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, catRes] = await Promise.allSettled([
        formsApi.listForms(),
        formsApi.getCategories(),
      ]);

      if (listRes.status === 'fulfilled') {
        setForms(listRes.value || []);
      } else {
        showToast('Failed to load saved forms', 'error');
      }

      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load forms', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab Filtering
  const filteredForms = useMemo(() => {
    switch (activeTab) {
      case 'single':
        return forms.filter((f) => f.form_type === 'single' && !f.hasMasterDetail);
      case 'master_detail':
        return forms.filter((f) => f.hasMasterDetail || f.masterDetailConfig?.details?.length);
      case 'continuous_tabular':
        return forms.filter((f) => f.form_type === 'continuous' || f.form_type === 'tabular');
      case 'fullscreen':
        return forms.filter((f) => f.display_mode === 'fullscreen' || f.form_type === 'fullscreen');
      case 'drafts':
        return forms.filter((f) => f.status === 'draft');
      case 'published':
        return forms.filter((f) => f.status === 'published');
      default:
        return forms;
    }
  }, [forms, activeTab]);

  // Actions Handlers
  const handleRunForm = (form: SavedForm, forceFullscreen?: boolean) => {
    const isFs = forceFullscreen || form.display_mode === 'fullscreen' || form.form_type === 'fullscreen';
    navigate(`/admin/forms/run/${form.id}${isFs ? '?fullscreen=true' : ''}`);
  };

  const handleOpenDesigner = (form: SavedForm) => {
    navigate(`/admin/forms/designer/${form.id}`);
  };

  const handleCreateNewForm = () => {
    navigate('/admin/forms/new');
  };

  const handleDuplicate = async (formId: string, newName: string) => {
    setIsDuplicating(true);
    try {
      const cloned = await formsApi.duplicateForm(formId, newName);
      showToast(`Form duplicated as '${cloned.name}'`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate form', 'error');
    } finally {
      setIsDuplicating(false);
      setDuplicateTargetForm(null);
    }
  };

  const handleRename = async (formId: string, newName: string, newDescription?: string) => {
    setIsRenaming(true);
    try {
      await formsApi.updateForm(formId, { name: newName, description: newDescription });
      showToast('Form updated successfully', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to rename form', 'error');
    } finally {
      setIsRenaming(false);
      setRenameTargetForm(null);
    }
  };

  const handleTogglePublish = async (form: SavedForm) => {
    try {
      if (form.status === 'published') {
        await formsApi.unpublishForm(form.id);
        showToast(`Form '${form.name}' reverted to draft`, 'info');
      } else {
        await formsApi.publishForm(form.id);
        showToast(`Form '${form.name}' published successfully`, 'success');
      }
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update form publish status', 'error');
    }
  };

  const handleExport = async (form: SavedForm) => {
    try {
      const data = await formsApi.exportForm(form.id);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.slug || 'form'}-definition.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported '${form.name}' definition`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    }
  };

  const handleImport = async (definition: any) => {
    setIsImporting(true);
    try {
      const imported = await formsApi.importForm(definition);
      showToast(`Form '${imported.name}' imported successfully`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to import form', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmForm) return;
    setIsDeleting(true);
    try {
      await formsApi.deleteForm(deleteConfirmForm.id);
      showToast(`Form '${deleteConfirmForm.name}' deleted`, 'success');
      setDeleteConfirmForm(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete form', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFormIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      let successCount = 0;
      for (const id of selectedFormIds) {
        try {
          await formsApi.deleteForm(String(id));
          successCount++;
        } catch (err) {
          console.error(`Failed to delete form ${id}:`, err);
        }
      }
      showToast(`Successfully deleted ${successCount} form(s)`, 'success');
      setSelectedFormIds([]);
      await fetchData();
    } catch (err: any) {
      showToast('Bulk delete operation encountered errors', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Format Form Type Badge
  const renderFormTypeBadge = (type: FormType, hasMasterDetail?: boolean) => {
    if (hasMasterDetail) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--brand-primary, #6366f1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <Layers size={11} />
          Master-Detail
        </span>
      );
    }

    switch (type) {
      case 'single':
        return <Badge variant="info">Single Record</Badge>;
      case 'continuous':
        return <Badge variant="info">Continuous</Badge>;
      case 'tabular':
        return <Badge variant="warning">Tabular Grid</Badge>;
      case 'popup':
        return <Badge variant="neutral">Popup Dialog</Badge>;
      case 'fullscreen':
        return <Badge variant="neutral">Full-Screen</Badge>;
      case 'readonly':
        return <Badge variant="neutral">Read-Only</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  // Format Display Mode Badge
  const renderDisplayModeBadge = (mode?: string) => {
    switch (mode) {
      case 'fullscreen':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--success, #10b981)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <Maximize2 size={11} />
            Full-Screen
          </span>
        );
      case 'dialog':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: 'var(--warning, #f59e0b)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <Layers size={11} />
            Dialog
          </span>
        );
      case 'embedded':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(100, 116, 139, 0.12)',
              color: 'var(--text-secondary, #64748b)',
              border: '1px solid rgba(100, 116, 139, 0.25)',
            }}
          >
            <LayoutTemplate size={11} />
            Embedded
          </span>
        );
    }
  };

  // Table Columns Definition
  const columns: Column<SavedForm>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Form Title',
        accessorKey: 'name',
        sortable: true,
        filterable: true,
        cell: (row) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '320px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <LayoutTemplate size={14} style={{ color: 'var(--brand-primary, #0067b8)', flexShrink: 0 }} />
            <span
              onClick={() => handleRunForm(row)}
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={row.name}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.textDecoration = 'underline')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.textDecoration = 'none')}
            >
              {row.name}
            </span>
          </div>
        ),
      },
      {
        id: 'form_type',
        header: 'Type',
        accessorKey: 'form_type',
        sortable: true,
        cell: (row) => renderFormTypeBadge(row.form_type, row.hasMasterDetail),
      },
      {
        id: 'display_mode',
        header: 'Display Mode',
        accessorKey: 'display_mode',
        sortable: true,
        cell: (row) => renderDisplayModeBadge(row.display_mode),
      },
      {
        id: 'source_name',
        header: 'Data Source',
        accessorKey: 'source_name',
        sortable: true,
        filterable: true,
        cell: (row) => (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
            <Database size={12} style={{ color: 'var(--text-muted)' }} />
            <code
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-2, rgba(0,0,0,0.05))',
                color: 'var(--text-primary)',
              }}
            >
              {row.source_name || '(Blank Canvas)'}
            </code>
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorKey: 'category',
        sortable: true,
        cell: (row) => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{String(row.category || 'General')}</span>,
      },
      {
        id: 'controls',
        header: 'Controls',
        accessorKey: 'controlCount',
        sortable: true,
        cell: (row) => (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {Number(row.controlCount || 0)} controls
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => (
          <Badge variant={row.status === 'published' ? 'success' : 'neutral'}>
            {row.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        ),
      },
      {
        id: 'updated_at',
        header: 'Last Modified',
        accessorKey: 'updatedAt',
        sortable: true,
        cell: (row) => (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {row.updatedAt ? new Date(String(row.updatedAt)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <RunIconButton
              title="Run Form Runtime"
              onClick={() => handleRunForm(row)}
            />
            <OperationsIconButton
              icon={<Maximize2 size={13} />}
              title="Run in Full-Screen Viewport"
              onClick={() => handleRunForm(row, true)}
            />
            <EditIconButton
              title="Open Form Designer"
              onClick={() => handleOpenDesigner(row)}
            />
            <CopyIconButton
              title="Duplicate Form"
              onClick={() => setDuplicateTargetForm(row)}
            />
            <OperationsIconButton
              icon={<Edit2 size={13} />}
              title="Rename Form"
              onClick={() => setRenameTargetForm(row)}
            />
            <OperationsIconButton
              icon={<Download size={13} />}
              title="Export Form Definition"
              onClick={() => handleExport(row)}
            />
            <OperationsIconButton
              icon={row.status === 'published' ? <Eye size={13} /> : <CheckCircle size={13} />}
              title={row.status === 'published' ? 'Revert to Draft' : 'Publish Form'}
              onClick={() => handleTogglePublish(row)}
            />
            <DeleteIconButton
              title="Delete Form"
              onClick={() => setDeleteConfirmForm(row)}
            />
          </div>
        ),
      },
    ],
    []
  );

  // Card View Renderer
  const cardRenderer = (form: SavedForm, isSelected: boolean, toggleSelect: () => void) => {
    return (
      <OperationsCard
        id={form.id}
        title={form.name}
        headerIcon={<LayoutTemplate size={16} />}
        subtitle={`Type: ${form.form_type} • Category: ${form.category}`}
        description={form.description || `Form bound to source: ${form.source_name || 'Blank canvas'}`}
        isSelected={isSelected}
        onToggleSelect={toggleSelect}
        badge={
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {renderFormTypeBadge(form.form_type, form.hasMasterDetail)}
            {renderDisplayModeBadge(form.display_mode)}
            <Badge variant={form.status === 'published' ? 'success' : 'neutral'}>
              {form.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {form.controlCount || 0} fields
            </span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleRunForm(form)}
              leftIcon={<Play size={12} />}
            >
              Run
            </Button>
            <OperationsIconButton
              icon={<Maximize2 size={13} />}
              title="Run Full-Screen"
              onClick={() => handleRunForm(form, true)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenDesigner(form)}
              leftIcon={<Edit2 size={12} />}
            >
              Design
            </Button>
            <OperationsIconButton
              icon={<Copy size={13} />}
              title="Duplicate"
              onClick={() => setDuplicateTargetForm(form)}
            />
            <OperationsIconButton
              icon={<Download size={13} />}
              title="Export"
              onClick={() => handleExport(form)}
            />
            <DeleteIconButton
              title="Delete"
              onClick={() => setDeleteConfirmForm(form)}
            />
          </div>
        }
      />
    );
  };

  return (
    <OperationsPageLayout<SavedForm>
      title="Form Builder"
      breadcrumbs={[
        { label: 'Admin', path: '/admin' },
        { label: 'Form Builder' },
      ]}
      headerActions={[
        {
          id: 'new_form',
          label: 'New Form',
          variant: 'primary',
          icon: <Plus size={14} />,
          onClick: handleCreateNewForm,
        },
        {
          id: 'import_form',
          label: 'Import Definition',
          variant: 'outline',
          icon: <Upload size={14} />,
          onClick: () => setIsImportModalOpen(true),
        },
        {
          id: 'refresh_forms',
          label: 'Refresh',
          variant: 'outline',
          icon: <RefreshCw size={14} />,
          onClick: fetchData,
        },
      ]}
      headerTabs={[
        { id: 'all', label: 'All Forms', badge: forms.length },
        { id: 'single', label: 'Single Record', badge: forms.filter((f) => f.form_type === 'single' && !f.hasMasterDetail).length },
        { id: 'master_detail', label: 'Master-Detail', badge: forms.filter((f) => f.hasMasterDetail).length },
        { id: 'continuous_tabular', label: 'Continuous & Tabular', badge: forms.filter((f) => f.form_type === 'continuous' || f.form_type === 'tabular').length },
        { id: 'fullscreen', label: 'Full-Screen', badge: forms.filter((f) => f.display_mode === 'fullscreen' || f.form_type === 'fullscreen').length },
        { id: 'published', label: 'Published', badge: forms.filter((f) => f.status === 'published').length },
        { id: 'drafts', label: 'Drafts', badge: forms.filter((f) => f.status === 'draft').length },
      ]}
      activeTabId={activeTab}
      onTabChange={setActiveTab}
      data={filteredForms}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No forms created yet. Click 'New Form' to design your first blank-canvas form!"
      getRowKey={(row) => row.id}
      selectable={true}
      selectedRowKeys={selectedFormIds}
      onSelectedRowKeysChange={setSelectedFormIds}
      onBulkDelete={handleBulkDelete}
      isBulkDeleting={isBulkDeleting}
      cardRenderer={cardRenderer}
    >
      {/* Rename Modal */}
      <RenameFormModal
        isOpen={!!renameTargetForm}
        onClose={() => setRenameTargetForm(null)}
        form={renameTargetForm}
        onConfirmRename={handleRename}
        isLoading={isRenaming}
      />

      {/* Duplicate Modal */}
      <DuplicateFormModal
        isOpen={!!duplicateTargetForm}
        onClose={() => setDuplicateTargetForm(null)}
        form={duplicateTargetForm}
        onConfirmDuplicate={handleDuplicate}
        isLoading={isDuplicating}
      />

      {/* Import Modal */}
      <ImportFormModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleImport}
        isLoading={isImporting}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmForm}
        onClose={() => setDeleteConfirmForm(null)}
        title="Delete Form"
        description="Are you sure you want to permanently delete this form? This action cannot be undone."
        maxWidth="440px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="outline" onClick={() => setDeleteConfirmForm(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 size={13} />}
            >
              Delete Form
            </Button>
          </div>
        }
      >
        {deleteConfirmForm && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px' }}>
            <AlertTriangle size={20} style={{ color: 'var(--status-danger-text, #ef4444)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                {deleteConfirmForm.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Type: {deleteConfirmForm.form_type} • Source: {deleteConfirmForm.source_name || 'None'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </OperationsPageLayout>
  );
};
