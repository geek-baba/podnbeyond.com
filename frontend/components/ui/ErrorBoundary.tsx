import React, { Component, ErrorInfo, ReactNode } from 'react';
import Card from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Simple error boundary component to catch and display errors gracefully
 * Prevents a single widget/component error from crashing the entire page
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card>
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-neutral-900 mb-2">
              Something went wrong loading this widget
            </p>
            <p className="text-xs text-neutral-500">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

