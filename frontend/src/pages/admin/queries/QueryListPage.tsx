import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { queriesApi, QueryExecutionResult } from '../../../api/queries.ts';
import { SavedQuery } from '../../../types/index.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { Column } from '../../../components/ui/Table.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Table as UiTable } from '../../../components/ui/Table.tsx';
import { SqlPreviewModal } from './components/SqlPreviewModal.tsx';
import { ParameterPromptModal } from './components/ParameterPromptModal.tsx';
import { RenameQueryModal } from './components/RenameQueryModal.tsx';
import {
  OperationsPageLayout,
  OperationsCard,
  RunIconButton,
  EditIconButton,
  DeleteIconButton,
  OpenIconButton,
  CopyIconButton,
  OperationsIconButton,
} from '../../../components/operations/index.ts';
import {
  Plus,
  RefreshCw,
  Search,
  Play,
  Edit2,
  Copy,
  Trash2,
  Code,
  Database,
  Tag,
  Sparkles,
  ExternalLink,
  Layers,
  Clock,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const QueryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Multi-Selection State
  const [selectedQueryIds, setSelectedQueryIds] = useState<(string | number)[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Modals state
  const [sqlModalQuery, setSqlModalQuery] = useState<SavedQuery | null>(null);
  const [runModalQuery, setRunModalQuery] = useState<SavedQuery | null>(null);
  const [runExecutionResult, setRunExecutionResult] = useState<QueryExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [deleteConfirmQuery, setDeleteConfirmQuery] = useState<SavedQuery | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameTargetQuery, setRenameTargetQuery] = useState<SavedQuery | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Fetch queries & categories
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, catRes] = await Promise.allSettled([
        queriesApi.listQueries(),
        queriesApi.getCategories(),
      ]);

      if (listRes.status === 'fulfilled') {
        setQueries(listRes.value || []);
      } else {
        showToast('Failed to load saved queries', 'error');
      }

      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load queries', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Query is template helper
  const isTemplateQuery = useCallback((q: SavedQuery): boolean => {
    return Boolean(q.isTemplate || q.slug?.startsWith('sample-') || q.category === 'Sample Queries');
  }, []);

  // Filtered queries based on active category/tab
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'custom') return !isTemplateQuery(q);
      if (activeTab === 'samples') return isTemplateQuery(q);
      return q.category === activeTab;
    });
  }, [queries, activeTab, isTemplateQuery]);

  // Selected records and protected count
  const selectedRecords = useMemo(() => {
    const set = new Set(selectedQueryIds.map(String));
    return queries.filter((q) => set.has(String(q.id)));
  }, [queries, selectedQueryIds]);

  const protectedCount = useMemo(() => {
    return selectedRecords.filter(isTemplateQuery).length;
  }, [selectedRecords, isTemplateQuery]);

  // Actions
  const handleDuplicate = async (id: string) => {
    try {
      const created = await queriesApi.duplicateQuery(id);
      showToast(`Duplicated query as '${created.name}'`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate query', 'error');
    }
  };

  const handleConfirmRename = async (queryId: string, newName: string, newDescription?: string) => {
    setIsRenaming(true);
    try {
      await queriesApi.updateQuery(queryId, {
        name: newName,
        description: newDescription || null,
      });
      showToast(`Renamed to '${newName}'`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to rename query', 'error');
    } finally {
      setIsRenaming(false);
      setRenameTargetQuery(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmQuery) return;
    if (isTemplateQuery(deleteConfirmQuery)) {
      showToast('Sample templates are protected and cannot be deleted.', 'warning');
      setDeleteConfirmQuery(null);
      return;
    }

    setIsDeleting(true);
    try {
      await queriesApi.deleteQuery(deleteConfirmQuery.id);
      showToast(`Query '${deleteConfirmQuery.name}' deleted.`, 'success');
      setDeleteConfirmQuery(null);
      setSelectedQueryIds((prev) => prev.filter((id) => id !== deleteConfirmQuery.id));
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete query', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    const deletableQueries = selectedRecords.filter((q) => !isTemplateQuery(q));
    if (deletableQueries.length === 0) {
      showToast('No deletable queries selected (sample templates are protected).', 'warning');
      return;
    }

    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const q of deletableQueries) {
      try {
        await queriesApi.deleteQuery(q.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsBulkDeleting(false);
    setSelectedQueryIds([]);
    fetchData();

    if (successCount > 0) {
      showToast(`Successfully deleted ${successCount} queries.`, 'success');
    }
    if (failCount > 0) {
      showToast(`Failed to delete ${failCount} queries.`, 'error');
    }
  };

  // Bulk Export to CSV
  const handleBulkExportCsv = () => {
    if (selectedRecords.length === 0) return;
    const headers = ['ID', 'Name', 'Slug', 'Category', 'Status', 'Type', 'SourceTables', 'ColumnsCount', 'UpdatedAt'];
    const rows = selectedRecords.map((q) => [
      `"${q.id}"`,
      `"${(q.name || '').replace(/"/g, '""')}"`,
      `"${q.slug || ''}"`,
      `"${q.category || ''}"`,
      `"${q.status || ''}"`,
      `"${isTemplateQuery(q) ? 'Sample Template' : 'Custom Query'}"`,
      `"${(q.sourceTables || []).join(', ')}"`,
      q.columnCount ?? q.outputColumns?.length ?? 0,
      `"${q.updatedAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `queries_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selectedRecords.length} queries to CSV`, 'success');
  };

  // Bulk Export to JSON
  const handleBulkExportJson = () => {
    if (selectedRecords.length === 0) return;
    const blob = new Blob([JSON.stringify(selectedRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `queries_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selectedRecords.length} queries to JSON`, 'success');
  };

  const handleRunClick = (q: SavedQuery) => {
    if (q.parameters && q.parameters.length > 0) {
      setRunModalQuery(q);
    } else {
      executeDirectly(q, {});
    }
  };

  const executeDirectly = async (q: SavedQuery, params: Record<string, unknown>) => {
    setIsExecuting(true);
    try {
      const res = await queriesApi.executeSavedQuery(q.id, params, { limit: 100 });
      setRunExecutionResult(res);
      setRunModalQuery(null);
    } catch (err: any) {
      showToast(err.message || 'Execution failed', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Export Results from modal
  const handleExportResultCsv = () => {
    if (!runExecutionResult || !runExecutionResult.data || runExecutionResult.data.length === 0) return;
    const headers = Object.keys(runExecutionResult.data[0]);
    const csvRows = [
      headers.join(','),
      ...runExecutionResult.data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${runExecutionResult.queryName || 'query_results'}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Header Actions
  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPermission('query_builder', 'add')) {
      actions.push({
        id: 'new-query-btn',
        label: 'New Query',
        variant: 'primary',
        icon: <Plus size={14} />,
        onClick: () => navigate('/admin/queries/new'),
      });
    }
    actions.push({
      id: 'refresh-queries-btn',
      label: 'Refresh',
      variant: 'outline',
      icon: <RefreshCw size={14} />,
      onClick: fetchData,
      isLoading,
    });
    return actions;
  }, [hasPermission, navigate, fetchData, isLoading]);

  // Header Tabs for Unified Categories
  const headerTabs = useMemo(() => {
    const tabs = [
      { id: 'all', label: `All Queries (${queries.length})` },
      { id: 'custom', label: `My Queries (${queries.filter((q) => !isTemplateQuery(q)).length})` },
      { id: 'samples', label: `Sample Templates (${queries.filter(isTemplateQuery).length})` },
    ];
    categories
      .filter((cat) => cat !== 'Sample Queries' && cat !== 'General')
      .forEach((cat) => {
        const count = queries.filter((q) => q.category === cat).length;
        tabs.push({ id: cat, label: `${cat} (${count})` });
      });
    return tabs;
  }, [queries, categories, isTemplateQuery]);

  // Unified Dataset Table Columns
  const columns: Column<SavedQuery>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Query Name',
        sortable: true,
        filterable: true,
        cell: (row) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
            title={row.description ? `${row.name} — ${row.description} (${row.slug})` : `${row.name} (${row.slug})`}
          >
            <button
              type="button"
              onClick={() => navigate(`/admin/queries/${row.id}`)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--primary-color, #3b82f6)',
                cursor: 'pointer',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.name}
            </button>
          </div>
        ),
      },
      {
        id: 'queryType',
        header: 'Query Type',
        width: '140px',
        sortable: true,
        filterable: true,
        cell: (row) =>
          isTemplateQuery(row) ? (
            <Badge variant="info">
              <Sparkles size={11} style={{ marginRight: '4px' }} /> Sample Template
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Layers size={11} style={{ marginRight: '4px' }} /> Custom Query
            </Badge>
          ),
      },
      {
        id: 'sourceTables',
        header: 'Source Tables',
        width: '180px',
        filterable: true,
        cell: (row) => {
          const tables = row.sourceTables || [];
          if (tables.length === 0) {
            return <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>;
          }
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              title={tables.join(', ')}
            >
              {tables.slice(0, 2).map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    padding: '1px 5px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Database size={10} style={{ color: 'var(--primary)' }} />
                  {t}
                </span>
              ))}
              {tables.length > 2 && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 4px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '3px',
                    color: 'var(--text-muted)',
                  }}
                >
                  +{tables.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'category',
        header: 'Category',
        width: '120px',
        sortable: true,
        filterable: true,
        cell: (row) => <Badge variant="neutral">{row.category || 'General'}</Badge>,
      },
      {
        id: 'status',
        header: 'Status',
        width: '100px',
        sortable: true,
        filterable: true,
        cell: (row) => (
          <Badge variant={row.status === 'published' ? 'success' : 'warning'}>
            {(row.status || 'draft').toUpperCase()}
          </Badge>
        ),
      },
      {
        id: 'outputColumns',
        header: 'Columns',
        width: '90px',
        sortable: true,
        cell: (row) => (
          <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
            {row.columnCount ?? row.outputColumns?.length ?? 0} cols
          </span>
        ),
      },
      {
        id: 'updatedAt',
        header: 'Last Modified',
        width: '120px',
        sortable: true,
        cell: (row) => (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        width: '200px',
        align: 'right',
        cell: (row) => {
          const isSample = isTemplateQuery(row);
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
              <RunIconButton onClick={() => handleRunClick(row)} />
              <OpenIconButton
                title="Open in designer"
                onClick={() => navigate(`/admin/queries/${row.id}`)}
              />
              <OperationsIconButton
                icon={<Code size={14} />}
                title="View generated SQL"
                onClick={() => setSqlModalQuery(row)}
              />
              <OperationsIconButton
                icon={<Tag size={14} />}
                title="Rename query"
                onClick={() => setRenameTargetQuery(row)}
              />
              <CopyIconButton onClick={() => handleDuplicate(row.id)} />
              {hasPermission('query_builder', 'delete') && (
                <DeleteIconButton
                  disabled={isSample}
                  title={isSample ? 'Protected sample template' : 'Delete query'}
                  onClick={() => setDeleteConfirmQuery(row)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [navigate, hasPermission, isTemplateQuery]
  );

  // Card View Renderer
  const cardRenderer = useCallback(
    (row: SavedQuery, isSelected: boolean, toggleSelect: () => void) => {
      const isSample = isTemplateQuery(row);

      return (
        <OperationsCard
          key={row.id}
          id={row.id}
          isSelected={isSelected}
          onToggleSelect={toggleSelect}
          headerIcon={
            isSample ? (
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            ) : (
              <Layers size={16} style={{ color: 'var(--primary)' }} />
            )
          }
          title={row.name}
          subtitle={row.slug}
          badge={
            <div style={{ display: 'flex', gap: '4px' }}>
              <Badge variant={isSample ? 'info' : 'neutral'}>
                {isSample ? 'Sample' : 'Custom'}
              </Badge>
              <Badge variant={row.status === 'published' ? 'success' : 'warning'}>
                {(row.status || 'draft').toUpperCase()}
              </Badge>
            </div>
          }
          description={row.description}
          tags={
            row.sourceTables && row.sourceTables.length > 0 ? (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {row.sourceTables.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      padding: '1px 5px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <Database size={9} style={{ color: 'var(--primary)' }} />
                    {t}
                  </span>
                ))}
              </div>
            ) : undefined
          }
          metadata={[
            { label: 'Category', value: row.category || 'General' },
            { label: 'Output Columns', value: `${row.columnCount ?? row.outputColumns?.length ?? 0} cols` },
            {
              label: 'Last Modified',
              value: row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-',
            },
          ]}
          actions={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Play size={12} />}
                  onClick={() => handleRunClick(row)}
                >
                  Run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 size={12} />}
                  onClick={() => navigate(`/admin/queries/${row.id}`)}
                >
                  Open
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '2px' }}>
                <OperationsIconButton
                  icon={<Code size={13} />}
                  title="View SQL"
                  onClick={() => setSqlModalQuery(row)}
                />
                <CopyIconButton onClick={() => handleDuplicate(row.id)} />
                {hasPermission('query_builder', 'delete') && (
                  <DeleteIconButton
                    disabled={isSample}
                    title={isSample ? 'Protected sample template' : 'Delete query'}
                    onClick={() => setDeleteConfirmQuery(row)}
                  />
                )}
              </div>
            </div>
          }
        />
      );
    },
    [navigate, hasPermission, isTemplateQuery]
  );

  return (
    <OperationsPageLayout<SavedQuery>
      title="Query Library & Saved Queries"
      breadcrumbs={[{ label: 'Administration' }, { label: 'Query Builder' }]}
      headerActions={headerActions}
      headerTabs={headerTabs}
      activeTabId={activeTab}
      onTabChange={setActiveTab}
      data={filteredQueries}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No queries match the selected tab and filters."
      selectable={true}
      selectedRowKeys={selectedQueryIds}
      onSelectedRowKeysChange={setSelectedQueryIds}
      getRowKey={(q) => q.id}
      cardRenderer={cardRenderer}
      onBulkDelete={handleBulkDelete}
      isBulkDeleting={isBulkDeleting}
      onBulkExportCsv={handleBulkExportCsv}
      onBulkExportJson={handleBulkExportJson}
      protectedCount={protectedCount}
      bulkDeleteLabel="Delete Selected"
    >
      {/* SQL Preview Modal */}
      {sqlModalQuery && (
        <SqlPreviewModal
          isOpen={!!sqlModalQuery}
          onClose={() => setSqlModalQuery(null)}
          sql={sqlModalQuery.generatedSql}
          title={`SQL Preview: ${sqlModalQuery.name}`}
        />
      )}

      {/* Rename Query Modal */}
      {renameTargetQuery && (
        <RenameQueryModal
          isOpen={!!renameTargetQuery}
          onClose={() => setRenameTargetQuery(null)}
          query={renameTargetQuery}
          onConfirmRename={handleConfirmRename}
          isLoading={isRenaming}
        />
      )}

      {/* Parameter Prompt Modal */}
      {runModalQuery && (
        <ParameterPromptModal
          isOpen={!!runModalQuery}
          onClose={() => setRunModalQuery(null)}
          parameters={runModalQuery.parameters}
          onExecute={(paramVals) => executeDirectly(runModalQuery, paramVals)}
          isLoading={isExecuting}
        />
      )}

      {/* Quick Run Results Modal */}
      {runExecutionResult && (
        <Modal
          isOpen={!!runExecutionResult}
          onClose={() => setRunExecutionResult(null)}
          title={`Results: ${runExecutionResult.queryName || 'Query Execution'}`}
          description={`Execution completed in ${runExecutionResult.executionTimeMs} ms. Returned ${
            runExecutionResult.rowCount
          } rows from MySQL.`}
          maxWidth="940px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={13} />}
                  onClick={handleExportResultCsv}
                  disabled={!runExecutionResult.data || runExecutionResult.data.length === 0}
                >
                  Export CSV
                </Button>
              </div>
              <Button variant="primary" onClick={() => setRunExecutionResult(null)}>
                Close Results
              </Button>
            </div>
          }
        >
          <div style={{ maxHeight: '440px', overflow: 'auto' }}>
            <UiTable
              columns={
                (runExecutionResult.columns && runExecutionResult.columns.length > 0)
                  ? runExecutionResult.columns
                  : (runExecutionResult.data && runExecutionResult.data.length > 0)
                  ? Object.keys(runExecutionResult.data[0]).map((k) => ({
                      id: k,
                      header: k,
                      accessorKey: k,
                    }))
                  : []
              }
              data={runExecutionResult.data || []}
              enableHeaderSearch={false}
              emptyMessage="Query executed successfully with 0 records found."
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmQuery && (
        <Modal
          isOpen={!!deleteConfirmQuery}
          onClose={() => setDeleteConfirmQuery(null)}
          title="Delete Saved Query"
          description={`Are you sure you want to permanently delete '${deleteConfirmQuery.name}'? This action cannot be undone.`}
          maxWidth="440px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="outline" onClick={() => setDeleteConfirmQuery(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                Delete Query
              </Button>
            </div>
          }
        >
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Slug: <code>{deleteConfirmQuery.slug}</code>
          </div>
        </Modal>
      )}
    </OperationsPageLayout>
  );
};
