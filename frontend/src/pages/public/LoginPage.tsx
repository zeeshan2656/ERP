import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBranding } from '../../context/BrandingContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { Lock, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isSystemInitialized } = useAuth();
  const { branding } = useBranding();
  const { resolvedMode } = useTheme();
  const { showToast } = useToast();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(emailOrUsername, password);
      showToast('Welcome back! Successfully authenticated.', 'success');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        {resolvedMode === 'dark' && branding.logoDarkUrl ? (
          <img
            src={branding.logoDarkUrl}
            alt={branding.productName}
            style={{ height: '44px', margin: '0 auto 16px' }}
          />
        ) : branding.logoLightUrl ? (
          <img
            src={branding.logoLightUrl}
            alt={branding.productName}
            style={{ height: '44px', margin: '0 auto 16px' }}
          />
        ) : null}

        <h1
          style={{
            fontSize: 'var(--font-size-2xl, 28px)',
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {branding.productName}
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm, 14px)',
            color: 'var(--text-muted)',
            marginTop: '6px',
            lineHeight: 1.4,
          }}
        >
          {branding.tagline}
        </p>
      </div>

      <Card style={{ padding: '32px' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-md, 18px)',
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}
        >
          Sign in to your account
        </h2>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--status-danger)',
              borderRadius: 'var(--radius-sm, 4px)',
              fontSize: 'var(--font-size-sm, 14px)',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Username or Email"
            required
            autoFocus
            autoComplete="username"
            placeholder="admin or user@factory.local"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            leftIcon={<User size={16} />}
          />

          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ marginTop: '8px' }}>
            Sign In
          </Button>
        </form>

        {isSystemInitialized === false && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-default)',
              textAlign: 'center',
              fontSize: 'var(--font-size-xs, 12px)',
              color: 'var(--text-muted)',
            }}
          >
            System is not yet initialized.{' '}
            <Link to="/setup" style={{ fontWeight: '600' }}>
              Launch Setup Wizard
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
