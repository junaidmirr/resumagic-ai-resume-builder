import React, { Component, ErrorInfo, ReactNode } from "react";
import { ServerCrash, RefreshCw, Home, ChevronDown } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Resumagic ErrorBoundary]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[420px] w-full p-8 flex flex-col items-center justify-center text-center bg-app-bg text-app-text my-4 rounded-2xl border border-app-border">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
            <ServerCrash className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            Error 500 · Unexpected Exception
          </span>

          <h3 className="text-xl font-black text-app-text mb-2">
            Something went wrong rendering this view
          </h3>

          <p className="text-xs text-app-text-muted max-w-md mb-6 leading-relaxed">
            An unhandled runtime error occurred. You can reload the page or
            return to the dashboard.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload View
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-app-surface hover:bg-app-border border border-app-border text-app-text text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Home className="w-3.5 h-3.5 text-app-text-muted" /> Return to
              Home
            </a>
          </div>

          {this.state.error && (
            <div className="mt-6 w-full max-w-md text-left">
              <button
                onClick={() =>
                  this.setState((prev) => ({
                    showDetails: !prev.showDetails,
                  }))
                }
                className="text-[11px] text-app-text-muted hover:text-app-text flex items-center gap-1 cursor-pointer"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${this.state.showDetails ? "rotate-180" : ""}`}
                />
                Technical Details
              </button>
              {this.state.showDetails && (
                <pre className="mt-2 p-3 bg-app-surface border border-app-border rounded-xl text-[10px] font-mono text-rose-400 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.message || String(this.state.error)}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
