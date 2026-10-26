import React from 'react';
import { FormControl, FormControlStyling, BoxAppearancePreset, BorderStyleType, ShadowElevation } from '../types/forms.ts';

/**
 * Computes CSS styles for an input / control element based on its FormControlStyling configuration.
 * Handles Box Appearance presets (Flat, Outlined, Filled, Inset/Recessed, Outset/Raised, Borderless),
 * custom borders, typography, colors, padding, sizing, and interactive states.
 */
export function computeControlStyles(
  ctrl: FormControl,
  state: {
    isFocused?: boolean;
    isHovered?: boolean;
    isDisabled?: boolean;
    isReadOnly?: boolean;
  } = {}
): React.CSSProperties {
  const s: FormControlStyling = ctrl.styling || {};
  const isInput = !['section', 'heading', 'divider', 'spacer', 'button', 'datagrid', 'master_detail'].includes(ctrl.type);
  const isNumberType = ['number', 'currency', 'decimal', 'percentage'].includes(ctrl.type);

  // 1. Base Box Appearance Preset
  let borderStyle: BorderStyleType = s.borderStyle || 'solid';
  let borderWidth: string = s.borderWidth || '1px';
  let borderColor: string = s.borderColor || 'var(--input-border, #64748b)';
  let borderRadius: string = s.borderRadius || 'var(--radius-input, var(--radius-sm, 4px))';
  let bgColor: string = s.bgColor || 'var(--input-bg, var(--surface-1, #ffffff))';
  let textColor: string = s.textColor || 'var(--input-text, var(--text-primary, #0f172a))';
  let boxShadow: string = 'none';

  const appearance: BoxAppearancePreset = s.boxAppearance || 'default';

  switch (appearance) {
    case 'inset':
      // Classic MS Access / Oracle APEX 3D Inset Recessed Look
      borderStyle = s.borderStyle && s.borderStyle !== 'solid' ? s.borderStyle : 'inset';
      borderWidth = s.borderWidth || '2px';
      borderColor = s.borderColor || 'var(--border-strong, #475569)';
      boxShadow = 'inset 1px 1px 3px rgba(0, 0, 0, 0.22)';
      bgColor = s.bgColor || 'var(--input-bg, var(--surface-1, #ffffff))';
      break;

    case 'outset':
      // Classic 3D Outset Raised Look
      borderStyle = s.borderStyle && s.borderStyle !== 'solid' ? s.borderStyle : 'outset';
      borderWidth = s.borderWidth || '2px';
      borderColor = s.borderColor || 'var(--border-strong, #64748b)';
      boxShadow = '1px 2px 4px rgba(0, 0, 0, 0.16)';
      bgColor = s.bgColor || 'var(--surface-1, #f8fafc)';
      break;

    case 'recessed':
      // Modern Inner Shadow Recessed Look
      borderStyle = s.borderStyle || 'solid';
      borderWidth = s.borderWidth || '1px';
      borderColor = s.borderColor || 'var(--border-default, #cbd5e1)';
      boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.12)';
      bgColor = s.bgColor || 'var(--surface-2, rgba(0, 0, 0, 0.03))';
      break;

    case 'raised':
      // Modern Elevated Card / Input Look
      borderStyle = s.borderStyle || 'solid';
      borderWidth = s.borderWidth || '1px';
      borderColor = s.borderColor || 'var(--border-default, #cbd5e1)';
      boxShadow = 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))';
      bgColor = s.bgColor || 'var(--bg-surface, #ffffff)';
      break;

    case 'flat':
      borderStyle = 'none';
      borderWidth = '0px';
      borderColor = 'transparent';
      boxShadow = 'none';
      bgColor = s.bgColor || 'var(--surface-2, rgba(0, 0, 0, 0.05))';
      break;

    case 'outlined':
      borderStyle = s.borderStyle || 'solid';
      borderWidth = s.borderWidth || '1.5px';
      borderColor = s.borderColor || 'var(--brand-primary, #0067b8)';
      bgColor = s.bgColor || 'transparent';
      break;

    case 'filled':
      borderStyle = 'none';
      borderWidth = '0px';
      bgColor = s.bgColor || 'var(--surface-2, rgba(0, 0, 0, 0.06))';
      break;

    case 'borderless':
      borderStyle = 'none';
      borderWidth = '0px';
      borderColor = 'transparent';
      boxShadow = 'none';
      bgColor = 'transparent';
      break;

    case 'default':
    default:
      // Standard low-code input style using theme variables
      borderStyle = s.borderStyle || 'solid';
      borderWidth = s.borderWidth || '1px';
      borderColor = s.borderColor || 'var(--input-border, #64748b)';
      break;
  }

  // 2. Custom Shadow Elevation (overrides preset shadow if explicitly set)
  if (s.shadowElevation) {
    switch (s.shadowElevation) {
      case 'subtle':
        boxShadow = 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))';
        break;
      case 'medium':
        boxShadow = 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))';
        break;
      case 'strong':
        boxShadow = 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.15))';
        break;
      case 'none':
        boxShadow = 'none';
        break;
    }
  }

  // 3. Interactive & Conditional Overrides
  if (state.isDisabled) {
    bgColor = s.disabledBgColor || 'var(--surface-2, rgba(0, 0, 0, 0.06))';
    textColor = s.disabledTextColor || 'var(--text-muted, #94a3b8)';
  } else if (state.isReadOnly) {
    bgColor = s.readOnlyBgColor || 'var(--surface-2, rgba(0, 0, 0, 0.03))';
    textColor = s.readOnlyTextColor || 'var(--input-text, var(--text-primary))';
  } else if (state.isFocused) {
    borderColor = s.focusBorderColor || 'var(--input-border-focus, var(--brand-primary, #0067b8))';
    if (s.focusBgColor) bgColor = s.focusBgColor;
    if (s.focusRingColor) {
      boxShadow = `0 0 0 3px ${s.focusRingColor}`;
    } else if (appearance === 'default' || appearance === 'outlined') {
      boxShadow = '0 0 0 2px rgba(0, 103, 184, 0.18)';
    }
  } else if (state.isHovered) {
    if (s.hoverBorderColor) borderColor = s.hoverBorderColor;
    if (s.hoverBgColor) bgColor = s.hoverBgColor;
  }

  // 4. Dimensions & Sizing
  const width = s.width || (ctrl.width ? ctrl.width : '100%');
  const height = s.height || (ctrl.height ? ctrl.height : undefined);
  const minHeight = s.minHeight || (ctrl.type === 'textarea' ? '64px' : undefined);
  const padding = s.padding || (ctrl.type === 'textarea' ? '8px 10px' : isNumberType && ctrl.type === 'currency' ? '7px 10px 7px 24px' : '7px 10px');

  // 5. Typography
  const textAlign = s.textAlign || (isNumberType ? 'right' : 'left');
  const fontWeight = s.isBold ? 700 : s.fontWeight ? s.fontWeight : 'inherit';
  const fontStyle = s.isItalic ? 'italic' : 'normal';
  const textDecoration = s.isUnderline ? 'underline' : 'none';

  return {
    width,
    height,
    minWidth: s.minWidth || undefined,
    maxWidth: s.maxWidth || undefined,
    minHeight,
    maxHeight: s.maxHeight || undefined,
    margin: s.margin || undefined,
    padding,
    borderStyle,
    borderWidth,
    borderColor,
    borderRadius,
    backgroundColor: bgColor,
    color: textColor,
    boxShadow,
    fontFamily: s.fontFamily || 'inherit',
    fontSize: s.fontSize || '12px',
    fontWeight,
    fontStyle,
    textDecoration,
    textAlign,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
  };
}

