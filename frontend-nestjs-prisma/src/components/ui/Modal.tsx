'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-50 w-full mx-4 bg-card rounded-xl shadow-xl animate-fade-in',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-2">
            <div>
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Close button if no header */}
        {!title && !description && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-accent rounded-md transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
