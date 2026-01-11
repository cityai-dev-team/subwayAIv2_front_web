'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  helperText?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    variant = 'default',
    leftIcon,
    rightIcon,
    label,
    helperText,
    error,
    ...props
  }, ref) => {
    const inputId = React.useId();
    const helperId = React.useId();
    const errorId = React.useId();

    const variantClass = {
      default: 'border-app-border focus:border-accent',
      error: 'border-red-500 focus:border-red-500',
      success: 'border-green-500 focus:border-green-500',
    };

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtext">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-input border bg-app-input px-3 py-2 text-sm text-app-text',
            'placeholder:text-app-subtext',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            variantClass[variant],
            className,
          )}
          ref={ref}
          aria-describedby={helperText ? helperId : error ? errorId : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-app-subtext">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (label || helperText || error) {
      return (
        <div className="space-y-2">
          {label && (
            <label htmlFor={inputId} className="text-sm font-medium text-app-text">
              {label}
            </label>
          )}
          {inputElement}
          {error && (
            <p id={errorId} className="text-sm text-red-600">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={helperId} className="text-sm text-app-subtext">
              {helperText}
            </p>
          )}
        </div>
      );
    }

    return inputElement;
  },
);
Input.displayName = 'Input';

export { Input };
