'use client';

import { forwardRef, ButtonHTMLAttributes, Children, cloneElement, isValidElement, ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  /** When true, renders the single child element instead of a <button>,
   *  merging button styles into the child (e.g. a Next.js <Link>). */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, disabled, children, asChild, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-sm',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
      whatsapp: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm flex items-center gap-2',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    const classes = cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className);

    // asChild: merge button styles into the single child element (Slot pattern)
    if (asChild) {
      const onlyChild = Children.only(children);
      if (isValidElement(onlyChild)) {
        const child = onlyChild as ReactElement<{ className?: string }>;
        return cloneElement(child, {
          className: cn(classes, child.props.className),
        });
      }
      return <>{children}</>;
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
