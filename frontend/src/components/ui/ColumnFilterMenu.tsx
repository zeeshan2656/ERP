import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Button } from './Button.tsx';

export type ColumnFilterType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export type ConditionOperator =
  | 'any'
  | 'equals'
  | 'doesNotEqual'
  | 'contains'
  | 'doesNotContain'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'before'
  | 'after'
  | 'today'
  | 'last7'
  | 'thisMonth'
  | 'isEmpty'
  | 'isNotEmpty';

export interface ColumnFilterRule {
  type?: ColumnFilterType;
  conditionOperator?: ConditionOperator;
  conditionValue?: string | number;
  conditionValue2?: string | number;
  // Selected distinct values from checklist (undefined if all selected)
  selectedValues?: string[];

  // Backward compatibility fields
  textOperator?: any;
  textValue?: string;
  numberOperator?: any;
  numValue1?: number | '';
  numValue2?: number | '';
  dateOperator?: any;
  dateValue1?: string;
  dateValue2?: string;
}

export interface ColumnFilterMenuProps {
  columnId: string;
  columnTitle: string;
  filterType?: ColumnFilterType;
  filterOptions?: { label: string; value: any }[];
  distinctValues?: { label: string; value: string; count?: number }[];
  currentFilter?: ColumnFilterRule | null;
  onApplyFilter: (columnId: string, rule: ColumnFilterRule | null) => void;

  // Sorting functionality
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (direction: 'asc' | 'desc' | null) => void;
}

