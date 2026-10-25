import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { queriesApi, QueryExecutionResult } from '../../../api/queries.ts';
import { api } from '../../../api/client.ts';
import {
  SavedQuery,
  VisualQueryDefinition,
  QueryTableNode,
  QueryColumn,
  QueryJoin,
  QueryCalculatedColumn,
  QueryConditionGroup,
  QueryOrderBy,
  QueryParameter,
  QueryJoinType,
  AccessGridColumn,
} from '../../../types/index.ts';
import { TableSummary, TableStructure, TableColumn } from '../../../types/database.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import {
  usePageTitle,
  usePageActions,
  useHeaderCustomControls,
} from '../../../context/PageHeaderContext.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Select } from '../../../components/ui/Select.tsx';

// Microsoft Access Query Designer Sub-components
import { AccessTableCanvas } from './components/AccessTableCanvas.tsx';
import { AccessQueryGrid } from './components/AccessQueryGrid.tsx';
import { AddTablesModal } from './components/AddTablesModal.tsx';
import { JoinPropertiesModal } from './components/JoinPropertiesModal.tsx';
import { FormulaEditorModal } from './components/FormulaEditorModal.tsx';
import { OpenQueryModal } from './components/OpenQueryModal.tsx';
import { SaveQueryModal } from './components/SaveQueryModal.tsx';
import { ResultsPreviewPanel } from './components/ResultsPreviewPanel.tsx';
import { SqlPreviewModal } from './components/SqlPreviewModal.tsx';
import { ParametersConfigModal } from './components/ParametersConfigModal.tsx';
import { ParameterPromptModal } from './components/ParameterPromptModal.tsx';
import { OperationsErrorBoundary } from '../../../components/operations/index.ts';

import {
  Save,
  Play,
  Code,
  Sliders,
  ArrowLeft,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Sparkles,
  FilePlus,
  Download,
} from 'lucide-react';

