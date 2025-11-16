import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: (string | SelectOption)[];
  placeholder?: string;
  containerClassName?: string;
}

export function Select({ 
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Selecione...',
  className = '',
  containerClassName = '',
  id,
  ...props 
}: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const baseClasses = "w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-gray-800 dark:text-gray-100";
  const stateClasses = error 
    ? "border-caos-300 focus:border-caos-500 focus:ring-caos-500" 
    : "border-gray-300 dark:border-gray-600 focus:border-espirito-500 focus:ring-espirito-500";
  
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
      
      <select
        id={inputId}
        className={`${baseClasses} ${stateClasses} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          if (typeof option === 'string') {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
      
      {error && (
        <p className="text-sm text-caos-600 dark:text-caos-400">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