/**
 * Computes label styling for a form control.
 */
export function computeLabelStyles(ctrl: FormControl): React.CSSProperties {
  const s = ctrl.styling || {};
  return {
    display: s.labelPosition === 'hidden' ? 'none' : 'block',
    fontSize: s.fontSize ? `calc(${s.fontSize} - 1px)` : '12px',
    fontWeight: 600,
    marginBottom: '4px',
    color: s.textColor ? s.textColor : 'var(--text-primary)',
    fontFamily: s.fontFamily || 'inherit',
  };
}

/**
 * Computes styles for section headers.
 */
export function computeSectionStyles(ctrl: FormControl): {
  containerStyle: React.CSSProperties;
  headingStyle: React.CSSProperties;
} {
  const s = ctrl.styling || {};
  return {
    containerStyle: {
      backgroundColor: s.sectionBgColor || s.bgColor || 'transparent',
      borderBottom: s.sectionBorderColor ? `2px solid ${s.sectionBorderColor}` : '2px solid var(--border-default, #cbd5e1)',
      paddingBottom: '6px',
      marginTop: '8px',
      marginBottom: '4px',
      borderRadius: s.borderRadius || '0px',
      padding: s.padding || undefined,
      width: '100%',
    },
    headingStyle: {
      fontSize: s.fontSize || '15px',
      fontWeight: s.isBold ? 800 : s.fontWeight ? s.fontWeight : 700,
      fontStyle: s.isItalic ? 'italic' : 'normal',
      textDecoration: s.isUnderline ? 'underline' : 'none',
      margin: 0,
      color: s.sectionTextColor || s.textColor || 'var(--text-primary)',
      fontFamily: s.fontFamily || 'inherit',
      textAlign: s.textAlign || 'left',
    },
  };
}