export const QueryDesignerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  // View Mode: Access Design View (Canvas + Grid) or Datasheet View (Live Result dataset)
  const [viewMode, setViewMode] = useState<'design' | 'datasheet'>('design');

  // Metadata
  const [queryName, setQueryName] = useState<string>('Untitled Query');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Design State
  const [tables, setTables] = useState<QueryTableNode[]>([]);
  const [joins, setJoins] = useState<QueryJoin[]>([]);
  const [gridColumns, setGridColumns] = useState<AccessGridColumn[]>([]);
  const [limit, setLimit] = useState<number>(100);
  const [parameters, setParameters] = useState<QueryParameter[]>([]);

  // Database Schema Reflection State
  const [allDbTables, setAllDbTables] = useState<TableSummary[]>([]);
  const [tableStructures, setTableStructures] = useState<Record<string, TableStructure>>({});
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(true);
  const [isLoadingQuery, setIsLoadingQuery] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modals State
  const [isAddTablesOpen, setIsAddTablesOpen] = useState<boolean>(false);
  const [editingJoin, setEditingJoin] = useState<QueryJoin | null>(null);
  const [editingGridColumn, setEditingGridColumn] = useState<AccessGridColumn | null>(null);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState<boolean>(false);
  const [isOpenQueryModalOpen, setIsOpenQueryModalOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveModalMode, setSaveModalMode] = useState<'save' | 'saveAs'>('save');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState<boolean>(false);
  const [isParamPromptOpen, setIsParamPromptOpen] = useState<boolean>(false);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [sqlWarnings, setSqlWarnings] = useState<string[]>([]);

  // Warn user before leaving page if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Results State
  const [previewResult, setPreviewResult] = useState<QueryExecutionResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Split-pane vertical height for canvas (in px) with sessionStorage persistence
  const [canvasHeight, setCanvasHeight] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('apex_flow_query_canvas_height');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 160 && val <= 800) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    return 340;
  });

  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleUpdateCanvasHeight = (newHeight: number) => {
    setCanvasHeight(newHeight);
    try {
      sessionStorage.setItem('apex_flow_query_canvas_height', String(newHeight));
    } catch {
      // ignore
    }
  };

  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplitter(true);

    const startY = e.clientY;
    const startHeight = canvasHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaY = moveEvent.clientY - startY;
      const containerHeight = workspaceRef.current ? workspaceRef.current.clientHeight : 700;
      const minCanvas = 160;
      const maxCanvas = Math.max(minCanvas + 50, containerHeight - 180);
      const newHeight = Math.max(minCanvas, Math.min(maxCanvas, startHeight + deltaY));
      handleUpdateCanvasHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSplitterTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDraggingSplitter(true);

    const startY = e.touches[0].clientY;
    const startHeight = canvasHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      const deltaY = moveEvent.touches[0].clientY - startY;
      const containerHeight = workspaceRef.current ? workspaceRef.current.clientHeight : 700;
      const minCanvas = 160;
      const maxCanvas = Math.max(minCanvas + 50, containerHeight - 180);
      const newHeight = Math.max(minCanvas, Math.min(maxCanvas, startHeight + deltaY));
      handleUpdateCanvasHeight(newHeight);
    };

    const handleTouchEnd = () => {
      setIsDraggingSplitter(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Page Title & Breadcrumbs
  usePageTitle(queryName || 'Visual Query Designer', [
    { label: 'Administration' },
    { label: 'Query Builder', path: '/admin/queries' },
    { label: isNew ? 'New Query' : queryName },
  ]);

  // Load Database Schema Tables
  useEffect(() => {
    const fetchSchema = async () => {
      setIsLoadingSchema(true);
      try {
        const res = await api.get<TableSummary[]>('/database/tables');
        if (res.data) {
          setAllDbTables(res.data);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load database tables', 'error');
      } finally {
        setIsLoadingSchema(false);
      }
    };
    fetchSchema();
  }, []);

  // Fetch Table Structure Helper
  const ensureTableStructure = useCallback(
    async (tableName: string) => {
      if (tableStructures[tableName]) return;
      try {
        const res = await api.get<TableStructure>(`/database/tables/${encodeURIComponent(tableName)}/structure`);
        if (res.data) {
          const struct = res.data;
          setTableStructures((prev) => ({ ...prev, [tableName]: struct }));
        }
      } catch {
        // ignore
      }
    },
    [tableStructures]
  );

  // Load Existing Query if Editing
  useEffect(() => {
    if (!isNew && id) {
      const loadQuery = async () => {
        setIsLoadingQuery(true);
        try {
          const q = await queriesApi.getQuery(id);
          setQueryName(q.name);
          setDescription(q.description || '');
          setCategory(q.category || 'General');
          setStatus(q.status);
          setGeneratedSql(q.generatedSql || '');
          setParameters(q.parameters || []);

          const def = q.visualDefinition || {};
          setTables(def.tables || []);
          setJoins(def.joins || []);
          setLimit(def.limit || 100);

          // If gridColumns are saved, use them; otherwise construct from legacy columns & calculatedColumns
          if (def.gridColumns && def.gridColumns.length > 0) {
            setGridColumns(def.gridColumns);
          } else {
            const reconstructed: AccessGridColumn[] = [
              ...(def.columns || []).map((col, idx) => ({
                id: col.id || `col_${idx}_${Date.now()}`,
                field: col.columnName,
                tableName: col.tableName,
                tableAlias: col.tableAlias,
                columnName: col.columnName,
                alias: col.alias || col.columnName,
                sortOrder: (col.sortOrder as any) || '',
                sortPriority: (idx + 1) * 10,
                isVisible: col.isVisible !== false,
                criteria: '',
                orCriteria: [],
                isCalculated: false,
                outputType: (col.dataType as any) || 'VARCHAR',
              })),
              ...(def.calculatedColumns || []).map((calc, idx) => ({
                id: calc.id || `calc_${idx}_${Date.now()}`,
                field: calc.alias,
                tableName: '',
                tableAlias: '',
                columnName: '',
                alias: calc.alias,
                sortOrder: '',
                sortPriority: (idx + 1) * 10,
                isVisible: calc.isVisible !== false,
                criteria: '',
                orCriteria: [],
                isCalculated: true,
                calculatedFormula: calc.formula,
                outputType: calc.outputType || 'VARCHAR',
              })),
            ];
            setGridColumns(reconstructed);
          }

          // Fetch structures for all tables in this query
          (def.tables || []).forEach((t: QueryTableNode) => {
            ensureTableStructure(t.tableName);
          });
        } catch (err: any) {
          showToast(err.message || 'Failed to load query', 'error');
        } finally {
          setIsLoadingQuery(false);
        }
      };
      loadQuery();
    }
  }, [id, isNew, ensureTableStructure]);

  // Construct Visual Definition object
  const buildVisualDefinition = useCallback((): VisualQueryDefinition => {
    // Also populate legacy columns and calculatedColumns for full backward compatibility
    const legacyCols: QueryColumn[] = gridColumns
      .filter((c) => !c.isCalculated && c.tableAlias && c.columnName)
      .map((c) => ({
        id: c.id,
        tableAlias: c.tableAlias,
        tableName: c.tableName,
        columnName: c.columnName,
        alias: c.alias,
        dataType: c.outputType,
        sortOrder: c.sortOrder === 'ASC' || c.sortOrder === 'DESC' ? (c.sortOrder as any) : undefined,
        isVisible: c.isVisible,
      }));

    const legacyCalcs: QueryCalculatedColumn[] = gridColumns
      .filter((c) => c.isCalculated && c.calculatedFormula)
      .map((c) => ({
        id: c.id,
        alias: c.alias,
        formula: c.calculatedFormula || '',
        outputType: c.outputType as any,
        isVisible: c.isVisible,
      }));

    return {
      tables,
      joins,
      gridColumns,
      columns: legacyCols,
      calculatedColumns: legacyCalcs,
      limit,
    };
  }, [tables, joins, gridColumns, limit]);

  // Handle Live Query Execution (Access Run Query)
  const handleRunQuery = async (paramValues: Record<string, unknown> = {}) => {
    if (tables.length === 0) {
      showToast('Please add at least one table before running the query.', 'warning');
      return;
    }

    if (parameters.length > 0 && Object.keys(paramValues).length === 0) {
      setIsParamPromptOpen(true);
      return;
    }

    setIsPreviewLoading(true);
    setExecutionError(null);

    try {
      const def = buildVisualDefinition();
      const res = await queriesApi.previewQuery(def, paramValues);
      setPreviewResult(res);
      setGeneratedSql(res.generatedSql || '');
      setSqlWarnings(res.warnings || []);
      showToast(`Query executed successfully (${res.rowCount} rows in ${res.executionTimeMs} ms)`, 'success');
    } catch (err: any) {
      setExecutionError(err.message || 'Execution error');
      showToast(err.message || 'Query execution failed', 'error');
    } finally {
      setIsPreviewLoading(false);
      setIsParamPromptOpen(false);
    }
  };

  // Compile SQL for Preview Modal
  const handleOpenSqlModal = async () => {
    try {
      const def = buildVisualDefinition();
      const res = await queriesApi.previewQuery(def, {});
      setGeneratedSql(res.generatedSql || '');
      setSqlWarnings(res.warnings || []);
    } catch {
      // keep current generatedSql
    }
    setIsSqlModalOpen(true);
  };

  // Pre-save validation
  const validateBeforeSave = (): boolean => {
    if (tables.length === 0) {
      showToast('Please add at least one database table to the designer before saving.', 'warning');
      return false;
    }
    const visibleCols = gridColumns.filter((c) => c.isVisible !== false && (c.columnName || c.calculatedFormula));
    if (visibleCols.length === 0) {
      showToast('Please add at least one output column to the design grid before saving.', 'warning');
      return false;
    }
    return true;
  };

  // Save Query button click in global header
  const handleSaveQueryClick = () => {
    if (!validateBeforeSave()) return;

    if (isNew || queryName === 'Untitled Query') {
      setSaveModalMode('save');
      setIsSaveModalOpen(true);
    } else {
      // Direct save to update existing query
      executeSave({
        name: queryName,
        description,
        category,
        status,
      });
    }
  };

  // Save As button click in global header
  const handleSaveAsClick = () => {
    if (!validateBeforeSave()) return;
    setSaveModalMode('saveAs');
    setIsSaveModalOpen(true);
  };

  // Core execution of Save or Save As from modal
  const executeSave = async (meta: {
    name: string;
    description: string;
    category: string;
    status: 'draft' | 'published';
  }) => {
    setIsSaving(true);
    const def = buildVisualDefinition();

    try {
      if (isNew || saveModalMode === 'saveAs') {
        const created = await queriesApi.createQuery({
          name: meta.name.trim(),
          description: meta.description.trim() || null,
          category: meta.category.trim() || 'General',
          status: meta.status,
          visualDefinition: def,
          parameters,
        });
        setQueryName(created.name);
        setDescription(created.description || '');
        setCategory(created.category);
        setStatus(created.status);
        setIsDirty(false);
        setIsSaveModalOpen(false);
        showToast(`Query '${created.name}' saved to library successfully.`, 'success');
        navigate(`/admin/queries/${created.id}`, { replace: true });
      } else {
        const updated = await queriesApi.updateQuery(id!, {
          name: meta.name.trim(),
          description: meta.description.trim() || null,
          category: meta.category.trim() || 'General',
          status: meta.status,
          visualDefinition: def,
          parameters,
        });
        setQueryName(updated.name);
        setDescription(updated.description || '');
        setCategory(updated.category);
        setStatus(updated.status);
        setGeneratedSql(updated.generatedSql);
        setIsDirty(false);
        setIsSaveModalOpen(false);
        showToast(`Query '${updated.name}' updated successfully.`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save query', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate back to Library with unsaved changes protection
  const handleNavigateLibrary = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in your visual query. Are you sure you want to return to the Query Library?')) {
        return;
      }
    }
    navigate('/admin/queries');
  };

  // New Query Action (Reset) with unsaved changes protection
  const handleNewQuery = () => {
    if (isDirty || tables.length > 0) {
      if (!window.confirm('Start a new query? Any unsaved changes in current query will be lost.')) {
        return;
      }
    }
    navigate('/admin/queries/new');
    setQueryName('Untitled Query');
    setIsDirty(false);
    setTables([]);
    setJoins([]);
    setGridColumns([]);
    setPreviewResult(null);
    setExecutionError(null);
  };

  // Duplicate Query Action
  const handleDuplicate = async () => {
    if (isNew || !id) {
      handleSaveAsClick();
      return;
    }
    try {
      const dup = await queriesApi.duplicateQuery(id);
      showToast(`Duplicated as '${dup.name}'`, 'success');
      navigate(`/admin/queries/${dup.id}`);
    } catch (err: any) {
      showToast(err.message || 'Duplicate failed', 'error');
    }
  };

  // Delete Query Action
  const handleDeleteQuery = async () => {
    if (isNew || !id) {
      handleNewQuery();
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete '${queryName}'?`)) {
      return;
    }
    try {
      await queriesApi.deleteQuery(id);
      showToast(`Query '${queryName}' deleted.`, 'success');
      navigate('/admin/queries');
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Add multiple tables into canvas from AddTablesModal
  const handleAddTablesFromModal = (tableNames: string[]) => {
    const newTables: QueryTableNode[] = [];

    tableNames.forEach((tName) => {
      // Find existing count with same table name to generate unique alias
      const count = tables.filter((t) => t.tableName === tName).length + newTables.filter((t) => t.tableName === tName).length;
      const alias = count > 0 ? `${tName}_${count + 1}` : tName;

      const totalCount = tables.length + newTables.length;
      const posX = 40 + (totalCount % 3) * 300;
      const posY = 30 + Math.floor(totalCount / 3) * 280;

      newTables.push({
        id: `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tableName: tName,
        alias,
        position: { x: posX, y: posY },
      });

      ensureTableStructure(tName);
    });

    setTables((prev) => [...prev, ...newTables]);
    setIsDirty(true);
    showToast(`Added ${newTables.length} table${newTables.length > 1 ? 's' : ''} to query designer.`, 'success');
  };

  // Remove Table from canvas
  const handleRemoveTable = (tableId: string) => {
    const tableToRemove = tables.find((t) => t.id === tableId);
    if (!tableToRemove) return;

    // Remove table
    setTables((prev) => prev.filter((t) => t.id !== tableId));

    // Remove associated joins
    setJoins((prev) =>
      prev.filter(
        (j) => j.sourceTableAlias !== tableToRemove.alias && j.targetTableAlias !== tableToRemove.alias
      )
    );

    // Remove associated columns from grid
    setGridColumns((prev) => prev.filter((gc) => gc.tableAlias !== tableToRemove.alias));
    setIsDirty(true);
    showToast(`Removed table '${tableToRemove.tableName}' from query.`, 'info');
  };

  // Update table card position
  const handleUpdateTablePosition = (tableId: string, position: { x: number; y: number }) => {
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, position } : t)));
    setIsDirty(true);
  };

  // Add join relationship
  const handleAddJoin = (newJoin: Omit<QueryJoin, 'id'>) => {
    // Check if relationship already exists between exact same two columns
    const exists = joins.some(
      (j) =>
        (j.sourceTableAlias === newJoin.sourceTableAlias &&
          j.sourceColumn === newJoin.sourceColumn &&
          j.targetTableAlias === newJoin.targetTableAlias &&
          j.targetColumn === newJoin.targetColumn) ||
        (j.sourceTableAlias === newJoin.targetTableAlias &&
          j.sourceColumn === newJoin.targetColumn &&
          j.targetTableAlias === newJoin.sourceTableAlias &&
          j.targetColumn === newJoin.sourceColumn)
    );

    if (exists) {
      showToast('A relationship already exists between these columns.', 'info');
      return;
    }

    const joinObj: QueryJoin = {
      ...newJoin,
      id: `join_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operator: newJoin.operator || '=',
      joinType: newJoin.joinType || 'INNER',
      leftTableAlias: newJoin.sourceTableAlias,
      leftColumn: newJoin.sourceColumn,
      rightTableAlias: newJoin.targetTableAlias,
      rightColumn: newJoin.targetColumn,
    };

    setJoins((prev) => [...prev, joinObj]);
    setIsDirty(true);
    showToast(
      `Linked [${newJoin.sourceTableAlias}].[${newJoin.sourceColumn}] → [${newJoin.targetTableAlias}].[${newJoin.targetColumn}]`,
      'success'
    );
  };

  // Update join relationship
  const handleUpdateJoin = (joinId: string, updates: Partial<QueryJoin>) => {
    setJoins((prev) => prev.map((j) => (j.id === joinId ? { ...j, ...updates } : j)));
    setIsDirty(true);
    showToast('Relationship updated.', 'success');
  };

  // Delete join relationship
  const handleDeleteJoin = (joinId: string) => {
    setJoins((prev) => prev.filter((j) => j.id !== joinId));
    setIsDirty(true);
    showToast('Relationship removed.', 'info');
  };

  // Auto-detect foreign key relationships
  const handleAutoSuggestJoins = () => {
    let addedCount = 0;
    const newJoins: QueryJoin[] = [];

    tables.forEach((sourceNode) => {
      const sourceStruct = tableStructures[sourceNode.tableName];
      if (!sourceStruct?.foreignKeys) return;

      sourceStruct.foreignKeys.forEach((fk) => {
        const targetNode = tables.find(
          (t) => t.tableName === fk.referencedTable && t.alias !== sourceNode.alias
        );

        if (targetNode) {
          const alreadyLinked =
            joins.some(
              (j) =>
                j.sourceTableAlias === sourceNode.alias &&
                j.sourceColumn === fk.columnName &&
                j.targetTableAlias === targetNode.alias &&
                j.targetColumn === fk.referencedColumn
            ) ||
            newJoins.some(
              (j) =>
                j.sourceTableAlias === sourceNode.alias &&
                j.sourceColumn === fk.columnName &&
                j.targetTableAlias === targetNode.alias &&
                j.targetColumn === fk.referencedColumn
            );

          if (!alreadyLinked) {
            newJoins.push({
              id: `join_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              sourceTableAlias: sourceNode.alias,
              sourceColumn: fk.columnName,
              targetTableAlias: targetNode.alias,
              targetColumn: fk.referencedColumn,
              joinType: 'INNER',
            });
            addedCount++;
          }
        }
      });
    });

    if (addedCount > 0) {
      setJoins((prev) => [...prev, ...newJoins]);
      setIsDirty(true);
      showToast(`Auto-connected ${addedCount} foreign key relationship${addedCount > 1 ? 's' : ''}!`, 'success');
    } else {
      showToast('No unlinked foreign keys found between active tables.', 'info');
    }
  };

  // Double-click column from table box in canvas -> appends to Access Design Grid!
  const handleDoubleClickColumn = (tableNode: QueryTableNode, column: TableColumn) => {
    const newGridCol: AccessGridColumn = {
      id: `gc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      field: column.name,
      tableName: tableNode.tableName,
      tableAlias: tableNode.alias,
      columnName: column.name,
      alias: column.name,
      sortOrder: '',
      isVisible: true,
      criteria: '',
      orCriteria: [],
      isCalculated: false,
      outputType: (column.dataType as any) || 'VARCHAR',
    };

    setGridColumns((prev) => [...prev, newGridCol]);
    setIsDirty(true);
    showToast(`Added [${tableNode.alias}].[${column.name}] to design grid`, 'info');
  };

  // Update Access Grid Column
  const handleUpdateGridColumn = (colId: string, updates: Partial<AccessGridColumn>) => {
    setGridColumns((prev) => prev.map((gc) => (gc.id === colId ? { ...gc, ...updates } : gc)));
    setIsDirty(true);
  };

  // Remove Access Grid Column
  const handleRemoveGridColumn = (colId: string) => {
    setGridColumns((prev) => prev.filter((gc) => gc.id !== colId));
    setIsDirty(true);
  };

  // Reorder Access Grid Columns
  const handleMoveGridColumn = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= gridColumns.length || toIndex >= gridColumns.length) {
      return;
    }
    setGridColumns((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
    setIsDirty(true);
  };

  // Add empty column to grid
  const handleAddEmptyColumn = () => {
    const newGridCol: AccessGridColumn = {
      id: `gc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      field: '',
      tableName: tables[0]?.tableName || '',
      tableAlias: tables[0]?.alias || '',
      columnName: '',
      alias: '',
      sortOrder: '',
      isVisible: true,
      criteria: '',
      orCriteria: [],
      isCalculated: false,
    };
    setGridColumns((prev) => [...prev, newGridCol]);
    setIsDirty(true);
  };

  // Save Calculated Field from FormulaEditorModal
  const handleSaveCalculatedField = (calcCol: QueryCalculatedColumn) => {
    if (editingGridColumn) {
      // Editing existing calculated column
      setGridColumns((prev) =>
        prev.map((gc) =>
          gc.id === editingGridColumn.id
            ? {
                ...gc,
                field: calcCol.alias,
                alias: calcCol.alias,
                isCalculated: true,
                calculatedFormula: calcCol.formula,
                outputType: calcCol.outputType,
                isVisible: calcCol.isVisible !== undefined ? calcCol.isVisible : true,
              }
            : gc
        )
      );
      showToast(`Updated calculated field '${calcCol.alias}'`, 'success');
    } else {
      // Adding new calculated column
      const newGridCol: AccessGridColumn = {
        id: `gc_calc_${Date.now()}`,
        field: calcCol.alias,
        tableName: '',
        tableAlias: '',
        columnName: '',
        alias: calcCol.alias,
        sortOrder: '',
        isVisible: calcCol.isVisible !== undefined ? calcCol.isVisible : true,
        criteria: '',
        orCriteria: [],
        isCalculated: true,
        calculatedFormula: calcCol.formula,
        outputType: calcCol.outputType,
      };
      setGridColumns((prev) => [...prev, newGridCol]);
      setIsDirty(true);
      showToast(`Added calculated field '${calcCol.alias}' to design grid`, 'success');
    }
    setIsDirty(true);
    setEditingGridColumn(null);
  };

  // Register Header Actions
  usePageActions(
    useMemo(() => {
      const actions: any[] = [
        {
          id: 'back-btn',
          label: 'Library',
          variant: 'ghost',
          icon: <ArrowLeft size={14} />,
          onClick: handleNavigateLibrary,
        },
        {
          id: 'new-query-btn',
          label: 'New Query',
          variant: 'ghost',
          icon: <FilePlus size={14} />,
          onClick: handleNewQuery,
        },
        {
          id: 'open-query-btn',
          label: 'Open Query',
          variant: 'outline',
          icon: <FolderOpen size={14} />,
          onClick: () => setIsOpenQueryModalOpen(true),
        },
        {
          id: 'save-btn',
          label: 'Save Query',
          variant: 'primary',
          icon: <Save size={14} />,
          onClick: handleSaveQueryClick,
          isLoading: isSaving,
        },
        {
          id: 'save-as-btn',
          label: 'Save As',
          variant: 'outline',
          onClick: handleSaveAsClick,
        },
        {
          id: 'run-btn',
          label: 'Run Query',
          variant: 'success',
          icon: <Play size={14} />,
          onClick: () => handleRunQuery({}),
          isLoading: isPreviewLoading,
        },
        {
          id: 'view-mode-btn',
          label: viewMode === 'design' ? 'Datasheet View' : 'Design View',
          variant: 'outline',
          icon: viewMode === 'design' ? <TableIcon size={14} /> : <LayoutGrid size={14} />,
          onClick: () => {
            if (viewMode === 'design') {
              if (!previewResult) {
                handleRunQuery({});
              }
              setViewMode('datasheet');
            } else {
              setViewMode('design');
            }
          },
        },
        {
          id: 'sql-btn',
          label: 'SQL View',
          variant: 'ghost',
          icon: <Code size={14} />,
          onClick: handleOpenSqlModal,
        },
        {
          id: 'params-btn',
          label: `Parameters (${parameters.length})`,
          variant: 'ghost',
          icon: <Sliders size={14} />,
          onClick: () => setIsParamsModalOpen(true),
        },
      ];
      return actions;
    }, [
      isNew,
      isSaving,
      isPreviewLoading,
      parameters.length,
      viewMode,
      previewResult,
      handleSaveQueryClick,
      handleSaveAsClick,
      handleNavigateLibrary,
      handleNewQuery,
      handleRunQuery,
      handleOpenSqlModal,
    ])
  );

  // Register Query Title and Category in Header Custom Controls
  useHeaderCustomControls(
    useMemo(() => {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={queryName}
            onChange={(e) => {
              setQueryName(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Query Name..."
            style={{
              padding: '5px 10px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-input, 6px)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              width: '220px',
              outline: 'none',
            }}
          />
          <div style={{ width: '130px' }}>
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setIsDirty(true);
              }}
              options={[
                { value: 'General', label: 'General' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Sales', label: 'Sales' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Inventory', label: 'Inventory' },
                { value: 'Production', label: 'Production' },
                { value: 'Reports', label: 'Reports' },
              ]}
            />
          </div>

          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-app)',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
            }}
          >
            <button
              onClick={() => setViewMode('design')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: viewMode === 'design' ? 600 : 400,
                backgroundColor: viewMode === 'design' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'design' ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: viewMode === 'design' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <LayoutGrid size={13} />
              Design View
            </button>
            <button
              onClick={() => {
                if (!previewResult) handleRunQuery({});
                setViewMode('datasheet');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: viewMode === 'datasheet' ? 600 : 400,
                backgroundColor: viewMode === 'datasheet' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'datasheet' ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: viewMode === 'datasheet' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <TableIcon size={13} />
              Datasheet View
            </button>
          </div>
        </div>
      );
    }, [queryName, category, viewMode, previewResult])
  );

  return (
    <OperationsErrorBoundary moduleName="Visual Query Designer">
      <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: '620px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-card, 8px)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
    >
      {/* Execution Error Banner (Preserves visual state) */}
      {executionError && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid var(--status-danger, #ef4444)',
            color: 'var(--status-danger, #ef4444)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 20,
          }}
        >
          <div>
            <strong>Query Error:</strong> {executionError}
          </div>
          <button
            onClick={() => setExecutionError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--status-danger, #ef4444)',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Display */}
      {viewMode === 'design' ? (
        <div
          ref={workspaceRef}
          style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
        >
          {/* TOP PANE: Access Visual Table Diagram & Relationships */}
          <div style={{ height: `${canvasHeight}px`, minHeight: '160px', flexShrink: 0 }}>
            <AccessTableCanvas
              tables={tables}
              joins={joins}
              tableStructures={tableStructures}
              onAddTableClick={() => setIsAddTablesOpen(true)}
              onRemoveTable={handleRemoveTable}
              onUpdateTablePosition={handleUpdateTablePosition}
              onAddJoin={handleAddJoin}
              onEditJoin={(j) => setEditingJoin(j)}
              onDeleteJoin={handleDeleteJoin}
              onAutoSuggestJoins={handleAutoSuggestJoins}
              onDoubleClickColumn={handleDoubleClickColumn}
            />
          </div>

          {/* INTERACTIVE DRAGGABLE RESIZE SPLITTER */}
          <div
            onMouseDown={handleSplitterMouseDown}
            onTouchStart={handleSplitterTouchStart}
            title="Drag up or down to resize panels"
            style={{
              height: '8px',
              margin: '-2px 0',
              cursor: 'row-resize',
              position: 'relative',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDraggingSplitter
                ? 'var(--primary, #0066cc)'
                : 'transparent',
              transition: isDraggingSplitter ? 'none' : 'background-color 0.15s ease',
              userSelect: 'none',
              touchAction: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isDraggingSplitter) {
                e.currentTarget.style.backgroundColor = 'var(--primary-subtle, rgba(0, 102, 204, 0.2))';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDraggingSplitter) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* Center grab pill */}
            <div
              style={{
                width: '38px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: isDraggingSplitter
                  ? '#ffffff'
                  : 'var(--text-muted, #94a3b8)',
                opacity: isDraggingSplitter ? 1 : 0.75,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {/* BOTTOM PANE: Microsoft Access Query Design Grid */}
          <div style={{ flex: 1, minHeight: '180px', overflow: 'hidden' }}>
            <AccessQueryGrid
              gridColumns={gridColumns}
              tables={tables}
              tableStructures={tableStructures}
              onUpdateGridColumn={handleUpdateGridColumn}
              onRemoveGridColumn={handleRemoveGridColumn}
              onMoveGridColumn={handleMoveGridColumn}
              onAddEmptyColumn={handleAddEmptyColumn}
              onOpenCalculatedFieldModal={(col) => {
                setEditingGridColumn(col || null);
                setIsFormulaModalOpen(true);
              }}
              onClearGrid={() => {
                if (window.confirm('Clear all fields from the query design grid?')) {
                  setGridColumns([]);
                }
              }}
            />
          </div>

          {/* Collapsible / Expandable Results Drawer when Query has Been Executed */}
          {previewResult && (
            <div
              style={{
                maxHeight: '220px',
                borderTop: '2px solid var(--primary)',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-app)',
                  borderBottom: '1px solid var(--border-default)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Query Output Dataset
                  </span>
                  <Badge variant="success">
                    {previewResult.rowCount} records returned
                  </Badge>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    ({previewResult.executionTimeMs} ms)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('datasheet')}
                    leftIcon={<TableIcon size={12} />}
                  >
                    Full Datasheet View
                  </Button>
                  <button
                    onClick={() => setPreviewResult(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '2px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-app)' }}>
                      {(previewResult.columns || []).map((c) => (
                        <th key={c.id} style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(previewResult.data || []).length > 0 ? (
                      (previewResult.data || []).slice(0, 15).map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: rIdx % 2 === 1 ? 'var(--bg-app)' : 'var(--bg-surface)',
                          }}
                        >
                          {(previewResult.columns || []).map((col) => {
                            const val = row[col.accessorKey];
                            return (
                              <td key={col.id} style={{ padding: '4px 8px', fontFamily: 'monospace' }}>
                                {val === null || val === undefined ? (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={(previewResult.columns || []).length || 1}
                          style={{
                            textAlign: 'center',
                            padding: '16px',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          Query executed successfully with 0 records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DATASHEET VIEW (Real Database Records) */
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <ResultsPreviewPanel
            result={previewResult}
            isLoading={isPreviewLoading}
            onExecute={() => handleRunQuery({})}
            limit={limit}
            onLimitChange={(l) => setLimit(l)}
          />
        </div>
      )}

      {/* MODALS */}
      <AddTablesModal
        isOpen={isAddTablesOpen}
        onClose={() => setIsAddTablesOpen(false)}
        allTables={allDbTables}
        existingTableNames={tables.map((t) => t.tableName)}
        onAddTables={handleAddTablesFromModal}
      />

      <JoinPropertiesModal
        isOpen={!!editingJoin}
        onClose={() => setEditingJoin(null)}
        join={editingJoin}
        tables={tables}
        tableStructures={tableStructures}
        onUpdateJoin={handleUpdateJoin}
        onDeleteJoin={handleDeleteJoin}
      />

      <FormulaEditorModal
        isOpen={isFormulaModalOpen}
        onClose={() => {
          setIsFormulaModalOpen(false);
          setEditingGridColumn(null);
        }}
        onSave={handleSaveCalculatedField}
        editingGridColumn={editingGridColumn}
        tables={tables}
        tableStructures={tableStructures}
      />

      <OpenQueryModal
        isOpen={isOpenQueryModalOpen}
        onClose={() => setIsOpenQueryModalOpen(false)}
        onSelectQuery={(qId) => navigate(`/admin/queries/${qId}`)}
      />

      <SqlPreviewModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        sql={generatedSql}
        warnings={sqlWarnings}
      />

      <ParametersConfigModal
        isOpen={isParamsModalOpen}
        onClose={() => setIsParamsModalOpen(false)}
        parameters={parameters}
        onSave={(params) => setParameters(params)}
      />

      <ParameterPromptModal
        isOpen={isParamPromptOpen}
        onClose={() => setIsParamPromptOpen(false)}
        parameters={parameters}
        onExecute={(paramValues: Record<string, unknown>) => handleRunQuery(paramValues)}
      />

      <SaveQueryModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        mode={saveModalMode}
        initialName={queryName}
        initialDescription={description}
        initialCategory={category}
        initialStatus={status}
        visualDefinition={buildVisualDefinition()}
        isSaving={isSaving}
        onConfirmSave={executeSave}
      />
      </div>
    </OperationsErrorBoundary>
  );
};
