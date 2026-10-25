import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button.tsx';

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Enterprise Operations Error Boundary
 * Prevents any runtime exceptions in Operations modules from crashing the application into a blank screen.
 * Displays diagnostic details, recovery actions, and theme-aware styling.
 */
export class OperationsErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OperationsErrorBoundary caught an unhandled render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  public render() {
    if (this.state.hasError) {
      const moduleTitle = this.props.moduleName || 'Operations Module';
      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '32px 20px',
            width: '100%',
          }}
        >
          <div
            style={{
              maxWidth: '680px',
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card, 10px)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: 'var(--status-danger, #ef4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {moduleTitle} Encountered an Issue
                </h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}
                >
                  The view encountered a runtime error, but the application was protected from crashing.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'var(--status-danger, #ef4444)',
                wordBreak: 'break-word',
              }}
            >
              <strong>Error:</strong> {errorMessage}
            </div>

            {/* Diagnostic Details Toggle */}
            <div>
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  color: 'var(--primary, #3b82f6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}
              >
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {this.state.showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}
              </button>

              {this.state.showDetails && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    maxHeight: '220px',
                    overflow: 'auto',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {this.state.error?.stack || 'No stack trace available.'}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Hierarchy:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
                onClick={this.handleGoBack}
              >
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
