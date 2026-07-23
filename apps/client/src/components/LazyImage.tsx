import { useEffect, useRef, useState } from 'react';

/**
 * DNA Performance pattern — IntersectionObserver lazy load (px rootMargin only).
 */
export function LazyImage({
  src,
  alt,
  className,
  eager,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(eager ? src : undefined);

  useEffect(() => {
    if (eager) {
      setCurrent(src);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setCurrent(src);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px 300px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, eager]);

  return (
    <img
      ref={ref}
      src={current}
      alt={alt}
      className={`${className ?? ''} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
    />
  );
}
