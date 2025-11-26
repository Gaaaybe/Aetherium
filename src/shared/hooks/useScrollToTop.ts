import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que faz scroll to top quando a rota muda
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);
}

/**
 * Componente que faz scroll to top quando a rota muda
 */
export function ScrollToTop() {
  useScrollToTop();
  return null;
}
