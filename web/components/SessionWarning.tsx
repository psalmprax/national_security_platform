import React from 'react';
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { useSessionManager } from '../hooks/useSessionManager';

interface SessionWarningProps {
  className?: string;
}

export function SessionWarning({ className = '' }: SessionWarningProps) {
  const {
    isWarning,
    timeRemaining,
    extendSession,
    logout,
    warningCount,
  } = useSessionManager();

  if (!isWarning) return null;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtend = () => {
    extendSession();
  };

  const handleLogout = () => {
    logout('user_logout_from_warning');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm ${className}`}>
      <div className="bg-slate-800 rounded-2xl border border-amber-500/30 shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className={`p-3 rounded-full ${
            timeRemaining < 60 
              ? 'bg-red-500/20 animate-pulse' 
              : 'bg-amber-500/20'
          }`}>
            {timeRemaining < 60 ? (
              <AlertTriangle className="w-8 h-8 text-red-400" />
            ) : (
              <Clock className="w-8 h-8 text-amber-400" />
            )}
          </div>
        </div>

        {/* Warning Content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Session Expiring Soon
          </h2>
          
          <p className="text-slate-300 mb-4">
            Your session will expire in{' '}
            <span className={`font-bold ${
              timeRemaining < 60 ? 'text-red-400' : 'text-amber-400'
            }`}>
              {formatTime(timeRemaining)}
            </span>
            {' '}due to inactivity.
          </p>

          {warningCount > 1 && (
            <p className="text-amber-400 text-sm">
              This is warning #{warningCount}. Your session will be terminated automatically.
            </p>
          )}
        </div>

        {/* Countdown Timer */}
        <div className="mb-6">
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                timeRemaining < 60 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-amber-500'
              }`}
              style={{ 
                width: `${(timeRemaining / (5 * 60)) * 100}%` // 5 minutes warning period
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExtend}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              timeRemaining < 60
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Extend Session
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center">
          <p className="text-slate-400 text-xs">
            For your security, sessions automatically expire after 30 minutes of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact session indicator for header
export function SessionIndicator({ className = '' }: { className?: string }) {
  const { isSessionValid, getTimeRemaining } = useSessionManager();

  if (!isSessionValid()) return null;

  const timeRemaining = getTimeRemaining;
  const isLowTime = timeRemaining < 5 * 60; // Less than 5 minutes

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
      isLowTime 
        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
        : 'bg-slate-800 text-slate-300 border border-slate-700'
    } ${className}`}>
      <Clock className="w-3 h-3" />
      <span className="font-medium">
        {Math.floor(timeRemaining / 60)}:{(Math.floor(timeRemaining % 60)).toString().padStart(2, '0')}
      </span>
    </div>
  );
}