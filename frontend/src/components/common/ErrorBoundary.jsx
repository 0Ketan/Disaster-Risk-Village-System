import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary Component
 * Catches rendering exceptions and ensures UI stability (GEMINI.md zero crash rule).
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VillageShield caught frontend render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-on-surface mb-2">
              System Interface Degraded
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              A temporary display error occurred. The system is operating in safe fallback mode.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-container transition-colors shadow-sm w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
