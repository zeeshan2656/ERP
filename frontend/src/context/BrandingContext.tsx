import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.ts';
import { BrandingConfig } from '../types/index.ts';

interface BrandingContextType {
  branding: BrandingConfig;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const defaultBranding: BrandingConfig = {
  productName: 'Apex Flow',
  companyName: 'Industrial Enterprise Platform',
  tagline: 'High-Performance Low-Code Platform for Modern Enterprises',
  footerText: '© 2026 Apex Flow • Self-Hosted Enterprise Edition',
  logoLightUrl: '',
  logoDarkUrl: '',
  faviconUrl: '',
  loginBackgroundUrl: '',
  themeStyle: 'general',
  themeMode: 'light',
  densityMode: 'comfortable',
  appZoom: 100,
  activeTheme: 'general_light',
  allowUserThemeOverride: true,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  baseFontSize: '16px',
  borderRadius: '4px',
  primaryColor: '#0067b8',
  accentColor: '#d9383a',
  sidebarColor: '#ffffff',
  headerColor: '#ffffff',
  canvasColor: '#f8fafc',
  btnSaveColor: '#16a34a',
  btnUpdateColor: '#2563eb',
  btnCancelColor: '#64748b',
  btnDeleteColor: '#dc2626',
  btnSuccessColor: '#16a34a',
  btnWarningColor: '#d97706',
  btnInfoColor: '#0284c7',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  isLoading: true,
  refreshBranding: async () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const res = await api.get<BrandingConfig>('/system/public-config');
      if (res.data) {
        setBranding(res.data);

        // Update document title and favicon
        document.title = `${res.data.productName} | ${res.data.companyName}`;
        if (res.data.faviconUrl) {
          const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = res.data.faviconUrl;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load branding settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        isLoading,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
