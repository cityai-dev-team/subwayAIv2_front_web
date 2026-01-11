'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import type { BadgeVariant, BadgeSize } from '../../shared/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-gray-100 text-gray-900',
  secondary: 'border-transparent bg-gray-200 text-gray-800',
  destructive: 'border-transparent bg-red-100 text-red-800',
  outline: 'border border-app-border text-app-text',
  accent: 'border-transparent bg-accent-soft text-accent',
  success: 'border-transparent bg-green-100 text-green-800',
  warning: 'border-transparent bg-yellow-100 text-yellow-800',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-accent-ring focus:ring-offset-2',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  ),
);
Badge.displayName = 'Badge';

export { Badge };
