import { useState, useRef, ReactNode, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isPinned) return;
    const closeIfOutside = (event: MouseEvent | TouchEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) {
        setIsPinned(false);
        setIsVisible(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPinned(false);
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('touchstart', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('touchstart', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isPinned]);

  useLayoutEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        
        let top = 0;
        let left = 0;

        // Base coordinate calculation (relative to viewport)
        if (position === 'top' || position === 'top-left' || position === 'top-right') {
          top = rect.top - 8;
        } else if (position === 'bottom' || position === 'bottom-left' || position === 'bottom-right') {
          top = rect.bottom + 8;
        } else {
          top = rect.top + rect.height / 2;
        }

        if (position === 'left') {
          left = rect.left - 8;
        } else if (position === 'right') {
          left = rect.right + 8;
        } else if (position === 'top-left' || position === 'bottom-left') {
          left = rect.left;
        } else if (position === 'top-right' || position === 'bottom-right') {
          left = rect.right;
        } else {
          left = rect.left + rect.width / 2;
        }

        // Adjust offset and clamp boundaries once the tooltip node is measured
        if (tooltipRef.current) {
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const width = tooltipRect.width;
          const height = tooltipRect.height;
          
          // Apply translations depending on alignment
          if (position === 'top' || position === 'bottom') {
            left = left - width / 2;
          } else if (position === 'left') {
            left = left - width;
          } else if (position === 'top-right' || position === 'bottom-right') {
            left = left - width;
          }
          
          if (position === 'top' || position === 'top-left' || position === 'top-right') {
            top = top - height;
          } else if (position === 'left' || position === 'right') {
            top = top - height / 2;
          }

          // Screen boundaries padding
          const padding = 8;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Clamp horizontally to prevent left or right overflow
          if (left < padding) {
            left = padding;
          } else if (left + width > viewportWidth - padding) {
            left = viewportWidth - width - padding;
          }

          // Clamp vertically and auto-flip if off-screen
          if (top < padding) {
            if (position === 'top' || position === 'top-left' || position === 'top-right') {
              top = rect.bottom + 8; // Flip to bottom
            } else {
              top = padding;
            }
          } else if (top + height > viewportHeight - padding) {
            if (position === 'bottom' || position === 'bottom-left' || position === 'bottom-right') {
              top = rect.top - height - 8; // Flip to top
            } else {
              top = viewportHeight - height - padding;
            }
          }
        }

        setCoords({ top, left });
      };

      updatePosition();
      
      // Update coordinates after rendering finishes to capture actual tooltip dimensions
      const frameId = requestAnimationFrame(updatePosition);

      // Listen to scroll and resize events globally (capturing phase) to re-position tooltip dynamically
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setCoords(null);
    }
  }, [isVisible, position]);

  return (
    <div 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => !isPinned && setIsVisible(false)}
      onFocusCapture={() => setIsVisible(true)}
      onBlurCapture={() => !isPinned && setIsVisible(false)}
      onClick={() => {
        setIsPinned(previous => {
          const next = !previous;
          setIsVisible(next);
          return next;
        });
      }}
    >
      {children}
      {isVisible && createPortal(
        <div 
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: coords ? `${coords.top}px` : '0px',
            left: coords ? `${coords.left}px` : '0px',
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: coords ? 1 : 0,
            visibility: coords ? 'visible' : 'hidden',
            transition: 'none', // Impede qualquer transição indesejada de posicionamento (top/left)
          }}
          className={coords ? "animate-fade-in" : ""}
          role="tooltip"
        >
          <div className="bg-gray-950/95 dark:bg-gray-900/95 border border-gray-800 dark:border-gray-700 text-gray-200 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl min-w-[220px] max-w-sm break-words backdrop-blur-sm">
            {content}
          </div>
        </div>,
        document.body
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
