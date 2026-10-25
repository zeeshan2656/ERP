import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FilterX,
  CheckSquare,
  Square,
  MinusSquare,
  SlidersHorizontal,
  Search,
  X,
} from 'lucide-react';
import { Button } from './Button.tsx';
import { ColumnFilterMenu, ColumnFilterRule, ColumnFilterType } from './ColumnFilterMenu.tsx';
import { usePageHeader } from '../../context/PageHeaderContext.tsx';

export interface Column<T> {
  id?: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  filterType?: ColumnFilterType;
  filterOptions?: { label: string; value: any }[];
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
    onLimitChange?: (newLimit: number) => void;
  };
  // Row selection
  selectable?: boolean;
  selectedRowKeys?: (string | number)[];
  onSelectedRowKeysChange?: (keys: (string | number)[]) => void;
  getRowKey?: (row: T) => string | number;
  // Card View Mode
  cardRenderer?: (item: T, isSelected: boolean, toggleSelect: () => void) => React.ReactNode;
  cardGridColumns?: string;
  viewMode?: 'table' | 'card';
  onViewModeChange?: (mode: 'table' | 'card') => void;
  // External filtering & sorting callbacks
  serverSideFiltering?: boolean;
  onFilterChange?: (filters: Record<string, ColumnFilterRule>) => void;
  serverSideSorting?: boolean;
  onSortChange?: (sort: { column: string; direction: 'asc' | 'desc' } | null) => void;
  // Optional controlled global search
  globalSearch?: string;
  onGlobalSearchChange?: (search: string) => void;
  enableHeaderSearch?: boolean;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found',
  pagination,
  selectable = false,
  selectedRowKeys: externalSelectedKeys,
  onSelectedRowKeysChange,
  getRowKey,
  cardRenderer,
  cardGridColumns,
  viewMode: propViewMode,
  onViewModeChange,
  serverSideFiltering = false,
  onFilterChange,
  serverSideSorting = false,
  onSortChange,
  globalSearch: externalGlobalSearch,
  onGlobalSearchChange,
  enableHeaderSearch = true,
}: TableProps<T>) {
  // Global Header View Mode & Advanced Filters Integration
  const {
    viewMode: headerViewMode,
    setSupportsCardView,
    isFilterOpen,
    setIsFilterOpen,
    setHasAdvancedFilters,
    setActiveFilterCount,
    setFilterPanelContent,
    setHeaderSearch,
  } = usePageHeader();

  // Register card view capability with the global header
  useEffect(() => {
    if (cardRenderer) {
      setSupportsCardView(true);
      return () => {
        setSupportsCardView(false);
      };
    }
  }, [cardRenderer, setSupportsCardView]);

  // Determine effective view mode (props take precedence, then header context)
  const activeViewMode = propViewMode || headerViewMode;

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  // Column Filtering State
  const [filters, setFilters] = useState<Record<string, ColumnFilterRule>>({});

  // Global Search State (internal if not controlled externally)
  const [internalGlobalSearch, setInternalGlobalSearch] = useState('');
  const globalSearch = externalGlobalSearch !== undefined ? externalGlobalSearch : internalGlobalSearch;

  const updateGlobalSearch = (val: string) => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(val);
    } else {
      setInternalGlobalSearch(val);
    }
  };

  // Register Global Search with Main Sticky Header
  useEffect(() => {
    if (enableHeaderSearch) {
      setHeaderSearch({
        placeholder: 'Search all fields...',
        value: globalSearch,
        onChange: (val) => updateGlobalSearch(val),
      });
      return () => {
        setHeaderSearch(null);
      };
    }
  }, [enableHeaderSearch, globalSearch, setHeaderSearch]);

  // Selection Internal State (if uncontrolled)
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<(string | number)[]>([]);
  const selectedRowKeys = externalSelectedKeys !== undefined ? externalSelectedKeys : internalSelectedKeys;

  const updateSelectedKeys = (newKeys: (string | number)[]) => {
    if (onSelectedRowKeysChange) {
      onSelectedRowKeysChange(newKeys);
    } else {
      setInternalSelectedKeys(newKeys);
    }
  };

  const getItemKey = (row: T, idx: number): string | number => {
    if (getRowKey) return getRowKey(row);
    return row.id !== undefined ? row.id : idx;
  };

  // Extract Distinct Values for ALL Columns (sorted naturally with counts & labels)
  const distinctValuesMap = useMemo(() => {
    const map: Record<string, { label: string; value: string; count: number }[]> = {};
    columns.forEach((col, idx) => {
      const colId = col.id || String(col.accessorKey) || `col_${idx}`;
      if (col.accessorKey) {
        const counts = new Map<string, number>();
        const labelLookup = new Map<string, string>();
        if (col.filterOptions) {
          col.filterOptions.forEach((opt) => {
            labelLookup.set(String(opt.value), opt.label);
          });
        }

        data.forEach((row) => {
          const val = row[col.accessorKey!];
          const rawKey = val === null || val === undefined ? '(Blank)' : String(val);
          counts.set(rawKey, (counts.get(rawKey) || 0) + 1);
        });

        const items = Array.from(counts.entries()).map(([value, count]) => ({
          label: labelLookup.get(value) || value,
          value,
          count,
        }));

        items.sort((a, b) => {
          if (a.value === '(Blank)') return 1;
          if (b.value === '(Blank)') return -1;
          return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
        });

        map[colId] = items;
      }
    });
    return map;
  }, [data, columns]);

  // Active filters count
  const totalActiveFilterCount = Object.keys(filters).length + (globalSearch.trim() ? 1 : 0);

  // Client-Side Multi-Column & Global Search Filtering Engine
  const filteredData = useMemo(() => {
    if (serverSideFiltering) {
      return data;
    }

    const trimmedSearch = globalSearch.trim().toLowerCase();

    return data.filter((row) => {
      // 1. Global Search across all filterable / string fields
      if (trimmedSearch) {
        let matchesGlobal = false;
        for (const col of columns) {
          if (col.accessorKey) {
            const rawVal = row[col.accessorKey];
            if (rawVal !== null && rawVal !== undefined) {
              if (String(rawVal).toLowerCase().includes(trimmedSearch)) {
                matchesGlobal = true;
                break;
              }
            }
          }
        }
        if (!matchesGlobal) return false;
      }

      // 2. Specific Column Filter Rules
      for (const [colId, rule] of Object.entries(filters)) {
        const col = columns.find((c, idx) => (c.id || String(c.accessorKey) || `col_${idx}`) === colId);
        if (!col || !col.accessorKey) continue;

        const rawVal = row[col.accessorKey];
        const strVal = rawVal === null || rawVal === undefined ? '' : String(rawVal);
        const displayVal = rawVal === null || rawVal === undefined ? '(Blank)' : String(rawVal);

        // A. Filter by Value Checklist (if specified)
        if (rule.selectedValues && Array.isArray(rule.selectedValues)) {
          if (!rule.selectedValues.includes(displayVal) && !rule.selectedValues.includes(strVal)) {
            return false;
          }
        }

        // B. Filter by Condition
        const condOp = rule.conditionOperator || rule.textOperator || rule.numberOperator || rule.dateOperator;
        const condVal = rule.conditionValue !== undefined && rule.conditionValue !== ''
          ? rule.conditionValue
          : (rule.textValue ?? rule.numValue1 ?? rule.dateValue1 ?? '');
        const condVal2 = rule.conditionValue2 !== undefined && rule.conditionValue2 !== ''
          ? rule.conditionValue2
          : (rule.numValue2 ?? rule.dateValue2 ?? '');

        if (condOp && condOp !== 'any') {
          const lowerStr = strVal.toLowerCase();
          const targetStr = String(condVal).toLowerCase();

          switch (condOp) {
            case 'contains':
              if (targetStr && !lowerStr.includes(targetStr)) return false;
              break;
            case 'doesNotContain':
              if (targetStr && lowerStr.includes(targetStr)) return false;
              break;
            case 'equals':
              if (rule.type === 'number') {
                if (condVal !== '' && Number(rawVal) !== Number(condVal)) return false;
              } else {
                if (targetStr && lowerStr !== targetStr) return false;
              }
              break;
            case 'doesNotEqual':
              if (rule.type === 'number') {
                if (condVal !== '' && Number(rawVal) === Number(condVal)) return false;
              } else {
                if (targetStr && lowerStr === targetStr) return false;
              }
              break;
            case 'startsWith':
              if (targetStr && !lowerStr.startsWith(targetStr)) return false;
              break;
            case 'endsWith':
              if (targetStr && !lowerStr.endsWith(targetStr)) return false;
              break;
            case 'isEmpty':
              if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '' && String(rawVal) !== '(Blank)') {
                return false;
              }
              break;
            case 'isNotEmpty':
              if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '' || String(rawVal) === '(Blank)') {
                return false;
              }
              break;
            case 'gt':
              if (condVal !== '' && Number(rawVal) <= Number(condVal)) return false;
              break;
            case 'gte':
              if (condVal !== '' && Number(rawVal) < Number(condVal)) return false;
              break;
            case 'lt':
              if (condVal !== '' && Number(rawVal) >= Number(condVal)) return false;
              break;
            case 'lte':
              if (condVal !== '' && Number(rawVal) > Number(condVal)) return false;
              break;
            case 'between':
              if (rule.type === 'number') {
                const num = Number(rawVal);
                if (condVal !== '' && num < Number(condVal)) return false;
                if (condVal2 !== '' && num > Number(condVal2)) return false;
              } else if (rule.type === 'date') {
                const t = new Date(rawVal).getTime();
                if (condVal) {
                  const start = new Date(String(condVal)).getTime();
                  if (t < start) return false;
                }
                if (condVal2) {
                  const end = new Date(String(condVal2)).getTime() + 86400000;
                  if (t > end) return false;
                }
              }
              break;
            case 'before':
              if (condVal) {
                const limit = new Date(String(condVal)).getTime() + 86400000;
                if (new Date(rawVal).getTime() > limit) return false;
              }
              break;
            case 'after':
              if (condVal) {
                const limit = new Date(String(condVal)).getTime();
                if (new Date(rawVal).getTime() < limit) return false;
              }
              break;
            case 'today': {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
              const end = start + 86400000;
              const t = new Date(rawVal).getTime();
              if (t < start || t >= end) return false;
              break;
            }
            case 'last7': {
              const now = Date.now();
              const t = new Date(rawVal).getTime();
              if (t < now - 7 * 86400000) return false;
              break;
            }
            case 'thisMonth': {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
              const t = new Date(rawVal).getTime();
              if (t < start) return false;
              break;
            }
          }
        }
      }
      return true;
    });
  }, [data, filters, globalSearch, columns, serverSideFiltering]);

  // Client-Side Sorting Engine
  const processedData = useMemo(() => {
    if (serverSideSorting || !sortConfig) {
      return filteredData;
    }

    const { column: colId, direction } = sortConfig;
    const col = columns.find((c, idx) => (c.id || String(c.accessorKey) || `col_${idx}`) === colId);
    if (!col || !col.accessorKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[col.accessorKey!];
      const valB = b[col.accessorKey!];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, columns, serverSideSorting]);

  // Filter handlers
  const handleApplyFilter = (colId: string, rule: ColumnFilterRule | null) => {
    const nextFilters = { ...filters };
    if (rule) {
      nextFilters[colId] = rule;
    } else {
      delete nextFilters[colId];
    }
    setFilters(nextFilters);
    onFilterChange?.(nextFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    updateGlobalSearch('');
    onFilterChange?.({});
  };

  // Sorting toggle
  const handleToggleSort = (colId: string) => {
    let nextSort: { column: string; direction: 'asc' | 'desc' } | null = null;
    if (!sortConfig || sortConfig.column !== colId) {
      nextSort = { column: colId, direction: 'asc' };
    } else if (sortConfig.direction === 'asc') {
      nextSort = { column: colId, direction: 'desc' };
    } else {
      nextSort = null;
    }
    setSortConfig(nextSort);
    onSortChange?.(nextSort);
  };

  const handleSetSort = (colId: string, direction: 'asc' | 'desc' | null) => {
    let nextSort: { column: string; direction: 'asc' | 'desc' } | null = null;
    if (direction) {
      nextSort = { column: colId, direction };
    }
    setSortConfig(nextSort);
    onSortChange?.(nextSort);
  };

  // Selection handlers
  const allCurrentKeys = processedData.map((row, idx) => getItemKey(row, idx));
  const isAllSelected = allCurrentKeys.length > 0 && allCurrentKeys.every((k) => selectedRowKeys.includes(k));
  const isSomeSelected = allCurrentKeys.some((k) => selectedRowKeys.includes(k)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const remaining = selectedRowKeys.filter((k) => !allCurrentKeys.includes(k));
      updateSelectedKeys(remaining);
    } else {
      const combined = Array.from(new Set([...selectedRowKeys, ...allCurrentKeys]));
      updateSelectedKeys(combined);
    }
  };

  const toggleRowSelection = (key: string | number) => {
    if (selectedRowKeys.includes(key)) {
      updateSelectedKeys(selectedRowKeys.filter((k) => k !== key));
    } else {
      updateSelectedKeys([...selectedRowKeys, key]);
    }
  };

  // Register with Header Advanced Filters System
  useEffect(() => {
    setHasAdvancedFilters(true);
    setActiveFilterCount(totalActiveFilterCount);

    setFilterPanelContent(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Panel Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-default)',
            paddingBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={16} color="var(--brand-primary)" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              Advanced Filters
            </span>
            {totalActiveFilterCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--brand-primary-text, #fff)',
                  fontWeight: 600,
                }}
              >
                {totalActiveFilterCount} active
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Global Quick Search Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Global Quick Search
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search across all fields..."
              value={globalSearch}
              onChange={(e) => updateGlobalSearch(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 28px 0 30px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs, 4px)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <Search
              size={14}
              style={{ position: 'absolute', left: '9px', top: '10px', color: 'var(--text-muted)' }}
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => updateGlobalSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '9px',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Column-Specific Quick Filters */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '260px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {columns
            .filter((col) => col.filterable !== false && (col.accessorKey || col.id))
            .map((col, idx) => {
              const colId = col.id || String(col.accessorKey) || `col_${idx}`;
              const rule = filters[colId];
              const isColFiltered = Boolean(rule);

              return (
                <div key={colId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {col.header}
                    </span>
                    {isColFiltered && (
                      <button
                        type="button"
                        onClick={() => handleApplyFilter(colId, null)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: 'var(--status-danger)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {col.filterType === 'select' || col.filterType === 'boolean' ? (
                    <select
                      value={rule?.selectedValues?.[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          handleApplyFilter(colId, null);
                        } else {
                          handleApplyFilter(colId, {
                            type: col.filterType || 'select',
                            selectedValues: [val],
                          });
                        }
                      }}
                      style={{
                        height: '32px',
                        padding: '0 8px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: isColFiltered
                          ? '1px solid var(--brand-primary)'
                          : '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs, 4px)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    >
                      <option value="">All {col.header}</option>
                      {(col.filterOptions || distinctValuesMap[colId] || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : col.filterType === 'date' ? (
                    <input
                      type="date"
                      value={rule?.dateValue1 || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          handleApplyFilter(colId, null);
                        } else {
                          handleApplyFilter(colId, {
                            type: 'date',
                            dateOperator: 'between',
                            dateValue1: val,
                          });
                        }
                      }}
                      style={{
                        height: '32px',
                        padding: '0 8px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: isColFiltered
                          ? '1px solid var(--brand-primary)'
                          : '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs, 4px)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={`Filter by ${col.header.toLowerCase()}...`}
                      value={rule?.textValue || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val.trim()) {
                          handleApplyFilter(colId, null);
                        } else {
                          handleApplyFilter(colId, {
                            type: 'text',
                            textOperator: 'contains',
                            textValue: val,
                          });
                        }
                      }}
                      style={{
                        height: '32px',
                        padding: '0 8px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: isColFiltered
                          ? '1px solid var(--brand-primary)'
                          : '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs, 4px)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  )}
                </div>
              );
            })}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-default)',
            paddingTop: '12px',
            marginTop: '4px',
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllFilters}
            disabled={totalActiveFilterCount === 0}
            leftIcon={<FilterX size={13} />}
          >
            Clear All
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsFilterOpen(false)}>
            Done
          </Button>
        </div>
      </div>
    );

    return () => {
      setHasAdvancedFilters(false);
      setActiveFilterCount(0);
      setFilterPanelContent(null);
    };
  }, [
    columns,
    filters,
    globalSearch,
    distinctValuesMap,
    totalActiveFilterCount,
    setHasAdvancedFilters,
    setActiveFilterCount,
    setFilterPanelContent,
    setIsFilterOpen,
  ]);

  return (
    <div className="advanced-table-wrapper">
      {/* Table View Mode */}
      {activeViewMode === 'table' ? (
        <div className="advanced-table-scroll-container">
          <table className="advanced-table">
            <thead>
              <tr>
                {/* Optional Checkbox Selection Column */}
                {selectable && (
                  <th style={{ width: '44px', textAlign: 'center', padding: '0 8px' }}>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isAllSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                      }}
                      title={isAllSelected ? 'Deselect all records' : 'Select all records on page'}
                    >
                      {isAllSelected ? (
                        <CheckSquare size={16} />
                      ) : isSomeSelected ? (
                        <MinusSquare size={16} color="var(--brand-primary)" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                )}

                {/* Column Headers with Sort & Excel Filter */}
                {columns.map((col, idx) => {
                  const colId = col.id || String(col.accessorKey) || `col_${idx}`;
                  const isSorted = sortConfig?.column === colId;
                  const sortDir = isSorted ? sortConfig.direction : null;
                  const isFilterable =
                    col.filterable !== false && (col.accessorKey !== undefined || col.id !== undefined);

                  return (
                    <th
                      key={colId}
                      style={{
                        width: col.width,
                        textAlign: col.align || 'left',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            col.align === 'right'
                              ? 'flex-end'
                              : col.align === 'center'
                              ? 'center'
                              : 'space-between',
                          gap: '6px',
                        }}
                      >
                        {/* Column Header Label & Optional Sort Trigger */}
                        <div
                          onClick={() => (col.sortable !== false ? handleToggleSort(colId) : undefined)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: col.sortable !== false ? 'pointer' : 'default',
                            flex: 1,
                            minWidth: 0,
                          }}
                          title={col.sortable !== false ? `Sort by ${col.header}` : undefined}
                        >
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {col.header}
                          </span>
                          {col.sortable !== false && (
                            <span
                              style={{
                                color: isSorted ? 'var(--brand-primary)' : 'var(--text-muted)',
                                flexShrink: 0,
                              }}
                            >
                              {sortDir === 'asc' ? (
                                <ArrowUp size={13} strokeWidth={2.5} />
                              ) : sortDir === 'desc' ? (
                                <ArrowDown size={13} strokeWidth={2.5} />
                              ) : (
                                <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Excel-Style Column Filter Icon & Menu (Portaled) */}
                        {isFilterable && (
                          <ColumnFilterMenu
                            columnId={colId}
                            columnTitle={col.header}
                            filterType={col.filterType || 'text'}
                            filterOptions={col.filterOptions}
                            distinctValues={distinctValuesMap[colId] || []}
                            currentFilter={filters[colId]}
                            onApplyFilter={handleApplyFilter}
                            sortable={col.sortable !== false}
                            sortDirection={sortConfig && sortConfig.column === colId ? sortConfig.direction : null}
                            onSort={(dir) => handleSetSort(colId, dir)}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    style={{
                      padding: '56px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 500 }}>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    style={{
                      padding: '56px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{emptyMessage}</span>
                      {totalActiveFilterCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllFilters}
                          leftIcon={<FilterX size={14} />}
                        >
                          Clear all active filters ({totalActiveFilterCount})
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                processedData.map((row, rowIdx) => {
                  const key = getItemKey(row, rowIdx);
                  const isSelected = selectedRowKeys.includes(key);

                  return (
                    <tr
                      key={key}
                      className={isSelected ? 'is-selected' : ''}
                      style={{
                        backgroundColor:
                          rowIdx % 2 === 1 ? 'var(--table-row-alt, transparent)' : 'transparent',
                      }}
                    >
                      {/* Checkbox */}
                      {selectable && (
                        <td style={{ width: '44px', textAlign: 'center', padding: '0 8px' }}>
                          <button
                            type="button"
                            onClick={() => toggleRowSelection(key)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                            }}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                      )}

                      {/* Cells */}
                      {columns.map((col, colIdx) => {
                        const cellVal = col.accessorKey !== undefined ? row[col.accessorKey] : undefined;
                        const cellStr = cellVal !== null && cellVal !== undefined && typeof cellVal !== 'object' ? String(cellVal) : '';

                        return (
                          <td
                            key={col.id || String(col.accessorKey) || colIdx}
                            style={{
                              textAlign: col.align || 'left',
                              width: col.width,
                            }}
                            title={!col.cell && cellStr ? cellStr : undefined}
                          >
                            <div
                              className="table-cell-content"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                justifyContent:
                                  col.align === 'right'
                                    ? 'flex-end'
                                    : col.align === 'center'
                                    ? 'center'
                                    : 'flex-start',
                              }}
                            >
                              {col.cell ? (
                                col.cell(row, rowIdx)
                              ) : (
                                <span className="table-cell-title">
                                  {cellStr}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View Mode (Requirement 6: Scrollable Cards Grid + Bottom Pinned Footer) */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {isLoading ? (
            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading cards...
            </div>
          ) : processedData.length === 0 ? (
            <div
              style={{
                padding: '64px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{emptyMessage}</div>
              {totalActiveFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  leftIcon={<FilterX size={14} />}
                >
                  Clear all active filters ({totalActiveFilterCount})
                </Button>
              )}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: cardGridColumns || 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
                alignContent: 'start',
              }}
            >
              {processedData.map((row, rowIdx) => {
                const key = getItemKey(row, rowIdx);
                const isSelected = selectedRowKeys.includes(key);

                if (cardRenderer) {
                  return (
                    <div key={key}>
                      {cardRenderer(row, isSelected, () => toggleRowSelection(key))}
                    </div>
                  );
                }

                // Fallback Card Renderer if none explicitly provided
                return (
                  <div
                    key={key}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-card, 8px)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: isSelected ? 'var(--table-row-selected)' : 'var(--bg-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {columns.map((col, cIdx) => (
                      <div
                        key={cIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {col.header}:
                        </span>
                        <div style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                          {col.cell
                            ? col.cell(row, rowIdx)
                            : col.accessorKey
                            ? String(row[col.accessorKey] ?? '—')
                            : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dedicated Bottom-Pinned Footer (Requirement 2 & 6) */}
      <div className="advanced-table-sticky-footer">
        {/* Left: Record Counts & Active Filter / Selection Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            Showing{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {processedData.length === 0
                ? 0
                : pagination
                ? (pagination.page - 1) * pagination.limit + 1
                : 1}
            </span>{' '}
            to{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {pagination
                ? Math.min(pagination.page * pagination.limit, pagination.total)
                : processedData.length}
            </span>{' '}
            of{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {pagination ? pagination.total : data.length}
            </span>{' '}
            records
            {totalActiveFilterCount > 0 && (
              <span style={{ marginLeft: '6px', color: 'var(--brand-primary)', fontWeight: 500 }}>
                ({processedData.length} filtered)
              </span>
            )}
          </div>

          {/* Selected Rows Counter */}
          {selectable && selectedRowKeys.length > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 103, 184, 0.12)',
                color: 'var(--brand-primary)',
                fontWeight: 600,
                fontSize: '11px',
              }}
            >
              {selectedRowKeys.length} selected
            </div>
          )}

          {/* Clear Filters Button (When Any Filter is Active) */}
          {totalActiveFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs, 4px)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                padding: '3px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Clear all active column filters and search"
            >
              <FilterX size={12} color="var(--status-danger)" />
              <span>Clear filters ({totalActiveFilterCount})</span>
            </button>
          )}
        </div>

        {/* Right: Rows-Per-Page Selector & Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Rows Per Page Dropdown */}
          {pagination && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Rows per page:</span>
              <select
                value={pagination.limit}
                onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
                disabled={!pagination.onLimitChange}
                style={{
                  height: '28px',
                  padding: '0 6px',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: pagination.onLimitChange ? 'pointer' : 'default',
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}

          {/* Prev / Next Pagination Controls */}
          {pagination && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                leftIcon={<ChevronLeft size={14} />}
                style={{ height: '28px', padding: '0 8px' }}
                aria-label="Previous page"
              >
                Prev
              </Button>
              <span
                style={{
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}
              >
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                rightIcon={<ChevronRight size={14} />}
                style={{ height: '28px', padding: '0 8px' }}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
