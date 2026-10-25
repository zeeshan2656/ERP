import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api/client.ts';
import { useTheme } from '../../../context/ThemeContext.tsx';
import { useBranding } from '../../../context/BrandingContext.tsx';
import { usePageTitle, usePageActions, usePageHeader, useHeaderTabs } from '../../../context/PageHeaderContext.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Select } from '../../../components/ui/Select.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Slider } from '../../../components/ui/Slider.tsx';
import { SegmentedControl } from '../../../components/ui/SegmentedControl.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { checkWcagCompliance } from '../../../utils/contrast.ts';
import {
  ThemeStyle,
  ThemeMode,
  ThemeDensity,
} from '../../../types/index.ts';
import {
  Palette,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Monitor,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Briefcase,
  Layout,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';

interface ComponentGroupConfig {
  key: string;
  cssVar: string;
  label: string;
  description: string;
}

const componentGroups: ComponentGroupConfig[] = [
  { key: 'radiusButtons', cssVar: '--radius-btn', label: 'Buttons', description: 'Action, icon & trigger buttons' },
  { key: 'radiusInputs', cssVar: '--radius-input', label: 'Inputs & Selects', description: 'Textfields, dropdowns, textareas' },
  { key: 'radiusCards', cssVar: '--radius-card', label: 'Cards & Panels', description: 'Metric widgets, content boxes' },
  { key: 'radiusSidebar', cssVar: '--radius-sidebar', label: 'Sidebar Items', description: 'Navigation links, group headers' },
  { key: 'radiusHeader', cssVar: '--radius-header', label: 'Header Chrome', description: 'Top navbar surface & menus' },
  { key: 'radiusDialogs', cssVar: '--radius-dialog', label: 'Dialogs & Modals', description: 'Overlay modals, prompt sheets' },
  { key: 'radiusTables', cssVar: '--radius-table', label: 'Tables & Grids', description: 'Data grid outer corners' },
  { key: 'radiusBadges', cssVar: '--radius-badge', label: 'Badges & Tags', description: 'Status pills, counter chips' },
  { key: 'radiusTabs', cssVar: '--radius-tab', label: 'Tabs & Segments', description: 'Tab bars, segmented toggles' },
  { key: 'radiusToasts', cssVar: '--radius-toast', label: 'Notification Toasts', description: 'Floating notification alerts' },
  { key: 'radiusImages', cssVar: '--radius-image', label: 'Images & Avatars', description: 'Thumbnails, user avatars' },
  { key: 'radiusControls', cssVar: '--radius-control', label: 'Sliders & Toggles', description: 'Knobs, tracks, switches' },
];

const radiusPresets = [
  { label: 'Sharp', value: '0px', num: 0 },
  { label: 'Small', value: '4px', num: 4 },
  { label: 'Medium', value: '8px', num: 8 },
  { label: 'Large', value: '16px', num: 16 },
  { label: 'Round', value: '24px', num: 24 },
];

export const AppearanceSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Page Title & Breadcrumbs in global header
  usePageTitle('Appearance & Themes', [
    { label: 'Settings', path: '/admin/settings/branding' },
    { label: 'Appearance' },
  ]);

  useHeaderTabs(
    useMemo(
      () => [
        { id: 'branding', label: 'Branding & Identity', icon: <ImageIcon size={14} />, onClick: () => navigate('/admin/settings/branding') },
        { id: 'appearance', label: 'Appearance & Themes', icon: <Palette size={14} />, onClick: () => navigate('/admin/settings/appearance') },
        { id: 'modules', label: 'Module Registry', icon: <Layers size={14} />, onClick: () => navigate('/admin/settings/modules') },
      ],
      [navigate]
    ),
    'appearance'
  );

  const {
    style: activeStyle,
    mode: activeMode,
    resolvedMode,
    density: activeDensity,
    zoom: activeZoom,
    setStyle,
    setMode,
    setDensity,
    setZoom,
    setLivePreviewTokens,
  } = useTheme();

  const { refreshBranding } = useBranding();
  const { showToast } = useToast();
  const { setFormDirty } = usePageHeader();

  const [form, setForm] = useState({
    themeStyle: 'general' as ThemeStyle,
    themeMode: 'light' as ThemeMode,
    densityMode: 'comfortable' as ThemeDensity,
    appZoom: 100,
    allowUserThemeOverride: true,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseFontSize: '16px',
    borderRadius: '4px',
    primaryColor: '#0067b8',
    accentColor: '#d9383a',
    sidebarColor: '#ffffff',
    headerColor: '#ffffff',
    canvasColor: '#f8fafc',

    // Semantic button colors (WCAG AA Compliant >= 4.5:1)
    btnSaveColor: '#047857',
    btnUpdateColor: '#1d4ed8',
    btnCancelColor: '#e2e8f0',
    btnDeleteColor: '#dc2626',

    // Soft UI Settings
    softUiDistance: '18px',
    softUiBlur: '30px',
    softUiIntensity: 1.0,
    softUiLightBg: '#ECF0F3',
    softUiLightShadowDark: '#D1D9E6',
    softUiLightShadowLight: '#FFFFFF',
    softUiDarkBg: '#2F3338',
    softUiDarkShadowDark: '#1E2024',
    softUiDarkShadowLight: '#3F434A',

    // Radius Settings
    radiusGlobal: '4px',
    radiusButtons: '4px',
    radiusInputs: '4px',
    radiusCards: '8px',
    radiusSidebar: '4px',
    radiusHeader: '0px',
    radiusDialogs: '8px',
    radiusTables: '8px',
    radiusBadges: '9999px',
    radiusTabs: '4px',
    radiusToasts: '4px',
    radiusImages: '8px',
    radiusControls: '4px',
  });

  const [followGlobal, setFollowGlobal] = useState<Record<string, boolean>>({
    radiusButtons: true,
    radiusInputs: true,
    radiusCards: false,
    radiusSidebar: true,
    radiusHeader: false,
    radiusDialogs: false,
    radiusTables: false,
    radiusBadges: false,
    radiusTabs: true,
    radiusToasts: true,
    radiusImages: false,
    radiusControls: true,
  });

  const [initialFormState, setInitialFormState] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<'widgets' | 'controls'>('widgets');
  const [sliderDemoVal, setSliderDemoVal] = useState(65);
  const [activeSegment, setActiveSegment] = useState('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contrastResult, setContrastResult] = useState<any>(null);

  // Evaluate form dirtiness
  useEffect(() => {
    if (!initialFormState) return;
    const isDirty = JSON.stringify(form) !== JSON.stringify(initialFormState);
    setFormDirty(isDirty);
  }, [form, initialFormState, setFormDirty]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/appearance');
        if (res.data) {
          const initialMode = activeMode || (localStorage.getItem('app_theme_mode') as ThemeMode) || res.data.themeMode || 'light';
          const initialStyle = activeStyle || (localStorage.getItem('app_theme_style') as ThemeStyle) || res.data.themeStyle || 'general';
          const defaults = getStyleModeDefaults(initialStyle, initialMode);
          const isDark = initialMode === 'dark' || (initialMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

          const loaded = {
            ...form,
            ...res.data,
            themeStyle: initialStyle,
            themeMode: initialMode,
            primaryColor: (isDark && res.data.primaryColor === '#0067b8') ? defaults.primaryColor : (res.data.primaryColor || defaults.primaryColor),
            sidebarColor: (isDark && (res.data.sidebarColor === '#ffffff' || !res.data.sidebarColor)) ? defaults.sidebarColor : (res.data.sidebarColor || defaults.sidebarColor),
            headerColor: (isDark && (res.data.headerColor === '#ffffff' || !res.data.headerColor)) ? defaults.headerColor : (res.data.headerColor || defaults.headerColor),
            canvasColor: (isDark && (res.data.canvasColor === '#f8fafc' || res.data.canvasColor === '#f1f5f9' || !res.data.canvasColor)) ? defaults.canvasColor : (res.data.canvasColor || defaults.canvasColor),
            densityMode: res.data.densityMode || 'comfortable',
            appZoom: Number(res.data.appZoom) || 100,
          };
          setForm(loaded);
          setInitialFormState(loaded);

          const globalVal = res.data.radiusGlobal || '4px';
          const newFollow: Record<string, boolean> = {};
          componentGroups.forEach((g) => {
            newFollow[g.key] = res.data[g.key] === 'follow' || res.data[g.key] === globalVal || res.data[g.key] === undefined;
          });
          setFollowGlobal(newFollow);

          evaluateContrast(loaded.primaryColor, loaded.canvasColor, loaded.themeStyle, loaded.themeMode);
        }
      } catch (err) {
        console.error('Failed to load appearance settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Synchronize form when external mode toggle (e.g. Header moon/sun icon) changes
  useEffect(() => {
    if (resolvedMode && resolvedMode !== form.themeMode) {
      const defaults = getStyleModeDefaults(form.themeStyle, resolvedMode);
      const isDark = resolvedMode === 'dark';
      setForm((prev) => ({
        ...prev,
        themeMode: resolvedMode,
        primaryColor: (isDark && prev.primaryColor === '#0067b8') ? defaults.primaryColor : prev.primaryColor,
        sidebarColor: defaults.sidebarColor,
        headerColor: defaults.headerColor,
        canvasColor: defaults.canvasColor,
      }));
      evaluateContrast(form.primaryColor, defaults.canvasColor, form.themeStyle, resolvedMode);
    }
  }, [resolvedMode]);

  const evaluateContrast = (primary: string, canvas: string, style: ThemeStyle, mode: ThemeMode) => {
    const effectiveDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    let buttonCheck;
    let canvasCheck;

    if (style === 'soft-ui') {
      if (effectiveDark) {
        buttonCheck = checkWcagCompliance('#0F172A', primary, false);
        canvasCheck = checkWcagCompliance('#F7FAFC', form.softUiDarkBg || '#2F3338', false);
      } else {
        buttonCheck = checkWcagCompliance('#FFFFFF', primary, false);
        canvasCheck = checkWcagCompliance('#1A202C', form.softUiLightBg || '#ECF0F3', false);
      }
    } else if (style === 'glassmorphism') {
      if (effectiveDark) {
        buttonCheck = checkWcagCompliance('#0F172A', primary, false);
        canvasCheck = checkWcagCompliance('#F8FAFC', canvas || '#070A12', false);
      } else {
        buttonCheck = checkWcagCompliance('#FFFFFF', primary, false);
        canvasCheck = checkWcagCompliance('#0F172A', canvas || '#EEF2F7', false);
      }
    } else {
      if (effectiveDark) {
        buttonCheck = checkWcagCompliance('#FFFFFF', primary, false);
        canvasCheck = checkWcagCompliance('#F8FAFC', canvas || '#0B1120', false);
      } else {
        buttonCheck = checkWcagCompliance('#FFFFFF', primary, false);
        canvasCheck = checkWcagCompliance('#0F172A', canvas || '#F8FAFC', false);
      }
    }

    setContrastResult({
      buttonCheck,
      canvasCheck,
      isCompliant: buttonCheck.passed && canvasCheck.passed,
    });
  };

  const parsePx = (val: string | undefined): number => {
    if (!val) return 4;
    const num = parseInt(val.replace('px', ''), 10);
    return isNaN(num) ? 4 : Math.min(32, Math.max(0, num));
  };

  const getStyleModeDefaults = (style: ThemeStyle, mode: ThemeMode) => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (style === 'enterprise') {
      return {
        primaryColor: isDark ? '#2563eb' : '#0050aa',
        sidebarColor: isDark ? '#070c18' : '#0f172a',
        headerColor: isDark ? '#162032' : '#ffffff',
        canvasColor: isDark ? '#0a0f1d' : '#f1f5f9',
      };
    } else if (style === 'soft-ui') {
      return {
        primaryColor: isDark ? '#00E5FF' : '#2B6CB0',
        sidebarColor: isDark ? (form.softUiDarkBg || '#2F3338') : (form.softUiLightBg || '#ECF0F3'),
        headerColor: isDark ? (form.softUiDarkBg || '#2F3338') : (form.softUiLightBg || '#ECF0F3'),
        canvasColor: isDark ? (form.softUiDarkBg || '#2F3338') : (form.softUiLightBg || '#ECF0F3'),
      };
    } else if (style === 'glassmorphism') {
      return {
        primaryColor: isDark ? '#818cf8' : '#4f46e5',
        sidebarColor: isDark ? 'rgba(11, 17, 32, 0.72)' : 'rgba(255, 255, 255, 0.62)',
        headerColor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.68)',
        canvasColor: isDark ? '#070a12' : '#eef2f7',
      };
    } else {
      return {
        primaryColor: isDark ? '#38bdf8' : '#0067b8',
        sidebarColor: isDark ? '#0d1527' : '#ffffff',
        headerColor: isDark ? '#1e293b' : '#ffffff',
        canvasColor: isDark ? '#0b1120' : '#f8fafc',
      };
    }
  };

  const pushLivePreview = (updated: typeof form) => {
    const isDark = updated.themeMode === 'dark' || (updated.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const defaults = getStyleModeDefaults(updated.themeStyle, updated.themeMode);

    const surfaceColor = isDark
      ? (updated.themeStyle === 'enterprise'
          ? '#162032'
          : updated.themeStyle === 'soft-ui'
          ? (updated.softUiDarkBg || '#2F3338')
          : updated.themeStyle === 'glassmorphism'
          ? 'rgba(19, 27, 44, 0.68)'
          : '#1e293b')
      : (updated.themeStyle === 'enterprise'
          ? '#ffffff'
          : updated.themeStyle === 'soft-ui'
          ? (updated.softUiLightBg || '#ECF0F3')
          : updated.themeStyle === 'glassmorphism'
          ? 'rgba(255, 255, 255, 0.72)'
          : '#ffffff');

    const tokens: Record<string, string> = {
      '--brand-primary': updated.primaryColor,
      '--brand-accent': updated.accentColor,
      '--btn-save-bg': updated.btnSaveColor,
      '--btn-update-bg': updated.btnUpdateColor,
      '--btn-cancel-bg': updated.btnCancelColor,
      '--btn-delete-bg': updated.btnDeleteColor,
      '--radius-sm': updated.borderRadius,
      '--font-size-base': updated.baseFontSize,
      '--radius-global': updated.radiusGlobal,
      '--soft-distance': updated.softUiDistance,
      '--soft-blur': updated.softUiBlur,
      '--soft-intensity': String(updated.softUiIntensity),
      '--bg-surface': surfaceColor,
      '--bg-canvas': (isDark && (updated.canvasColor === '#ffffff' || updated.canvasColor === '#f8fafc' || updated.canvasColor === '#f1f5f9'))
        ? defaults.canvasColor
        : updated.canvasColor || defaults.canvasColor,
      '--sidebar-bg': (isDark && (updated.sidebarColor === '#ffffff' || !updated.sidebarColor))
        ? defaults.sidebarColor
        : updated.sidebarColor || defaults.sidebarColor,
      '--header-bg': (isDark && (updated.headerColor === '#ffffff' || !updated.headerColor))
        ? defaults.headerColor
        : updated.headerColor || defaults.headerColor,
    };

    componentGroups.forEach((g) => {
      const isFollowing = followGlobal[g.key];
      const rawVal = (updated as any)[g.key];
      tokens[g.cssVar] = isFollowing || rawVal === 'follow' ? updated.radiusGlobal : rawVal || updated.radiusGlobal;
    });

    if (updated.themeStyle === 'soft-ui') {
      if (isDark) {
        tokens['--soft-bg'] = updated.softUiDarkBg || '#2F3338';
        tokens['--soft-shadow-dark'] = updated.softUiDarkShadowDark || '#1E2024';
        tokens['--soft-shadow-light'] = updated.softUiDarkShadowLight || '#3F434A';
        tokens['--bg-canvas'] = updated.softUiDarkBg || '#2F3338';
        tokens['--bg-surface'] = updated.softUiDarkBg || '#2F3338';
      } else {
        tokens['--soft-bg'] = updated.softUiLightBg || '#ECF0F3';
        tokens['--soft-shadow-dark'] = updated.softUiLightShadowDark || '#D1D9E6';
        tokens['--soft-shadow-light'] = updated.softUiLightShadowLight || '#FFFFFF';
        tokens['--bg-canvas'] = updated.softUiLightBg || '#ECF0F3';
        tokens['--bg-surface'] = updated.softUiLightBg || '#ECF0F3';
      }
    } else if (updated.themeStyle === 'glassmorphism') {
      tokens['--glass-blur'] = '18px';
      tokens['--backdrop-filter'] = 'blur(18px) saturate(185%)';
      tokens['--bg-surface'] = surfaceColor;
      tokens['--bg-canvas'] = isDark ? '#070a12' : '#eef2f7';
      tokens['--border-default'] = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.68)';
      tokens['--border-strong'] = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.92)';
      tokens['--glass-card-bg'] = isDark
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(19, 27, 44, 0.68)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.58) 100%)';
      tokens['--glass-shadow-md'] = isDark
        ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.24), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.48)'
        : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.35), 0 8px 32px 0 rgba(31, 38, 135, 0.08)';
    }

    setLivePreviewTokens(tokens);
  };

  // --- Style, Mode, Density, Zoom Change Handlers ---
  const handleStyleSelect = (newStyle: ThemeStyle) => {
    setStyle(newStyle);
    const defaults = getStyleModeDefaults(newStyle, form.themeMode);
    const updated = {
      ...form,
      themeStyle: newStyle,
      primaryColor: defaults.primaryColor,
      sidebarColor: defaults.sidebarColor,
      headerColor: defaults.headerColor,
      canvasColor: defaults.canvasColor,
    };
    setForm(updated);
    pushLivePreview(updated);
    evaluateContrast(updated.primaryColor, updated.canvasColor, newStyle, updated.themeMode);
    showToast(`Style set to ${newStyle.toUpperCase()}`, 'info');
  };

  const handleModeSelect = (newMode: ThemeMode) => {
    setMode(newMode);
    const defaults = getStyleModeDefaults(form.themeStyle, newMode);
    const updated = {
      ...form,
      themeMode: newMode,
      primaryColor: defaults.primaryColor,
      sidebarColor: defaults.sidebarColor,
      headerColor: defaults.headerColor,
      canvasColor: defaults.canvasColor,
    };
    setForm(updated);
    pushLivePreview(updated);
    evaluateContrast(updated.primaryColor, updated.canvasColor, updated.themeStyle, newMode);
    showToast(`Color mode set to ${newMode.toUpperCase()}`, 'info');
  };

  const handleDensitySelect = (newDensity: ThemeDensity) => {
    setDensity(newDensity);
    const updated = { ...form, densityMode: newDensity };
    setForm(updated);
    showToast(`Layout density set to ${newDensity.toUpperCase()}`, 'info');
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(150, Math.max(50, Math.round(newZoom)));
    setZoom(clamped);
    const updated = { ...form, appZoom: clamped };
    setForm(updated);
  };

  const handleGlobalRadiusChange = (newValPx: number) => {
    const pxStr = `${newValPx}px`;
    const updated = {
      ...form,
      radiusGlobal: pxStr,
      borderRadius: pxStr,
    };

    componentGroups.forEach((g) => {
      if (followGlobal[g.key]) {
        (updated as any)[g.key] = pxStr;
      }
    });

    setForm(updated);
    pushLivePreview(updated);
  };

  const handleGroupRadiusChange = (groupKey: string, newValPx: number) => {
    const pxStr = `${newValPx}px`;
    const updated = { ...form, [groupKey]: pxStr };
    setForm(updated);
    pushLivePreview(updated);
  };

  const toggleFollowGlobal = (groupKey: string, checked: boolean) => {
    setFollowGlobal((prev) => ({ ...prev, [groupKey]: checked }));
    if (checked) {
      const updated = { ...form, [groupKey]: form.radiusGlobal };
      setForm(updated);
      pushLivePreview(updated);
    }
  };

  const handleColorFieldChange = (key: string, value: string) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    pushLivePreview(updated);
    evaluateContrast(updated.primaryColor, updated.canvasColor, updated.themeStyle, updated.themeMode);
  };

  const handleSoftUiFieldChange = (key: string, value: any) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    pushLivePreview(updated);
    evaluateContrast(updated.primaryColor, updated.canvasColor, updated.themeStyle, updated.themeMode);
  };

  // --- Save & Reset Actions ---
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const isDark = form.themeMode === 'dark' || (form.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const defaults = getStyleModeDefaults(form.themeStyle, form.themeMode);
      const payload = {
        ...form,
        sidebarColor: (isDark && (form.sidebarColor === '#ffffff' || !form.sidebarColor)) ? defaults.sidebarColor : form.sidebarColor,
        headerColor: (isDark && (form.headerColor === '#ffffff' || !form.headerColor)) ? defaults.headerColor : form.headerColor,
        canvasColor: (isDark && (form.canvasColor === '#f8fafc' || form.canvasColor === '#f1f5f9' || !form.canvasColor)) ? defaults.canvasColor : form.canvasColor,
      };
      componentGroups.forEach((g) => {
        if (followGlobal[g.key]) {
          (payload as any)[g.key] = 'follow';
        }
      });

      const res = await api.put('/settings/appearance', payload);
      setInitialFormState(form);
      setFormDirty(false);
      setLivePreviewTokens(null);

      // Keep ThemeContext fully in sync with saved appearance settings
      setStyle(form.themeStyle);
      setMode(form.themeMode);
      setDensity(form.densityMode);
      setZoom(form.appZoom);

      await refreshBranding();

      if (res.contrastCheck && !res.contrastCheck.isCompliant) {
        showToast(`Saved, with WCAG Notice: ${res.contrastCheck.buttonContrast?.ratio ?? 4.5}:1 ratio`, 'info');
      } else {
        showToast('Appearance tokens and zoom settings saved successfully.', 'success');
      }
    } catch (err: any) {
      const errorMsg = err.details?.map((d: any) => `${d.field}: ${d.message}`).join(', ') || err.message || 'Failed to save appearance settings';
      showToast(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [form, followGlobal, refreshBranding, setDensity, setFormDirty, setLivePreviewTokens, setMode, setStyle, setZoom, showToast]);

  const handleResetStyle = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await api.post(`/settings/appearance/reset-style/${form.themeStyle}`);
      if (res.data) {
        setForm((prev) => ({ ...prev, ...res.data }));
        setStyle(form.themeStyle);
        setLivePreviewTokens(null);
        await refreshBranding();
        showToast(`Reset style ${form.themeStyle.toUpperCase()} to factory defaults.`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reset style defaults', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [form.themeStyle, refreshBranding, setLivePreviewTokens, setStyle, showToast]);

  const handleResetAll = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await api.post('/settings/appearance/reset');
      if (res.data) {
        setForm(res.data);
        setInitialFormState(res.data);
        setStyle(res.data.themeStyle || 'general');
        setMode(res.data.themeMode || 'light');
        setDensity(res.data.densityMode || 'comfortable');
        setZoom(Number(res.data.appZoom) || 100);
        setFormDirty(false);
        setLivePreviewTokens(null);
        evaluateContrast(res.data.primaryColor, res.data.canvasColor, res.data.themeStyle, res.data.themeMode);
        await refreshBranding();
        showToast('Reset entire appearance system to factory defaults.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reset appearance', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [refreshBranding, setDensity, setFormDirty, setLivePreviewTokens, setMode, setStyle, setZoom, showToast]);

  // Register actions into the Global Header with Ctrl+S shortcut!
  usePageActions(
    useMemo(
      () => [
        {
          id: 'reset-all',
          label: 'Reset All',
          variant: 'cancel',
          onClick: handleResetAll,
          disabled: isSaving,
        },
        {
          id: 'reset-style',
          label: `Reset ${form.themeStyle === 'soft-ui' ? 'Soft UI' : form.themeStyle === 'enterprise' ? 'Enterprise' : form.themeStyle === 'glassmorphism' ? 'Glassmorphism' : 'Standard'}`,
          variant: 'secondary',
          icon: <RotateCcw size={14} />,
          onClick: handleResetStyle,
          disabled: isSaving,
        },
        {
          id: 'save-appearance',
          label: 'Save Changes',
          variant: 'save',
          icon: <Save size={14} />,
          shortcut: 'Ctrl+S',
          onClick: handleSave,
          isLoading: isSaving,
        },
      ],
      [handleResetAll, handleResetStyle, handleSave, isSaving, form.themeStyle]
    )
  );

  const isSoftUiActive = form.themeStyle === 'soft-ui';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Real-Time WCAG Contrast Validation Banner */}
      {contrastResult && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-card, 8px)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: contrastResult.isCompliant ? 'var(--status-success)' : 'var(--status-warning)',
            backgroundColor: contrastResult.isCompliant ? 'var(--status-success-bg, rgba(16, 185, 129, 0.1))' : 'var(--status-warning-bg, rgba(245, 158, 11, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: 'var(--soft-raised-sm, var(--shadow-sm))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {contrastResult.isCompliant ? (
              <CheckCircle2 size={20} color="var(--status-success)" />
            ) : (
              <AlertTriangle size={20} color="var(--status-warning)" />
            )}
            <div>
              <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '600', color: 'var(--text-primary)' }}>
                {contrastResult.isCompliant
                  ? 'WCAG AA Passed: High contrast readability verified across all active surfaces'
                  : 'WCAG AA Notice: Contrast ratio falls below recommended 4.5:1 on selected surfaces'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Primary Button: {contrastResult.buttonCheck?.ratio ?? '4.5'}:1 (Min 4.5:1) · Canvas / Text: {contrastResult.canvasCheck?.ratio ?? '12.0'}:1 (Min 4.5:1)
              </div>
            </div>
          </div>

          <Badge variant={contrastResult.isCompliant ? 'success' : 'warning'}>
            {contrastResult.isCompliant ? 'WCAG AA Verified' : 'Adjust Palette'}
          </Badge>
        </div>
      )}

      {/* SECTION 1: THEME STYLES (AXIS 1) */}
      <Card
        title="1. Design Style"
        subtitle="Independent architectural styling: Clean Standard SaaS, Tactile Neumorphism, or Formal Enterprise"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Style 1: General / Standard */}
          <div
            onClick={() => handleStyleSelect('general')}
            style={{
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.themeStyle === 'general' ? 'var(--brand-primary)' : 'var(--border-default)',
              borderRadius: 'var(--radius-card, 8px)',
              padding: '18px',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: form.themeStyle === 'general' ? '0 0 0 1px var(--brand-primary)' : 'var(--shadow-sm)',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layout size={18} color="var(--brand-primary)" />
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Standard SaaS</span>
              </div>
              {form.themeStyle === 'general' && <CheckCircle2 size={18} color="var(--brand-primary)" />}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Crisp modern SaaS look with flat elevated cards, clean borders, and optimal white-label versatility.
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--brand-primary)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--bg-canvas)', border: '1px solid var(--border-default)' }} />
            </div>
          </div>

          {/* Style 2: Soft UI (Neumorphic) */}
          <div
            onClick={() => handleStyleSelect('soft-ui')}
            style={{
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.themeStyle === 'soft-ui' ? 'var(--brand-primary)' : 'var(--border-default)',
              borderRadius: 'var(--radius-card, 8px)',
              padding: '18px',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--soft-raised-sm, 4px 4px 10px rgba(0,0,0,0.1), -4px -4px 10px rgba(255,255,255,0.7))',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--brand-primary)" />
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Soft UI (Neumorphism)</span>
              </div>
              {form.themeStyle === 'soft-ui' && <CheckCircle2 size={18} color="var(--brand-primary)" />}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Dual 135° soft directional shadows, extruded buttons, tactile sliders, and recessed inputs.
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#2B6CB0', boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--bg-surface)', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.2)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#00E5FF' }} />
            </div>
          </div>

          {/* Style 3: Enterprise */}
          <div
            onClick={() => handleStyleSelect('enterprise')}
            style={{
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.themeStyle === 'enterprise' ? 'var(--brand-primary)' : 'var(--border-default)',
              borderRadius: 'var(--radius-card, 8px)',
              padding: '18px',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: form.themeStyle === 'enterprise' ? '0 0 0 1px var(--brand-primary)' : 'var(--shadow-sm)',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="var(--brand-primary)" />
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Enterprise B2B</span>
              </div>
              {form.themeStyle === 'enterprise' && <CheckCircle2 size={18} color="var(--brand-primary)" />}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Formal high-density industrial layout with deep navy sidebar accents and minimal shadow footprint.
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '2px', background: '#0f172a' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '2px', background: '#0050aa' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '2px', background: '#ffffff', border: '1px solid #cbd5e1' }} />
            </div>
          </div>

          {/* Style 4: Glassmorphism */}
          <div
            onClick={() => handleStyleSelect('glassmorphism')}
            style={{
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.themeStyle === 'glassmorphism' ? 'var(--brand-primary)' : 'var(--border-default)',
              borderRadius: 'var(--radius-card, 8px)',
              padding: '18px',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-surface)',
              background: form.themeStyle === 'glassmorphism' ? 'var(--glass-card-hover-bg, var(--bg-surface))' : 'var(--bg-surface)',
              backdropFilter: 'blur(20px) saturate(185%)',
              WebkitBackdropFilter: 'blur(20px) saturate(185%)',
              boxShadow: form.themeStyle === 'glassmorphism'
                ? '0 0 0 1px var(--brand-primary), inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 12px 36px rgba(79, 70, 229, 0.22)'
                : 'var(--shadow-sm)',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--brand-primary)" />
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Glassmorphism UI</span>
              </div>
              {form.themeStyle === 'glassmorphism' && <CheckCircle2 size={18} color="var(--brand-primary)" />}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Frosted liquid acrylic, 18px backdrop blur, specular top rim reflection, luminous depth, and ambient refraction.
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.9), rgba(129, 140, 248, 0.9))', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 2px 6px rgba(79,70,229,0.35)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', border: '1px solid rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: COLOR MODE (AXIS 2) */}
      <Card
        title="2. Color Mode"
        subtitle="One shared dark mode engine adapting every style with 100% surface coverage and zero blinding white containers"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {/* Light Mode */}
          <div
            onClick={() => handleModeSelect('light')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card, 8px)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.themeMode === 'light' ? 'var(--brand-primary)' : 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <Sun size={24} color={form.themeMode === 'light' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Light Mode</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Crisp bright surfaces</div>
            </div>
          </div>

          {/* Dark Mode */}
          <div
            onClick={() => handleModeSelect('dark')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card, 8px)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.themeMode === 'dark' ? 'var(--brand-primary)' : 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <Moon size={24} color={form.themeMode === 'dark' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Dark Mode</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Engineered slate & coal</div>
            </div>
          </div>

          {/* System Mode */}
          <div
            onClick={() => handleModeSelect('system')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card, 8px)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.themeMode === 'system' ? 'var(--brand-primary)' : 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <Monitor size={24} color={form.themeMode === 'system' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Follow System</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto sync with OS</div>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 3: DENSITY MODE (AXIS 3) */}
      <Card
        title="3. Information Density"
        subtitle="Proportional scaling for controls, tables, and sidebar (never dropping readability text below 12px)"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div
            onClick={() => handleDensitySelect('comfortable')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card, 8px)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.densityMode === 'comfortable' ? 'var(--brand-primary)' : 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: '20px', height: '14px', border: '2px solid var(--text-muted)', borderRadius: '2px' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Comfortable (Default)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                40px input heights, generous padding, best for daily touch & desktop operation.
              </div>
            </div>
          </div>

          <div
            onClick={() => handleDensitySelect('compact')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-card, 8px)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: form.densityMode === 'compact' ? 'var(--brand-primary)' : 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: '20px', height: '8px', border: '2px solid var(--text-muted)', borderRadius: '2px' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Compact / Dense</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                32px input heights, 34px data rows, high data density for factories & telemetry.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 4: APPLICATION ZOOM (PERSISTENT PROJECT-WIDE ZOOM) */}
      <Card
        title="4. Persistent Project-Wide Zoom"
        subtitle="Scales the entire user interface proportionally from 50% to 150% without clipping or layout shifts"
      >
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-card, 8px)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Global Viewport Zoom Scale
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Saved globally for all users, restorable instantly in initial HTML head before render
              </p>
            </div>

            {/* Step Controls & Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleZoomChange(form.appZoom - 10)}
                disabled={form.appZoom <= 50}
                leftIcon={<ZoomOut size={14} />}
              >
                -10%
              </Button>

              <div
                style={{
                  minWidth: '64px',
                  textAlign: 'center',
                  padding: '4px 10px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  fontWeight: '700',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                }}
              >
                {form.appZoom}%
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleZoomChange(form.appZoom + 10)}
                disabled={form.appZoom >= 150}
                leftIcon={<ZoomIn size={14} />}
              >
                +10%
              </Button>

              <Button
                variant={form.appZoom === 100 ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleZoomChange(100)}
                disabled={form.appZoom === 100}
                leftIcon={<Maximize2 size={14} />}
              >
                Reset to 100%
              </Button>
            </div>
          </div>

          <Slider
            value={form.appZoom}
            min={50}
            max={150}
            step={5}
            unit="%"
            onChange={handleZoomChange}
          />
        </div>
      </Card>

      {/* SECTION 5: MASTER BORDER RADIUS */}
      <Card
        title="5. Master Border Radius System"
        subtitle="Universal geometry scale (0px to 32px) with quick presets and per-component overrides"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Master Slider & Quick Presets */}
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-card, 8px)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--soft-raised-sm, none)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Global Master Radius
                </span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Governs all components marked as "Follow Global" simultaneously
                </p>
              </div>

              {/* Quick Presets Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {radiusPresets.map((p) => {
                  const isCurrent = form.radiusGlobal === p.value;
                  return (
                    <Button
                      key={p.label}
                      variant={isCurrent ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleGlobalRadiusChange(p.num)}
                    >
                      {p.label} ({p.value})
                    </Button>
                  );
                })}
              </div>
            </div>

            <Slider
              value={parsePx(form.radiusGlobal)}
              min={0}
              max={32}
              step={1}
              unit="px"
              onChange={handleGlobalRadiusChange}
            />
          </div>

          {/* Component Group Overrides Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                Per-Component Group Overrides
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Toggle off "Follow Global" to tailor individual element curvature
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                gap: '14px',
              }}
            >
              {componentGroups.map((g) => {
                const isFollowing = followGlobal[g.key];
                const rawVal = (form as any)[g.key];
                const currentValStr = isFollowing || rawVal === 'follow' ? form.radiusGlobal : (rawVal || form.radiusGlobal);
                const currentValPx = parsePx(currentValStr);

                return (
                  <div
                    key={g.key}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-card, 8px)',
                      border: '1px solid var(--border-default)',
                      boxShadow: 'var(--soft-raised-sm, none)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderTop: '3px solid var(--brand-primary)',
                            borderLeft: '3px solid var(--brand-primary)',
                            borderTopLeftRadius: `${currentValPx}px`,
                            backgroundColor: 'var(--bg-subtle)',
                          }}
                          title={`Outer Corner Radius: ${currentValPx}px`}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {g.label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{g.description}</div>
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isFollowing}
                          onChange={(e) => toggleFollowGlobal(g.key, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ color: isFollowing ? 'var(--brand-primary)' : 'var(--text-muted)', fontWeight: isFollowing ? '600' : '400' }}>
                          Follow Global
                        </span>
                      </label>
                    </div>

                    <Slider
                      value={currentValPx}
                      min={0}
                      max={32}
                      step={1}
                      unit="px"
                      disabled={isFollowing}
                      onChange={(val) => handleGroupRadiusChange(g.key, val)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 6: COLOR CUSTOMIZATION & SEMANTIC BUTTONS */}
      <Card
        title="6. Color Tokens & Semantic Buttons"
        subtitle="Custom brand accents and distinct semantic colors for Save, Update, Cancel, and Delete actions"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Brand & Chrome Colors */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Base & Chrome Tokens
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Primary Brand</span>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => handleColorFieldChange('primaryColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Accent Highlight</span>
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => handleColorFieldChange('accentColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Sidebar BG</span>
                <input
                  type="color"
                  value={form.sidebarColor}
                  onChange={(e) => handleColorFieldChange('sidebarColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Canvas BG</span>
                <input
                  type="color"
                  value={form.canvasColor}
                  onChange={(e) => handleColorFieldChange('canvasColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          {/* Semantic Action Button Colors */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Semantic Action Button Colors
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: form.btnSaveColor }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Save Action</span>
                </div>
                <input
                  type="color"
                  value={form.btnSaveColor}
                  onChange={(e) => handleColorFieldChange('btnSaveColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: form.btnUpdateColor }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Update Action</span>
                </div>
                <input
                  type="color"
                  value={form.btnUpdateColor}
                  onChange={(e) => handleColorFieldChange('btnUpdateColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: form.btnCancelColor }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Cancel Action</span>
                </div>
                <input
                  type="color"
                  value={form.btnCancelColor}
                  onChange={(e) => handleColorFieldChange('btnCancelColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: form.btnDeleteColor }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Delete Action</span>
                </div>
                <input
                  type="color"
                  value={form.btnDeleteColor}
                  onChange={(e) => handleColorFieldChange('btnDeleteColor', e.target.value)}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 7: SOFT UI PARAMETERS (Shown ONLY when themeStyle === 'soft-ui') */}
      {isSoftUiActive && (
        <Card
          title="7. Soft UI Neumorphism Parameters"
          subtitle="Fine-tune dual 135° shadow distance, Gaussian blur diffusion, and extrusion surface colors"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <Slider
                label="Shadow Distance"
                value={parsePx(form.softUiDistance)}
                min={4}
                max={32}
                step={1}
                unit="px"
                onChange={(val) => handleSoftUiFieldChange('softUiDistance', `${val}px`)}
                helperText="Extrusion height of raised surfaces (Default: 18px)"
              />

              <Slider
                label="Shadow Blur"
                value={parsePx(form.softUiBlur)}
                min={10}
                max={60}
                step={1}
                unit="px"
                onChange={(val) => handleSoftUiFieldChange('softUiBlur', `${val}px`)}
                helperText="Gaussian shadow softness diffusion (Default: 30px)"
              />

              <Slider
                label="Shadow Intensity"
                value={Math.round((form.softUiIntensity ?? 1.0) * 100)}
                min={10}
                max={200}
                step={5}
                unit="%"
                onChange={(val) => handleSoftUiFieldChange('softUiIntensity', val / 100)}
                helperText="Tactile depth multiplier (Default: 100%)"
              />
            </div>

            {/* Dual Shadow & Base Surface Color Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Soft UI Light Palette */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-card, 8px)',
                  boxShadow: 'var(--soft-raised-sm, var(--shadow-sm))',
                  border: '1px solid var(--border-default)',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Soft UI Light Surfaces
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base Surface Color</label>
                    <input
                      type="color"
                      value={form.softUiLightBg}
                      onChange={(e) => handleSoftUiFieldChange('softUiLightBg', e.target.value)}
                      style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dark Shadow Tint</label>
                    <input
                      type="color"
                      value={form.softUiLightShadowDark}
                      onChange={(e) => handleSoftUiFieldChange('softUiLightShadowDark', e.target.value)}
                      style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Light Highlight Tint</label>
                    <input
                      type="color"
                      value={form.softUiLightShadowLight}
                      onChange={(e) => handleSoftUiFieldChange('softUiLightShadowLight', e.target.value)}
                      style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Soft UI Dark Palette */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-card, 8px)',
                  boxShadow: 'var(--soft-raised-sm, var(--shadow-sm))',
                  border: '1px solid var(--border-default)',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Soft UI Dark Surfaces
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base Surface Color</label>
                    <input
                      type="color"
                      value={form.softUiDarkBg}
                      onChange={(e) => handleSoftUiFieldChange('softUiDarkBg', e.target.value)}
                      style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dark Shadow Tint</label>
                    <input
                      type="color"
                      value={form.softUiDarkShadowDark}
                      onChange={(e) => handleSoftUiFieldChange('softUiDarkShadowDark', e.target.value)}
                      style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Light Highlight Tint</label>
                    <input
                      type="color"
                      value={form.softUiDarkShadowLight}
                      onChange={(e) => handleSoftUiFieldChange('softUiDarkShadowLight', e.target.value)}
                      style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 8: LIVE INTERACTIVE COMPONENT PREVIEW */}
      <Card
        title="8. Live Interactive Component Sandbox"
        subtitle="Interact with representative UI widgets in real-time as you switch styles, modes, density, and zoom"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <SegmentedControl
              options={[
                { value: 'widgets', label: 'Metric Cards & Actions' },
                { value: 'controls', label: 'Inputs, Form Controls & Tables' },
              ]}
              value={previewTab}
              onChange={(val) => setPreviewTab(val as any)}
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="info">Style: {form.themeStyle}</Badge>
              <Badge variant="neutral">Mode: {resolvedMode}</Badge>
              <Badge variant="success">Density: {form.densityMode}</Badge>
              <Badge variant="warning">Zoom: {form.appZoom}%</Badge>
            </div>
          </div>

          {/* Sandbox Canvas */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-canvas)',
              background: form.themeStyle === 'glassmorphism' ? 'var(--glass-canvas-mesh)' : 'var(--bg-canvas)',
              backgroundAttachment: 'local',
              borderRadius: 'var(--radius-card, 8px)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--soft-inset-sm, inset 0 2px 4px rgba(0,0,0,0.05))',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {previewTab === 'widgets' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Metric Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {/* Metric Card 1 */}
                  <div
                    className="card"
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-card, 8px)',
                      border: '1px solid var(--border-default)',
                      boxShadow: 'var(--soft-raised, var(--shadow-sm))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                        Production Output Rate
                      </span>
                      <Badge variant="success">+18.4%</Badge>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      42,850 Units
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button variant="save" size="sm">
                        Save Batch
                      </Button>
                      <Button variant="update" size="sm">
                        Update Rate
                      </Button>
                      <Button variant="secondary" size="sm">
                        Telemetry
                      </Button>
                    </div>
                  </div>

                  {/* Metric Card 2 */}
                  <div
                    className="card"
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-card, 8px)',
                      border: '1px solid var(--border-default)',
                      boxShadow: 'var(--soft-raised, var(--shadow-sm))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                        Connected Machines
                      </span>
                      <Badge variant="info">Online</Badge>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      128 Units Live
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button variant="outline" size="sm">
                        Inspection
                      </Button>
                      <Button variant="cancel" size="sm">
                        Cancel Job
                      </Button>
                      <Button variant="delete" size="sm">
                        Purge Queue
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Semantic Action Buttons Showcase */}
                <div
                  className="card"
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-card, 8px)',
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--soft-raised-sm, var(--shadow-sm))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Semantic Action Buttons
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Button variant="save">Save Changes</Button>
                    <Button variant="update">Update Record</Button>
                    <Button variant="cancel">Cancel Action</Button>
                    <Button variant="delete">Delete Entry</Button>
                    <Button variant="primary">Primary Action</Button>
                    <Button variant="secondary">Secondary Action</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <Input label="Factory Identifier" defaultValue="CNC-LATHE-LINE-04" />
                  <Select
                    label="Operational State"
                    options={[
                      { value: 'active', label: 'Active Running (Full Speed)' },
                      { value: 'idle', label: 'Standby / Pre-heating' },
                      { value: 'maintenance', label: 'Preventative Inspection' },
                    ]}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Shift Schedule Segment
                  </label>
                  <SegmentedControl
                    options={[
                      { value: 'daily', label: 'Morning Shift' },
                      { value: 'monthly', label: 'Evening Shift' },
                      { value: 'annual', label: 'Night Shift' },
                    ]}
                    value={activeSegment}
                    onChange={setActiveSegment}
                  />
                </div>

                <Slider
                  label="Spindle RPM Velocity Limit"
                  value={sliderDemoVal}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={setSliderDemoVal}
                />

                {/* Sample Table */}
                <div className="advanced-table-wrapper">
                  <div className="advanced-table-scroll-container">
                    <table className="advanced-table">
                      <thead>
                        <tr>
                          <th>Device</th>
                          <th>Status</th>
                          <th>Load</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: '500' }}>Turbine Pump A</td>
                          <td><Badge variant="success">Operational</Badge></td>
                          <td style={{ color: 'var(--text-secondary)' }}>84%</td>
                          <td style={{ textAlign: 'right' }}>
                            <Button variant="update" size="sm">Tune</Button>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: '500' }}>Conveyor Motor B</td>
                          <td><Badge variant="warning">Warning</Badge></td>
                          <td style={{ color: 'var(--text-secondary)' }}>98%</td>
                          <td style={{ textAlign: 'right' }}>
                            <Button variant="delete" size="sm">Halt</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="advanced-table-sticky-footer">
                    <div>Showing 1 to 2 of 2 records</div>
                    <div style={{ fontWeight: 500, color: 'var(--brand-primary)' }}>Live Grid Preview</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Persistent Bottom Floating Action Bar for Instant Save & Reset */}
      <div
        style={{
          position: 'sticky',
          bottom: '20px',
          zIndex: 40,
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-card, 12px)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1))',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: contrastResult?.isCompliant ? 'var(--status-success, #10b981)' : 'var(--status-warning, #f59e0b)',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Active Style:{' '}
            <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {form.themeStyle === 'glassmorphism' ? 'Glassmorphism UI' : form.themeStyle}
            </strong>{' '}
            • Mode: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{form.themeMode}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            type="button"
            variant="cancel"
            size="sm"
            onClick={handleResetAll}
            disabled={isSaving}
          >
            Reset All
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={handleResetStyle}
            disabled={isSaving}
          >
            Reset {form.themeStyle === 'soft-ui' ? 'Soft UI' : form.themeStyle === 'enterprise' ? 'Enterprise' : form.themeStyle === 'glassmorphism' ? 'Glassmorphism' : 'Standard'}
          </Button>
          <Button
            type="button"
            variant="save"
            size="md"
            leftIcon={<Save size={16} />}
            onClick={handleSave}
            isLoading={isSaving}
            style={{ minWidth: '150px', fontWeight: '600' }}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
