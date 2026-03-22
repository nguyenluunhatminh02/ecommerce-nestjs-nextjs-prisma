'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border bg-background',
};

const sizeStyles = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'badge-base font-semibold',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
