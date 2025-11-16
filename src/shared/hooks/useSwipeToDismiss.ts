import { useState, useRef } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  style: {
    transform: string;
    transition: string;
  };
}

export function useSwipeToDismiss(
  onDismiss: () => void,
  threshold = 100
): SwipeHandlers {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Apenas permite swipe para a esquerda (deletar)
    if (diff < 0) {
      setTranslateX(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (translateX < -threshold) {
      // Anima completamente para fora antes de deletar
      setTranslateX(-400);
      setTimeout(() => {
        onDismiss();
        setTranslateX(0);
      }, 300);
    } else {
      // Volta para a posição original
      setTranslateX(0);
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: {
      transform: `translateX(${translateX}px)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease-out'
    }
  };
}
