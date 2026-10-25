import React, { useEffect, useState } from 'react';
import { api } from '../../../api/client.ts';
import { Table, Column } from '../../../components/ui/Table.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { AuditLog } from '../../../types/index.ts';
import { FileText, Eye, RefreshCw } from 'lucide-react';

import { usePageTitle, usePageActions } from '../../../context/PageHeaderContext.tsx';

export const AuditLogsPage: React.FC = () => {
  usePageTitle('Audit Logs', [
    { label: 'Administration' },
    { label: 'Audit Logs' },
  ]);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<AuditLog[]>(`/audit-logs?page=${page}&limit=${limit}`);
      if (res.data) {
        setLogs(res.data);
        if (res.pagination) {
          setTotalCount(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  usePageActions([
    {
      id: 'refresh-audit-logs',
      label: 'Refresh Trail',
      variant: 'outline',
      icon: <RefreshCw size={14} />,
      onClick: fetchLogs,
      isLoading,
    },
  ]);

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) return <Badge variant="info">{action}</Badge>;
    if (action.includes('CREATED')) return <Badge variant="success">{action}</Badge>;
    if (action.includes('DELETED')) return <Badge variant="danger">{action}</Badge>;
    if (action.includes('UPDATED')) return <Badge variant="warning">{action}</Badge>;
    return <Badge variant="neutral">{action}</Badge>;
  };

  const columns: Column<AuditLog>[] = [
    {
      id: 'createdAt',
      header: 'Timestamp',
      accessorKey: 'createdAt',
      filterType: 'date',
      sortable: true,
      cell: (l) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {new Date(l.createdAt).toLocaleString()}
        </span>
      ),
      width: '180px',
    },
    {
      id: 'userFullName',
      header: 'Operator / User',
      accessorKey: 'userFullName',
      filterType: 'text',
      sortable: true,
      cell: (l) => (
        <div>
          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
            {l.userFullName || l.username || 'System Engine'}
          </div>
          {l.username && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{l.username}</div>}
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      filterType: 'select',
      filterOptions: [
        { label: 'AUTH_LOGIN', value: 'AUTH_LOGIN' },
        { label: 'USER_CREATED', value: 'USER_CREATED' },
        { label: 'USER_UPDATED', value: 'USER_UPDATED' },
        { label: 'USER_DELETED', value: 'USER_DELETED' },
        { label: 'ROLE_CREATED', value: 'ROLE_CREATED' },
        { label: 'ROLE_UPDATED', value: 'ROLE_UPDATED' },
        { label: 'ROLE_DELETED', value: 'ROLE_DELETED' },
      ],
      sortable: true,
      cell: (l) => getActionBadge(l.action),
    },
    {
      id: 'entityType',
      header: 'Target Entity',
      accessorKey: 'entityType',
      filterType: 'text',
      sortable: true,
      cell: (l) => (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {l.entityType} {l.entityId ? `(#${l.entityId.substring(0, 8)})` : ''}
        </span>
      ),
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      accessorKey: 'ipAddress',
      filterType: 'text',
      sortable: true,
      cell: (l) => (
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--text-muted)' }}>
          {l.ipAddress || '—'}
        </span>
      ),
    },
    {
      header: 'Inspection',
      align: 'right',
      filterable: false,
      sortable: false,
      cell: (l) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(l)} leftIcon={<Eye size={14} />}>
          View Payload
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}>
      <Table
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No audit logs recorded yet."
        selectable={true}
        pagination={{
          page,
          limit,
          total: totalCount,
          totalPages,
          onPageChange: (p) => setPage(p),
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
        cardRenderer={(l) => (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card, 10px)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
          >
            {/* Header: Action Badge & Timestamp */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              {getActionBadge(l.action)}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Operator and Target Entity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Operator: </span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {l.userFullName || l.username || 'System Engine'}
                </strong>
                {l.username && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> (@{l.username})</span>}
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Target: </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{l.entityType}</span>
                {l.entityId && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    #{l.entityId.substring(0, 8)}
                  </span>
                )}
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>IP: </span>
                <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.ipAddress || '—'}</code>
              </div>
            </div>

            {/* Footer with Payload Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '10px',
                marginTop: '4px',
              }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(l)}
                leftIcon={<Eye size={13} />}
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
              >
                Inspect Payload
              </Button>
            </div>
          </div>
        )}
      />

      {/* Payload Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Entry Details"
        description={`Action: ${selectedLog?.action} • Logged at: ${selectedLog ? new Date(selectedLog.createdAt).toLocaleString() : ''}`}
        maxWidth="640px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
              OPERATOR & ENVIRONMENT
            </div>
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px',
                borderRadius: 'var(--radius-sm, 4px)',
                fontSize: '13px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <div>User: <strong>{selectedLog?.userFullName || 'System'}</strong></div>
              <div>IP Address: <code>{selectedLog?.ipAddress || 'Unknown'}</code></div>
              <div style={{ gridColumn: 'span 2' }}>
                User Agent: <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{selectedLog?.userAgent || '—'}</span>
              </div>
            </div>
          </div>

          {selectedLog?.newValues && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                NEW VALUES / MUTATION PAYLOAD
              </div>
              <pre
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '12px',
                  overflowX: 'auto',
                  border: '1px solid var(--border-default)',
                }}
              >
                {JSON.stringify(selectedLog.newValues, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.oldValues && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                PREVIOUS VALUES
              </div>
              <pre
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '12px',
                  overflowX: 'auto',
                  border: '1px solid var(--border-default)',
                }}
              >
                {JSON.stringify(selectedLog.oldValues, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
