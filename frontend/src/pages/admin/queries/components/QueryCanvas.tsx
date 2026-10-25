import React, { useState, useRef, useEffect } from 'react';
import {
  QueryTableNode,
  QueryJoin,
  QueryColumn,
  QueryJoinType,
} from '../../../../types/index.ts';
import { TableSummary, TableStructure, TableColumn } from '../../../../types/database.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import {
  Plus,
  Trash2,
  Key,
  Link2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Search,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';

interface QueryCanvasProps {
  tables: QueryTableNode[];
  joins: QueryJoin[];
  columns: QueryColumn[];
  allDbTables: TableSummary[];
  tableStructures: Record<string, TableStructure>;
  onAddTable: (tableName: string) => void;
  onRemoveTable: (tableId: string) => void;
  onUpdateTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  onToggleColumn: (tableNode: QueryTableNode, column: TableColumn) => void;
  onAddJoin: (join: Omit<QueryJoin, 'id'>) => void;
  onRemoveJoin: (joinId: string) => void;
  onUpdateJoinType: (joinId: string, joinType: QueryJoinType) => void;
  onAutoSuggestJoins: () => void;
}

export const QueryCanvas: React.FC<QueryCanvasProps> = ({
  tables,
  joins,
  columns,
  allDbTables,
  tableStructures,
  onAddTable,
  onRemoveTable,
  onUpdateTablePosition,
  onToggleColumn,
  onAddJoin,
  onRemoveJoin,
  onUpdateJoinType,
  onAutoSuggestJoins,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Linking state: click a source column connector, then click a target column connector to link!
  const [linkingSource, setLinkingSource] = useState<{
    tableAlias: string;
    columnName: string;
  } | null>(null);

  // Quick table picker
  const [selectedAddTableName, setSelectedAddTableName] = useState('');
  const [cardColumnFilter, setCardColumnFilter] = useState<Record<string, string>>({});

  // Mouse drag handler for table cards
  const handleMouseDown = (e: React.MouseEvent, tableId: string, currentPos: { x: number; y: number }) => {
    // Only drag from card header
    if ((e.target as HTMLElement).closest('.table-card-body') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setDraggingTableId(tableId);
    setDragOffset({
      x: e.clientX / zoom - currentPos.x,
      y: e.clientY / zoom - currentPos.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingTableId || !canvasRef.current) return;
      const newX = Math.max(10, Math.round(e.clientX / zoom - dragOffset.x));
      const newY = Math.max(10, Math.round(e.clientY / zoom - dragOffset.y));
      onUpdateTablePosition(draggingTableId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setDraggingTableId(null);
    };

    if (draggingTableId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTableId, dragOffset, zoom, onUpdateTablePosition]);

  const handleConnectorClick = (tableAlias: string, columnName: string) => {
    if (!linkingSource) {
      setLinkingSource({ tableAlias, columnName });
    } else {
      if (linkingSource.tableAlias === tableAlias) {
        // Can't link column to the same table instance
        setLinkingSource(null);
        return;
      }
      // Create join
      onAddJoin({
        sourceTableAlias: linkingSource.tableAlias,
        sourceColumn: linkingSource.columnName,
        targetTableAlias: tableAlias,
        targetColumn: columnName,
        joinType: 'INNER',
      });
      setLinkingSource(null);
    }
  };

  // Helper to calculate coordinates for join line bezier curve
  const calculateJoinCoords = (join: QueryJoin) => {
    const sourceTable = tables.find((t) => t.alias === join.sourceTableAlias);
    const targetTable = tables.find((t) => t.alias === join.targetTableAlias);
    if (!sourceTable || !targetTable) return null;

    // Table width is 260px
    const cardWidth = 260;
    // Approximating column vertical offset or center of card
    const sourceX = sourceTable.position.x < targetTable.position.x ? sourceTable.position.x + cardWidth : sourceTable.position.x;
    const sourceY = sourceTable.position.y + 70;

    const targetX = sourceTable.position.x < targetTable.position.x ? targetTable.position.x : targetTable.position.x + cardWidth;
    const targetY = targetTable.position.y + 70;

    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
    return { path, midX, midY, sourceX, sourceY, targetX, targetY };
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '620px',
        backgroundColor: 'var(--bg-canvas, var(--bg-app))',
        backgroundImage:
          'radial-gradient(var(--border-default) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        borderRadius: 'var(--radius-card, 8px)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Canvas Top Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '220px' }}>
            <Select
              value={selectedAddTableName}
              onChange={(e) => setSelectedAddTableName(e.target.value)}
              options={[
                { value: '', label: 'Select table to add...' },
                ...allDbTables.map((t) => ({
                  value: t.tableName,
                  label: `${t.tableName} (${t.rowCount})`,
                })),
              ]}
            />
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={14} />}
            disabled={!selectedAddTableName}
            onClick={() => {
              if (selectedAddTableName) {
                onAddTable(selectedAddTableName);
                setSelectedAddTableName('');
              }
            }}
          >
            Add Table
          </Button>

          <Button
            variant="outline"
            leftIcon={<Sparkles size={14} />}
            onClick={onAutoSuggestJoins}
            disabled={tables.length < 2}
            title="Auto-detect Foreign Key relationships and add Joins"
          >
            Auto-Suggest Joins
          </Button>
        </div>

        {/* Linking Mode Banner */}
        {linkingSource && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              backgroundColor: 'var(--primary-color)',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <Link2 size={13} />
            <span>
              Click a column in another table to link to{' '}
              <strong>{linkingSource.tableAlias}.{linkingSource.columnName}</strong>
            </span>
            <button
              onClick={() => setLinkingSource(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Button
            variant="outline"
            leftIcon={<ZoomOut size={13} />}
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            title="Zoom Out"
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            leftIcon={<ZoomIn size={13} />}
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            title="Zoom In"
          />
          <Button
            variant="ghost"
            leftIcon={<Maximize2 size={13} />}
            onClick={() => setZoom(1)}
            title="Reset 100%"
          />
        </div>
      </div>

      {/* Main Draggable Workspace Area */}
      <div
        ref={canvasRef}
        style={{
          position: 'relative',
          flex: 1,
          overflow: 'auto',
          width: '100%',
          height: '100%',
          cursor: draggingTableId ? 'grabbing' : 'default',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '3200px',
            height: '2400px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* SVG Layer for Join Lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <defs>
              <marker
                id="join-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="4"
                refY="4"
                orient="auto"
              >
                <circle cx="4" cy="4" r="3" fill="var(--primary-color, #3b82f6)" />
              </marker>
            </defs>
            {joins.map((join) => {
              const coords = calculateJoinCoords(join);
              if (!coords) return null;
              return (
                <g key={join.id}>
                  <path
                    d={coords.path}
                    fill="none"
                    stroke="var(--primary-color, #3b82f6)"
                    strokeWidth="2.5"
                    strokeDasharray={join.joinType === 'LEFT' || join.joinType === 'RIGHT' ? '5,5' : 'none'}
                    markerEnd="url(#join-arrow)"
                    markerStart="url(#join-arrow)"
                  />
                </g>
              );
            })}
          </svg>

          {/* HTML Join Badges (clickable) */}
          {joins.map((join) => {
            const coords = calculateJoinCoords(join);
            if (!coords) return null;
            return (
              <div
                key={`badge_${join.id}`}
                style={{
                  position: 'absolute',
                  left: `${coords.midX - 45}px`,
                  top: `${coords.midY - 14}px`,
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                <select
                  value={join.joinType}
                  onChange={(e) => onUpdateJoinType(join.id, e.target.value as QueryJoinType)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--primary-color)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="INNER">INNER</option>
                  <option value="LEFT">LEFT</option>
                  <option value="RIGHT">RIGHT</option>
                  <option value="CROSS">CROSS</option>
                </select>
                <button
                  type="button"
                  onClick={() => onRemoveJoin(join.id)}
                  title="Remove join"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}

          {/* Draggable Table Cards */}
          {tables.map((tableNode) => {
            const structure = tableStructures[tableNode.tableName];
            const allCols = structure?.columns || [];
            const filterTerm = (cardColumnFilter[tableNode.id] || '').toLowerCase();
            const visibleCols = filterTerm
              ? allCols.filter((c) => c.name.toLowerCase().includes(filterTerm))
              : allCols;

            return (
              <div
                key={tableNode.id}
                onMouseDown={(e) => handleMouseDown(e, tableNode.id, tableNode.position)}
                style={{
                  position: 'absolute',
                  left: `${tableNode.position.x}px`,
                  top: `${tableNode.position.y}px`,
                  width: '260px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-card, 8px)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: draggingTableId === tableNode.id ? 10 : 2,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  userSelect: 'none',
                }}
              >
                {/* Table Card Header */}
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.05))',
                    borderBottom: '1px solid var(--border-default)',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <Layers size={14} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={tableNode.tableName}
                    >
                      {tableNode.tableName}
                    </span>
                    <Badge variant="neutral">
                      {tableNode.alias}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveTable(tableNode.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Remove table from query"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Filter within table columns */}
                <div
                  className="table-card-body"
                  style={{
                    padding: '4px 8px',
                    borderBottom: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={11} style={{ position: 'absolute', left: '6px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Filter columns..."
                      value={cardColumnFilter[tableNode.id] || ''}
                      onChange={(e) =>
                        setCardColumnFilter((prev) => ({ ...prev, [tableNode.id]: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '4px 6px 4px 22px',
                        fontSize: '11px',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Columns Scroll Area */}
                <div
                  className="table-card-body"
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '4px 0',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  {visibleCols.map((col) => {
                    const isSelected = columns.some(
                      (c) => c.tableAlias === tableNode.alias && c.columnName === col.name
                    );
                    const isConnectorActive =
                      linkingSource?.tableAlias === tableNode.alias &&
                      linkingSource?.columnName === col.name;

                    return (
                      <div
                        key={col.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.03))',
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        }}
                      >
                        {/* Checkbox & Name */}
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            flex: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleColumn(tableNode, col)}
                            style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                          />
                          <span
                            style={{
                              color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                              fontWeight: isSelected ? 600 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {col.name}
                          </span>
                          {col.isPrimaryKey && (
                            <span title="Primary Key">
                              <Key size={11} style={{ color: '#eab308', flexShrink: 0 }} />
                            </span>
                          )}
                        </label>

                        {/* Data Type & Join Link Anchor */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {col.dataType}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleConnectorClick(tableNode.alias, col.name)}
                            title={
                              isConnectorActive
                                ? 'Connecting from here...'
                                : `Link ${tableNode.alias}.${col.name}`
                            }
                            style={{
                              border: 'none',
                              background: isConnectorActive ? 'var(--primary-color)' : 'transparent',
                              color: isConnectorActive ? '#fff' : 'var(--text-muted)',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            <Link2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {visibleCols.length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No matching columns
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {tables.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '120px',
                left: '200px',
                padding: '24px 32px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-card, 8px)',
                textAlign: 'center',
                maxWidth: '420px',
              }}
            >
              <Layers size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>Visual Query Canvas Empty</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Select a table from the top dropdown and click <strong>Add Table</strong> to begin visually designing your multi-table query.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
