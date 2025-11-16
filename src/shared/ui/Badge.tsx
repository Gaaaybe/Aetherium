import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'espirito' | 'caos' | 'success' | 'warning' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}: BadgeProps) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-full shadow-sm border transition-colors duration-200";
  
  const variants: Record<string, string> = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700/80 dark:text-gray-200 border-gray-300 dark:border-gray-600",
    espirito: "bg-gradient-to-r from-espirito-100 to-espirito-50 text-espirito-800 dark:from-espirito-900/80 dark:to-espirito-800/80 dark:text-espirito-200 border-espirito-300 dark:border-espirito-700",
    caos: "bg-gradient-to-r from-caos-100 to-caos-50 text-caos-800 dark:from-caos-900/80 dark:to-caos-800/80 dark:text-caos-200 border-caos-300 dark:border-caos-700",
    success: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 dark:from-green-900/80 dark:to-green-800/80 dark:text-green-200 border-green-300 dark:border-green-700",
    warning: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 dark:from-yellow-900/80 dark:to-yellow-800/80 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700",
    info: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 dark:from-blue-900/80 dark:to-blue-800/80 dark:text-blue-200 border-blue-300 dark:border-blue-700",
    secondary: "bg-gray-200/80 text-gray-700 dark:bg-gray-600/80 dark:text-gray-200 border-gray-400 dark:border-gray-500",
  };
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };
  
  return (
    <span 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