export const ColumnFilterMenu: React.FC<ColumnFilterMenuProps> = ({
  columnId,
  columnTitle,
  filterType = 'text',
  filterOptions,
  distinctValues = [],
  currentFilter,
  onApplyFilter,
  sortable = true,
  sortDirection = null,
  onSort,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Condition State
  const initialCondition = (currentFilter?.conditionOperator ||
    currentFilter?.textOperator ||
    currentFilter?.numberOperator ||
    currentFilter?.dateOperator ||
    'any') as ConditionOperator;

  const initialVal1 = currentFilter?.conditionValue ?? currentFilter?.textValue ?? currentFilter?.numValue1 ?? currentFilter?.dateValue1 ?? '';
  const initialVal2 = currentFilter?.conditionValue2 ?? currentFilter?.numValue2 ?? currentFilter?.dateValue2 ?? '';

  const [conditionOp, setConditionOp] = useState<ConditionOperator>(initialCondition);
  const [conditionVal, setConditionVal] = useState<string | number>(initialVal1);
  const [conditionVal2, setConditionVal2] = useState<string | number>(initialVal2);

  // Available options for distinct values list
  const availableValues: { label: string; value: string; count?: number }[] = useMemo(() => {
    if (filterOptions && filterOptions.length > 0) {
      return filterOptions.map((opt) => {
        const found = distinctValues.find((d) => d.value === String(opt.value));
        return {
          label: opt.label,
          value: String(opt.value),
          count: found ? found.count : undefined,
        };
      });
    }
    return distinctValues;
  }, [filterOptions, distinctValues]);

  // Checklist of Selected Values
  const [checkedValues, setCheckedValues] = useState<Set<string>>(new Set());
  const [searchChecklist, setSearchChecklist] = useState('');

  // Reposition calculation to keep popup in viewport
  const updatePosition = () => {
    if (!triggerButtonRef.current) return;
    const rect = triggerButtonRef.current.getBoundingClientRect();
    const popupWidth = 280;
    const estimatedHeight = 440;

    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldFlip = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    let top = shouldFlip ? rect.top - estimatedHeight - 4 : rect.bottom + 6;
    if (top < 10) top = 10;
    if (top + estimatedHeight > window.innerHeight - 10) {
      top = Math.max(10, window.innerHeight - estimatedHeight - 10);
    }

    let left = rect.left - 200; // open aligned towards left of button
    if (left + popupWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popupWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    setCoords({ top, left });
  };

  // Sync state when popup opens or currentFilter changes
  useEffect(() => {
    if (isOpen) {
      const op = (currentFilter?.conditionOperator ||
        currentFilter?.textOperator ||
        currentFilter?.numberOperator ||
        currentFilter?.dateOperator ||
        'any') as ConditionOperator;
      setConditionOp(op);
      setConditionVal(currentFilter?.conditionValue ?? currentFilter?.textValue ?? currentFilter?.numValue1 ?? currentFilter?.dateValue1 ?? '');
      setConditionVal2(currentFilter?.conditionValue2 ?? currentFilter?.numValue2 ?? currentFilter?.dateValue2 ?? '');

      if (currentFilter?.selectedValues && Array.isArray(currentFilter.selectedValues)) {
        setCheckedValues(new Set(currentFilter.selectedValues));
      } else {
        // Default to all selected (standard Excel behavior)
        setCheckedValues(new Set(availableValues.map((v) => v.value)));
      }

      setSearchChecklist('');
      updatePosition();
    }
  }, [isOpen, currentFilter, availableValues]);

  // Window resize & scroll listener
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter checklist by search text
  const filteredChecklist = useMemo(() => {
    if (!searchChecklist.trim()) return availableValues;
    const q = searchChecklist.toLowerCase();
    return availableValues.filter((v) => v.label.toLowerCase().includes(q));
  }, [availableValues, searchChecklist]);

  // Update indeterminate state of Select All checkbox
  useEffect(() => {
    if (!selectAllRef.current) return;
    const visibleCount = filteredChecklist.length;
    if (visibleCount === 0) {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = false;
      return;
    }
    const checkedVisibleCount = filteredChecklist.filter((v) => checkedValues.has(v.value)).length;
    if (checkedVisibleCount === visibleCount) {
      selectAllRef.current.checked = true;
      selectAllRef.current.indeterminate = false;
    } else if (checkedVisibleCount === 0) {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = false;
    } else {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = true;
    }
  }, [filteredChecklist, checkedValues]);

  const handleToggleSelectAll = () => {
    const visibleValues = filteredChecklist.map((v) => v.value);
    const allVisibleChecked = visibleValues.every((val) => checkedValues.has(val));

    const next = new Set(checkedValues);
    if (allVisibleChecked) {
      // Uncheck all visible
      visibleValues.forEach((val) => next.delete(val));
    } else {
      // Check all visible
      visibleValues.forEach((val) => next.add(val));
    }
    setCheckedValues(next);
  };

  const toggleCheckValue = (val: string) => {
    const next = new Set(checkedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setCheckedValues(next);
  };

  // Check if this column is actively filtered
  const isFiltered = Boolean(
    currentFilter &&
      ((currentFilter.conditionOperator && currentFilter.conditionOperator !== 'any') ||
        (currentFilter.textOperator && currentFilter.textOperator !== 'any') ||
        currentFilter.textValue ||
        currentFilter.numValue1 !== '' ||
        currentFilter.dateValue1 ||
        (currentFilter.selectedValues &&
          availableValues.length > 0 &&
          currentFilter.selectedValues.length < availableValues.length))
  );

  const handleApply = () => {
    const hasCondition = conditionOp !== 'any';
    const isChecklistRestricted =
      availableValues.length > 0 && checkedValues.size < availableValues.length;

    if (!hasCondition && !isChecklistRestricted) {
      // No filter active
      onApplyFilter(columnId, null);
    } else {
      const rule: ColumnFilterRule = {
        type: filterType,
        conditionOperator: conditionOp,
        conditionValue: conditionVal,
        conditionValue2: conditionVal2,
        selectedValues: isChecklistRestricted ? Array.from(checkedValues) : undefined,

        // Backward-compat aliases
        textOperator: conditionOp,
        textValue: String(conditionVal || ''),
        numberOperator: conditionOp as any,
        numValue1: conditionVal !== '' ? Number(conditionVal) : '',
        numValue2: conditionVal2 !== '' ? Number(conditionVal2) : '',
        dateOperator: conditionOp as any,
        dateValue1: String(conditionVal || ''),
        dateValue2: String(conditionVal2 || ''),
      };
      onApplyFilter(columnId, rule);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setConditionOp('any');
    setConditionVal('');
    setConditionVal2('');
    setSearchChecklist('');
    setCheckedValues(new Set(availableValues.map((v) => v.value)));
    if (onSort && sortDirection) {
      onSort(null);
    }
    onApplyFilter(columnId, null);
    setIsOpen(false);
  };

  // Sort labels based on data type
  const getSortLabels = () => {
    if (filterType === 'number') {
      return { asc: '↑  1 → 9', desc: '↓  9 → 1' };
    }
    if (filterType === 'date') {
      return { asc: '↑  Oldest → Newest', desc: '↓  Newest → Oldest' };
    }
    return { asc: '↑  A → Z', desc: '↓  Z → A' };
  };

  const sortLabels = getSortLabels();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        marginLeft: '4px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Column Filter Funnel Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isFiltered ? `Active Filter on ${columnTitle}` : `Filter & Sort ${columnTitle}`}
        aria-label={`Filter and Sort ${columnTitle}`}
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: 'var(--radius-xs, 4px)',
          border: isFiltered ? '1px solid var(--brand-primary)' : '1px solid transparent',
          backgroundColor: isFiltered
            ? 'var(--brand-primary)'
            : isOpen
            ? 'var(--bg-subtle)'
            : 'transparent',
          color: isFiltered ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-muted)',
          cursor: 'pointer',
          padding: 0,
          transition: 'all var(--transition-fast)',
        }}
      >
        <Filter size={12} strokeWidth={isFiltered ? 2.5 : 2} />
      </button>

      {/* Portaled Excel / Function-Style Filter Dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
              width: '280px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              border: '1px solid var(--border-strong, #cbd5e1)',
              borderRadius: 'var(--radius-card, 8px)',
              boxShadow: '0 18px 45px -5px rgba(0, 0, 0, 0.3), 0 8px 18px -4px rgba(0, 0, 0, 0.15)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              backdropFilter: 'var(--glass-blur-filter, none)',
              WebkitBackdropFilter: 'var(--glass-blur-filter, none)',
            }}
          >
            {/* 1. Header: Column Title & Close 'X' */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {columnTitle}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* 2. Sort Buttons: [ ↑ A → Z ] [ ↓ Z → A ] */}
            {sortable && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (onSort) {
                      onSort(sortDirection === 'asc' ? null : 'asc');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: 'var(--radius-xs, 4px)',
                    border: sortDirection === 'asc' ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    backgroundColor: sortDirection === 'asc' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                    color: sortDirection === 'asc' ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{sortLabels.asc}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSort) {
                      onSort(sortDirection === 'desc' ? null : 'desc');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: 'var(--radius-xs, 4px)',
                    border: sortDirection === 'desc' ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    backgroundColor: sortDirection === 'desc' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                    color: sortDirection === 'desc' ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{sortLabels.desc}</span>
                </button>
              </div>
            )}

            {/* 3. CONDITION Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                CONDITION
              </div>

              <select
                value={conditionOp}
                onChange={(e) => setConditionOp(e.target.value as ConditionOperator)}
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="any">(Any)</option>
                {filterType === 'number' ? (
                  <>
                    <option value="equals">Equals (=)</option>
                    <option value="doesNotEqual">Does not equal (≠)</option>
                    <option value="gt">Greater than (&gt;)</option>
                    <option value="gte">Greater than or equal (≥)</option>
                    <option value="lt">Less than (&lt;)</option>
                    <option value="lte">Less than or equal (≤)</option>
                    <option value="between">Between</option>
                    <option value="isEmpty">Is empty</option>
                    <option value="isNotEmpty">Is not empty</option>
                  </>
                ) : filterType === 'date' ? (
                  <>
                    <option value="equals">Equals</option>
                    <option value="before">Before</option>
                    <option value="after">After</option>
                    <option value="between">Between</option>
                    <option value="today">Today</option>
                    <option value="last7">Last 7 days</option>
                    <option value="thisMonth">This month</option>
                    <option value="isEmpty">Is empty</option>
                    <option value="isNotEmpty">Is not empty</option>
                  </>
                ) : (
                  <>
                    <option value="contains">Contains</option>
                    <option value="doesNotContain">Does not contain</option>
                    <option value="equals">Equals</option>
                    <option value="doesNotEqual">Does not equal</option>
                    <option value="startsWith">Starts with</option>
                    <option value="endsWith">Ends with</option>
                    <option value="isEmpty">Is empty</option>
                    <option value="isNotEmpty">Is not empty</option>
                  </>
                )}
              </select>

              {/* Dynamic Input for Condition Value */}
              {conditionOp !== 'any' && conditionOp !== 'isEmpty' && conditionOp !== 'isNotEmpty' && (
                <div style={{ marginTop: '2px' }}>
                  {filterType === 'number' ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="number"
                        placeholder={conditionOp === 'between' ? 'Min' : 'Value'}
                        value={conditionVal}
                        onChange={(e) => setConditionVal(e.target.value)}
                        style={{
                          flex: 1,
                          height: '30px',
                          padding: '0 8px',
                          borderRadius: 'var(--radius-xs, 4px)',
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                        }}
                      />
                      {conditionOp === 'between' && (
                        <input
                          type="number"
                          placeholder="Max"
                          value={conditionVal2}
                          onChange={(e) => setConditionVal2(e.target.value)}
                          style={{
                            flex: 1,
                            height: '30px',
                            padding: '0 8px',
                            borderRadius: 'var(--radius-xs, 4px)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                          }}
                        />
                      )}
                    </div>
                  ) : filterType === 'date' && (conditionOp === 'before' || conditionOp === 'after' || conditionOp === 'between' || conditionOp === 'equals') ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <input
                        type="date"
                        value={String(conditionVal)}
                        onChange={(e) => setConditionVal(e.target.value)}
                        style={{
                          width: '100%',
                          height: '30px',
                          padding: '0 8px',
                          borderRadius: 'var(--radius-xs, 4px)',
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                        }}
                      />
                      {conditionOp === 'between' && (
                        <input
                          type="date"
                          value={String(conditionVal2)}
                          onChange={(e) => setConditionVal2(e.target.value)}
                          style={{
                            width: '100%',
                            height: '30px',
                            padding: '0 8px',
                            borderRadius: 'var(--radius-xs, 4px)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter value..."
                      value={String(conditionVal)}
                      onChange={(e) => setConditionVal(e.target.value)}
                      style={{
                        width: '100%',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: 'var(--radius-xs, 4px)',
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* 4. FILTER BY VALUE Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                FILTER BY VALUE
              </div>

              {/* Search values input */}
              <input
                type="text"
                placeholder="Search values..."
                value={searchChecklist}
                onChange={(e) => setSearchChecklist(e.target.value)}
                style={{
                  width: '100%',
                  height: '30px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />

              {/* Select All Checkbox Row */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 2px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  userSelect: 'none',
                }}
              >
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  onChange={handleToggleSelectAll}
                  style={{
                    cursor: 'pointer',
                    accentColor: 'var(--brand-primary, #0067b8)',
                    width: '14px',
                    height: '14px',
                  }}
                />
                <span>Select All</span>
              </label>

              {/* Scrollable Checkbox List with Counts */}
              <div
                style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  paddingRight: '2px',
                }}
              >
                {filteredChecklist.length === 0 ? (
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: '16px 0',
                      fontSize: '11px',
                    }}
                  >
                    No matching values
                  </div>
                ) : (
                  filteredChecklist.map((item) => {
                    const isChecked = checkedValues.has(item.value);
                    return (
                      <label
                        key={item.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '3px 4px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          backgroundColor: isChecked ? 'rgba(0, 103, 184, 0.05)' : 'transparent',
                          userSelect: 'none',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheckValue(item.value)}
                            style={{
                              cursor: 'pointer',
                              accentColor: 'var(--brand-primary, #0067b8)',
                              width: '14px',
                              height: '14px',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                            }}
                            title={item.label}
                          >
                            {item.label}
                          </span>
                        </div>

                        {item.count !== undefined && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              flexShrink: 0,
                              marginLeft: '6px',
                            }}
                          >
                            {item.count}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* 5. Footer Buttons: [ Clear ] [ Apply ] */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '10px',
                marginTop: '4px',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={handleClear}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs, 4px)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: 1,
                  height: '32px',
                  padding: '0 20px',
                  border: 'none',
                  borderRadius: 'var(--radius-xs, 4px)',
                  backgroundColor: 'var(--btn-save, #047857)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Apply
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
