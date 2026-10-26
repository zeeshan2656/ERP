import React, { useState, useMemo, useCallback } from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBranding } from '../../context/BrandingContext.tsx';
import { PageHeaderProvider } from '../../context/PageHeaderContext.tsx';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';

export interface AdminLayoutOutletContext {
  isFullScreenLayout: boolean;
  setIsFullScreenLayout: (val: boolean) => void;
}

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isInitializing, isSystemInitialized } = useAuth();
  const { branding } = useBranding();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullScreenLayout, setIsFullScreenLayout] = useState(false);
  const [searchParams] = useSearchParams();

  const isFullscreenUrl = searchParams.get('fullscreen') === 'true' || searchParams.get('mode') === 'fullscreen';
  const effectiveFullscreen = isFullScreenLayout || isFullscreenUrl;

  const setFullScreenSafe = useCallback((val: boolean) => {
    setIsFullScreenLayout((prev) => (prev !== val ? val : prev));
  }, []);

  const outletContextValue = useMemo<AdminLayoutOutletContext>(() => ({
    isFullScreenLayout: effectiveFullscreen,
    setIsFullScreenLayout: setFullScreenSafe,
  }), [effectiveFullscreen, setFullScreenSafe]);

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
        className={effectiveFullscreen ? 'admin-fullscreen-shell' : 'admin-layout-root'}
        style={
          effectiveFullscreen
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
                backgroundColor: 'var(--bg-canvas)',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
              }
            : {
                display: 'flex',
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-canvas)',
              }
        }
      >
        {/* Full-height Sidebar (hidden when in Full-Screen Viewport) */}
        {!effectiveFullscreen && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Main Content Area */}
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
          {/* Main Global Header (hidden when in Full-Screen Viewport) */}
          {!effectiveFullscreen && (
            <Header
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          )}

          {/* Page Body Container */}
          <main
            className={effectiveFullscreen ? 'admin-layout-main fullscreen' : 'admin-layout-main'}
            style={
              effectiveFullscreen
                ? {
                    flex: 1,
                    padding: 0,
                    margin: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--bg-canvas)',
                    minHeight: 0,
                    height: '100%',
                    width: '100%',
                  }
                : {
                    flex: 1,
                    padding: '20px 32px 24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--bg-canvas)',
                    minHeight: 0,
                  }
            }
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                width: '100%',
                height: effectiveFullscreen ? '100%' : undefined,
              }}
            >
              <Outlet context={outletContextValue} />
            </div>
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
};
