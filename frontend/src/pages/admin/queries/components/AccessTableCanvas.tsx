import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  QueryTableNode,
  QueryJoin,
  QueryJoinType,
} from '../../../../types/index.ts';
import { TableStructure, TableColumn } from '../../../../types/database.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  Plus,
  Trash2,
  Key,
  Link2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  AlertTriangle,
  X,
  Database,
  Unlink,
} from 'lucide-react';

interface AccessTableCanvasProps {
  tables: QueryTableNode[];
  joins: QueryJoin[];
  tableStructures: Record<string, TableStructure>;
  onAddTableClick: () => void;
  onRemoveTable: (tableId: string) => void;
  onUpdateTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  onAddJoin: (join: Omit<QueryJoin, 'id'>) => void;
  onEditJoin: (join: QueryJoin) => void;
  onDeleteJoin?: (joinId: string) => void;
  onAutoSuggestJoins: () => void;
  onDoubleClickColumn: (tableNode: QueryTableNode, column: TableColumn) => void;
}

export const AccessTableCanvas: React.FC<AccessTableCanvasProps> = ({
  tables,
  joins,
  tableStructures,
  onAddTableClick,
  onRemoveTable,
  onUpdateTablePosition,
  onAddJoin,
  onEditJoin,
  onDeleteJoin,
  onAutoSuggestJoins,
  onDoubleClickColumn,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Column Drag-and-Drop / Connecting state
  const [connectingSource, setConnectingSource] = useState<{
    tableAlias: string;
    columnName: string;
    startX: number;
    startY: number;
  } | null>(null);

  // Candidate drag tracking for column row mousedown vs click
  const potentialDragRef = useRef<{
    tableAlias: string;
    columnName: string;
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [hoveredTargetCol, setHoveredTargetCol] = useState<{
    tableAlias: string;
    columnName: string;
  } | null>(null);

  const [hoveredJoinId, setHoveredJoinId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Revision state to trigger SVG re-render on card drag
  const [, setPosRevision] = useState(0);

  // Track DOM coordinates of columns for drawing exact SVG lines
  const columnPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  const registerColumnPos = (tableAlias: string, columnName: string, element: HTMLElement | null) => {
    if (!element || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const elemRect = element.getBoundingClientRect();
    const key = `${tableAlias}.${columnName}`;

    columnPositionsRef.current[key] = {
      x: (elemRect.left + elemRect.width / 2 - canvasRect.left + canvasRef.current.scrollLeft) / zoom,
      y: (elemRect.top + elemRect.height / 2 - canvasRect.top + canvasRef.current.scrollTop) / zoom,
    };
  };

  // Card movement drag
  const handleCardHeaderMouseDown = (
    e: React.MouseEvent,
    tableId: string,
    currentPos: { x: number; y: number }
  ) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setDraggingTableId(tableId);
    setDragOffset({
      x: e.clientX / zoom - currentPos.x,
      y: e.clientY / zoom - currentPos.y,
    });
  };

  // Global mousemove / mouseup
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();

      const currentCanvasX = (e.clientX - canvasRect.left + canvasRef.current.scrollLeft) / zoom;
      const currentCanvasY = (e.clientY - canvasRect.top + canvasRef.current.scrollTop) / zoom;
      setMousePos({ x: currentCanvasX, y: currentCanvasY });

      // Check if candidate row drag threshold (4px) exceeded
      if (potentialDragRef.current && !connectingSource) {
        const dx = Math.abs(e.clientX - potentialDragRef.current.clientX);
        const dy = Math.abs(e.clientY - potentialDragRef.current.clientY);
        if (dx > 4 || dy > 4) {
          setConnectingSource({
            tableAlias: potentialDragRef.current.tableAlias,
            columnName: potentialDragRef.current.columnName,
            startX: potentialDragRef.current.startX,
            startY: potentialDragRef.current.startY,
          });
        }
      }

      if (draggingTableId) {
        const newX = Math.max(10, Math.round(e.clientX / zoom - dragOffset.x));
        const newY = Math.max(10, Math.round(e.clientY / zoom - dragOffset.y));
        onUpdateTablePosition(draggingTableId, { x: newX, y: newY });
        setPosRevision((r) => r + 1);
      }
    };

    const handleMouseUp = () => {
      potentialDragRef.current = null;
      setDraggingTableId(null);
      setConnectingSource(null);
      setHoveredTargetCol(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTableId, dragOffset, zoom, connectingSource, onUpdateTablePosition]);

  // Start connecting from column handle or row
  const handleColumnMouseDown = (
    e: React.MouseEvent,
    tableAlias: string,
    columnName: string,
    isImmediateHandle: boolean = false
  ) => {
    if (e.button !== 0) return; // Left click only
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startX = (e.clientX - canvasRect.left + canvasRef.current.scrollLeft) / zoom;
    const startY = (e.clientY - canvasRect.top + canvasRef.current.scrollTop) / zoom;

    if (isImmediateHandle) {
      e.stopPropagation();
      setConnectingSource({
        tableAlias,
        columnName,
        startX,
        startY,
      });
    } else {
      potentialDragRef.current = {
        tableAlias,
        columnName,
        clientX: e.clientX,
        clientY: e.clientY,
        startX,
        startY,
      };
    }
  };

  // Drop onto a target column row or handle
  const handleColumnMouseUp = (
    e: React.MouseEvent,
    targetTableAlias: string,
    targetColumnName: string
  ) => {
    if (!connectingSource) return;
    e.stopPropagation();

    if (connectingSource.tableAlias !== targetTableAlias) {
      onAddJoin({
        sourceTableAlias: connectingSource.tableAlias,
        sourceColumn: connectingSource.columnName,
        targetTableAlias,
        targetColumn: targetColumnName,
        joinType: 'INNER',
        operator: '=',
        leftTableAlias: connectingSource.tableAlias,
        leftColumn: connectingSource.columnName,
        rightTableAlias: targetTableAlias,
        rightColumn: targetColumnName,
      });
    }

    setConnectingSource(null);
    potentialDragRef.current = null;
    setHoveredTargetCol(null);
  };

  // Identify unconnected tables for Cartesian warning
  const connectedTableAliases = new Set<string>();
  joins.forEach((j) => {
    const src = j.sourceTableAlias || (j as any).leftTableAlias;
    const tgt = j.targetTableAlias || (j as any).rightTableAlias;
    if (src) connectedTableAliases.add(src);
    if (tgt) connectedTableAliases.add(tgt);
  });
  const unconnectedTables = tables.filter((t) => !connectedTableAliases.has(t.alias));
  const hasCartesianWarning = tables.length > 1 && unconnectedTables.length > 0;

  // Helper to calculate exact join line coordinates
  const calculateJoinCoords = useCallback(
    (join: QueryJoin) => {
      const srcAlias = join.sourceTableAlias || (join as any).leftTableAlias;
      const tgtAlias = join.targetTableAlias || (join as any).rightTableAlias;
      const srcCol = join.sourceColumn || (join as any).leftColumn;
      const tgtCol = join.targetColumn || (join as any).rightColumn;

      const sourceTable = tables.find((t) => t.alias === srcAlias);
      const targetTable = tables.find((t) => t.alias === tgtAlias);
      if (!sourceTable || !targetTable) return null;

      const cardWidth = 260;
      const isSourceOnLeft = sourceTable.position.x < targetTable.position.x;

      const sourceKey = `${srcAlias}.${srcCol}`;
      const targetKey = `${tgtAlias}.${tgtCol}`;

      const sourcePos = columnPositionsRef.current[sourceKey];
      const targetPos = columnPositionsRef.current[targetKey];

      const startX = isSourceOnLeft
        ? sourceTable.position.x + cardWidth
        : sourceTable.position.x;
      const startY = sourcePos ? sourcePos.y : sourceTable.position.y + 60;

      const endX = isSourceOnLeft
        ? targetTable.position.x
        : targetTable.position.x + cardWidth;
      const endY = targetPos ? targetPos.y : targetTable.position.y + 60;

      const dx = Math.max(40, Math.abs(endX - startX) * 0.45);
      const path = `M ${startX} ${startY} C ${startX + (isSourceOnLeft ? dx : -dx)} ${startY}, ${
        endX + (isSourceOnLeft ? -dx : dx)
      } ${endY}, ${endX} ${endY}`;

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      return { path, midX, midY, startX, startY, endX, endY };
    },
    [tables]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-app)',
        borderBottom: '1px solid var(--border-default)',
        position: 'relative',
        userSelect: draggingTableId || connectingSource ? 'none' : 'auto',
      }}
    >
      {/* Canvas Toolbar Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '12px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={onAddTableClick}
            leftIcon={<Plus size={13} />}
          >
            Add Tables
          </Button>

          {tables.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoSuggestJoins}
              leftIcon={<Sparkles size={13} />}
              title="Automatically detect and connect foreign key relationships from database schema"
            >
              Auto-Link FKs
            </Button>
          )}

          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>
            {tables.length} table{tables.length === 1 ? '' : 's'} on canvas
          </span>

          {hasCartesianWarning && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: 'var(--status-warning, #ca8a04)',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title={`Tables without relationships: ${unconnectedTables.map((t) => t.tableName).join(', ')}`}
            >
              <AlertTriangle size={12} />
              <span>Unconnected tables (Cartesian Join warning)</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
            title="Zoom Out"
            leftIcon={<ZoomOut size={13} />}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
            title="Zoom In"
            leftIcon={<ZoomIn size={13} />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(1)}
            title="Reset Zoom (100%)"
            leftIcon={<Maximize2 size={13} />}
          />
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          backgroundImage:
            'radial-gradient(var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          minHeight: '160px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '3200px',
            height: '2200px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* SVG Layer for Relationship Lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <defs>
              <filter id="line-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Existing Relationship Lines */}
            {joins.map((join) => {
              const coords = calculateJoinCoords(join);
              if (!coords) return null;
              const isHovered = hoveredJoinId === join.id;

              return (
                <g
                  key={join.id}
                  onMouseEnter={() => setHoveredJoinId(join.id)}
                  onMouseLeave={() => setHoveredJoinId((curr) => (curr === join.id ? null : curr))}
                >
                  {/* Invisible thicker path for reliable clicking */}
                  <path
                    d={coords.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="16"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={() => onEditJoin(join)}
                  />
                  {/* Visible Relationship Line */}
                  <path
                    d={coords.path}
                    fill="none"
                    className="query-canvas-join-line"
                    stroke={isHovered ? 'var(--join-line-hover, var(--brand-primary-hover))' : 'var(--join-line-stroke, var(--brand-primary))'}
                    strokeWidth={isHovered ? '3.5' : '2.5'}
                    strokeLinecap="round"
                    style={{
                      pointerEvents: 'stroke',
                      cursor: 'pointer',
                      filter: 'url(#line-shadow)',
                      transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
                    }}
                    onClick={() => onEditJoin(join)}
                  />

                  {/* Midpoint Join Type & Operator Badge */}
                  <g
                    transform={`translate(${coords.midX}, ${coords.midY})`}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => onEditJoin(join)}
                  >
                    <rect
                      x="-38"
                      y="-12"
                      width="76"
                      height="24"
                      rx="5"
                      className="query-canvas-join-badge-rect"
                      fill="var(--join-badge-bg, var(--surface-1))"
                      stroke={isHovered ? 'var(--join-line-hover, var(--brand-primary-hover))' : 'var(--join-badge-border, var(--brand-primary))'}
                      strokeWidth={isHovered ? '2' : '1.5'}
                      style={{
                        filter: 'drop-shadow(0 2px 4px var(--join-line-shadow, rgba(0,0,0,0.25)))',
                        transition: 'stroke 0.15s ease',
                      }}
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      className="query-canvas-join-badge-text"
                      fill="var(--join-badge-text, var(--brand-primary))"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                    >
                      {join.joinType} {join.operator && join.operator !== '=' ? join.operator : ''}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Rubberband dashed line while dragging to create a join */}
            {connectingSource && (
              <line
                x1={connectingSource.startX}
                y1={connectingSource.startY}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="var(--join-line-stroke, var(--brand-primary, #0066cc))"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />
            )}
          </svg>

          {/* Floating Drag Indicator Badge following Cursor */}
          {connectingSource && (
            <div
              style={{
                position: 'absolute',
                left: `${mousePos.x + 14}px`,
                top: `${mousePos.y - 12}px`,
                backgroundColor: 'var(--bg-surface)',
                border: '1.5px solid var(--join-badge-border, var(--brand-primary))',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--join-badge-text, var(--brand-primary))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                zIndex: 100,
                whiteSpace: 'nowrap',
              }}
            >
              Linking [{connectingSource.tableAlias}].[{connectingSource.columnName}] → drop on target column
            </div>
          )}

          {/* Prompt when canvas is empty */}
          {tables.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                left: '50px',
                padding: '24px 32px',
                backgroundColor: 'var(--bg-surface)',
                border: '2px dashed var(--border-default)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Database size={32} style={{ color: 'var(--text-muted)' }} />
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                  No Tables in Query Designer
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Click <strong>Add Tables</strong> to pick tables and start building relationships.
                </p>
              </div>
              <Button variant="primary" onClick={onAddTableClick} leftIcon={<Plus size={14} />}>
                Add Tables
              </Button>
            </div>
          )}

          {/* Draggable Table Cards */}
          {tables.map((tableNode) => {
            const structure = tableStructures[tableNode.tableName];
            const columns = structure?.columns || [];
            const isUnconnected = unconnectedTables.some((t) => t.id === tableNode.id);

            return (
              <div
                key={tableNode.id}
                style={{
                  position: 'absolute',
                  left: `${tableNode.position.x}px`,
                  top: `${tableNode.position.y}px`,
                  width: '260px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-card, 6px)',
                  border:
                    isUnconnected && tables.length > 1
                      ? '1.5px solid var(--status-warning, #eab308)'
                      : '1px solid var(--border-default)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  zIndex: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Table Box Header */}
                <div
                  onMouseDown={(e) => handleCardHeaderMouseDown(e, tableNode.id, tableNode.position)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-app)',
                    borderBottom: '1px solid var(--border-default)',
                    cursor: 'grab',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <Database size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={tableNode.tableName}
                    >
                      {tableNode.tableName}
                    </span>
                    {tableNode.alias !== tableNode.tableName && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({tableNode.alias})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onRemoveTable(tableNode.id)}
                    title="Remove Table from Query"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-danger, #ef4444)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Column List */}
                <div
                  style={{
                    maxHeight: '240px',
                    overflowY: 'auto',
                    fontSize: '12px',
                  }}
                >
                  {columns.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                      Loading columns...
                    </div>
                  ) : (
                    columns.map((col) => {
                      const isPk = col.isPrimaryKey;
                      const hasFk = structure?.foreignKeys?.some((fk) => fk.columnName === col.name);
                      const isDropTarget =
                        connectingSource &&
                        connectingSource.tableAlias !== tableNode.alias &&
                        hoveredTargetCol?.tableAlias === tableNode.alias &&
                        hoveredTargetCol?.columnName === col.name;

                      return (
                        <div
                          key={col.name}
                          ref={(el) => registerColumnPos(tableNode.alias, col.name, el)}
                          onMouseDown={(e) => handleColumnMouseDown(e, tableNode.alias, col.name, false)}
                          onMouseEnter={() => {
                            if (connectingSource && connectingSource.tableAlias !== tableNode.alias) {
                              setHoveredTargetCol({ tableAlias: tableNode.alias, columnName: col.name });
                            }
                          }}
                          onMouseLeave={() => {
                            if (connectingSource) {
                              setHoveredTargetCol((curr) =>
                                curr?.tableAlias === tableNode.alias && curr?.columnName === col.name
                                  ? null
                                  : curr
                              );
                            }
                          }}
                          onMouseUp={(e) => handleColumnMouseUp(e, tableNode.alias, col.name)}
                          onDoubleClick={() => onDoubleClickColumn(tableNode, col)}
                          title="Double-click to add to design grid, or drag anywhere onto another table's column to link"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '5px 8px',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: connectingSource ? 'crosshair' : 'pointer',
                            userSelect: 'none',
                            backgroundColor: isDropTarget
                              ? 'var(--primary-subtle, rgba(0, 102, 204, 0.15))'
                              : 'transparent',
                            outline: isDropTarget ? '2px solid var(--primary)' : 'none',
                            transition: 'background-color 0.1s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            {/* Primary Key / Foreign Key Icons */}
                            {isPk ? (
                              <span title="Primary Key" style={{ display: 'inline-flex' }}>
                                <Key
                                  size={12}
                                  style={{ color: 'var(--status-warning, #d97706)', flexShrink: 0 }}
                                />
                              </span>
                            ) : hasFk ? (
                              <span title="Foreign Key" style={{ display: 'inline-flex' }}>
                                <Link2
                                  size={12}
                                  style={{ color: 'var(--brand-primary, #0066cc)', flexShrink: 0 }}
                                />
                              </span>
                            ) : (
                              <div style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                            )}

                            <span
                              style={{
                                color: isPk ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: isPk ? 600 : 400,
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {col.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {col.dataType}
                            </span>

                            {/* Relationship Connector Drag Handle */}
                            <div
                              onMouseDown={(e) => handleColumnMouseDown(e, tableNode.alias, col.name, true)}
                              onMouseUp={(e) => handleColumnMouseUp(e, tableNode.alias, col.name)}
                              title="Drag handle to connect relationship"
                              style={{
                                width: '11px',
                                height: '11px',
                                borderRadius: '50%',
                                border: '1.5px solid var(--brand-primary)',
                                backgroundColor: isDropTarget ? 'var(--brand-primary)' : 'var(--bg-surface)',
                                cursor: 'crosshair',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
