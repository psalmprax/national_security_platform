'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { logError } from '../lib/errorLogger';

export interface ErrorInfo {
  componentStack: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logError(error.message, { stack: error.stack, componentStack: errorInfo.componentStack }, 'ErrorBoundary');

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
          {/* Ambient Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

          <div className="glass-card-premium max-w-lg w-full relative z-10 border-red-500/30 p-1">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/5">

              {/* Header Icon */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                  <div className="relative bg-red-500/10 p-4 rounded-full border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    <ShieldAlert className="w-12 h-12 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center mb-8 space-y-3">
                <h1 className="text-2xl font-black text-white uppercase tracking-widest">
                  System Malfunction
                </h1>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  A critical exception has occurred within the interface layer. Diagnostics have been logged.
                </p>
                <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-[10px] font-mono text-red-400">ID: {this.state.errorId}</span>
                </div>
              </div>

              {/* Dev Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8">
                  <div className="bg-black/50 rounded-xl border border-white/10 p-4 overflow-hidden">
                    <p className="text-[10px] font-mono text-red-400 mb-2 truncate">
                      {this.state.error.message}
                    </p>
                    <div className="h-px w-full bg-white/10 my-2" />
                    <p className="text-[9px] font-mono text-slate-500">
                      Check console for full stack trace.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-widest transition-all hover:text-white flex items-center justify-center gap-2"
                >
                  <Home className="w-3.5 h-3.5" />
                  Return_Base
                </button>

                <button
                  onClick={this.handleRetry}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reboot_UI
                </button>
              </div>

            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}