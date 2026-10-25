import React, { useState, useMemo } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { TableSummary } from '../../../../types/database.ts';
import { Search, Plus, Check, Database, Layers, Key, CheckSquare, Square } from 'lucide-react';

interface AddTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTables: TableSummary[];
  existingTableNames: string[];
  onAddTables: (tableNames: string[]) => void;
}

export const AddTablesModal: React.FC<AddTablesModalProps> = ({
  isOpen,
  onClose,
  allTables,
  existingTableNames,
  onAddTables,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  // Filter available tables based on search
  const filteredTables = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return allTables.filter((t) => {
      if (!term) return true;
      return (
        t.tableName.toLowerCase().includes(term) ||
        (t.comment && t.comment.toLowerCase().includes(term))
      );
    });
  }, [allTables, searchTerm]);

  const toggleSelectTable = (tableName: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTables.size === filteredTables.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(filteredTables.map((t) => t.tableName)));
    }
  };

  const handleConfirmAdd = () => {
    if (selectedTables.size === 0) return;
    onAddTables(Array.from(selectedTables));
    setSelectedTables(new Set());
    onClose();
  };

  const handleDoubleClick = (tableName: string) => {
    onAddTables([tableName]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Show Table (Add Tables to Query)"
      description="Select one or more tables to add to the query design workspace. Double-click a table to add it immediately."
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {selectedTables.size > 0 ? (
              <span><strong>{selectedTables.size}</strong> table(s) selected</span>
            ) : (
              <span>Select tables to add</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAdd}
              disabled={selectedTables.size === 0}
              leftIcon={<Plus size={14} />}
            >
              Add Selected Table{selectedTables.size > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search Bar & Select All */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Search tables by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={14} />}
              autoFocus
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            title={selectedTables.size === filteredTables.length ? 'Deselect all' : 'Select all'}
          >
            {selectedTables.size === filteredTables.length && filteredTables.length > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckSquare size={14} /> Clear
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Square size={14} /> Select All
              </span>
            )}
          </Button>
        </div>

        {/* Table List */}
        <div
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-input, 6px)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          {filteredTables.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No tables found matching "{searchTerm}"
            </div>
          ) : (
            filteredTables.map((table) => {
              const isAlreadyInQuery = existingTableNames.includes(table.tableName);
              const isSelected = selectedTables.has(table.tableName);

              return (
                <div
                  key={table.tableName}
                  onClick={() => toggleSelectTable(table.tableName)}
                  onDoubleClick={() => handleDoubleClick(table.tableName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'var(--primary-subtle, rgba(0, 102, 204, 0.08))'
                      : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: isSelected
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border-default)',
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '11px',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Database size={14} style={{ color: 'var(--text-muted)' }} />
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {table.tableName}
                        </span>
                        {isAlreadyInQuery && (
                          <Badge variant="info">
                            In Canvas
                          </Badge>
                        )}
                        {table.primaryKey && (
                          <span
                            title={`Primary Key: ${table.primaryKey}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: 'var(--status-warning, #d97706)',
                              fontSize: '11px',
                            }}
                          >
                            <Key size={12} />
                          </span>
                        )}
                      </div>
                      {table.comment && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {table.comment}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {table.columnCount} columns
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      • {table.rowCount.toLocaleString()} rows
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
