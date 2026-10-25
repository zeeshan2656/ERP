import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  padding = 'var(--space-6, 24px)',
  style,
  ...props
}) => {
  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--border-default)',
        borderRadius: 'var(--radius-card, var(--radius-lg, 8px))',
        boxShadow: 'var(--soft-raised, var(--shadow-sm))',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...props}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${padding} ${padding} calc(${padding} / 2)`,
            borderBottom: subtitle ? 'none' : '1px solid var(--border-default)',
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: 'var(--font-size-md, 18px)',
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--font-size-sm, 14px)',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding, flex: 1 }}>{children}</div>
    </div>
  );
};
