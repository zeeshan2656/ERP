import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { queriesApi } from '../../../../api/queries.ts';
import { Search, FolderOpen, Clock, Database, Layers, ArrowRight } from 'lucide-react';

interface OpenQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (queryId: string) => void;
}

export const OpenQueryModal: React.FC<OpenQueryModalProps> = ({
  isOpen,
  onClose,
  onSelectQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'sample'>('all');
  const [queries, setQueries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadQueries = async () => {
        setIsLoading(true);
        try {
          const res = await queriesApi.listQueries();
          setQueries(res || []);
        } catch {
          // ignore
        } finally {
          setIsLoading(false);
        }
      };
      loadQueries();
    }
  }, [isOpen]);

  const filteredQueries = queries.filter((q) => {
    const isSample = q.isTemplate || q.slug?.startsWith('sample-') || q.category === 'Sample Queries';
    if (activeTab === 'my' && isSample) return false;
    if (activeTab === 'sample' && !isSample) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.name.toLowerCase().includes(term) ||
      (q.description && q.description.toLowerCase().includes(term)) ||
      (q.category && q.category.toLowerCase().includes(term)) ||
      (q.sourceTables && q.sourceTables.some((t: string) => t.toLowerCase().includes(term)))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Saved Query"
      description="Choose an existing query from your repository to load into the Visual Query Designer."
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Search by query name, description, or table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={14} />}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-app)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                border: 'none',
                background: activeTab === 'all' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'all' ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my')}
              style={{
                border: 'none',
                background: activeTab === 'my' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'my' ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              My Queries
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sample')}
              style={{
                border: 'none',
                background: activeTab === 'sample' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'sample' ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Templates
            </button>
          </div>
        </div>

        <div
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-input, 6px)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading queries...
            </div>
          ) : filteredQueries.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No saved queries found.
            </div>
          ) : (
            filteredQueries.map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  onSelectQuery(q.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderOpen size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {q.name}
                    </span>
                    <Badge variant={q.status === 'published' ? 'success' : 'neutral'}>
                      {q.status}
                    </Badge>
                    <Badge variant="info">
                      {q.category}
                    </Badge>
                  </div>

                  {q.description && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {q.description}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Tables: {q.sourceTables?.join(', ') || 'None'}</span>
                    <span>• Columns: {q.columnCount}</span>
                    <span>• Updated: {new Date(q.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" leftIcon={<ArrowRight size={13} />}>
                  Open
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
