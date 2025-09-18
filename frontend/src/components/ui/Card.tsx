import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  glowing?: boolean;
  animated?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className = '',
    variant = 'default',
    padding = 'md',
    hoverable = false,
    glowing = false,
    animated = true,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'relative rounded-2xl transition-all duration-300 overflow-hidden group';
    
    const variantClasses = {
      default: 'bg-white/5 backdrop-blur-sm border border-white/10',
      glass: 'glass-card',
      gradient: 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl',
      elevated: 'bg-dark-800 border border-dark-700 shadow-2xl',
      bordered: 'bg-dark-900 border-2 border-primary-500/30 shadow-neon',
    };
    
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };
    
    const hoverClasses = hoverable ? 'hover:scale-[1.02] hover:shadow-2xl cursor-pointer hover-lift' : '';
    const glowClasses = glowing ? 'animate-glow' : '';
    const animatedClasses = animated ? 'animate-fade-in' : '';
    
    return (
      <div
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${paddingClasses[padding]}
          ${hoverClasses}
          ${glowClasses}
          ${animatedClasses}
          ${className}
        `}
        {...props}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
        
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', icon: Icon, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between mb-4 ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-primary-500/20 text-primary-400 rounded-lg">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>{children}</div>
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-gray-300 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-6 pt-4 border-t border-white/10 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };