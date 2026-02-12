import React, { useState, useCallback, useRef, useEffect } from 'react';
import { errorLogger } from '../lib/errorLogger';

interface FocusableElement {
  element: HTMLElement;
  index: number;
}

interface AccessibilityState {
  focusedIndex: number;
  isKeyboardNavigation: boolean;
  announcement: string;
  screenReaderEnabled: boolean;
}

export function useAccessibility(containerRef?: React.RefObject<HTMLElement>) {
  const [state, setState] = useState<AccessibilityState>({
    focusedIndex: -1,
    isKeyboardNavigation: false,
    announcement: '',
    screenReaderEnabled: false,
  });

  const lastInteractionTime = useRef<number>(Date.now());
  const focusableElementsRef = useRef<FocusableElement[]>([]);

  // Check if screen reader is enabled
  const detectScreenReader = useCallback(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // Common screen reader detection methods
    const hasScreenReader = 
      // VoiceOver on Safari
      (window as any).safari !== undefined ||
      // JAWS on Windows (check for specific patterns)
      navigator.userAgent.includes('JAWS') ||
      // NVDA on Windows
      navigator.userAgent.includes('NVDA') ||
      // General accessibility API check
      window.speechSynthesis !== undefined;

    return hasScreenReader;
  }, []);

  // Get all focusable elements within container
  const getFocusableElements = useCallback((container?: HTMLElement): HTMLElement[] => {
    const root = container || document.body;
    
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      'area[href]',
      '[tabindex]:not([tabindex="-1"])',
      'summary',
      'audio[controls]',
      'video[controls]',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  }, []);

  // Update focusable elements list
  const updateFocusableElements = useCallback(() => {
    const container = containerRef?.current;
    const elements = getFocusableElements(container);
    
    focusableElementsRef.current = elements.map((element, index) => ({
      element,
      index,
    }));
  }, [containerRef, getFocusableElements]);

  // Focus management
  const focusElement = useCallback((index: number) => {
    const focusableElements = focusableElementsRef.current;
    
    if (index >= 0 && index < focusableElements.length) {
      const { element } = focusableElements[index];
      element.focus();
      
      setState(prev => ({
        ...prev,
        focusedIndex: index,
      }));

      return true;
    }
    
    return false;
  }, []);

  // Focus next element
  const focusNext = useCallback(() => {
    const currentIndex = state.focusedIndex;
    const nextIndex = currentIndex + 1;
    
    if (!focusElement(nextIndex)) {
      // Wrap to beginning
      focusElement(0);
    }
  }, [state.focusedIndex, focusElement]);

  // Focus previous element
  const focusPrevious = useCallback(() => {
    const currentIndex = state.focusedIndex;
    const elements = focusableElementsRef.current;
    const previousIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    
    focusElement(previousIndex);
  }, [state.focusedIndex, focusElement]);

  // Focus first element
  const focusFirst = useCallback(() => {
    focusElement(0);
  }, [focusElement]);

  // Focus last element
  const focusLast = useCallback(() => {
    const elements = focusableElementsRef.current;
    focusElement(elements.length - 1);
  }, [focusElement]);

  // Trap focus within container
  const trapFocus = useCallback((container: HTMLElement) => {
    const elements = getFocusableElements(container);
    focusableElementsRef.current = elements.map((element, index) => ({
      element,
      index,
    }));

    // Focus first element
    if (elements.length > 0) {
      elements[0].focus();
      setState(prev => ({
        ...prev,
        focusedIndex: 0,
      }));
    }
  }, [getFocusableElements]);

  // Release focus trap
  const releaseFocus = useCallback(() => {
    focusableElementsRef.current = [];
    setState(prev => ({
      ...prev,
      focusedIndex: -1,
    }));
  }, []);

  // Screen reader announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setState(prev => ({
      ...prev,
      announcement: message,
    }));

    // Use ARIA live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);

    // Log for debugging
    errorLogger.info(`Screen reader announcement: ${message}`, { priority }, 'useAccessibility');
  }, []);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionTime.current;
    
    // Consider keyboard navigation if events are close together
    if (timeSinceLastInteraction < 500) {
      setState(prev => ({
        ...prev,
        isKeyboardNavigation: true,
      }));
    }
    
    lastInteractionTime.current = now;

    let handled = false;

    switch (event.key) {
      case 'Tab':
        // Let browser handle tab navigation
        handled = true;
        break;
        
      case 'ArrowDown':
      case 'Right':
        event.preventDefault();
        focusNext();
        handled = true;
        break;
        
      case 'ArrowUp':
      case 'Left':
        event.preventDefault();
        focusPrevious();
        handled = true;
        break;
        
      case 'Home':
        event.preventDefault();
        focusFirst();
        handled = true;
        break;
        
      case 'End':
        event.preventDefault();
        focusLast();
        handled = true;
        break;
        
      case 'Enter':
      case ' ':
        // Let default action happen
        handled = true;
        break;
    }

    if (handled) {
      event.stopPropagation();
    }
  }, [focusNext, focusPrevious, focusFirst, focusLast]);

  // Click detection for mouse navigation
  const handleMouseDown = useCallback(() => {
    setState(prev => ({
      ...prev,
      isKeyboardNavigation: false,
    }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleMouseDown, true);

    // Initial screen reader detection
    const screenReaderEnabled = detectScreenReader();
    setState(prev => ({
      ...prev,
      screenReaderEnabled,
    }));

    // Update focusable elements initially
    updateFocusableElements();

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [handleKeyDown, handleMouseDown, detectScreenReader, updateFocusableElements]);

  // Update focusable elements when container changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      updateFocusableElements();
    });

    if (containerRef?.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'tabindex'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [containerRef, updateFocusableElements]);

  // ARIA attribute setters
  const setAriaExpanded = useCallback((element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString());
  }, []);

  const setAriaSelected = useCallback((element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString());
  }, []);

  const setAriaControls = useCallback((element: HTMLElement, controls: string) => {
    element.setAttribute('aria-controls', controls);
  }, []);

  return {
    // State
    focusedIndex: state.focusedIndex,
    isKeyboardNavigation: state.isKeyboardNavigation,
    announcement: state.announcement,
    screenReaderEnabled: state.screenReaderEnabled,
    
    // Focus management
    focusElement,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    trapFocus,
    releaseFocus,
    
    // Screen reader
    announce,
    
    // ARIA attributes
    setAriaExpanded,
    setAriaSelected,
    setAriaControls,
    
    // Utilities
    updateFocusableElements,
    getFocusableElements,
  };
}

