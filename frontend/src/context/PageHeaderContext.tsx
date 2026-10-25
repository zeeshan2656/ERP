import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageAction } from '../types/index.ts';
import { useBranding } from './BrandingContext.tsx';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface HeaderTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
}

export interface HeaderSearchConfig {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  onSearch?: () => void;
}

interface PageHeaderContextType {
  title: string;
  setTitle: (title: string) => void;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (crumbs: BreadcrumbItem[]) => void;
  actions: PageAction[];
  registerActions: (newActions: PageAction[]) => void;
  clearActions: () => void;
  isDirty: boolean;
  setFormDirty: (dirty: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  viewMode: 'table' | 'card';
  setViewMode: (mode: 'table' | 'card') => void;
  supportsCardView: boolean;
  setSupportsCardView: (supports: boolean) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  hasAdvancedFilters: boolean;
  setHasAdvancedFilters: (has: boolean) => void;
  activeFilterCount: number;
  setActiveFilterCount: (count: number) => void;
  filterPanelContent: React.ReactNode | null;
  setFilterPanelContent: (content: React.ReactNode | null) => void;

  // Header-First Module Tabs, Search & Custom Controls
  headerTabs: HeaderTabItem[];
  activeTabId: string;
  onTabChange: ((tabId: string) => void) | null;
  setHeaderTabsConfig: (
    config: { tabs: HeaderTabItem[]; activeTabId: string; onTabChange?: (tabId: string) => void } | null
  ) => void;
  headerSearch: HeaderSearchConfig | null;
  setHeaderSearch: (config: HeaderSearchConfig | null) => void;
  headerCustomControls: React.ReactNode | null;
  setHeaderCustomControls: (controls: React.ReactNode | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  title: '',
  setTitle: () => {},
  breadcrumbs: [],
  setBreadcrumbs: () => {},
  actions: [],
  registerActions: () => {},
  clearActions: () => {},
  isDirty: false,
  setFormDirty: () => {},
  isSaving: false,
  setIsSaving: () => {},
  viewMode: 'table',
  setViewMode: () => {},
  supportsCardView: false,
  setSupportsCardView: () => {},
  isFilterOpen: false,
  setIsFilterOpen: () => {},
  hasAdvancedFilters: false,
  setHasAdvancedFilters: () => {},
  activeFilterCount: 0,
  setActiveFilterCount: () => {},
  filterPanelContent: null,
  setFilterPanelContent: () => {},

  headerTabs: [],
  activeTabId: '',
  onTabChange: null,
  setHeaderTabsConfig: () => {},
  headerSearch: null,
  setHeaderSearch: () => {},
  headerCustomControls: null,
  setHeaderCustomControls: () => {},
});

export const PageHeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [title, setTitleState] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [actions, setActions] = useState<PageAction[]>([]);
  const [isDirty, setFormDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [supportsCardView, setSupportsCardView] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasAdvancedFilters, setHasAdvancedFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [filterPanelContent, setFilterPanelContent] = useState<React.ReactNode | null>(null);

  // Header-First states
  const [headerTabs, setHeaderTabs] = useState<HeaderTabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [onTabChangeCallback, setOnTabChangeCallback] = useState<((tabId: string) => void) | null>(null);
  const [headerSearch, setHeaderSearch] = useState<HeaderSearchConfig | null>(null);
  const [headerCustomControls, setHeaderCustomControls] = useState<React.ReactNode | null>(null);

  const { branding } = useBranding();
  const location = useLocation();

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    if (newTitle) {
      document.title = `${newTitle} | ${branding.productName || 'Apex Flow'}`;
    }
  }, [branding.productName]);

  const registerActions = useCallback((newActions: PageAction[]) => {
    setActions(newActions);
  }, []);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  const setHeaderTabsConfig = useCallback(
    (config: { tabs: HeaderTabItem[]; activeTabId: string; onTabChange?: (tabId: string) => void } | null) => {
      if (config) {
        setHeaderTabs(config.tabs);
        setActiveTabId(config.activeTabId);
        setOnTabChangeCallback(() => config.onTabChange || null);
      } else {
        setHeaderTabs([]);
        setActiveTabId('');
        setOnTabChangeCallback(null);
      }
    },
    []
  );

  // Clear actions and reset states when route changes
  useEffect(() => {
    setActions([]);
    setFormDirty(false);
    setSupportsCardView(false);
    setViewMode('table');
    setHasAdvancedFilters(false);
    setActiveFilterCount(0);
    setFilterPanelContent(null);
    setIsFilterOpen(false);
    setHeaderTabs([]);
    setActiveTabId('');
    setOnTabChangeCallback(null);
    setHeaderSearch(null);
    setHeaderCustomControls(null);
  }, [location.pathname]);

  // Global Ctrl+S / Cmd+S shortcut for primary Save / Update action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        const primaryAction = actions.find(
          (a) => (a.variant === 'save' || a.variant === 'update' || a.variant === 'primary') && !a.disabled && !a.isLoading
        );
        if (primaryAction) {
          e.preventDefault();
          primaryAction.onClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  // Unsaved changes browser prompt on page refresh / close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <PageHeaderContext.Provider
      value={{
        title,
        setTitle,
        breadcrumbs,
        setBreadcrumbs,
        actions,
        registerActions,
        clearActions,
        isDirty,
        setFormDirty,
        isSaving,
        setIsSaving,
        viewMode,
        setViewMode,
        supportsCardView,
        setSupportsCardView,
        isFilterOpen,
        setIsFilterOpen,
        hasAdvancedFilters,
        setHasAdvancedFilters,
        activeFilterCount,
        setActiveFilterCount,
        filterPanelContent,
        setFilterPanelContent,

        headerTabs,
        activeTabId,
        onTabChange: onTabChangeCallback,
        setHeaderTabsConfig,
        headerSearch,
        setHeaderSearch,
        headerCustomControls,
        setHeaderCustomControls,
      }}
    >
      {children}
    </PageHeaderContext.Provider>
  );
};

