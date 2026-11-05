import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { getSeo } from './seo';

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export default function RouteSeo() {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const seo = getSeo(pathname, language);
    document.title = seo.title;
    setMeta('name', 'description', seo.description);
    setMeta('name', 'robots', seo.robots);
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
  }, [pathname, language]);

  return null;
}
