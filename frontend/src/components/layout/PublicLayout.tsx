import React from 'react';
import { Outlet } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext.tsx';

export const PublicLayout: React.FC = () => {
  const { branding } = useBranding();

  return (
    <div
      style={{
        minHeight: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Outlet />
      </div>

      <footer
        style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: 'var(--font-size-xs, 12px)',
          color: 'var(--text-muted)',
        }}
      >
        {branding.footerText}
      </footer>
    </div>
  );
};
