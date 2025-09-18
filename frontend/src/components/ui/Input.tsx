import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  variant?: 'default' | 'glass' | 'outline';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className = '',
    label,
    error,
    hint,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    variant = 'default',
    inputSize = 'md',
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    const baseClasses = 'w-full transition-all duration-300 focus:outline-none placeholder:text-gray-500 text-white';
    
    const variantClasses = {
      default: 'bg-white/5 border border-white/10 focus:border-primary-500 focus:bg-white/10 rounded-xl',
      glass: 'glass border-white/20 focus:border-primary-400 focus:shadow-neon rounded-xl',
      outline: 'bg-transparent border-2 border-gray-600 focus:border-primary-500 rounded-xl',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm h-9',
      md: 'px-4 py-3 text-sm h-11',
      lg: 'px-5 py-4 text-base h-13',
    };
    
    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };
    
    const errorClasses = error ? 'border-red-500 focus:border-red-400' : '';
    const iconPaddingLeft = LeftIcon ? 'pl-10' : '';
    const iconPaddingRight = RightIcon ? 'pr-10' : '';
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <LeftIcon className={iconSizeClasses[inputSize]} />
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseClasses}
              ${variantClasses[variant]}
              ${sizeClasses[inputSize]}
              ${errorClasses}
              ${iconPaddingLeft}
              ${iconPaddingRight}
              ${className}
            `}
            {...props}
          />
          
          {RightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <RightIcon className={iconSizeClasses[inputSize]} />
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-400 animate-slide-down">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;