import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset scroll when changing routes (e.g. home → /listings). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Navigation should always restore the header; otherwise the scroll-hide
    // transition can leave only a thin strip visible on the next page.
    document.body.classList.remove('sv-scroll-down');
  }, [pathname]);

  return null;
}
