import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BrandingProvider } from './context/BrandingContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';

import { PublicLayout } from './components/layout/PublicLayout.tsx';
import { AdminLayout } from './components/layout/AdminLayout.tsx';

import { SetupWizardPage } from './pages/public/SetupWizardPage.tsx';
import { LoginPage } from './pages/public/LoginPage.tsx';
import { DashboardOverviewPage } from './pages/admin/DashboardOverviewPage.tsx';
import { UserListPage } from './pages/admin/users/UserListPage.tsx';
import { RoleListPage } from './pages/admin/roles/RoleListPage.tsx';
import { BrandingSettingsPage } from './pages/admin/settings/BrandingSettingsPage.tsx';
import { AppearanceSettingsPage } from './pages/admin/settings/AppearanceSettingsPage.tsx';
import { ModuleRegistryPage } from './pages/admin/settings/ModuleRegistryPage.tsx';
import { AuditLogsPage } from './pages/admin/audit/AuditLogsPage.tsx';
import { DatabaseManagerPage } from './pages/admin/database/DatabaseManagerPage.tsx';
import { QueryListPage } from './pages/admin/queries/QueryListPage.tsx';
import { QueryDesignerPage } from './pages/admin/queries/QueryDesignerPage.tsx';

export const App: React.FC = () => {
  return (
    <BrandingProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Area Shell */}
                <Route element={<PublicLayout />}>
                  <Route path="/setup" element={<SetupWizardPage />} />
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Protected Enterprise Admin Shell */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardOverviewPage />} />
                  <Route path="users" element={<UserListPage />} />
                  <Route path="roles" element={<RoleListPage />} />
                  <Route path="settings/branding" element={<BrandingSettingsPage />} />
                  <Route path="settings/appearance" element={<AppearanceSettingsPage />} />
                  <Route path="settings/modules" element={<ModuleRegistryPage />} />
                  <Route path="audit" element={<AuditLogsPage />} />
                  <Route path="database" element={<DatabaseManagerPage />} />
                  <Route path="queries" element={<QueryListPage />} />
                  <Route path="queries/new" element={<QueryDesignerPage />} />
                  <Route path="queries/:id" element={<QueryDesignerPage />} />
                </Route>

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrandingProvider>
  );
};
