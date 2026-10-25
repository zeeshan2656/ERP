import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

export interface OperationsCardProps {
  id: string | number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  headerIcon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  description?: React.ReactNode;
  metadata?: Array<{ label: string; value: React.ReactNode }>;
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standard Reusable Card Component for Operations Modules in Card View
 * Follows enterprise styling with theme tokens, selection highlight, metadata layout, and action footer.
 */
export const OperationsCard: React.FC<OperationsCardProps> = ({
  isSelected = false,
  onToggleSelect,
  headerIcon,
  title,
  subtitle,
  badge,
  description,
  metadata,
  tags,
  actions,
  onClick,
  style,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-card, 8px)',
        border: isSelected
          ? '1.5px solid var(--brand-primary, #3b82f6)'
          : isHovered
          ? '1px solid var(--border-hover, #94a3b8)'
          : '1px solid var(--border-default)',
        backgroundColor: isSelected
          ? 'var(--bg-selected, rgba(59, 130, 246, 0.04))'
          : 'var(--bg-surface)',
        padding: '16px',
        boxShadow: isSelected
          ? '0 0 0 1px var(--brand-primary, #3b82f6), var(--shadow-sm)'
          : isHovered
          ? 'var(--shadow-md)'
          : 'var(--shadow-xs, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        transition: 'all 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        minHeight: '190px',
        gap: '12px',
        ...style,
      }}
    >
      {/* 1. Card Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: isSelected ? 'var(--brand-primary, #3b82f6)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                title={isSelected ? 'Deselect record' : 'Select record'}
              >
                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            )}

            {headerIcon && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                {headerIcon}
              </div>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: 'monospace',
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
        </div>

        {/* 2. Card Description */}
        {description && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              marginBottom: '8px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '34px',
            }}
          >
            {description}
          </div>
        )}

        {/* 3. Tags / Chips */}
        {tags && <div style={{ marginBottom: '8px' }}>{tags}</div>}

        {/* 4. Metadata List */}
        {metadata && metadata.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '11px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '8px',
              marginTop: '4px',
            }}
          >
            {metadata.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Card Footer: Actions */}
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '10px',
            marginTop: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
