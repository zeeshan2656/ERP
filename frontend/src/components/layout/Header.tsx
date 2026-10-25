import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Sun,
  Moon,
  LayoutList,
  LayoutGrid,
  SlidersHorizontal,
  Search,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { usePageHeader, HeaderTabItem } from '../../context/PageHeaderContext.tsx';
import { Button } from '../ui/Button.tsx';
import { Link } from 'react-router-dom';

export interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const { resolvedMode, toggleDarkLight } = useTheme();
  const {
    title,
    breadcrumbs,
    actions,
    isDirty,
    viewMode,
    setViewMode,
    supportsCardView,
    isFilterOpen,
    setIsFilterOpen,
    hasAdvancedFilters,
    activeFilterCount,
    filterPanelContent,

    // Header-First features
    headerTabs,
    activeTabId,
    onTabChange,
    headerSearch,
    headerCustomControls,
  } = usePageHeader();

  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    if (isOverflowOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOverflowOpen]);

  // Determine primary actions vs overflow actions if there are many
  const visibleActionLimit = 3;
  const visibleActions = actions.slice(0, visibleActionLimit);
  const overflowActions = actions.slice(visibleActionLimit);

  const hasTabs = headerTabs && headerTabs.length > 0;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Primary Header Band */}
      <div
        style={{
          minHeight: 'var(--header-height, 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          gap: '16px',
        }}
      >
        {/* Left: Sidebar Toggle + Dynamic Page Title & Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flexShrink: 1 }}>
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm, 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)',
              flexShrink: 0,
            }}
            title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Breadcrumbs (if present) */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.2,
                  marginBottom: '2px',
                }}
              >
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span style={{ opacity: 0.5 }}>/</span>}
                    {crumb.path ? (
                      <Link
                        to={crumb.path}
                        style={{
                          color: 'var(--text-muted)',
                          textDecoration: 'none',
                          transition: 'color var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Dynamic Page Title & Dirty Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                style={{
                  fontSize: 'var(--font-size-md, 18px)',
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title || 'Apex Flow'}
              </h1>

              {/* Unsaved Changes Indicator */}
              {isDirty && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    flexShrink: 0,
                  }}
                  title="You have unsaved changes on this page"
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                      display: 'inline-block',
                    }}
                  />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Global Header Search (if registered by active module) */}
        {headerSearch && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: '320px',
              minWidth: '180px',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder={headerSearch.placeholder || 'Search records...'}
              value={headerSearch.value}
              onChange={(e) => headerSearch.onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && headerSearch.onSearch) {
                  headerSearch.onSearch();
                }
              }}
              style={{
                width: '100%',
                padding: '6px 30px 6px 32px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
              }}
            />
            {headerSearch.value && (
              <button
                type="button"
                onClick={() => headerSearch.onChange('')}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Right: Custom Controls + View Switcher + Filters + Actions + Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Custom Module Controls (e.g. Active Table Select Dropdown) */}
          {headerCustomControls && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {headerCustomControls}
            </div>
          )}

          {/* Table View / Card View Toggle */}
          {supportsCardView && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '2px',
                gap: '2px',
              }}
              role="group"
              aria-label="Display View Mode Switch"
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: 'calc(var(--radius-sm, 4px) - 2px)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: viewMode === 'table' ? '600' : '400',
                  color: viewMode === 'table' ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-secondary)',
                  backgroundColor: viewMode === 'table' ? 'var(--brand-primary)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                }}
                title="Table View (Grid with column filters, sorting and sticky footer)"
                aria-pressed={viewMode === 'table'}
                aria-label="Switch to Table View"
              >
                <LayoutList size={14} />
                <span style={{ fontSize: '12px' }}>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: 'calc(var(--radius-sm, 4px) - 2px)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: viewMode === 'card' ? '600' : '400',
                  color: viewMode === 'card' ? 'var(--brand-primary-text, #ffffff)' : 'var(--text-secondary)',
                  backgroundColor: viewMode === 'card' ? 'var(--brand-primary)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                }}
                title="Card View (Visual cards with responsive layout and actions)"
                aria-pressed={viewMode === 'card'}
                aria-label="Switch to Card View"
              >
                <LayoutGrid size={14} />
                <span style={{ fontSize: '12px' }}>Cards</span>
              </button>
            </div>
          )}

          {/* Advanced Filters Button with Active Count Badge */}
          {hasAdvancedFilters && (
            <Button
              variant={isFilterOpen || activeFilterCount > 0 ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              leftIcon={<SlidersHorizontal size={14} />}
              title="Open Advanced Filters"
            >
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    marginLeft: '4px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isFilterOpen ? 'rgba(255, 255, 255, 0.3)' : 'var(--brand-primary)',
                    color: isFilterOpen ? '#ffffff' : 'var(--brand-primary-text, #ffffff)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {/* Page Actions (Primary & Secondary buttons) */}
          {visibleActions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {visibleActions.map((act) => (
                <Button
                  key={act.id}
                  variant={act.variant || 'primary'}
                  size="sm"
                  onClick={act.onClick}
                  disabled={act.disabled}
                  isLoading={act.isLoading}
                  leftIcon={act.icon}
                  title={act.shortcut ? `${act.label} (${act.shortcut})` : act.label}
                >
                  <span>{act.label}</span>
                  {act.shortcut && (
                    <kbd
                      style={{
                        marginLeft: '6px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {act.shortcut}
                    </kbd>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Overflow Menu for additional actions */}
          {overflowActions.length > 0 && (
            <div style={{ position: 'relative' }} ref={overflowRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOverflowOpen(!isOverflowOpen)}
                title="More actions"
              >
                <MoreHorizontal size={15} />
              </Button>

              {isOverflowOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    zIndex: 100,
                    minWidth: '160px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {overflowActions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => {
                        act.onClick();
                        setIsOverflowOpen(false);
                      }}
                      disabled={act.disabled || act.isLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {act.icon}
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Dark/Light Toggle */}
          <button
            onClick={toggleDarkLight}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '7px 9px',
              borderRadius: 'var(--radius-sm, 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
            }}
            title={resolvedMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {resolvedMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      {/* 2. Secondary Navigation Tabs Band (Rendered inside sticky header when module tabs are registered) */}
      {hasTabs && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '8px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--header-bg)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {headerTabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.onClick) {
                    tab.onClick();
                  }
                  if (onTabChange) {
                    onTabChange(tab.id);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 14px',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? 'var(--brand-primary)' : 'transparent'}`,
                  backgroundColor: 'transparent',
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: isActive ? 'rgba(0, 103, 184, 0.12)' : 'var(--bg-subtle)',
                      color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Advanced Filters Panel */}
      {isFilterOpen && filterPanelContent && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: '24px',
            zIndex: 100,
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-card, 10px)',
            boxShadow: '0 18px 45px -5px rgba(0, 0, 0, 0.3), 0 8px 18px -4px rgba(0, 0, 0, 0.15)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backdropFilter: 'var(--glass-blur-filter, none)',
            WebkitBackdropFilter: 'var(--glass-blur-filter, none)',
          }}
        >
          {filterPanelContent}
        </div>
      )}
    </header>
  );
};
