/**
 * Product analytics stub — GA4 / Mixpanel ready.
 * Set VITE_GA4_MEASUREMENT_ID to load gtag in production builds.
 */
type EventProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
  if (!measurementId) {
    if (import.meta.env.DEV) {
      console.info('[analytics] stub mode — set VITE_GA4_MEASUREMENT_ID for GA4');
    }
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

export function track(event: string, props?: EventProps): void {
  if (import.meta.env.DEV) {
    console.info('[analytics]', event, props ?? {});
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, props);
  }
}
