import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, disabled, style, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            width: '100%',
          }}
        >
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            style={{
              width: '100%',
              height: 'var(--density-input-height, 40px)',
              paddingLeft: leftIcon ? '38px' : 'var(--density-padding-x, 14px)',
              paddingRight: rightIcon ? '38px' : 'var(--density-padding-x, 14px)',
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
              transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
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
          />

          {rightIcon && (
            <div
              style={{
                position: 'absolute',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>

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

Input.displayName = 'Input';
