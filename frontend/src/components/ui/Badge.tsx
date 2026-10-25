import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  style,
  ...props
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--status-success-bg, #dcfce7)',
          color: 'var(--status-success-text, var(--status-success, #15803d))',
          borderColor: 'var(--status-success, #15803d)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--status-warning-bg, #fef3c7)',
          color: 'var(--status-warning-text, var(--status-warning, #b45309))',
          borderColor: 'var(--status-warning, #b45309)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--status-danger-bg, #fee2e2)',
          color: 'var(--status-danger-text, var(--status-danger, #b91c1c))',
          borderColor: 'var(--status-danger, #b91c1c)',
        };
      case 'info':
        return {
          backgroundColor: 'var(--status-info-bg, #e0f2fe)',
          color: 'var(--status-info-text, var(--status-info, #0284c7))',
          borderColor: 'var(--status-info, #0284c7)',
        };
      case 'neutral':
      default:
        return {
          backgroundColor: 'var(--surface-2, var(--bg-subtle))',
          color: 'var(--text-secondary)',
          borderColor: 'var(--border-strong)',
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: 'var(--font-size-xs, 12px)',
        fontWeight: 'var(--font-weight-medium, 500)',
        borderRadius: 'var(--radius-badge, var(--radius-full, 9999px))',
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: 'var(--soft-raised-sm, none)',
        lineHeight: 1.2,
        ...colors,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
