import React, { createContext, useContext, useEffect, useState } from 'react';
import { useBranding } from './BrandingContext.tsx';
import { checkWcagCompliance } from '../utils/contrast.ts';
import { ThemeStyle, ThemeMode, ResolvedThemeMode, ThemeDensity } from '../types/index.ts';

interface ThemeContextType {
  // 3 Independent Theme Axes
  style: ThemeStyle;
  setStyle: (style: ThemeStyle) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: ResolvedThemeMode;
  toggleDarkLight: () => void;
  density: ThemeDensity;
  setDensity: (density: ThemeDensity) => void;

  // Project-Wide Zoom
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Legacy ThemeMode support
  activeTheme: string;
  resolvedTheme: string;
  setTheme: (theme: any) => void;

  previewTokens: Record<string, string> | null;
  setLivePreviewTokens: (tokens: Record<string, string> | null) => void;
  validateContrast: (textColor: string, bgColor: string, isLarge?: boolean) => any;
}

const ThemeContext = createContext<ThemeContextType>({
  style: 'general',
  setStyle: () => {},
  mode: 'light',
  setMode: () => {},
  resolvedMode: 'light',
  toggleDarkLight: () => {},
  density: 'comfortable',
  setDensity: () => {},
  zoom: 100,
  setZoom: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  resetZoom: () => {},
  activeTheme: 'general_light',
  resolvedTheme: 'general_light',
  setTheme: () => {},
  previewTokens: null,
  setLivePreviewTokens: () => {},
  validateContrast: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { branding } = useBranding();

  // 1. Style state ('general' | 'soft-ui' | 'enterprise')
  const [style, setStyleState] = useState<ThemeStyle>(() => {
    const saved = localStorage.getItem('app_theme_style') as ThemeStyle | null;
    return saved || branding.themeStyle || 'general';
  });

  // 2. Mode state ('light' | 'dark' | 'system')
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme_mode') as ThemeMode | null;
    return saved || branding.themeMode || 'light';
  });

  // 3. Density state ('comfortable' | 'compact')
  const [density, setDensityState] = useState<ThemeDensity>(() => {
    const saved = localStorage.getItem('app_density_mode') as ThemeDensity | null;
    return saved || branding.densityMode || 'comfortable';
  });

  // 4. Project-Wide Zoom (50 to 150)
  const [zoom, setZoomState] = useState<number>(() => {
    const saved = localStorage.getItem('app_zoom_level');
    return saved ? Number(saved) : branding.appZoom || 100;
  });

  const [previewTokens, setPreviewTokens] = useState<Record<string, string> | null>(null);

  // Sync state if branding loads new values from backend and user hasn't overridden
  useEffect(() => {
    if (!localStorage.getItem('app_theme_style') && branding.themeStyle) {
      setStyleState(branding.themeStyle);
    }
    if (!localStorage.getItem('app_theme_mode') && branding.themeMode) {
      setModeState(branding.themeMode);
    }
    if (!localStorage.getItem('app_density_mode') && branding.densityMode) {
      setDensityState(branding.densityMode);
    }
    if (!localStorage.getItem('app_zoom_level') && branding.appZoom) {
      setZoomState(branding.appZoom);
    }
  }, [branding]);

  // Determine system dark preference
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedMode: ResolvedThemeMode = mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

  const setStyle = (newStyle: ThemeStyle) => {
    setStyleState(newStyle);
    localStorage.setItem('app_theme_style', newStyle);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('app_theme_mode', newMode);
  };

  const setDensity = (newDensity: ThemeDensity) => {
    setDensityState(newDensity);
    localStorage.setItem('app_density_mode', newDensity);
  };

  const setZoom = (newZoom: number) => {
    const clamped = Math.min(150, Math.max(50, Math.round(newZoom)));
    setZoomState(clamped);
    localStorage.setItem('app_zoom_level', String(clamped));
  };

  const zoomIn = () => setZoom(zoom + 10);
  const zoomOut = () => setZoom(zoom - 10);
  const resetZoom = () => setZoom(100);

  const toggleDarkLight = () => {
    if (resolvedMode === 'dark') {
      setMode('light');
    } else {
      setMode('dark');
    }
  };

  // Legacy compatibility setter
  const setTheme = (theme: any) => {
    if (theme === 'dark') {
      setMode('dark');
    } else if (theme === 'soft_ui_light') {
      setStyle('soft-ui');
      setMode('light');
    } else if (theme === 'soft_ui_dark') {
      setStyle('soft-ui');
      setMode('dark');
    } else if (theme === 'glassmorphism') {
      setStyle('glassmorphism');
    } else if (theme === 'glassmorphism_light') {
      setStyle('glassmorphism');
      setMode('light');
    } else if (theme === 'glassmorphism_dark') {
      setStyle('glassmorphism');
      setMode('dark');
    } else if (theme === 'enterprise') {
      setStyle('enterprise');
    } else if (theme === 'compact') {
      setDensity('compact');
    } else {
      setStyle('general');
      setMode('light');
    }
  };

  // 1. Synchronize attributes on root element (<html data-style="..." data-mode="..." data-density="...">)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-style', style);
    root.setAttribute('data-mode', resolvedMode);
    root.setAttribute('data-density', density);
    root.classList.toggle('dark', resolvedMode === 'dark');

    // Legacy data-theme compatibility for existing CSS selectors
    root.setAttribute('data-theme', `${style}_${resolvedMode}`);

    // Apply Global Application Zoom without breaking document flow
    root.style.zoom = `${zoom}%`;
    root.style.setProperty('--app-zoom', String(zoom / 100));

    // Apply tokens if not actively overridden by live preview
    if (!previewTokens) {
      if (branding.fontFamily) {
        root.style.setProperty('--font-family-base', branding.fontFamily);
      }
      if (branding.baseFontSize) {
        root.style.setProperty('--font-size-base', branding.baseFontSize);
      }
      if (branding.borderRadius) {
        root.style.setProperty('--radius-sm', branding.borderRadius);
      }
      if (branding.primaryColor && resolvedMode !== 'dark') {
        root.style.setProperty('--brand-primary', branding.primaryColor);
      }
      if (branding.accentColor) {
        root.style.setProperty('--brand-accent', branding.accentColor);
      }

      // Radius token sync
      if (branding.radiusGlobal) {
        root.style.setProperty('--radius-global', branding.radiusGlobal);
      }
      const setRadiusProp = (prop: string, val: string | undefined, fallbackVar = 'var(--radius-global)') => {
        if (val && val !== 'follow') {
          root.style.setProperty(prop, val);
        } else {
          root.style.setProperty(prop, fallbackVar);
        }
      };

      setRadiusProp('--radius-btn', branding.radiusButtons);
      setRadiusProp('--radius-input', branding.radiusInputs);
      setRadiusProp('--radius-card', branding.radiusCards);
      setRadiusProp('--radius-sidebar', branding.radiusSidebar);
      setRadiusProp('--radius-header', branding.radiusHeader);
      setRadiusProp('--radius-dialog', branding.radiusDialogs);
      setRadiusProp('--radius-table', branding.radiusTables);
      setRadiusProp('--radius-badge', branding.radiusBadges, 'var(--radius-full)');
      setRadiusProp('--radius-tab', branding.radiusTabs);
      setRadiusProp('--radius-toast', branding.radiusToasts);
      setRadiusProp('--radius-image', branding.radiusImages);
      setRadiusProp('--radius-control', branding.radiusControls);

      // Semantic Button Colors
      if (branding.btnSaveColor) root.style.setProperty('--btn-save-bg', branding.btnSaveColor);
      if (branding.btnUpdateColor) root.style.setProperty('--btn-update-bg', branding.btnUpdateColor);
      if (branding.btnCancelColor) root.style.setProperty('--btn-cancel-border', branding.btnCancelColor);
      if (branding.btnDeleteColor) root.style.setProperty('--btn-delete-bg', branding.btnDeleteColor);

      // Soft UI token sync
      if (branding.softUiDistance) root.style.setProperty('--soft-distance', branding.softUiDistance);
      if (branding.softUiBlur) root.style.setProperty('--soft-blur', branding.softUiBlur);
      if (branding.softUiIntensity !== undefined) root.style.setProperty('--soft-intensity', String(branding.softUiIntensity));

      if (resolvedMode === 'light') {
        if (branding.softUiLightBg) root.style.setProperty('--soft-bg', branding.softUiLightBg);
        if (branding.softUiLightShadowDark) root.style.setProperty('--soft-shadow-dark', branding.softUiLightShadowDark);
        if (branding.softUiLightShadowLight) root.style.setProperty('--soft-shadow-light', branding.softUiLightShadowLight);
      } else {
        if (branding.softUiDarkBg) root.style.setProperty('--soft-bg', branding.softUiDarkBg);
        if (branding.softUiDarkShadowDark) root.style.setProperty('--soft-shadow-dark', branding.softUiDarkShadowDark);
        if (branding.softUiDarkShadowLight) root.style.setProperty('--soft-shadow-light', branding.softUiDarkShadowLight);
      }
    }

    // Always guarantee primary and surface aliases are synchronized
    root.style.setProperty('--primary', 'var(--brand-primary)');
    root.style.setProperty('--primary-color', 'var(--brand-primary)');
    root.style.setProperty('--bg-app', 'var(--surface-0)');
    root.style.setProperty('--bg-surface', 'var(--surface-1)');
    root.style.setProperty('--bg-subtle', 'var(--surface-2)');
  }, [style, resolvedMode, density, zoom, branding, previewTokens]);

  // Apply Live Preview Overrides
  useEffect(() => {
    const root = document.documentElement;
    const inlineProps = [
      '--brand-primary',
      '--brand-primary-text',
      '--brand-accent',
      '--sidebar-bg',
      '--sidebar-text',
      '--sidebar-muted',
      '--header-bg',
      '--header-text',
      '--bg-canvas',
      '--bg-surface',
      '--bg-subtle',
      '--radius-sm',
      '--radius-global',
      '--radius-btn',
      '--radius-input',
      '--radius-card',
      '--radius-sidebar',
      '--radius-header',
      '--radius-dialog',
      '--radius-table',
      '--radius-badge',
      '--radius-tab',
      '--radius-toast',
      '--radius-image',
      '--radius-control',
      '--soft-distance',
      '--soft-blur',
      '--soft-intensity',
      '--soft-bg',
      '--soft-shadow-dark',
      '--soft-shadow-light',
      '--btn-save-bg',
      '--btn-update-bg',
      '--btn-cancel-bg',
      '--btn-cancel-border',
      '--btn-delete-bg',
    ];

    // Always clear old inline overrides first to prevent stale light overrides persisting into dark mode
    inlineProps.forEach((p) => root.style.removeProperty(p));

    if (previewTokens) {
      Object.entries(previewTokens).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
      });
    }
  }, [previewTokens]);

  return (
    <ThemeContext.Provider
      value={{
        style,
        setStyle,
        mode,
        setMode,
        resolvedMode,
        toggleDarkLight,
        density,
        setDensity,
        zoom,
        setZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        activeTheme: `${style}_${resolvedMode}`,
        resolvedTheme: `${style}_${resolvedMode}`,
        setTheme,
        previewTokens,
        setLivePreviewTokens: setPreviewTokens,
        validateContrast: checkWcagCompliance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
