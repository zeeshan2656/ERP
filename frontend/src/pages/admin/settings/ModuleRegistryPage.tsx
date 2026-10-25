import React, { useEffect, useState } from 'react';
import { api } from '../../../api/client.ts';
import { Card } from '../../../components/ui/Card.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { ModuleItem } from '../../../types/index.ts';
import {
  Layers,
  ShoppingBag,
  Database,
  Printer,
  Users,
  ShieldCheck,
  Sparkles,
  Palette,
  FileText,
  LucideIcon,
} from 'lucide-react';

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
};

import { useNavigate } from 'react-router-dom';
import { usePageTitle, usePageActions, useHeaderTabs } from '../../../context/PageHeaderContext.tsx';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';

export const ModuleRegistryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  usePageTitle('Module Registry', [
    { label: 'Settings' },
    { label: 'Modules' },
  ]);

  useHeaderTabs(
    React.useMemo(
      () => [
        { id: 'branding', label: 'Branding & Identity', icon: <ImageIcon size={14} />, onClick: () => navigate('/admin/settings/branding') },
        { id: 'appearance', label: 'Appearance & Themes', icon: <Palette size={14} />, onClick: () => navigate('/admin/settings/appearance') },
        { id: 'modules', label: 'Module Registry', icon: <Layers size={14} />, onClick: () => navigate('/admin/settings/modules') },
      ],
      [navigate]
    ),
    'modules'
  );

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ModuleItem[]>('/modules');
      if (res.data) {
        setModules(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch modules', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  usePageActions([
    {
      id: 'refresh-modules',
      label: 'Refresh Registry',
      variant: 'outline',
      icon: <RefreshCw size={14} />,
      onClick: fetchModules,
      isLoading,
    },
  ]);

  const handleToggle = async (module: ModuleItem) => {
    if (module.isCore) {
      showToast('Core modules are essential for platform operation and cannot be disabled.', 'warning');
      return;
    }

    setTogglingKey(module.moduleKey);
    const newStatus = !module.isEnabled;

    try {
      await api.put(`/modules/${module.moduleKey}/toggle`, { isEnabled: newStatus });
      setModules((prev) =>
        prev.map((m) => (m.moduleKey === module.moduleKey ? { ...m, isEnabled: newStatus } : m))
      );
      showToast(
        `Module '${module.name}' has been ${newStatus ? 'enabled' : 'disabled'}. Navigation menu updated.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle module', 'error');
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      <Card title="Registered System & Business Modules" subtitle="Enable or disable functional business modules seamlessly">
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading module registry...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {modules.map((mod) => {
              const Icon = iconMap[mod.iconName] || Layers;
              const isToggling = togglingKey === mod.moduleKey;

              return (
                <div
                  key={mod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-sm, 4px)',
                    backgroundColor: 'var(--bg-subtle)',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: mod.isEnabled ? 'var(--brand-primary)' : 'var(--text-muted)',
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm, 14px)',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {mod.name}
                        </span>
                        {mod.isCore ? (
                          <Badge variant="neutral">Core System</Badge>
                        ) : (
                          <Badge variant={mod.isEnabled ? 'success' : 'neutral'}>
                            {mod.isEnabled ? 'Enabled' : 'Disabled (Off)'}
                          </Badge>
                        )}
                        {mod.moduleKey === 'e_commerce' && <Badge variant="warning">Phase 1 Placeholder</Badge>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {mod.description || `Module key: ${mod.moduleKey} • Route: ${mod.routePath}`}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Control */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '44px',
                        height: '24px',
                        cursor: mod.isCore ? 'not-allowed' : 'pointer',
                        opacity: mod.isCore ? 0.6 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={mod.isEnabled}
                        disabled={mod.isCore || isToggling}
                        onChange={() => handleToggle(mod)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          cursor: mod.isCore ? 'not-allowed' : 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: mod.isEnabled ? 'var(--brand-primary)' : 'var(--border-strong)',
                          transition: 'var(--transition-fast)',
                          borderRadius: '24px',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: '18px',
                            width: '18px',
                            left: mod.isEnabled ? '23px' : '3px',
                            bottom: '3px',
                            backgroundColor: '#ffffff',
                            transition: 'var(--transition-fast)',
                            borderRadius: '50%',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
