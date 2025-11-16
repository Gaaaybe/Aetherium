import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function Input({ 
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  type = 'text',
  id,
  ...props 
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const baseClasses = "w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1";
  const stateClasses = error 
    ? "border-caos-300 focus:border-caos-500 focus:ring-caos-500" 
    : "border-gray-300 focus:border-espirito-500 focus:ring-espirito-500";
  
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        className={`${baseClasses} ${stateClasses} ${className} dark:bg-gray-800 dark:text-gray-100`}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-caos-600 dark:text-caos-400">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function Textarea({ 
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 3,
  id,
  ...props 
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const baseClasses = "w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 resize-y";
  const stateClasses = error 
    ? "border-caos-300 focus:border-caos-500 focus:ring-caos-500" 
    : "border-gray-300 focus:border-espirito-500 focus:ring-espirito-500";
  
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={inputId}
        rows={rows}
        className={`${baseClasses} ${stateClasses} ${className} dark:bg-gray-800 dark:text-gray-100`}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-caos-600 dark:text-caos-400">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
