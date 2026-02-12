'use client';

import React, { useState, useCallback } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatusIndicator({ className = '' }: NetworkStatusProps) {
  const {
    isOnline,
    networkStatus,
    networkQuality,
    offlineQueue,
    testConnection,
    connectionAttempts,
  } = useNetworkStatus();

  const [isTesting, setIsTesting] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await testConnection();
    } finally {
      setIsTesting(false);
    }
  };

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'good': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'fair': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'poor': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getQualityText = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  // Handle drag end to update position
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y,
    }));
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      // dragConstraints removed for free movement
      initial={{ x: position.x, y: position.y }}
      animate={{ x: position.x, y: position.y }}
      onDragEnd={handleDragEnd}
      className={`fixed z-50 ${className}`}
    >
      {/* Main Status Indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${isOnline
        ? getQualityColor(networkQuality)
        : 'text-red-400 bg-red-400/10 border-red-400/30'
        }`}>
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4 animate-pulse" />
        )}

        <span className="text-sm font-medium">
          {isOnline ? getQualityText(networkQuality) : 'Offline'}
        </span>

        {/* Connection attempts indicator */}
        {!isOnline && connectionAttempts > 0 && (
          <span className="text-xs opacity-75">
            (Retry {connectionAttempts}/5)
          </span>
        )}
      </div>

      {/* Offline Queue Indicator */}
      {offlineQueue.length > 0 && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {offlineQueue.length} queued
          </span>
        </div>
      )}

      {/* Detailed Status Panel */}
      <div className="mt-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 p-3 min-w-64">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {isOnline && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-slate-200">
                    {networkStatus.networkType.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Speed:</span>
                  <span className="text-slate-200">
                    {networkStatus.effectiveType}
                  </span>
                </div>

                {networkStatus.downlink > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Downlink:</span>
                    <span className="text-slate-200">
                      {networkStatus.downlink} Mbps
                    </span>
                  </div>
                )}

                {networkStatus.rtt > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latency:</span>
                    <span className="text-slate-200">
                      {networkStatus.rtt} ms
                    </span>
                  </div>
                )}
              </>
            )}

            {offlineQueue.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Queued Ops:</span>
                <span className="text-amber-400">
                  {offlineQueue.length}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-700">
              {!isOnline && (
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || connectionAttempts >= 5}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded text-xs transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  Test
                </button>
              )}

              {offlineQueue.length > 0 && (
                <button
                  onClick={() => {/* Clear queue action */ }}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact network status for header
export function CompactNetworkStatus({ className = '' }: { className?: string }) {
  const { isOnline, networkQuality, offlineQueue } = useNetworkStatus();

  const getStatusColor = (): string => {
    if (!isOnline) return 'text-red-400';
    switch (networkQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-amber-400';
      case 'poor': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${getStatusColor()}`}>
        {isOnline ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span className="text-xs font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {offlineQueue.length > 0 && (
        <div className="relative">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-xs rounded-full w-3 h-3 flex items-center justify-center font-bold">
            {offlineQueue.length}
          </span>
        </div>
      )}
    </div>
  );
}