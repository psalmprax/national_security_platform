'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface DraggableModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    position?: { x: number; y: number };
    defaultPosition?: { x: number; y: number };
    dragHandle?: string;
    className?: string;
    style?: React.CSSProperties;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    showCloseButton?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export function DraggableModal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    position,
    defaultPosition = { x: 0, y: 0 },
    dragHandle = '.drag-handle',
    className = '',
    style,
    closeOnEscape = true,
    closeOnBackdrop = true,
    showCloseButton = true,
}: DraggableModalProps) {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const [positionState, setPositionState] = useState(position || defaultPosition);
    const [isAnimating, setIsAnimating] = useState(false);

    // Update position when prop changes
    React.useEffect(() => {
        if (position) {
            setPositionState(position);
        }
    }, [position]);

    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Optional: Snap to edges or boundaries
        const { offset } = info;
        setPositionState((prev) => ({
            x: prev.x + offset.x,
            y: prev.y + offset.y,
        }));
    }, []);

    const handleClose = useCallback(() => {
        if (!isAnimating) {
            setIsAnimating(true);
            setTimeout(() => {
                onClose();
                setIsAnimating(false);
            }, 200);
        }
    }, [onClose, isAnimating]);

    const handleBackdropClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (event.target === event.currentTarget && closeOnBackdrop) {
                handleClose();
            }
        },
        [closeOnBackdrop, handleClose]
    );

    // Handle escape key
    React.useEffect(() => {
        if (isOpen && closeOnEscape) {
            const handleEscape = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    handleClose();
                }
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, closeOnEscape, handleClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={constraintsRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isAnimating ? 0 : 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* Draggable Modal */}
            <motion.div
                drag
                dragMomentum={false}
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: isAnimating ? 0 : 1,
                    scale: isAnimating ? 0.95 : 1,
                    x: positionState.x,
                    y: positionState.y,
                }}
                onDragEnd={handleDragEnd}
                className={`pointer-events-auto relative w-full ${sizeClasses[size]} bg-slate-800 rounded-xl border border-slate-700 shadow-2xl ${className}`}
                style={style}
            >
                {/* Header / Drag Handle */}
                {(title || showCloseButton) && (
                    <div
                        className={`flex items-center justify-between p-4 border-b border-slate-700 drag-handle cursor-move ${title ? 'cursor-grab active:cursor-grabbing' : ''
                            }`}
                    >
                        {title && (
                            <h2 className="text-lg font-semibold text-white select-none">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={handleClose}
                                className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
            </motion.div>
        </div>
    );
}

// Simple draggable wrapper for non-modal elements
interface DraggableWrapperProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    defaultPosition?: { x: number; y: number };
    bounds?: 'parent' | { left: number; right: number; top: number; bottom: number };
    dragHandle?: string;
    onDragEnd?: (x: number, y: number) => void;
}

export function Draggable({
    children,
    className = '',
    style,
    defaultPosition = { x: 0, y: 0 },
    bounds,
    dragHandle = '.drag-handle',
    onDragEnd,
}: DraggableWrapperProps) {
    const [position, setPosition] = useState(defaultPosition);

    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const newX = position.x + info.offset.x;
            const newY = position.y + info.offset.y;
            setPosition({ x: newX, y: newY });
            onDragEnd?.(newX, newY);
        },
        [position, onDragEnd]
    );

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragConstraints={bounds === 'parent' ? { left: 0, right: 0, top: 0, bottom: 0 } : bounds}
            initial={{ x: position.x, y: position.y }}
            animate={{ x: position.x, y: position.y }}
            onDragEnd={handleDragEnd}
            className={`cursor-move ${className}`}
            style={style}
        >
            {children}
        </motion.div>
    );
}
