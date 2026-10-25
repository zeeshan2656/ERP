import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api/client.ts';
import { useBranding } from '../../../context/BrandingContext.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { usePageTitle, usePageActions, usePageHeader, useHeaderTabs } from '../../../context/PageHeaderContext.tsx';
import { Upload, Image as ImageIcon, CheckCircle, AlertTriangle, Save, Palette, Layers } from 'lucide-react';

export const BrandingSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { branding, refreshBranding } = useBranding();
  const { showToast } = useToast();
  const { setFormDirty } = usePageHeader();

  usePageTitle('Branding & Identity', [
    { label: 'Settings' },
    { label: 'Branding' },
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
    'branding'
  );

  const [formData, setFormData] = useState({
    productName: '',
    companyName: '',
    tagline: '',
    footerText: '',
    logoLightUrl: '',
    logoDarkUrl: '',
    faviconUrl: '',
    loginBackgroundUrl: '',
  });

  const [initialData, setInitialData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    const data = {
      productName: branding.productName || '',
      companyName: branding.companyName || '',
      tagline: branding.tagline || '',
      footerText: branding.footerText || '',
      logoLightUrl: branding.logoLightUrl || '',
      logoDarkUrl: branding.logoDarkUrl || '',
      faviconUrl: branding.faviconUrl || '',
      loginBackgroundUrl: branding.loginBackgroundUrl || '',
    };
    setFormData(data);
    setInitialData(data);
  }, [branding]);

  useEffect(() => {
    if (!initialData) return;
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
    setFormDirty(isDirty);
  }, [formData, initialData, setFormDirty]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.put('/settings/branding', formData);
      await refreshBranding();
      setInitialData(formData);
      setFormDirty(false);
      showToast('White-label branding settings updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update branding', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  usePageActions([
    {
      id: 'save-branding',
      label: 'Save Branding',
      variant: 'save',
      icon: <Save size={14} />,
      shortcut: 'Ctrl+S',
      onClick: () => handleSave(),
      isLoading: isSubmitting,
    },
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check raster image size for 2x crispness check
    if (!file.name.endsWith('.svg') && file.type.startsWith('image/')) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((res) => (img.onload = res));

      if (img.width < 120 && fieldName.includes('logo')) {
        showToast(
          'Image resolution warning: Raster logo is below 120px wide. For high-DPI screens, please upload at least 2x resolution (240px+) or an SVG vector logo to guarantee maximum sharpness.',
          'warning'
        );
      }
    }

    const uploadPayload = new FormData();
    uploadPayload.append('file', file);
    uploadPayload.append('category', 'branding');

    setUploadingField(fieldName);
    try {
      const res = await api.post('/media/upload', uploadPayload);
      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: res.data.url,
        }));
        showToast(`Asset uploaded to persistent external storage: ${file.name}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Media upload failed', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      <form onSubmit={(e) => handleSave(e)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Core Identity */}
        <Card title="White-Label Identity" subtitle="System product titles, company copyright, and tagline">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <Input
              label="Product Name"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              helperText="Displayed in the top navigation, page titles, and browser tabs"
            />
            <Input
              label="Company Name"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              helperText="Displayed in system footers and administrative headers"
            />
            <Input
              label="Platform Tagline"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              helperText="Subtitle displayed on login screens"
            />
            <Input
              label="Footer Text"
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              helperText="Copyright or attribution line shown at bottom of every page"
            />
          </div>
        </Card>

        {/* Media & Logos */}
        <Card
          title="Brand Assets & External Media"
          subtitle="Files are saved in external persistent storage and never overwritten during software updates"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Logo Light */}
            <div
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '16px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '500', color: 'var(--text-primary)' }}>
                Logo (Light Backgrounds)
              </div>
              <div
                style={{
                  height: '70px',
                  backgroundColor: '#ffffff',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                }}
              >
                {formData.logoLightUrl ? (
                  <img src={formData.logoLightUrl} alt="Logo Light" style={{ maxHeight: '54px', maxWidth: '100%' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No logo uploaded</span>
                )}
              </div>
              <label style={{ display: 'inline-flex' }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'logoLightUrl')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={uploadingField === 'logoLightUrl'}
                  leftIcon={<Upload size={14} />}
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    input?.click();
                  }}
                >
                  Upload Light Logo
                </Button>
              </label>
            </div>

            {/* Logo Dark */}
            <div
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '16px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '500', color: 'var(--text-primary)' }}>
                Logo (Dark Backgrounds)
              </div>
              <div
                style={{
                  height: '70px',
                  backgroundColor: '#0f172a',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                }}
              >
                {formData.logoDarkUrl ? (
                  <img src={formData.logoDarkUrl} alt="Logo Dark" style={{ maxHeight: '54px', maxWidth: '100%' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>No dark logo uploaded</span>
                )}
              </div>
              <label style={{ display: 'inline-flex' }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'logoDarkUrl')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={uploadingField === 'logoDarkUrl'}
                  leftIcon={<Upload size={14} />}
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    input?.click();
                  }}
                >
                  Upload Dark Logo
                </Button>
              </label>
            </div>

            {/* Favicon */}
            <div
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '16px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sm, 14px)', fontWeight: '500', color: 'var(--text-primary)' }}>
                Favicon (32x32 / SVG)
              </div>
              <div
                style={{
                  height: '70px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                }}
              >
                {formData.faviconUrl ? (
                  <img src={formData.faviconUrl} alt="Favicon" style={{ height: '32px', width: '32px' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default icon</span>
                )}
              </div>
              <label style={{ display: 'inline-flex' }}>
                <input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'faviconUrl')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={uploadingField === 'faviconUrl'}
                  leftIcon={<Upload size={14} />}
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    input?.click();
                  }}
                >
                  Upload Favicon
                </Button>
              </label>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
