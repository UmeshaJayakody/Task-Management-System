import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  dot?: boolean;
  glowing?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className = '',
    variant = 'default',
    size = 'md',
    icon: Icon,
    dot = false,
    glowing = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-300';
    
    const variantClasses = {
      default: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
      secondary: 'bg-accent-500/20 text-accent-400 border border-accent-500/30',
      success: 'bg-green-500/20 text-green-400 border border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
      info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    };
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs h-5',
      md: 'px-3 py-1.5 text-sm h-6',
      lg: 'px-4 py-2 text-base h-8',
    };
    
    const iconSizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };
    
    const glowClasses = glowing ? 'animate-glow' : '';
    
    return (
      <span
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${glowClasses}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <div className={`w-2 h-2 rounded-full ${
            variant === 'default' ? 'bg-gray-400' :
            variant === 'primary' ? 'bg-primary-400' :
            variant === 'secondary' ? 'bg-accent-400' :
            variant === 'success' ? 'bg-green-400' :
            variant === 'warning' ? 'bg-yellow-400' :
            variant === 'danger' ? 'bg-red-400' :
            'bg-blue-400'
          }`} />
        )}
        
        {Icon && <Icon className={iconSizeClasses[size]} />}
        
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;