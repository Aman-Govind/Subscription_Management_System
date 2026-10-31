import React from 'react';
import { AlertOctagon, RotateCcw, Home, Terminal } from 'lucide-react';
import Button from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-rose-500/30 selection:text-rose-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  Application Rendering Exception
                </h1>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  The component runtime encountered an unexpected state.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Exception Summary
              </div>
              <div className="font-mono text-xs text-rose-400 break-words">
                {this.state.error?.toString() || 'Unknown Rendering Error'}
              </div>
            </div>

            {/* Collapsible Stack Trace */}
            <div>
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showStack: !prev.showStack }))}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{this.state.showStack ? 'Hide Diagnostics' : 'Inspect Stack Trace'}</span>
              </button>

              {this.state.showStack && (
                <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-48 leading-relaxed">
                  {this.state.errorInfo?.componentStack || 'No component stack available.'}
                </div>
              )}
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={this.handleReload}
              >
                Reload Window
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Home}
                onClick={this.handleReset}
              >
                Recover to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

