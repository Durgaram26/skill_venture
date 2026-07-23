import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset scroll when changing routes (e.g. home → /listings). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
