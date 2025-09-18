import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
  glowing?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    glowing = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus-ring rounded-xl relative overflow-hidden group';
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white shadow-lg hover:shadow-xl hover:shadow-primary-500/25 active:scale-95',
      secondary: 'glass-card text-white hover:bg-white/10 border-white/20 hover:border-white/30 shadow-glass hover:shadow-glass-strong',
      ghost: 'text-gray-300 hover:text-white hover:bg-white/10 active:scale-95',
      outline: 'border-2 border-primary-500/50 text-primary-400 hover:border-primary-400 hover:bg-primary-500/10 hover:text-primary-300',
      danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 active:scale-95',
      success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/25 active:scale-95',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm h-8 gap-1.5',
      md: 'px-4 py-2.5 text-sm h-10 gap-2',
      lg: 'px-6 py-3 text-base h-12 gap-2.5',
      xl: 'px-8 py-4 text-lg h-14 gap-3',
    };
    
    const glowClasses = glowing ? 'animate-glow' : '';
    const fullWidthClasses = fullWidth ? 'w-full' : '';
    const disabledClasses = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
    
    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${glowClasses}
          ${fullWidthClasses}
          ${disabledClasses}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
        
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
            <span className="ml-2">Loading...</span>
          </>
        ) : (
          <>
            {LeftIcon && <LeftIcon className="w-4 h-4" />}
            {children}
            {RightIcon && <RightIcon className="w-4 h-4" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;