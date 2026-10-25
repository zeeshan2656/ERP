import React from 'react';
import {
  Plus,
  Save,
  Edit2,
  Trash2,
  Play,
  FolderOpen,
  Copy,
  RefreshCw,
  Download,
  X,
  Check,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';
import { Button, ButtonProps } from '../ui/Button.tsx';

export type ButtonVariant = NonNullable<ButtonProps['variant']>;
export type ButtonSize = NonNullable<ButtonProps['size']>;

// ==========================================
// 1. STANDARD ACTION PROPS
// ==========================================

export interface BaseActionProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export interface LabeledActionProps extends BaseActionProps {
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export interface IconButtonProps extends BaseActionProps {
  title: string;
  size?: 'sm' | 'md';
  danger?: boolean;
  success?: boolean;
}

// ==========================================
// 2. COMPACT ICON BUTTON (For Rows & Cards)
// ==========================================

export const OperationsIconButton: React.FC<IconButtonProps & { icon: React.ReactNode }> = ({
  icon,
  onClick,
  title,
  disabled = false,
  isLoading = false,
  danger = false,
  success = false,
  style,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  let color = 'var(--text-secondary)';
  let hoverBg = 'var(--bg-hover, rgba(0, 0, 0, 0.05))';

  if (danger) {
    color = isHovered ? 'var(--status-danger, #ef4444)' : 'var(--text-muted)';
    hoverBg = 'rgba(239, 68, 68, 0.12)';
  } else if (success) {
    color = isHovered ? 'var(--status-success, #10b981)' : 'var(--primary-color, #3b82f6)';
    hoverBg = 'rgba(16, 185, 129, 0.12)';
  } else if (isHovered) {
    color = 'var(--text-primary)';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      aria-label={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="operations-icon-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        padding: 0,
        border: 'none',
        borderRadius: 'var(--radius-sm, 4px)',
        backgroundColor: isHovered && !disabled ? hoverBg : 'transparent',
        color: disabled ? 'var(--text-muted)' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
        flexShrink: 0,
        ...style,
      }}
    >
      {isLoading ? <RefreshCw size={12} className="spin-animation" /> : icon}
    </button>
  );
};

// ==========================================
// 3. STANDARDIZED ACTION BUTTONS
// ==========================================

/**
 * Standard "Create / New" Button
 */
export const CreateActionButton: React.FC<LabeledActionProps> = ({
  label = 'Create New',
  onClick,
  disabled,
  isLoading,
  size = 'md',
  variant = 'primary',
  style,
}) => (
  <Button
    variant={variant}
    size={size}
    leftIcon={<Plus size={14} />}
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  >
    {label}
  </Button>
);

/**
 * Standard "Save" Button
 */
export const SaveActionButton: React.FC<LabeledActionProps> = ({
  label = 'Save Changes',
  onClick,
  disabled,
  isLoading,
  size = 'md',
  variant = 'primary',
  style,
}) => (
  <Button
    variant={variant}
    size={size}
    leftIcon={<Save size={14} />}
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  >
    {label}
  </Button>
);

/**
 * Standard "Run" Action (Primary/Success)
 */
export const RunActionButton: React.FC<LabeledActionProps> = ({
  label = 'Run Query',
  onClick,
  disabled,
  isLoading,
  size = 'md',
  variant = 'success',
  style,
}) => (
  <Button
    variant={variant}
    size={size}
    leftIcon={<Play size={14} />}
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  >
    {label}
  </Button>
);

/**
 * Row/Card "Run" Icon Button
 */
export const RunIconButton: React.FC<BaseActionProps & { title?: string }> = ({
  onClick,
  disabled,
  isLoading,
  title = 'Run query and display live results',
  style,
}) => (
  <OperationsIconButton
    icon={<Play size={14} />}
    onClick={onClick}
    title={title}
    disabled={disabled}
    isLoading={isLoading}
    success
    style={style}
  />
);

/**
 * Row/Card "Edit" Icon Button
 */
export const EditIconButton: React.FC<BaseActionProps & { title?: string }> = ({
  onClick,
  disabled,
  isLoading,
  title = 'Edit record',
  style,
}) => (
  <OperationsIconButton
    icon={<Edit2 size={14} />}
    onClick={onClick}
    title={title}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  />
);

/**
 * Row/Card "Delete" Icon Button
 */
export const DeleteIconButton: React.FC<BaseActionProps & { title?: string }> = ({
  onClick,
  disabled,
  isLoading,
  title = 'Delete record',
  style,
}) => (
  <OperationsIconButton
    icon={<Trash2 size={14} />}
    onClick={onClick}
    title={title}
    disabled={disabled}
    isLoading={isLoading}
    danger
    style={style}
  />
);

/**
 * Row/Card "Open / View" Icon Button
 */
export const OpenIconButton: React.FC<BaseActionProps & { title?: string }> = ({
  onClick,
  disabled,
  isLoading,
  title = 'Open in designer',
  style,
}) => (
  <OperationsIconButton
    icon={<FolderOpen size={14} />}
    onClick={onClick}
    title={title}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  />
);

/**
 * Row/Card "Duplicate / Copy" Icon Button
 */
export const CopyIconButton: React.FC<BaseActionProps & { title?: string }> = ({
  onClick,
  disabled,
  isLoading,
  title = 'Duplicate record',
  style,
}) => (
  <OperationsIconButton
    icon={<Copy size={14} />}
    onClick={onClick}
    title={title}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  />
);

/**
 * Standard "Refresh" Button
 */
export const RefreshActionButton: React.FC<LabeledActionProps> = ({
  label = 'Refresh',
  onClick,
  disabled,
  isLoading,
  size = 'md',
  variant = 'outline',
  style,
}) => (
  <Button
    variant={variant}
    size={size}
    leftIcon={<RefreshCw size={14} className={isLoading ? 'spin-animation' : undefined} />}
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  >
    {label}
  </Button>
);

/**
 * Standard "Export" Button
 */
export const ExportActionButton: React.FC<LabeledActionProps> = ({
  label = 'Export',
  onClick,
  disabled,
  isLoading,
  size = 'md',
  variant = 'outline',
  style,
}) => (
  <Button
    variant={variant}
    size={size}
    leftIcon={<Download size={14} />}
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  >
    {label}
  </Button>
);

/**
 * Standard "Cancel" Button
 */
export const CancelActionButton: React.FC<LabeledActionProps> = ({
  label = 'Cancel',
  onClick,
  disabled,
  size = 'md',
  variant = 'outline',
  style,
}) => (
  <Button
    variant={variant}
    size={size}
    leftIcon={<X size={14} />}
    onClick={onClick}
    disabled={disabled}
    style={style}
  >
    {label}
  </Button>
);

/**
 * Standard "Confirm" Button
 */
export const ConfirmActionButton: React.FC<LabeledActionProps & { danger?: boolean }> = ({
  label = 'Confirm',
  onClick,
  disabled,
  isLoading,
  danger = false,
  size = 'md',
  variant = danger ? 'danger' : 'primary',
  style,
}) => (
  <Button
    variant={variant}
    size={size}
    leftIcon={danger ? <Trash2 size={14} /> : <Check size={14} />}
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
    style={style}
  >
    {label}
  </Button>
);
