import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2.5';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2.5';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2.5';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2.5';
      case 'top-left':
        return 'bottom-full left-0 mb-2.5';
      case 'top-right':
        return 'bottom-full right-0 mb-2.5';
      case 'bottom-left':
        return 'top-full left-0 mt-2.5';
      case 'bottom-right':
        return 'top-full right-0 mt-2.5';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute z-55 ${getPositionClasses()}`}
          role="tooltip"
        >
          <div className="bg-gray-950/95 dark:bg-gray-900/95 border border-gray-800 dark:border-gray-700 text-gray-200 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl min-w-[220px] max-w-sm break-words backdrop-blur-sm">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

interface HelpIconProps {
  tooltip: string | ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function HelpIcon({ tooltip, size = 'md' }: HelpIconProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <Tooltip content={tooltip}>
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-help ${sizeClasses[size]}`}>
        ?
      </span>
    </Tooltip>
  );
}
