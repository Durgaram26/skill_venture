import { useEffect } from 'react';

/** Client-side meta + JSON-LD for SPA listing pages (complements API SSR). */
export function usePageSeo(params: {
  title: string;
  description: string;
  url?: string;
  jsonLd?: Record<string, unknown>;
}) {
  const jsonLdKey = params.jsonLd ? JSON.stringify(params.jsonLd) : '';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = params.title;

    const ensureMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    ensureMeta('name', 'description', params.description);
    ensureMeta('property', 'og:title', params.title);
    ensureMeta('property', 'og:description', params.description);
    if (params.url) {
      ensureMeta('property', 'og:url', params.url);
    }

    let script: HTMLScriptElement | null = null;
    if (params.jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'sv-jsonld';
      script.text = jsonLdKey;
      document.getElementById('sv-jsonld')?.remove();
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      script?.remove();
    };
  }, [params.title, params.description, params.url, jsonLdKey, params.jsonLd]);
}
