import { useState } from 'react';

interface InlineHelpProps {
  text: string;
  type?: 'info' | 'tip' | 'warning' | 'example';
  dismissible?: boolean;
  storageKey?: string;
}

export function InlineHelp({ 
  text, 
  type = 'info', 
  dismissible = false,
  storageKey 
}: InlineHelpProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (storageKey) {
      return localStorage.getItem(`inline-help-${storageKey}`) === 'dismissed';
    }
    return false;
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    if (storageKey) {
      localStorage.setItem(`inline-help-${storageKey}`, 'dismissed');
    }
    setIsDismissed(true);
  };

  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'ℹ️'
    },
    tip: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
      icon: '💡'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: '⚠️'
    },
    example: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300',
      icon: '📝'
    }
  };

  const style = styles[type];

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${style.bg} ${style.border} text-sm ${style.text} mb-4`}>
      <span className="text-base flex-shrink-0">{style.icon}</span>
      <p className="flex-1">{text}</p>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dispensar"
        >
          ✕
        </button>
      )}
    </div>
  );
}
