/**
 * Error Boundary Component
 * Catches React errors and displays a friendly error message
 */

'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { THEME_COLORS } from '@/lib/game/types';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${THEME_COLORS.mine}/20` }}
            >
              <AlertCircle className="w-8 h-8" style={{ color: THEME_COLORS.mine }} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-textPrimary">Something went wrong</h1>
              <p className="text-textSecondary">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{
                  backgroundColor: THEME_COLORS.safe,
                  color: THEME_COLORS.background,
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 border"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary,
                }}
              >
                <Home className="w-4 h-4" />
                Go to Lobby
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-6">
                <summary className="cursor-pointer text-sm text-textSecondary hover:text-textPrimary">
                  Technical details
                </summary>
                <pre className="mt-2 p-4 rounded-lg bg-surface text-xs text-textSecondary overflow-auto max-h-48">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback Component
 * Simplified error display for use in specific contexts
 */
export function ErrorFallback({
  title = 'Something went wrong',
  message,
  onRetry,
  showHome = true,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${THEME_COLORS.mine}/20` }}
      >
        <AlertCircle className="w-6 h-6" style={{ color: THEME_COLORS.mine }} />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
        {message && <p className="text-sm text-textSecondary">{message}</p>}
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
            style={{
              backgroundColor: THEME_COLORS.safe,
              color: THEME_COLORS.background,
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
        )}
        {showHome && (
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{
              backgroundColor: 'transparent',
              borderColor: THEME_COLORS.border,
              color: THEME_COLORS.textPrimary,
            }}
          >
            Home
          </button>
        )}
      </div>
    </div>
  );
}
