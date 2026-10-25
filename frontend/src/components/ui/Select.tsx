import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, disabled, style, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: 'var(--font-size-sm, 14px)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'var(--text-primary)',
            }}
          >
            {label}
            {props.required && <span style={{ color: 'var(--status-danger)', marginLeft: '4px' }}>*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          style={{
            width: '100%',
            height: 'var(--density-input-height, 40px)',
            padding: '0 var(--density-padding-x, 14px)',
            fontSize: 'var(--font-size-sm, 14px)',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            backgroundColor: disabled ? 'var(--bg-subtle)' : 'var(--bg-surface)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: error ? 'var(--status-danger)' : 'var(--border-strong)',
            borderRadius: 'var(--radius-input, var(--radius-sm, 4px))',
            boxShadow: 'var(--soft-inset-sm, none)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            ...style,
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--brand-primary)';
              e.currentTarget.style.boxShadow = 'var(--soft-inset-sm, none), 0 0 0 1px var(--brand-primary)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.boxShadow = 'var(--soft-inset-sm, none)';
            }
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {error ? (
          <span style={{ fontSize: 'var(--font-size-xs, 12px)', color: 'var(--status-danger)' }}>
            {error}
          </span>
        ) : helperText ? (
          <span style={{ fontSize: 'var(--font-size-xs, 12px)', color: 'var(--text-muted)' }}>
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
