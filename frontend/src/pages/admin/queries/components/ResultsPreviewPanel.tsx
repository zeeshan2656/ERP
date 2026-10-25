import React from 'react';
import { Table, Column } from '../../../../components/ui/Table.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { Download, AlertTriangle, Clock, Database, Play } from 'lucide-react';
import { QueryExecutionResult } from '../../../../api/queries.ts';

interface ResultsPreviewPanelProps {
  result: QueryExecutionResult | null;
  isLoading: boolean;
  onExecute: () => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export const ResultsPreviewPanel: React.FC<ResultsPreviewPanelProps> = ({
  result,
  isLoading,
  onExecute,
  limit,
  onLimitChange,
}) => {
  // Export as CSV
  const handleExportCsv = () => {
    if (!result || !result.data || result.data.length === 0) return;
    const headers = Object.keys(result.data[0]);
    const csvRows = [
      headers.join(','),
      ...result.data.map((row) =>
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
    link.download = `query_results_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as JSON
  const handleExportJson = () => {
    if (!result || !result.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_results_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Construct dynamic table columns
  const tableColumns: Column<Record<string, any>>[] = React.useMemo(() => {
    if (!result || !result.data || result.data.length === 0) {
      if (result?.columns && result.columns.length > 0) {
        return result.columns.map((c) => ({
          id: c.id,
          header: c.header,
          accessorKey: c.accessorKey,
          sortable: true,
        }));
      }
      return [];
    }

    const firstRow = result.data[0];
    return Object.keys(firstRow).map((key) => ({
      id: key,
      header: key,
      accessorKey: key,
      sortable: true,
      cell: (row) => {
        const val = row[key];
        if (val === null || val === undefined) {
          return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>;
        }
        if (typeof val === 'boolean') {
          return <Badge variant={val ? 'success' : 'neutral'}>{val ? 'true' : 'false'}</Badge>;
        }
        if (typeof val === 'object') {
          return <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{JSON.stringify(val)}</span>;
        }
        return <span>{String(val)}</span>;
      },
    }));
  }, [result]);

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
        minHeight: '480px',
      }}
    >
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="primary"
            leftIcon={<Play size={14} />}
            onClick={onExecute}
            isLoading={isLoading}
          >
            Run Query
          </Button>

          {result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <Badge variant="neutral">
                <Clock size={11} style={{ marginRight: '4px' }} /> {result.executionTimeMs} ms
              </Badge>
              <Badge variant="neutral">
                <Database size={11} style={{ marginRight: '4px' }} /> {result.rowCount} rows
              </Badge>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Row Limit:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={13} />}
            disabled={!result || !result.data || result.data.length === 0}
            onClick={handleExportCsv}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={13} />}
            disabled={!result || !result.data || result.data.length === 0}
            onClick={handleExportJson}
          >
            JSON
          </Button>
        </div>
      </div>

      {/* Warnings Banner */}
      {result?.warnings && result.warnings.length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: 'var(--text-warning, #eab308)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            fontSize: '13px',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{result.warnings.join(' ')}</span>
        </div>
      )}

      {/* Live Table Results */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Table
          columns={tableColumns}
          data={result?.data || []}
          isLoading={isLoading}
          emptyMessage={
            result
              ? 'Query executed successfully with 0 matching rows.'
              : 'Click "Run Query" or "Run / Preview" to test your visual query definition.'
          }
        />
      </div>
    </div>
  );
};
