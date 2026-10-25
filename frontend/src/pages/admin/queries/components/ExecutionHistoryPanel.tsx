import React, { useEffect, useState } from 'react';
import { QueryExecutionHistoryItem } from '../../../../types/index.ts';
import { queriesApi } from '../../../../api/queries.ts';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/Button.tsx';

interface ExecutionHistoryPanelProps {
  queryId?: string;
}

export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({ queryId }) => {
  const [history, setHistory] = useState<QueryExecutionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    if (!queryId) return;
    setIsLoading(true);
    try {
      const items = await queriesApi.getExecutionHistory(queryId);
      setHistory(items);
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [queryId]);

  if (!queryId) {
    return (
      <div
        style={{
          padding: '36px',
          textAlign: 'center',
          border: '1px dashed var(--border-default)',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          fontSize: '13px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        Save this query first to start recording execution history logs.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-card, 8px)',
        border: '1px solid var(--border-default)',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Execution History Logs ({history.length})
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Audit log of all executions, runtime durations, returned record counts, and errors.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={13} />}
          onClick={fetchHistory}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {history.length === 0 ? (
        <div
          style={{
            padding: '36px',
            textAlign: 'center',
            border: '1px dashed var(--border-default)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          No executions recorded yet. Run this query to generate execution history.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--border-default)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px' }}>Executed At</th>
                <th style={{ padding: '8px 10px' }}>Executed By</th>
                <th style={{ padding: '8px 10px' }}>Execution Time</th>
                <th style={{ padding: '8px 10px' }}>Rows Returned</th>
                <th style={{ padding: '8px 10px' }}>Error Details</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid var(--border-subtle, var(--border-default))' }}
                >
                  <td style={{ padding: '8px 10px' }}>
                    <Badge variant={item.status === 'success' ? 'success' : 'danger'}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                    {new Date(item.executedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                    {item.executedByName}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {item.executionTimeMs} ms
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                    {item.rowCount.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--status-danger)', fontSize: '12px' }}>
                    {item.errorMessage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
