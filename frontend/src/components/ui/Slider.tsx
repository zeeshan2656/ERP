import React from 'react';

export interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
  helperText?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  helperText,
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm, 14px)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'var(--text-primary)',
            }}
          >
            {label}
          </label>
          <span
            style={{
              fontSize: 'var(--font-size-xs, 12px)',
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'var(--brand-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
            {unit}
          </span>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Visual Inset Track */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '8px',
            borderRadius: 'var(--radius-control, var(--radius-full, 9999px))',
            backgroundColor: 'var(--bg-subtle)',
            boxShadow: 'var(--soft-inset-sm, inset 0 1px 3px rgba(0,0,0,0.2))',
            border: '1px solid var(--border-default)',
            overflow: 'hidden',
          }}
        >
          {/* Active Fill Track */}
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: 'var(--brand-gradient, var(--brand-primary))',
              borderRadius: 'inherit',
              transition: 'width 0.05s ease-out',
            }}
          />
        </div>

        {/* Real Native Range Input layered over with opacity 0 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            margin: 0,
            zIndex: 2,
          }}
        />

        {/* Tactile Soft UI Raised Knob Thumb */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${percentage}% - 10px)`,
            width: '20px',
            height: '20px',
            borderRadius: 'var(--radius-full, 9999px)',
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--soft-raised-sm, var(--shadow-md))',
            border: '2px solid var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'left 0.05s ease-out',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-primary)',
            }}
          />
        </div>
      </div>

      {helperText && (
        <span style={{ fontSize: 'var(--font-size-xs, 12px)', color: 'var(--text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
