import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api/client.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import { usePageTitle, usePageActions, useHeaderTabs, useHeaderCustomControls } from '../../../context/PageHeaderContext.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { Table, Column } from '../../../components/ui/Table.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Select } from '../../../components/ui/Select.tsx';

import {
  DatabaseOverview,
  TableSummary,
  TableStructure,
  TableColumn,
} from '../../../types/database.ts';

import { CreateTableModal } from './CreateTableModal.tsx';
import { AlterTableModal } from './AlterTableModal.tsx';
import { RecordModal } from './RecordModal.tsx';
import { RecordDetailModal } from './RecordDetailModal.tsx';

import {
  Database,
  Table as TableIcon,
  Columns,
  GitFork,
  HardDrive,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  Eye,
  Key,
  Shield,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

type ActiveTab = 'overview' | 'browse' | 'structure' | 'relations';

export const DatabaseManagerPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  usePageTitle('Database Manager', [
    { label: 'Administration' },
    { label: 'Database Manager' },
  ]);

  // Tab & Selection State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedTableName, setSelectedTableName] = useState<string>('');

  // Overview & Tables Data
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');

  // Active Table Structure
  const [structure, setStructure] = useState<TableStructure | null>(null);
  const [isStructureLoading, setIsStructureLoading] = useState(false);

  // Active Table Data
  const [tableRows, setTableRows] = useState<Record<string, any>[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataPage, setDataPage] = useState(1);
  const [dataLimit, setDataLimit] = useState(15);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAlterModalOpen, setIsAlterModalOpen] = useState(false);
  const [alterInitialAction, setAlterInitialAction] = useState<
    'addColumn' | 'modifyColumn' | 'dropColumn' | 'addIndex' | 'dropIndex'
  >('addColumn');
  const [targetColumnForAlter, setTargetColumnForAlter] = useState<TableColumn | null>(null);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Record<string, any> | null>(null);

  const [isDropTableModalOpen, setIsDropTableModalOpen] = useState(false);
  const [tableToDrop, setTableToDrop] = useState<TableSummary | null>(null);
  const [confirmDropTableName, setConfirmDropTableName] = useState('');
  const [isDropping, setIsDropping] = useState(false);

  // Fetch Overview & Table List
  const fetchOverviewAndTables = async () => {
    setIsOverviewLoading(true);
    try {
      const [overviewRes, tablesRes] = await Promise.all([
        api.get<DatabaseOverview>('/database/overview'),
        api.get<TableSummary[]>('/database/tables'),
      ]);

      if (overviewRes.data) setOverview(overviewRes.data);
      if (tablesRes.data) {
        setTables(tablesRes.data);
        if (!selectedTableName && tablesRes.data.length > 0) {
          // Select first non-system table if available, else first table
          const nonSystem = tablesRes.data.find((t) => !t.isSystemTable);
          setSelectedTableName(nonSystem ? nonSystem.tableName : tablesRes.data[0].tableName);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load database overview', 'error');
    } finally {
      setIsOverviewLoading(false);
    }
  };

  // Fetch Table Structure
  const fetchStructure = async (tableName: string) => {
    if (!tableName) return;
    setIsStructureLoading(true);
    try {
      const res = await api.get<TableStructure>(`/database/tables/${encodeURIComponent(tableName)}/structure`);
      if (res.data) {
        setStructure(res.data);
      }
    } catch (err: any) {
      showToast(err.message || `Failed to fetch structure for ${tableName}`, 'error');
    } finally {
      setIsStructureLoading(false);
    }
  };

  // Fetch Table Data Records
  const fetchTableData = async (tableName: string, page = dataPage, limit = dataLimit) => {
    if (!tableName) return;
    setIsDataLoading(true);
    try {
      const res = await api.get<Record<string, any>[]>(
        `/database/tables/${encodeURIComponent(tableName)}/data?page=${page}&limit=${limit}`
      );
      if (res.data) {
        setTableRows(res.data);
        if (res.pagination) {
          setTotalRows(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err: any) {
      showToast(err.message || `Failed to load records for ${tableName}`, 'error');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewAndTables();
  }, []);

  useEffect(() => {
    if (selectedTableName) {
      fetchStructure(selectedTableName);
      setDataPage(1);
      fetchTableData(selectedTableName, 1, dataLimit);
    }
  }, [selectedTableName]);

  // Page Header Actions Integration
  usePageActions(
    useMemo(() => {
      const actions: any[] = [];

      if (activeTab === 'overview') {
        if (hasPermission('database_manager', 'add')) {
          actions.push({
            id: 'create-table',
            label: 'Create Table',
            variant: 'primary',
            icon: <Plus size={14} />,
            onClick: () => setIsCreateModalOpen(true),
          });
        }
        actions.push({
          id: 'refresh-overview',
          label: 'Refresh',
          variant: 'outline',
          icon: <RefreshCw size={14} />,
          onClick: fetchOverviewAndTables,
          isLoading: isOverviewLoading,
        });
      } else if (activeTab === 'browse') {
        if (hasPermission('database_manager', 'add')) {
          actions.push({
            id: 'add-record',
            label: 'Add Record',
            variant: 'primary',
            icon: <Plus size={14} />,
            onClick: () => {
              setEditingRecord(null);
              setIsRecordModalOpen(true);
            },
          });
        }
        actions.push({
          id: 'view-structure-btn',
          label: 'Table Structure',
          variant: 'outline',
          icon: <Columns size={14} />,
          onClick: () => setActiveTab('structure'),
        });
        actions.push({
          id: 'refresh-data',
          label: 'Refresh',
          variant: 'outline',
          icon: <RefreshCw size={14} />,
          onClick: () => fetchTableData(selectedTableName, dataPage, dataLimit),
          isLoading: isDataLoading,
        });
      } else if (activeTab === 'structure') {
        if (hasPermission('database_manager', 'add')) {
          actions.push({
            id: 'add-column',
            label: 'Add Column',
            variant: 'primary',
            icon: <Plus size={14} />,
            onClick: () => {
              setAlterInitialAction('addColumn');
              setTargetColumnForAlter(null);
              setIsAlterModalOpen(true);
            },
          });
        }
        actions.push({
          id: 'browse-data-btn',
          label: 'Browse Data',
          variant: 'outline',
          icon: <TableIcon size={14} />,
          onClick: () => setActiveTab('browse'),
        });
        actions.push({
          id: 'refresh-structure',
          label: 'Refresh',
          variant: 'outline',
          icon: <RefreshCw size={14} />,
          onClick: () => fetchStructure(selectedTableName),
          isLoading: isStructureLoading,
        });
      } else if (activeTab === 'relations') {
        actions.push({
          id: 'refresh-relations',
          label: 'Refresh',
          variant: 'outline',
          icon: <RefreshCw size={14} />,
          onClick: () => fetchStructure(selectedTableName),
          isLoading: isStructureLoading,
        });
      }

      return actions;
    }, [activeTab, selectedTableName, isOverviewLoading, isDataLoading, isStructureLoading, hasPermission])
  );

  // Register Secondary Navigation Tabs in the main sticky header
  useHeaderTabs(
    useMemo(
      () => [
        { id: 'overview', label: 'Database Overview', icon: <Database size={15} /> },
        { id: 'browse', label: 'Browse Data', icon: <TableIcon size={15} /> },
        { id: 'structure', label: 'Table Structure', icon: <Columns size={15} /> },
        { id: 'relations', label: 'Relations & Indexes', icon: <GitFork size={15} /> },
      ],
      []
    ),
    activeTab,
    (tabId) => setActiveTab(tabId as ActiveTab)
  );

  // Register Active Table Selector in the main sticky header
  useHeaderCustomControls(
    useMemo(() => {
      if (activeTab === 'overview' || tables.length === 0) return null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Table:</span>
          <div style={{ width: '220px' }}>
            <Select
              value={selectedTableName}
              onChange={(e) => setSelectedTableName(e.target.value)}
              options={tables.map((t) => ({
                value: t.tableName,
                label: `${t.tableName} (${t.rowCount})${t.isSystemTable ? ' [Sys]' : ''}`,
              }))}
            />
          </div>
        </div>
      );
    }, [activeTab, tables, selectedTableName])
  );

  // Handle Drop Table
  const handleConfirmDropTable = async () => {
    if (!tableToDrop) return;
    if (confirmDropTableName.trim() !== tableToDrop.tableName) {
      showToast(`Please type '${tableToDrop.tableName}' to confirm dropping the table`, 'warning');
      return;
    }

    setIsDropping(true);
    try {
      await api.delete(`/database/tables/${encodeURIComponent(tableToDrop.tableName)}`);
      showToast(`Table '${tableToDrop.tableName}' has been permanently dropped.`, 'success');
      setIsDropTableModalOpen(false);
      setTableToDrop(null);
      setConfirmDropTableName('');
      fetchOverviewAndTables();
    } catch (err: any) {
      showToast(err.message || 'Failed to drop table', 'error');
    } finally {
      setIsDropping(false);
    }
  };

  // Filtered Table List for Overview
  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    const q = tableSearch.toLowerCase();
    return tables.filter(
      (t) =>
        t.tableName.toLowerCase().includes(q) ||
        (t.comment && t.comment.toLowerCase().includes(q)) ||
        t.engine.toLowerCase().includes(q)
    );
  }, [tables, tableSearch]);

  // Dynamic Columns for Active Table Browse Data
  const dynamicColumns = useMemo<Column<Record<string, any>>[]>(() => {
    if (!structure || structure.columns.length === 0) return [];

    const cols: Column<Record<string, any>>[] = structure.columns.map((col) => {
      let filterType: 'text' | 'select' | 'date' | 'number' = 'text';

      if (['INT', 'BIGINT', 'SMALLINT', 'DECIMAL', 'FLOAT', 'DOUBLE'].includes(col.dataType)) {
        filterType = 'number';
      } else if (['DATE', 'DATETIME', 'TIMESTAMP'].includes(col.dataType)) {
        filterType = 'date';
      } else if (col.dataType === 'BOOLEAN' || (col.dataType === 'TINYINT' && col.columnType.includes('(1)'))) {
        filterType = 'select';
      }

      return {
        id: col.name,
        header: col.name,
        accessorKey: col.name,
        filterType,
        sortable: true,
        filterOptions:
          filterType === 'select'
            ? [
                { label: 'True / 1', value: '1' },
                { label: 'False / 0', value: '0' },
              ]
            : undefined,
        cell: (row) => {
          const val = row[col.name];
          if (val === null || val === undefined) {
            return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>NULL</span>;
          }
          if (row[`__isMasked_${col.name}`] || val === '••••••••') {
            return (
              <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                ••••••••
              </span>
            );
          }
          if (typeof val === 'object') {
            return (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {JSON.stringify(val).substring(0, 30)}...
              </span>
            );
          }
          if (col.isPrimaryKey) {
            return (
              <strong style={{ color: 'var(--brand-primary)', fontFamily: 'monospace', fontSize: '13px' }}>
                {String(val)}
              </strong>
            );
          }
          return <span>{String(val)}</span>;
        },
      };
    });

    // Row Actions Column
    cols.push({
      header: 'Actions',
      align: 'right',
      filterable: false,
      sortable: false,
      cell: (row) => {
        const pkCol = structure.primaryKey[0];
        const pkVal = pkCol ? row[pkCol] : null;

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <Button
              variant="ghost"
              size="sm"
              title="View full record details"
              onClick={() => {
                setDetailRecord(row);
                setIsDetailModalOpen(true);
              }}
            >
              <Eye size={15} />
            </Button>

            {hasPermission('database_manager', 'edit') && (
              <Button
                variant="ghost"
                size="sm"
                title="Edit record"
                onClick={() => {
                  setEditingRecord(row);
                  setIsRecordModalOpen(true);
                }}
              >
                <Edit2 size={15} />
              </Button>
            )}

            {hasPermission('database_manager', 'delete') && pkVal !== null && (
              <Button
                variant="ghost"
                size="sm"
                title="Delete record"
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete this record (${pkCol} = ${pkVal})?`)) {
                    try {
                      await api.delete(
                        `/database/tables/${encodeURIComponent(structure.tableName)}/data/${encodeURIComponent(pkVal)}`
                      );
                      showToast('Record deleted.', 'success');
                      fetchTableData(selectedTableName);
                    } catch (err: any) {
                      showToast(err.message || 'Failed to delete record', 'error');
                    }
                  }
                }}
              >
                <Trash2 size={15} color="var(--status-danger)" />
              </Button>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [structure, selectedTableName, hasPermission]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, gap: '16px' }}>
      {/* TAB 1: Database Overview & Tables List */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '16px' }}>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-card, 10px)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 103, 184, 0.12)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Database Name</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {overview?.databaseName || 'Loading...'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-card, 10px)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 124, 65, 0.12)',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Tables</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {overview?.totalTables || 0} Tables
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-card, 10px)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  color: 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TableIcon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated Records</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {overview?.totalRows.toLocaleString() || 0}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-card, 10px)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HardDrive size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Disk Storage Size</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {overview?.totalSize || '0 MB'}
                </div>
              </div>
            </div>
          </div>

          {/* Tables Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Table
              data={filteredTables}
              isLoading={isOverviewLoading}
              emptyMessage="No tables matching your filter."
              selectable={false}
              columns={[
                {
                  id: 'tableName',
                  header: 'Table Name',
                  accessorKey: 'tableName',
                  filterType: 'text',
                  sortable: true,
                  cell: (t) => (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={t.comment ? `${t.tableName} — ${t.comment}` : t.tableName}
                    >
                      <TableIcon size={15} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.tableName}
                      </strong>
                      {t.isSystemTable && <Badge variant="info">System</Badge>}
                    </div>
                  ),
                },
                {
                  id: 'engine',
                  header: 'Engine',
                  accessorKey: 'engine',
                  filterType: 'select',
                  sortable: true,
                  cell: (t) => <Badge variant="neutral">{t.engine}</Badge>,
                },
                {
                  id: 'columnCount',
                  header: 'Columns',
                  accessorKey: 'columnCount',
                  filterType: 'number',
                  sortable: true,
                  cell: (t) => <span>{t.columnCount} cols</span>,
                },
                {
                  id: 'rowCount',
                  header: 'Estimated Rows',
                  accessorKey: 'rowCount',
                  filterType: 'number',
                  sortable: true,
                  cell: (t) => <span>{t.rowCount.toLocaleString()}</span>,
                },
                {
                  id: 'primaryKey',
                  header: 'Primary Key',
                  accessorKey: 'primaryKey',
                  filterType: 'text',
                  sortable: true,
                  cell: (t) => (
                    t.primaryKey ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        <Key size={13} color="var(--brand-primary)" /> {t.primaryKey}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                    )
                  ),
                },
                {
                  header: 'Actions',
                  align: 'right',
                  cell: (t) => (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedTableName(t.tableName);
                          setActiveTab('browse');
                        }}
                      >
                        Browse
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTableName(t.tableName);
                          setActiveTab('structure');
                        }}
                      >
                        Structure
                      </Button>
                      {hasPermission('database_manager', 'delete') && !t.isSystemTable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Drop Table"
                          onClick={() => {
                            setTableToDrop(t);
                            setConfirmDropTableName('');
                            setIsDropTableModalOpen(true);
                          }}
                        >
                          <Trash2 size={15} color="var(--status-danger)" />
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* TAB 2: Browse Live Data */}
      {activeTab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Table
            data={tableRows}
            columns={dynamicColumns}
            isLoading={isDataLoading}
            emptyMessage={`No records found in table '${selectedTableName}'. Click 'Add Record' above to insert data.`}
            selectable={true}
            pagination={{
              page: dataPage,
              limit: dataLimit,
              total: totalRows,
              totalPages,
              onPageChange: (newPage) => {
                setDataPage(newPage);
                fetchTableData(selectedTableName, newPage, dataLimit);
              },
              onLimitChange: (newLimit) => {
                setDataLimit(newLimit);
                setDataPage(1);
                fetchTableData(selectedTableName, 1, newLimit);
              },
            }}
            cardRenderer={(row) => (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-card, 10px)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--brand-primary)' }}>
                    {structure?.primaryKey[0] ? String(row[structure.primaryKey[0]]) : 'Row'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDetailRecord(row);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRecord(row);
                        setIsRecordModalOpen(true);
                      }}
                    >
                      <Edit2 size={14} />
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  {structure?.columns.slice(0, 5).map((col) => (
                    <div key={col.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{col.name}:</span>
                      <strong style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {row[col.name] !== null ? String(row[col.name]) : 'NULL'}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* TAB 3: Table Structure */}
      {activeTab === 'structure' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Table
              data={structure?.columns || []}
              isLoading={isStructureLoading}
              emptyMessage="No columns in this table."
              selectable={false}
              columns={[
                {
                  id: 'ordinalPosition',
                  header: '#',
                  accessorKey: 'ordinalPosition',
                  width: '60px',
                  sortable: true,
                },
                {
                  id: 'name',
                  header: 'Column Name',
                  accessorKey: 'name',
                  sortable: true,
                  cell: (c) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.name}</strong>
                      {c.isPrimaryKey && <Badge variant="warning">PK</Badge>}
                      {c.isUnique && !c.isPrimaryKey && <Badge variant="info">UNI</Badge>}
                    </div>
                  ),
                },
                {
                  id: 'columnType',
                  header: 'Type & Length',
                  accessorKey: 'columnType',
                  sortable: true,
                  cell: (c) => (
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--brand-primary)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {c.columnType}
                    </span>
                  ),
                },
                {
                  id: 'isNullable',
                  header: 'Nullable',
                  accessorKey: 'isNullable',
                  sortable: true,
                  cell: (c) => (
                    <Badge variant={c.isNullable ? 'neutral' : 'info'}>
                      {c.isNullable ? 'NULL' : 'NOT NULL'}
                    </Badge>
                  ),
                },
                {
                  id: 'defaultValue',
                  header: 'Default Value',
                  accessorKey: 'defaultValue',
                  cell: (c) => (
                    <span style={{ fontSize: '12px', color: c.defaultValue ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {c.defaultValue ?? 'None'}
                    </span>
                  ),
                },
                {
                  id: 'isAutoIncrement',
                  header: 'Extra',
                  accessorKey: 'isAutoIncrement',
                  cell: (c) => (
                    c.isAutoIncrement ? <Badge variant="success">auto_increment</Badge> : <span>-</span>
                  ),
                },
                {
                  id: 'comment',
                  header: 'Comment',
                  accessorKey: 'comment',
                  cell: (c) => (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.comment || '-'}</span>
                  ),
                },
                {
                  header: 'Actions',
                  align: 'right',
                  cell: (c) => (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {hasPermission('database_manager', 'edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Modify column definition"
                          onClick={() => {
                            setTargetColumnForAlter(c);
                            setAlterInitialAction('modifyColumn');
                            setIsAlterModalOpen(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </Button>
                      )}
                      {hasPermission('database_manager', 'delete') && !structure?.isSystemTable && !c.isPrimaryKey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Drop column"
                          onClick={() => {
                            setTargetColumnForAlter(c);
                            setAlterInitialAction('dropColumn');
                            setIsAlterModalOpen(true);
                          }}
                        >
                          <Trash2 size={15} color="var(--status-danger)" />
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
        </div>
      )}

      {/* TAB 4: Relationships & Indexes */}
      {activeTab === 'relations' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '20px', overflowY: 'auto' }}>
          {/* Outbound Foreign Keys */}
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-card, 10px)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitFork size={18} color="var(--brand-primary)" />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Outbound Foreign Keys (References from `{selectedTableName}`)
              </h4>
            </div>

            {(!structure?.foreignKeys || structure.foreignKeys.length === 0) ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No outbound foreign key relationships configured for this table.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {structure.foreignKeys.map((fk) => (
                  <div
                    key={fk.constraintName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                        {fk.columnName}
                      </strong>
                      <ArrowRight size={14} color="var(--text-muted)" />
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {fk.referencedTable}.{fk.referencedColumn}
                      </strong>
                      <Badge variant="neutral">{fk.constraintName}</Badge>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>ON UPDATE: <strong>{fk.onUpdate}</strong></span>
                      <span>•</span>
                      <span>ON DELETE: <strong>{fk.onDelete}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inbound Foreign Keys (Referenced By) */}
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-card, 10px)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={18} color="var(--status-success)" />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Inbound Relationships (Child Tables referencing `{selectedTableName}`)
              </h4>
            </div>

            {(!structure?.inboundRelationships || structure.inboundRelationships.length === 0) ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No other tables currently reference `{selectedTableName}`.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {structure.inboundRelationships.map((ifk) => (
                  <div
                    key={ifk.constraintName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {ifk.referencingTable}.{ifk.referencingColumn}
                      </strong>
                      <ArrowRight size={14} color="var(--text-muted)" />
                      <strong style={{ color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                        {selectedTableName}.{ifk.referencedColumn}
                      </strong>
                      <Badge variant="neutral">{ifk.constraintName}</Badge>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>ON DELETE: <strong>{ifk.onDelete}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Indexes & Unique Keys */}
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-card, 10px)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="var(--status-warning)" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Indexes & Keys ({structure?.indexes.length || 0})
                </h4>
              </div>
              {hasPermission('database_manager', 'add') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAlterInitialAction('addIndex');
                    setIsAlterModalOpen(true);
                  }}
                >
                  Add Index
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {structure?.indexes.map((idx) => (
                <div
                  key={idx.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{idx.name}</strong>
                    {idx.name === 'PRIMARY' && <Badge variant="warning">PRIMARY KEY</Badge>}
                    {idx.isUnique && idx.name !== 'PRIMARY' && <Badge variant="info">UNIQUE</Badge>}
                    <Badge variant="neutral">{idx.type}</Badge>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Columns: <strong>{idx.columns.join(', ')}</strong>
                    </span>
                    {hasPermission('database_manager', 'delete') && idx.name !== 'PRIMARY' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Drop Index"
                        onClick={() => {
                          setAlterInitialAction('dropIndex');
                          setIsAlterModalOpen(true);
                        }}
                      >
                        <Trash2 size={14} color="var(--status-danger)" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newTableName) => {
          fetchOverviewAndTables();
          setSelectedTableName(newTableName);
          setActiveTab('browse');
        }}
      />

      <AlterTableModal
        isOpen={isAlterModalOpen}
        onClose={() => setIsAlterModalOpen(false)}
        structure={structure}
        initialAction={alterInitialAction}
        targetColumn={targetColumnForAlter}
        onSuccess={() => {
          fetchStructure(selectedTableName);
          fetchTableData(selectedTableName);
        }}
      />

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        structure={structure}
        record={editingRecord}
        onSuccess={() => fetchTableData(selectedTableName)}
      />

      <RecordDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        structure={structure}
        record={detailRecord}
      />

      {/* Drop Table Confirmation Modal */}
      {tableToDrop && (
        <Modal
          isOpen={isDropTableModalOpen}
          onClose={() => setIsDropTableModalOpen(false)}
          title={`Drop Database Table: ${tableToDrop.tableName}`}
          description="This is a permanent, non-reversible DDL operation"
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: 'rgba(217, 56, 58, 0.08)',
                border: '1px solid var(--status-danger)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <AlertTriangle size={20} color="var(--status-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                Dropping <strong>`{tableToDrop.tableName}`</strong> will permanently destroy the table schema and all{' '}
                <strong>{tableToDrop.rowCount.toLocaleString()}</strong> stored records.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Please type <strong>{tableToDrop.tableName}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmDropTableName}
                onChange={(e) => setConfirmDropTableName(e.target.value)}
                placeholder={tableToDrop.tableName}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <Button variant="ghost" onClick={() => setIsDropTableModalOpen(false)} disabled={isDropping}>
                Cancel
              </Button>
              <Button variant="danger" isLoading={isDropping} onClick={handleConfirmDropTable}>
                Permanently Drop Table
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
