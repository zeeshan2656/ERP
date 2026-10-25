import React, { useMemo } from 'react';
import { Table, Column, TableProps } from '../ui/Table.tsx';
import {
  usePageTitle,
  usePageActions,
  useHeaderTabs,
  useHeaderCustomControls,
  HeaderTabItem,
} from '../../context/PageHeaderContext.tsx';
import { PageAction } from '../../types/index.ts';
import { OperationsBulkActionBar } from './OperationsBulkActionBar.tsx';
import { OperationsErrorBoundary } from './OperationsErrorBoundary.tsx';

export interface OperationsPageLayoutProps<T extends Record<string, any>> {
  /** Page Title shown in sticky platform header */
  title: string;
  /** Breadcrumbs path */
  breadcrumbs?: Array<{ label: string; path?: string }>;
  /** Global Header Action Buttons */
  headerActions?: PageAction[];
  /** Optional Top Navigation Tabs (e.g. All, Samples, Categories) */
  headerTabs?: HeaderTabItem[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  /** Optional Custom Controls rendered inside global header */
  customHeaderControls?: React.ReactNode;

  /** Primary Dataset */
  data: T[];
  /** Table Columns definition with filters and sorting */
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey?: (row: T) => string | number;

  /** Pagination */
  pagination?: TableProps<T>['pagination'];

  /** Multi-Selection System */
  selectable?: boolean;
  selectedRowKeys?: (string | number)[];
  onSelectedRowKeysChange?: (keys: (string | number)[]) => void;

  /** Unified Card View Renderer (enables Table/Card toggle in header) */
  cardRenderer?: (item: T, isSelected: boolean, toggleSelect: () => void) => React.ReactNode;
  cardGridColumns?: string;

  /** Bulk Operations */
  onBulkDelete?: () => Promise<void> | void;
  isBulkDeleting?: boolean;
  onBulkExportCsv?: () => void;
  onBulkExportJson?: () => void;
  customBulkActions?: React.ReactNode;
  protectedCount?: number;
  bulkDeleteLabel?: string;

  /** Modals and ancillary content */
  children?: React.ReactNode;
}

/**
 * Enterprise Operations Module Layout & Data View Standard
 * 
 * Provides an all-in-one declarative standard for all Operations modules:
 * - Automatically wires Page Title, Breadcrumbs, and Header Actions
 * - Automatically registers Table/Card View Toggle with platform Header
 * - Preserves search, filters, sorting, selection across view switches
 * - Renders Unified Dataset through <Table> and <Card> collections
 * - Manages Multi-Selection and Bulk Actions (Delete with protection, Export)
 * - Protected by OperationsErrorBoundary to prevent white-screen crashes
 */
export function OperationsPageLayout<T extends Record<string, any>>({
  title,
  breadcrumbs,
  headerActions = [],
  headerTabs,
  activeTabId,
  onTabChange,
  customHeaderControls,
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No records found.',
  getRowKey,
  pagination,
  selectable = true,
  selectedRowKeys,
  onSelectedRowKeysChange,
  cardRenderer,
  cardGridColumns,
  onBulkDelete,
  isBulkDeleting = false,
  onBulkExportCsv,
  onBulkExportJson,
  customBulkActions,
  protectedCount = 0,
  bulkDeleteLabel,
  children,
}: OperationsPageLayoutProps<T>) {
  // 1. Register Page Title & Breadcrumbs
  usePageTitle(title, breadcrumbs);

  // 2. Register Header Actions
  usePageActions(headerActions);

  // 3. Register Header Tabs if provided
  if (headerTabs && activeTabId && onTabChange) {
    useHeaderTabs(headerTabs, activeTabId, onTabChange);
  }

  // 4. Register Custom Header Controls if provided
  if (customHeaderControls) {
    useHeaderCustomControls(customHeaderControls);
  }

  // Uncontrolled selection fallback
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<(string | number)[]>([]);
  const effectiveSelectedKeys = selectedRowKeys !== undefined ? selectedRowKeys : internalSelectedKeys;
  const updateSelectedKeys = onSelectedRowKeysChange || setInternalSelectedKeys;

  const handleClearSelection = () => {
    updateSelectedKeys([]);
  };

  const handleSelectAll = () => {
    const allKeys = data.map((item, idx) => (getRowKey ? getRowKey(item) : item.id !== undefined ? item.id : idx));
    updateSelectedKeys(allKeys);
  };

  return (
    <OperationsErrorBoundary moduleName={title}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          gap: '12px',
        }}
      >
        {/* Floating Bulk Action Bar when records are selected */}
        {selectable && effectiveSelectedKeys.length > 0 && (
          <OperationsBulkActionBar
            selectedCount={effectiveSelectedKeys.length}
            totalCount={data.length}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
            onBulkDelete={onBulkDelete}
            isDeleting={isBulkDeleting}
            onBulkExportCsv={onBulkExportCsv}
            onBulkExportJson={onBulkExportJson}
            customActions={customBulkActions}
            protectedCount={protectedCount}
            deleteLabel={bulkDeleteLabel}
          />
        )}

        {/* Primary Unified Dataset Table / Card View */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Table<T>
            columns={columns}
            data={data}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            selectable={selectable}
            selectedRowKeys={effectiveSelectedKeys}
            onSelectedRowKeysChange={updateSelectedKeys}
            getRowKey={getRowKey}
            pagination={pagination}
            cardRenderer={cardRenderer}
            cardGridColumns={cardGridColumns}
            enableHeaderSearch={true}
          />
        </div>

        {/* Modals & Dialogs */}
        {children}
      </div>
    </OperationsErrorBoundary>
  );
}
