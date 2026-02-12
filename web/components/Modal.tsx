'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAccessibility, useFocusTrap } from '../hooks/useAccessibility';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  initialFocus?: 'auto' | 'first' | 'selector';
  restoreFocus?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnEscape = true,
  closeOnBackdrop = true,
  initialFocus = 'auto',
  restoreFocus = true,
  ariaLabel,
  ariaDescribedBy,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { trapFocus, releaseFocus, announce } = useAccessibility();
  const focusTrapRef = useFocusTrap(isOpen);

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Handle escape key
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      handleClose();
    }
  }, [closeOnEscape]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      handleClose();
    }
  }, [closeOnBackdrop]);

  // Close modal
  const handleClose = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      announce('Modal closing', 'polite');
      
      setTimeout(() => {
        onClose();
        setIsAnimating(false);
      }, 200);
    }
  }, [onClose, isAnimating, announce]);

  // Store and restore focus
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Announce to screen readers
      announce(title ? `Modal opened: ${title}` : 'Modal opened', 'assertive');
      
      // Focus management
      if (modalRef.current) {
        focusTrapRef.current = modalRef.current;
        
        if (initialFocus === 'first') {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          
          if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
          }
        }
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus
      if (restoreFocus && previousFocusRef.current) {
        setTimeout(() => previousFocusRef.current?.focus(), 100);
      }
    }
  }, [isOpen, title, announce, initialFocus, restoreFocus, focusTrapRef]);

  // Global event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} bg-slate-800 rounded-xl border border-slate-700 shadow-2xl transform transition-all duration-200 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || ariaLabel) && (
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            {title && (
              <h2 
                id="modal-title" 
                className="text-xl font-semibold text-white"
              >
                {title}
              </h2>
            )}
            
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        
        {/* Focus indicator for screen readers */}
        <div className="sr-only" aria-live="polite">
          Modal is open. Press Escape to close.
        </div>
      </div>
    </div>
  );
}

// Confirmation modal
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  dangerously = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  dangerously?: boolean;
}) {
  const { announce } = useAccessibility();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    try {
      await onConfirm();
      announce('Action confirmed', 'polite');
      onClose();
    } catch (error) {
      announce('Action failed', 'assertive');
    } finally {
      setIsConfirming(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      ariaLabel={`Confirmation: ${title}`}
    >
      <div className="space-y-4">
        <p className="text-slate-300">
          {message}
        </p>
        
        {dangerously && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm font-medium">
              ⚠️ This action cannot be undone and may have serious consequences.
            </p>
          </div>
        )}
        
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses()}`}
          >
            {isConfirming ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}