export const usePageHeader = () => useContext(PageHeaderContext);

/**
 * Hook to declaratively register page-level actions in the global header.
 * Automatically cleans up on unmount.
 */
export function usePageActions(actions: PageAction[]) {
  const { registerActions, clearActions } = usePageHeader();

  useEffect(() => {
    registerActions(actions);
    return () => {
      clearActions();
    };
  }, [actions, registerActions, clearActions]);
}

/**
 * Hook to set the active page title and breadcrumbs in the global header.
 */
export function usePageTitle(title: string, breadcrumbs?: BreadcrumbItem[]) {
  const { setTitle, setBreadcrumbs } = usePageHeader();

  useEffect(() => {
    if (title) {
      setTitle(title);
    }
    if (breadcrumbs) {
      setBreadcrumbs(breadcrumbs);
    }
  }, [title, breadcrumbs, setTitle, setBreadcrumbs]);
}

/**
 * Hook to enable Table View vs Card View switching in the global header.
 */
export function useTableViewMode(supportsCard = true) {
  const { viewMode, setViewMode, setSupportsCardView } = usePageHeader();

  useEffect(() => {
    setSupportsCardView(supportsCard);
    return () => {
      setSupportsCardView(false);
    };
  }, [supportsCard, setSupportsCardView]);

  return { viewMode, setViewMode };
}

/**
 * Hook to register an Advanced Filter panel and active count in the global header.
 */
export function useHeaderFilter(
  content: React.ReactNode | null,
  activeCount: number = 0,
  enabled: boolean = true
) {
  const { setHasAdvancedFilters, setActiveFilterCount, setFilterPanelContent } = usePageHeader();

  useEffect(() => {
    if (enabled) {
      setHasAdvancedFilters(true);
      setActiveFilterCount(activeCount);
      setFilterPanelContent(content);
    } else {
      setHasAdvancedFilters(false);
      setActiveFilterCount(0);
      setFilterPanelContent(null);
    }

    return () => {
      setHasAdvancedFilters(false);
      setActiveFilterCount(0);
      setFilterPanelContent(null);
    };
  }, [enabled, activeCount, content, setHasAdvancedFilters, setActiveFilterCount, setFilterPanelContent]);
}

/**
 * Hook to register secondary navigation tabs in the sticky main header.
 */
export function useHeaderTabs(
  tabs: HeaderTabItem[],
  activeTabId: string,
  onTabChange?: (tabId: string) => void
) {
  const { setHeaderTabsConfig } = usePageHeader();

  useEffect(() => {
    if (tabs && tabs.length > 0) {
      setHeaderTabsConfig({ tabs, activeTabId, onTabChange });
    } else {
      setHeaderTabsConfig(null);
    }

    return () => {
      setHeaderTabsConfig(null);
    };
  }, [tabs, activeTabId, onTabChange, setHeaderTabsConfig]);
}

/**
 * Hook to register a search field in the sticky main header.
 */
export function useHeaderSearch(config: HeaderSearchConfig | null) {
  const { setHeaderSearch } = usePageHeader();

  useEffect(() => {
    setHeaderSearch(config);
    return () => {
      setHeaderSearch(null);
    };
  }, [config, setHeaderSearch]);
}

/**
 * Hook to register custom module controls (e.g. active table selector) in the sticky main header.
 */
export function useHeaderCustomControls(controls: React.ReactNode | null) {
  const { setHeaderCustomControls } = usePageHeader();

  useEffect(() => {
    setHeaderCustomControls(controls);
    return () => {
      setHeaderCustomControls(null);
    };
  }, [controls, setHeaderCustomControls]);
}
