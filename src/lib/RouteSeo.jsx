import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { getSeo, SITE_URL } from './seo';

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export default function RouteSeo({ publicPage } = {}) {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const seo = getSeo(pathname, language, publicPage);
    document.title = seo.title;
    setMeta('name', 'description', seo.description);
    setMeta('name', 'robots', seo.robots);
    setMeta('property', 'og:type', seo.type);
    for (const prefix of ['og', 'twitter']) {
      const attribute = prefix === 'og' ? 'property' : 'name';
      setMeta(attribute, `${prefix}:title`, seo.title);
      setMeta(attribute, `${prefix}:description`, seo.description);
    }
    let canonical = document.head.querySelector('link[rel="canonical"]');
    const ogUrl = document.head.querySelector('meta[property="og:url"]');
    if (seo.canonical) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', seo.canonical);
      setMeta('property', 'og:url', seo.canonical);
    } else {
      canonical?.remove();
      ogUrl?.remove();
    }
    for (const link of document.head.querySelectorAll('link[rel="alternate"][hreflang]')) link.remove();
    for (const [locale, path] of Object.entries(seo.alternates)) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = locale;
      link.href = SITE_URL + path;
      document.head.appendChild(link);
    }
    let schema = document.getElementById('route-schema');
    if (seo.schema) {
      if (!schema) {
        schema = document.createElement('script');
        schema.id = 'route-schema';
        schema.setAttribute('type', 'application/ld+json');
        document.head.appendChild(schema);
      }
      schema.textContent = JSON.stringify(seo.schema);
    } else schema?.remove();
  }, [pathname, language, publicPage]);

  return null;
}