// Hook for focus trap within modal/dialog
export function useFocusTrap(isOpen: boolean) {
  const containerRef = React.useRef<HTMLElement>(null);
  const { trapFocus, releaseFocus } = useAccessibility();

  useEffect(() => {
    if (isOpen && containerRef.current) {
      trapFocus(containerRef.current);
    } else {
      releaseFocus();
    }

    return () => {
      releaseFocus();
    };
  }, [isOpen, trapFocus, releaseFocus]);

  return containerRef;
}

// Hook for ARIA attributes management
export function useAriaAttributes() {
  const setAriaAttribute = useCallback((
    element: HTMLElement,
    attribute: string,
    value: string
  ) => {
    element.setAttribute(`aria-${attribute}`, value);
    
    errorLogger.debug(
      `ARIA attribute set: aria-${attribute}="${value}"`,
      { element: element.tagName, attribute, value },
      'useAriaAttributes'
    );
  }, []);

  const removeAriaAttribute = useCallback((
    element: HTMLElement,
    attribute: string
  ) => {
    element.removeAttribute(`aria-${attribute}`);
  }, []);

  const setAriaLabel = useCallback((element: HTMLElement, label: string) => {
    setAriaAttribute(element, 'label', label);
  }, [setAriaAttribute]);

  const setAriaDescribedBy = useCallback((element: HTMLElement, ids: string[]) => {
    setAriaAttribute(element, 'describedby', ids.join(' '));
  }, [setAriaAttribute]);

  const setAriaExpanded = useCallback((element: HTMLElement, expanded: boolean) => {
    setAriaAttribute(element, 'expanded', expanded.toString());
  }, [setAriaAttribute]);

  const setAriaSelected = useCallback((element: HTMLElement, selected: boolean) => {
    setAriaAttribute(element, 'selected', selected.toString());
  }, [setAriaAttribute]);

  const setAriaDisabled = useCallback((element: HTMLElement, disabled: boolean) => {
    setAriaAttribute(element, 'disabled', disabled.toString());
  }, [setAriaAttribute]);

  return {
    setAriaAttribute,
    removeAriaAttribute,
    setAriaLabel,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaSelected,
    setAriaDisabled,
  };
}