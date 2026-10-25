import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'save' | 'update' | 'cancel' | 'delete' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--brand-primary)',
          color: 'var(--brand-primary-text)',
          borderColor: 'var(--brand-primary)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-strong)',
        };
      case 'danger':
      case 'delete':
        return {
          backgroundColor: 'var(--btn-delete-bg, #dc2626)',
          color: 'var(--btn-delete-text, #ffffff)',
          borderColor: 'var(--btn-delete-bg, #dc2626)',
        };
      case 'save':
        return {
          backgroundColor: 'var(--btn-save-bg, #047857)',
          color: 'var(--btn-save-text, #ffffff)',
          borderColor: 'var(--btn-save-bg, #047857)',
        };
      case 'update':
        return {
          backgroundColor: 'var(--btn-update-bg, #1d4ed8)',
          color: 'var(--btn-update-text, #ffffff)',
          borderColor: 'var(--btn-update-bg, #1d4ed8)',
        };
      case 'cancel':
        return {
          backgroundColor: 'var(--btn-cancel-bg, var(--surface-2))',
          color: 'var(--btn-cancel-text, var(--text-primary))',
          borderColor: 'var(--btn-cancel-border, var(--border-strong))',
        };
      case 'success':
        return {
          backgroundColor: 'var(--status-success, #10b981)',
          color: '#ffffff',
          borderColor: 'var(--status-success, #10b981)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--status-warning, #f59e0b)',
          color: '#0f172a',
          borderColor: 'var(--status-warning, #f59e0b)',
        };
      case 'info':
        return {
          backgroundColor: 'var(--status-info, #0ea5e9)',
          color: 'var(--brand-primary-text, #ffffff)',
          borderColor: 'var(--status-info, #0ea5e9)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-strong)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: 'var(--surface-2)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-default)',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          height: 'var(--density-input-height, 32px)',
          padding: '0 12px',
          fontSize: 'var(--font-size-sm, 14px)',
        };
      case 'lg':
        return {
          height: '48px',
          padding: '0 24px',
          fontSize: 'var(--font-size-base, 16px)',
        };
      case 'md':
      default:
        return {
          height: 'var(--density-input-height, 40px)',
          padding: '0 16px',
          fontSize: 'var(--font-size-sm, 14px)',
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-btn, var(--radius-sm, 4px))',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: variant === 'ghost' ? 'none' : 'var(--soft-raised-sm, var(--shadow-sm))',
    fontWeight: 'var(--font-weight-medium, 500)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transition: 'background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), transform 0.05s ease',
    ...getSizeStyles(),
    ...getVariantStyles(),
    ...style,
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={baseStyles}
      className={`btn-interactive ${className}`}
      onMouseDown={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.boxShadow = 'var(--soft-inset-sm, inset 0 2px 4px rgba(0,0,0,0.15))';
          e.currentTarget.style.transform = 'translateY(1px)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.boxShadow = variant === 'ghost' ? 'none' : 'var(--soft-raised-sm, var(--shadow-sm))';
          e.currentTarget.style.transform = 'translateY(0px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.boxShadow = variant === 'ghost' ? 'none' : 'var(--soft-raised-sm, var(--shadow-sm))';
          e.currentTarget.style.transform = 'translateY(0px)';
        }
      }}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
