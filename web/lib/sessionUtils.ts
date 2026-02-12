import { useState, useCallback } from 'react';
import { useSessionManager } from '../hooks/useSessionManager';
import { errorLogger } from '../lib/errorLogger';

export interface SessionUtils {
  getSessionInfo: () => SessionInfo;
  isValidSession: () => boolean;
  refreshToken: () => Promise<boolean>;
  checkActivity: () => boolean;
  forceReauth: (reason: string) => void;
}

export interface SessionInfo {
  userId: string | null;
  token: string | null;
  expiresAt: number | null;
  lastActivity: number;
  isActive: boolean;
  warningCount: number;
}

export function useSessionUtils(): SessionUtils {
  const { isSessionValid, requireReauth, logout } = useSessionManager();

  // Get comprehensive session information
  const getSessionInfo = useCallback((): SessionInfo => {
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      const lastActivity = sessionStorage.getItem('lastActivity');
      
      let userId = null;
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id || null;
      }

      let expiresAt = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          expiresAt = payload.exp * 1000; // Convert to milliseconds
        } catch {
          // Token parsing failed
          errorLogger.warning('Failed to parse JWT token', { tokenLength: token?.length }, 'SessionUtils');
        }
      }

      return {
        userId,
        token,
        expiresAt,
        lastActivity: lastActivity ? parseInt(lastActivity) : 0,
        isActive: isSessionValid(),
        warningCount: parseInt(sessionStorage.getItem('warningCount') || '0'),
      };
    } catch (error) {
      errorLogger.error('Failed to get session info', error, 'SessionUtils');
      return {
        userId: null,
        token: null,
        expiresAt: null,
        lastActivity: 0,
        isActive: false,
        warningCount: 0,
      };
    }
  }, [isSessionValid]);

  // Validate session
  const isValidSession = useCallback((): boolean => {
    const sessionInfo = getSessionInfo();
    
    // Check if token exists
    if (!sessionInfo.token) {
      return false;
    }

    // Check if token is expired
    if (sessionInfo.expiresAt && Date.now() >= sessionInfo.expiresAt) {
      return false;
    }

    // Check if session is active
    if (!sessionInfo.isActive) {
      return false;
    }

    return true;
  }, [getSessionInfo]);

  // Refresh authentication token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentToken = localStorage.getItem('authToken');
      if (!currentToken) {
        throw new Error('No token to refresh');
      }

      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        errorLogger.info('Token refreshed successfully', { timestamp: Date.now() }, 'SessionUtils');
        return true;
      }

      throw new Error('No token in refresh response');
    } catch (error) {
      errorLogger.error('Token refresh failed', error, 'SessionUtils');
      
      // If refresh fails, logout the user
      await logout('token_refresh_failed');
      return false;
    }
  }, [logout]);

  // Check user activity
  const checkActivity = useCallback((): boolean => {
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (!lastActivity) {
      return false;
    }

    const activityAge = Date.now() - parseInt(lastActivity);
    const maxInactivity = 30 * 60 * 1000; // 30 minutes

    return activityAge < maxInactivity;
  }, []);

  // Force re-authentication
  const forceReauth = useCallback((reason: string) => {
    requireReauth(reason);
  }, [requireReauth]);

  return {
    getSessionInfo,
    isValidSession,
    refreshToken,
    checkActivity,
    forceReauth,
  };
}

// Utility functions for session management
export const sessionUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return false;
    }

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      return payload.exp > now;
    } catch {
      return false;
    }
  },

  // Get current user ID
  getCurrentUserId: (): string | null => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || null;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Get user role
  getUserRole: (): string | null => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role || null;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Check if user has specific permission
  hasPermission: (permission: string): boolean => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.permissions?.includes(permission) || user.role === 'admin';
      }
      return false;
    } catch {
      return false;
    }
  },

  // Update last activity timestamp
  updateActivity: (): void => {
    sessionStorage.setItem('lastActivity', Date.now().toString());
  },

  // Clear session data
  clearSession: (): void => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    sessionStorage.clear();
  },

  // Store session data securely
  storeSession: (user: any, token: string): void => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      sessionStorage.setItem('lastActivity', Date.now().toString());
      sessionStorage.setItem('warningCount', '0');
    } catch (error) {
      errorLogger.error('Failed to store session data', error, 'SessionUtils');
    }
  },

  // Get session duration
  getSessionDuration: (): number => {
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (!lastActivity) {
      return 0;
    }

    return Date.now() - parseInt(lastActivity);
  },

  // Check if session should be refreshed
  shouldRefreshToken: (): boolean => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - now;
      
      // Refresh if less than 5 minutes remaining
      return timeUntilExpiry < 300 && timeUntilExpiry > 0;
    } catch {
      return false;
    }
  },
};