import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Sparkles,
  Palette,
  Layers,
  FileText,
  ShoppingBag,
  Database,
  Printer,
  LayoutDashboard,
  Sliders,
  LogOut,
  ChevronRight,
  ChevronDown,
  LucideIcon,
  Box,
  GitMerge,
  LayoutTemplate,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBranding } from '../../context/BrandingContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { ModuleItem } from '../../types/index.ts';

const iconMap: Record<string, LucideIcon> = {
  Users,
  ShieldCheck,
  Sparkles,
  Palette,
  Layers,
  FileText,
  ShoppingBag,
  Database,
  Printer,
  LayoutDashboard,
  GitMerge,
  LayoutTemplate,
};

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user, logout, hasPermission } = useAuth();
  const { branding } = useBranding();
  const { resolvedMode } = useTheme();
  const navigate = useNavigate();

  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await api.get<ModuleItem[]>('/modules');
        if (res.data) {
          setModules(res.data.filter((m) => m.isEnabled));
        }
      } catch (err) {
        console.error('Failed to load registered modules:', err);
      }
    };
    fetchModules();
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Filter modules user has permission to view
  const authorizedModules = modules.filter((m) => {
    return hasPermission(m.permissionKey, 'view');
  });

  const mainModules = authorizedModules.filter((m) => m.category === 'main');
  const systemModules = authorizedModules.filter((m) => m.category === 'system');
  const otherModules = authorizedModules.filter((m) => m.category !== 'main' && m.category !== 'system');

  const logoUrl = resolvedMode === 'dark' && branding.logoDarkUrl ? branding.logoDarkUrl : branding.logoLightUrl;

  const renderNavGroup = (title: string, items: ModuleItem[]) => {
    if (items.length === 0) return null;

    return (
      <div style={{ marginBottom: '16px' }}>
        {!isCollapsed && (
          <div
            style={{
              padding: '0 16px 6px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--sidebar-muted, var(--text-muted))',
              opacity: 0.9,
            }}
          >
            {title}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map((item) => {
            const Icon = iconMap[item.iconName] || Layers;
            return (
              <NavLink
                key={item.id}
                to={item.routePath}
                title={isCollapsed ? item.name : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isCollapsed ? '10px' : '9px 16px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sidebar, var(--radius-sm, 4px))',
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-sm, 14px)',
                  fontWeight: isActive ? 'var(--font-weight-semibold, 600)' : 'var(--font-weight-medium, 500)',
                  color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  boxShadow: isActive ? 'var(--soft-inset-sm, none)' : 'none',
                  border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)',
                })}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width, 72px)' : 'var(--sidebar-width, 260px)',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        zIndex: 40,
        transition: 'width var(--transition-fast)',
        userSelect: 'none',
      }}
    >
      {/* Top Brand Identity Section */}
      <div
        style={{
          height: 'var(--header-height, 64px)',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          padding: isCollapsed ? '0 12px' : '0 18px',
          gap: '12px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          flexShrink: 0,
          backgroundColor: 'var(--sidebar-bg)',
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={branding.productName}
            style={{
              height: '32px',
              maxWidth: isCollapsed ? '36px' : '120px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--brand-primary-text, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '15px',
              flexShrink: 0,
            }}
          >
            {branding.productName ? branding.productName.charAt(0) : <Box size={18} />}
          </div>
        )}

        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: '600',
                color: 'var(--sidebar-text)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {branding.productName || 'Apex Flow'}
            </span>
            {branding.companyName && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--sidebar-muted, var(--text-muted))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {branding.companyName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Middle Navigation - Scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Dashboard Overview */}
        <div style={{ marginBottom: '14px' }}>
          <NavLink
            to="/admin/dashboard"
            title={isCollapsed ? 'Overview' : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isCollapsed ? '10px' : '9px 16px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-sidebar, var(--radius-sm, 4px))',
              textDecoration: 'none',
              fontSize: 'var(--font-size-sm, 14px)',
              fontWeight: isActive ? 'var(--font-weight-semibold, 600)' : 'var(--font-weight-medium, 500)',
              color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
              boxShadow: isActive ? 'var(--soft-inset-sm, none)' : 'none',
              border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
              transition: 'all var(--transition-fast)',
            })}
          >
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>Dashboard Overview</span>}
          </NavLink>
        </div>

        {/* Dynamic Module Nav Groups */}
        {renderNavGroup('Operations', mainModules)}
        {renderNavGroup('System & Security', systemModules)}
        {renderNavGroup('Platform Modules', otherModules)}
      </div>

      {/* Bottom Administrator Profile Section */}
      {user && (
        <div
          ref={userMenuRef}
          style={{
            position: 'relative',
            borderTop: '1px solid var(--sidebar-border)',
            padding: '10px 8px',
            flexShrink: 0,
            backgroundColor: 'var(--sidebar-bg)',
          }}
        >
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: isCollapsed ? '6px 0' : '6px 10px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-sidebar, 6px)',
              background: isUserMenuOpen ? 'var(--bg-subtle)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--sidebar-text)',
              textAlign: 'left',
              transition: 'background var(--transition-fast)',
            }}
            title={isCollapsed ? `${user.fullName} (${user.roleName})` : undefined}
          >
            {/* User Initials Avatar */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-full, 9999px)',
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-primary-text, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '13px',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AD'}
            </div>

            {!isCollapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm, 13px)',
                      fontWeight: '600',
                      color: 'var(--sidebar-text)',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.fullName}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--sidebar-muted, var(--text-muted))',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {user.roleName || 'Administrator'}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--sidebar-muted, var(--text-muted))',
                    transform: isUserMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--transition-fast)',
                  }}
                />
              </>
            )}
          </button>

          {/* User Profile Popup Menu */}
          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                left: isCollapsed ? 'calc(100% + 8px)' : '8px',
                right: isCollapsed ? 'auto' : '8px',
                bottom: 'calc(100% + 8px)',
                width: isCollapsed ? '210px' : 'auto',
                backgroundColor: 'var(--bg-surface)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-strong)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.25))',
                padding: '6px 0',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {user.fullName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  @{user.username} · {user.roleName}
                </div>
              </div>

              <div
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/admin/settings/appearance');
                }}
                style={{
                  padding: '9px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: 'var(--font-size-sm, 13px)',
                  color: 'var(--text-primary)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Sliders size={15} style={{ color: 'var(--text-muted)' }} />
                <span>Appearance & Themes</span>
              </div>

              <div
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                style={{
                  padding: '9px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: 'var(--font-size-sm, 13px)',
                  color: 'var(--status-danger)',
                  borderTop: '1px solid var(--border-default)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
