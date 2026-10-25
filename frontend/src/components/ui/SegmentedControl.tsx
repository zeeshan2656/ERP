import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-control, var(--radius-sm, 4px))',
        boxShadow: 'var(--soft-inset-sm, inset 0 1px 2px rgba(0, 0, 0, 0.1))',
        border: '1px solid var(--border-default)',
        gap: '4px',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: size === 'sm' ? '4px 10px' : '6px 14px',
              fontSize: size === 'sm' ? 'var(--font-size-xs, 12px)' : 'var(--font-size-sm, 14px)',
              fontWeight: isSelected ? 'var(--font-weight-semibold, 600)' : 'var(--font-weight-medium, 500)',
              color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
              backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
              borderRadius: 'var(--radius-tab, calc(var(--radius-control, var(--radius-sm, 4px)) - 2px))',
              border: isSelected ? '1px solid var(--border-default)' : '1px solid transparent',
              boxShadow: isSelected ? 'var(--soft-raised-sm, var(--shadow-sm))' : 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)',
              userSelect: 'none',
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
