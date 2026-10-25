import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBranding } from '../../context/BrandingContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import {
  Users,
  ShieldCheck,
  Layers,
  FileText,
  Palette,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Server,
  Database,
} from 'lucide-react';

import { usePageTitle, usePageActions } from '../../context/PageHeaderContext.tsx';

export const DashboardOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const { resolvedMode } = useTheme();
  const navigate = useNavigate();

  usePageTitle('Dashboard Overview');

  usePageActions([
    {
      id: 'customize-theme',
      label: 'Customize Theme',
      variant: 'outline',
      icon: <Palette size={14} />,
      onClick: () => navigate('/admin/settings/appearance'),
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      variant: 'primary',
      icon: <Users size={14} />,
      onClick: () => navigate('/admin/users'),
    },
  ]);

  const [metrics, setMetrics] = useState({
    usersCount: 0,
    rolesCount: 0,
    modulesCount: 0,
    auditCount: 0,
    serverUptime: 0,
  });

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, rolesRes, modulesRes, auditRes, healthRes] = await Promise.all([
          api.get('/users?limit=1'),
          api.get('/roles'),
          api.get('/modules'),
          api.get('/audit-logs?limit=5'),
          api.get('/system/health'),
        ]);

        setMetrics({
          usersCount: usersRes.pagination?.total || 0,
          rolesCount: rolesRes.data?.length || 0,
          modulesCount: modulesRes.data?.filter((m: any) => m.isEnabled).length || 0,
          auditCount: auditRes.pagination?.total || 0,
          serverUptime: (healthRes as any).uptimeSeconds || 0,
        });

        if (auditRes.data) {
          setRecentLogs(auditRes.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner Band */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--border-default)',
          borderRadius: 'var(--radius-lg, 8px)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-primary)',
              }}
            >
              Welcome back, {user?.fullName}
            </span>
            <Badge variant="success">Active Session</Badge>
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-sm, 14px)',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            {branding.productName} enterprise operating environment • Role:{' '}
            <strong>{user?.roleName}</strong>
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-xs, 12px)', color: 'var(--text-muted)', fontWeight: '500' }}>
              REGISTERED USERS
            </span>
            <Users size={18} color="var(--brand-primary)" />
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl, 28px)',
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'var(--text-primary)',
              marginTop: '10px',
            }}
          >
            {isLoading ? '...' : metrics.usersCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--status-success)', marginTop: '4px' }}>
            Active enterprise accounts
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-xs, 12px)', color: 'var(--text-muted)', fontWeight: '500' }}>
              SECURITY ROLES
            </span>
            <ShieldCheck size={18} color="var(--status-info)" />
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl, 28px)',
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'var(--text-primary)',
              marginTop: '10px',
            }}
          >
            {isLoading ? '...' : metrics.rolesCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Granular module RBAC rules
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-xs, 12px)', color: 'var(--text-muted)', fontWeight: '500' }}>
              ACTIVE MODULES
            </span>
            <Layers size={18} color="var(--brand-accent)" />
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl, 28px)',
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'var(--text-primary)',
              marginTop: '10px',
            }}
          >
            {isLoading ? '...' : metrics.modulesCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Registered business modules
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-xs, 12px)', color: 'var(--text-muted)', fontWeight: '500' }}>
              AUDIT TRAIL EVENTS
            </span>
            <FileText size={18} color="var(--status-warning)" />
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-2xl, 28px)',
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'var(--text-primary)',
              marginTop: '10px',
            }}
          >
            {isLoading ? '...' : metrics.auditCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Logged system operations
          </div>
        </Card>
      </div>

      {/* Two-Column Operations Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Quick Action Tiles */}
        <Card title="Quick Management Actions" subtitle="Direct shortcuts to core platform controls">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              onClick={() => navigate('/admin/users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-subtle)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={20} color="var(--brand-primary)" />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '500', color: 'var(--text-primary)' }}>
                    User Accounts
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Add operators, reset credentials, deactivate users
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>

            <div
              onClick={() => navigate('/admin/roles')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-subtle)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={20} color="var(--status-info)" />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Roles & Permissions
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Module-level permissions (View, Add, Edit, Delete)
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>

            <div
              onClick={() => navigate('/admin/settings/branding')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-subtle)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={20} color="var(--brand-accent)" />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Branding & White-Label
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Customize company name, logos, favicon, and login text
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>

            <div
              onClick={() => navigate('/admin/settings/modules')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-subtle)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Layers size={20} color="var(--status-warning)" />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Module Registry
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Enable or disable business modules (e.g. E-Commerce)
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>
          </div>
        </Card>

        {/* Platform Status & Architecture Readiness */}
        <Card title="Architecture & System Health" subtitle="Foundation for Phase 2 low-code engine">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm, 4px)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={18} color="var(--status-success)" />
                <span style={{ fontSize: 'var(--font-size-sm, 14px)', color: 'var(--text-primary)' }}>
                  Database Engine
                </span>
              </div>
              <Badge variant="success">MySQL Pool Connected</Badge>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm, 4px)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={18} color="var(--brand-primary)" />
                <span style={{ fontSize: 'var(--font-size-sm, 14px)', color: 'var(--text-primary)' }}>
                  Active Visual Theme
                </span>
              </div>
              <Badge variant="info">{resolvedMode.toUpperCase()}</Badge>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm, 4px)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="var(--status-success)" />
                <span style={{ fontSize: 'var(--font-size-sm, 14px)', color: 'var(--text-primary)' }}>
                  Media Storage Isolation
                </span>
              </div>
              <Badge variant="neutral">EXTERNAL STORAGE MOUNTED</Badge>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm, 4px)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="var(--status-success)" />
                <span style={{ fontSize: 'var(--font-size-sm, 14px)', color: 'var(--text-primary)' }}>
                  Offline-Sync Readiness
                </span>
              </div>
              <Badge variant="neutral">UUIDs & Versioning Active</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
