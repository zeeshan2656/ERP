import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBranding } from '../../context/BrandingContext.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { Sparkles, Shield, Building2 } from 'lucide-react';

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkSetupStatus, refreshUserProfile } = useAuth();
  const { refreshBranding } = useBranding();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productName: 'Apex Flow',
    companyName: 'Acme Factory Systems',
    tagline: 'Agile Low-Code Operating System for Industrial Excellence',
    themePreset: 'soft_light' as 'soft_light' | 'enterprise' | 'dark' | 'compact',
    adminUsername: 'admin',
    adminEmail: 'admin@factory.local',
    adminFullName: 'System Administrator',
    adminPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const stepErrors: Record<string, string> = {};
    if (!formData.productName.trim()) stepErrors.productName = 'Product name is required';
    if (!formData.companyName.trim()) stepErrors.companyName = 'Company name is required';

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitErrors: Record<string, string> = {};

    if (!formData.adminUsername.trim()) submitErrors.adminUsername = 'Username is required';
    if (!formData.adminEmail.trim()) submitErrors.adminEmail = 'Email is required';
    if (!formData.adminFullName.trim()) submitErrors.adminFullName = 'Full name is required';
    if (formData.adminPassword.length < 8) {
      submitErrors.adminPassword = 'Password must be at least 8 characters';
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      submitErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(submitErrors).length > 0) {
      setErrors(submitErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await api.post('/system/setup', {
        productName: formData.productName,
        companyName: formData.companyName,
        tagline: formData.tagline,
        themePreset: formData.themePreset,
        adminUsername: formData.adminUsername,
        adminEmail: formData.adminEmail,
        adminFullName: formData.adminFullName,
        adminPassword: formData.adminPassword,
      });

      if (res.data) {
        api.setTokens(res.data.accessToken, res.data.refreshToken);
        await refreshBranding();
        await checkSetupStatus();
        await refreshUserProfile();

        showToast('Platform setup completed successfully! Welcome to your dashboard.', 'success');
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Setup initialization failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '520px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md, 6px)',
            backgroundColor: 'var(--brand-primary)',
            color: '#ffffff',
            marginBottom: '16px',
          }}
        >
          <Sparkles size={24} />
        </div>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl, 28px)',
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Initial Setup Wizard
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm, 14px)',
            color: 'var(--text-muted)',
            marginTop: '6px',
          }}
        >
          Configure your enterprise white-label identity and initialize the Super Admin account.
        </p>
      </div>

      <Card style={{ padding: '32px' }}>
        {/* Step Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: step === 1 ? 'var(--brand-primary)' : 'var(--status-success)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              1
            </div>
            <span
              style={{
                fontSize: 'var(--font-size-sm, 14px)',
                fontWeight: step === 1 ? '600' : '500',
                color: 'var(--text-primary)',
              }}
            >
              Branding & Identity
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: step === 2 ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                color: step === 2 ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              2
            </div>
            <span
              style={{
                fontSize: 'var(--font-size-sm, 14px)',
                fontWeight: step === 2 ? '600' : '500',
                color: step === 2 ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              Super Admin Setup
            </span>
          </div>
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input
              label="Product Name"
              required
              placeholder="e.g. Apex Flow"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              error={errors.productName}
              helperText="The white-label application name displayed throughout the portal"
            />

            <Input
              label="Company / Enterprise Name"
              required
              placeholder="e.g. Acme Industrial Ltd"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              error={errors.companyName}
              leftIcon={<Building2 size={16} />}
            />

            <Input
              label="Platform Tagline"
              placeholder="e.g. Industrial Low-Code OS"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            />

            <Select
              label="Initial Visual Theme"
              value={formData.themePreset}
              onChange={(e) => setFormData({ ...formData, themePreset: e.target.value as any })}
              options={[
                { value: 'soft_light', label: 'Soft Light UI (Modern Default SaaS)' },
                { value: 'enterprise', label: 'Enterprise UI (Deep Navy Zoho Sidebar)' },
                { value: 'dark', label: 'Complete Dark UI (Engineered Slate)' },
                { value: 'compact', label: 'Compact / Dense UI (Factory Data Grids)' },
              ]}
              helperText="You can customize colors, fonts, and tokens anytime from Settings."
            />

            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              style={{ marginTop: '12px', width: '100%' }}
            >
              Next: Configure Admin Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Admin Full Name"
              required
              placeholder="e.g. Jane Doe"
              value={formData.adminFullName}
              onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
              error={errors.adminFullName}
            />

            <Input
              label="Admin Username"
              required
              placeholder="e.g. admin"
              value={formData.adminUsername}
              onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
              error={errors.adminUsername}
            />

            <Input
              label="Admin Email Address"
              type="email"
              required
              placeholder="e.g. admin@factory.local"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              error={errors.adminEmail}
            />

            <Input
              label="Admin Password"
              type="password"
              required
              placeholder="At least 8 characters"
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              error={errors.adminPassword}
              leftIcon={<Shield size={16} />}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                Back
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} style={{ flex: 1 }}>
                Initialize & Launch Platform
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