/**
 * Computes styles for button controls.
 */
export function computeButtonStyles(
  ctrl: FormControl,
  state: { isHovered?: boolean; isFocused?: boolean; isDisabled?: boolean } = {}
): React.CSSProperties {
  const s = ctrl.styling || {};
  let bg = s.bgColor || 'var(--brand-primary, #0067b8)';
  let text = s.textColor || '#ffffff';
  let border = s.borderColor ? `${s.borderWidth || '1px'} ${s.borderStyle || 'solid'} ${s.borderColor}` : 'none';

  if (state.isDisabled) {
    bg = s.disabledBgColor || 'var(--surface-2, #cbd5e1)';
    text = s.disabledTextColor || 'var(--text-muted, #94a3b8)';
  } else if (state.isHovered && s.hoverBgColor) {
    bg = s.hoverBgColor;
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: s.padding || '7px 16px',
    fontSize: s.fontSize || '12px',
    fontWeight: s.isBold ? 700 : s.fontWeight ? s.fontWeight : 600,
    fontFamily: s.fontFamily || 'inherit',
    borderRadius: s.borderRadius || 'var(--radius-sm, 4px)',
    backgroundColor: bg,
    color: text,
    border,
    boxShadow: s.shadowElevation ? `var(--shadow-${s.shadowElevation})` : 'none',
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    width: s.width || undefined,
    height: s.height || undefined,
    transition: 'all 0.15s ease',
  };
}

/**
 * Complete reset preset to return an element's styling to pristine theme defaults.
 */
export const RESET_STYLING: FormControlStyling = {
  boxAppearance: 'default',
  shadowElevation: 'none',
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: '',
  borderRadius: '4px',
  bgColor: '',
  textColor: '',
  fontFamily: '',
  fontSize: '12px',
  fontWeight: 'normal',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  textAlign: 'left',
  padding: '',
  margin: '',
  width: '',
  height: '',
  focusBorderColor: '',
  focusBgColor: '',
  focusRingColor: '',
  hoverBorderColor: '',
  hoverBgColor: '',
  disabledBgColor: '',
  disabledTextColor: '',
  readOnlyBgColor: '',
  readOnlyTextColor: '',
  labelPosition: 'above',
  sectionBgColor: '',
  sectionTextColor: '',
  sectionBorderColor: '',
  gridHeaderBg: '',
  gridHeaderTextColor: '',
  gridRowStriped: true,
  gridCellPadding: 'normal',
};
