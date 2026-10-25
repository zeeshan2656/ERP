import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBranding } from '../../context/BrandingContext.tsx';
import { PageHeaderProvider } from '../../context/PageHeaderContext.tsx';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isInitializing, isSystemInitialized } = useAuth();
  const { branding } = useBranding();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-muted)',
          fontSize: 'var(--font-size-sm, 14px)',
        }}
      >
        Initializing application session...
      </div>
    );
  }

  // Redirect to setup wizard if system has not been initialized
  if (isSystemInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  // Redirect to login if user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PageHeaderProvider>
      <div
        className="admin-layout-root"
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
        {/* Full-height Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area (Header at top, scrollable main content below) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* Main Global Header */}
          <Header
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          {/* Scrollable Page Body */}
          <main
            className="admin-layout-main"
            style={{
              flex: 1,
              padding: '20px 32px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-canvas)',
              minHeight: 0,
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
};
