import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeLabelMap: Record<string, string> = {
    admin: 'Home',
    dashboard: 'Dashboard Overview',
    users: 'User Management',
    roles: 'Roles & Permissions',
    settings: 'Settings',
    branding: 'Branding & Identity',
    appearance: 'Appearance & Themes',
    modules: 'Module Registry',
    audit: 'Audit Trails',
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: 'var(--font-size-xs, 12px)',
        color: 'var(--text-muted)',
        marginBottom: '20px',
      }}
    >
      <Link
        to="/admin/dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
        }}
      >
        <Home size={14} />
      </Link>

      {pathnames.map((name, index) => {
        if (name === 'admin' && pathnames.length > 1) return null;

        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabelMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight size={12} color="var(--border-strong)" />
            {isLast ? (
              <span
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                {label}
              </span>
            ) : (
              <Link to={routeTo} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
