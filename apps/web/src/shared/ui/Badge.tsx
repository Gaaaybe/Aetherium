import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'espirito' | 'caos' | 'success' | 'warning' | 'info' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}: BadgeProps) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded shadow-md border transition-all duration-200 hover:scale-105";
  
  const variants: Record<string, string> = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700/80 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:shadow-lg",
    espirito: "bg-gradient-to-r from-espirito-200 via-espirito-100 to-purple-100 text-espirito-900 dark:from-espirito-900/90 dark:via-espirito-800/90 dark:to-purple-900/90 dark:text-espirito-100 border-espirito-400 dark:border-espirito-600 hover:shadow-lg hover:shadow-espirito-500/30",
    caos: "bg-gradient-to-r from-red-200 via-red-100 to-orange-100 text-red-900 dark:from-red-900/90 dark:via-red-800/90 dark:to-orange-900/90 dark:text-red-100 border-red-400 dark:border-red-600 hover:shadow-lg hover:shadow-red-500/30",
    success: "bg-gradient-to-r from-green-200 via-green-100 to-emerald-100 text-green-900 dark:from-green-900/90 dark:via-green-800/90 dark:to-emerald-900/90 dark:text-green-100 border-green-400 dark:border-green-600 hover:shadow-lg hover:shadow-green-500/30",
    warning: "bg-gradient-to-r from-yellow-200 via-yellow-100 to-orange-100 text-yellow-900 dark:from-yellow-900/90 dark:via-yellow-800/90 dark:to-orange-900/90 dark:text-yellow-100 border-yellow-400 dark:border-yellow-600 hover:shadow-lg hover:shadow-yellow-500/30",
    info: "bg-gradient-to-r from-blue-200 via-blue-100 to-cyan-100 text-blue-900 dark:from-blue-900/90 dark:via-blue-800/90 dark:to-cyan-900/90 dark:text-blue-100 border-blue-400 dark:border-blue-600 hover:shadow-lg hover:shadow-blue-500/30",
    secondary: "bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800 dark:from-gray-700/90 dark:to-gray-600/90 dark:text-gray-200 border-gray-400 dark:border-gray-500 hover:shadow-lg",
    outline: "bg-transparent text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:shadow-lg",
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
