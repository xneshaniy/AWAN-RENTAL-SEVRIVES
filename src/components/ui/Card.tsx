'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'gold';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover, children, ...props }, ref) => {
    const variants = {
      default: 'bg-card text-card-foreground border border-border',
      outlined: 'bg-transparent border-2 border-border',
      elevated: 'bg-card text-card-foreground shadow-lg border-none',
      gold: 'bg-accent/5 text-accent-foreground border border-accent/20',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          variants[variant],
          paddings[padding],
          hover && 'hover:shadow-md hover:-translate-y-1 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 2 | 3 | 4;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, level = 3, ...props }, ref) => {
    const cls = cn('text-xl font-heading font-semibold text-foreground', className);

    if (level === 2) {
      return <h2 ref={ref} className={cls} {...props}>{children}</h2>;
    }
    if (level === 4) {
      return <h4 ref={ref} className={cls} {...props}>{children}</h4>;
    }
    return <h3 ref={ref} className={cls} {...props}>{children}</h3>;
  }
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-border flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';