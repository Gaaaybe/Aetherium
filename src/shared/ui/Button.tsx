import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  loadingText,
  onClick,
  type = 'button',
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-espirito-600 to-espirito-500 hover:from-espirito-700 hover:to-espirito-600 text-white focus:ring-espirito-500 shadow-md hover:shadow-lg dark:from-espirito-500 dark:to-espirito-400 dark:hover:from-espirito-600 dark:hover:to-espirito-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-400 shadow-sm hover:shadow-md dark:bg-gray-700/80 dark:hover:bg-gray-600/80 dark:text-gray-100",
    danger: "bg-gradient-to-r from-caos-600 to-caos-500 hover:from-caos-700 hover:to-caos-600 text-white focus:ring-caos-500 shadow-md hover:shadow-lg dark:from-caos-500 dark:to-caos-400 dark:hover:from-caos-600 dark:hover:to-caos-500",
    outline: "border-2 border-espirito-600 text-espirito-600 hover:bg-espirito-50 focus:ring-espirito-500 dark:border-espirito-400 dark:text-espirito-400 dark:hover:bg-espirito-950/50",
    ghost: "text-gray-700 hover:bg-gray-100/80 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800/80",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;
  
  return (
    <button 
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
