import { useState, useEffect } from 'react';

export function useFirstVisit(key: string): [boolean, () => void] {
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem(key);
    if (!visited) {
      setIsFirstVisit(true);
    }
  }, [key]);

  const markAsVisited = () => {
    localStorage.setItem(key, 'true');
    setIsFirstVisit(false);
  };

  return [isFirstVisit, markAsVisited];
}
