import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { errorLogger, logUserAction, logSecurityEvent } from '../lib/errorLogger';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutes (5 min warning)
const EXTEND_SESSION_TIME = 5 * 60 * 1000; // 5 minutes extension

interface SessionState {
  isActive: boolean;
  isWarning: boolean;
  timeRemaining: number;
  lastActivity: number;
  warningCount: number;
}

export function useSessionManager() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: true,
    isWarning: false,
    timeRemaining: SESSION_TIMEOUT,
    lastActivity: Date.now(),
    warningCount: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const warningRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const extendRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update last activity time
  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
      warningCount: 0, // Reset warning count on activity
    }));

    // Reset timers
    resetTimeouts();

    // Log user activity for security monitoring
    logUserAction('session_activity', 'page_interaction', { timestamp: now });
  }, []);

  // Reset all timers
  const resetTimeouts = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (extendRef.current) clearTimeout(extendRef.current);

    // Set warning timeout
    warningRef.current = setTimeout(() => {
      showSessionWarning();
    }, WARNING_TIMEOUT);

    // Set session timeout
    timeoutRef.current = setTimeout(() => {
      handleSessionExpiry();
    }, SESSION_TIMEOUT);
  }, []);

  // Show session warning
  const showSessionWarning = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      isWarning: true,
      timeRemaining: SESSION_TIMEOUT - WARNING_TIMEOUT,
      warningCount: prev.warningCount + 1,
    }));

    logUserAction('session_warning', 'displayed', {
      warningCount: sessionState.warningCount + 1,
    });

    // Auto-logout if no response within warning period
    extendRef.current = setTimeout(() => {
      handleSessionExpiry();
    }, WARNING_TIMEOUT);
  }, [sessionState.warningCount]);

  // Handle session expiry
  const handleSessionExpiry = useCallback(async () => {
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      isWarning: false,
      timeRemaining: 0,
    }));

    // Log security event
    logSecurityEvent('session_timeout', 'medium', {
      lastActivity: sessionState.lastActivity,
      sessionDuration: Date.now() - sessionState.lastActivity,
      warningCount: sessionState.warningCount,
    });

    // Clear authentication data
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      sessionStorage.clear();

      // Call logout API
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      errorLogger.error('Failed to logout properly', error, 'SessionManager');
    }

    // Redirect to login
    router.push('/login?reason=session_expired');
  }, [router, sessionState.lastActivity, sessionState.warningCount]);

  // Extend session
  const extendSession = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      isWarning: false,
      timeRemaining: SESSION_TIMEOUT,
    }));

    // Clear warning timeout
    if (extendRef.current) clearTimeout(extendRef.current);

    // Reset main timeout
    resetTimeouts();

    // Log session extension
    logUserAction('session_extended', 'user_action', {
      extendedAt: Date.now(),
    });
  }, [resetTimeouts]);

  // Logout manually
  const logout = useCallback(async (reason?: string) => {
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      isWarning: false,
      timeRemaining: 0,
    }));

    // Log logout
    logUserAction('manual_logout', 'user_action', { reason });

    try {
      // Call logout API
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch (error) {
      errorLogger.error('Failed to logout properly', error, 'SessionManager');
    }

    // Clear authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    sessionStorage.clear();

    // Redirect to login
    router.push('/login');
  }, [router]);

  // Force re-authentication for sensitive operations
  const requireReauth = useCallback(async (reason: string): Promise<boolean> => {
    logSecurityEvent('reauthentication_required', 'medium', { reason });

    // Show re-authentication dialog
    const shouldReauth = window.confirm(
      'For security purposes, please re-authenticate to continue this operation.'
    );

    if (shouldReauth) {
      // Redirect to re-authentication
      router.push(`/login?reason=reauth&operation=${encodeURIComponent(reason)}`);
      return false;
    }

    return false;
  }, [router]);

  // Check if session is valid
  const isSessionValid = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - sessionState.lastActivity;

    return (
      sessionState.isActive &&
      timeSinceActivity < SESSION_TIMEOUT &&
      !!localStorage.getItem('authToken')
    );
  }, [sessionState.isActive, sessionState.lastActivity]);

  // Get session time remaining
  const getTimeRemaining = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - sessionState.lastActivity;
    const remaining = Math.max(0, SESSION_TIMEOUT - timeSinceActivity);

    return remaining;
  }, [sessionState.lastActivity]);

  // Update time remaining countdown
  useEffect(() => {
    if (sessionState.isWarning) {
      const interval = setInterval(() => {
        const remaining = getTimeRemaining();
        setSessionState(prev => ({
          ...prev,
          timeRemaining: remaining,
        }));

        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionState.isWarning, getTimeRemaining]);

  // Setup activity listeners
  useEffect(() => {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      updateLastActivity();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start initial timeout
    resetTimeouts();

    return () => {
      // Cleanup event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (extendRef.current) clearTimeout(extendRef.current);
    };
  }, [updateLastActivity, resetTimeouts]);

  // Monitor visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - log for security monitoring
        logUserAction('tab_hidden', 'visibility_change', {
          lastActivity: sessionState.lastActivity,
        });
      } else {
        // Tab is visible - check session validity
        updateLastActivity();

        if (!isSessionValid()) {
          handleSessionExpiry();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateLastActivity, isSessionValid, handleSessionExpiry, sessionState.lastActivity]);

  return {
    // State
    isActive: sessionState.isActive,
    isWarning: sessionState.isWarning,
    timeRemaining: sessionState.timeRemaining,
    warningCount: sessionState.warningCount,

    // Actions
    extendSession,
    logout,
    updateLastActivity,
    requireReauth,

    // Utilities
    isSessionValid,
    getTimeRemaining: getTimeRemaining() / 1000, // Return in seconds
  };
}