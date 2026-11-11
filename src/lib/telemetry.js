import { publicPaths } from 'virtual:seo-discovery-links';
import { SITE_URL } from './siteUrl.js';

const trackedPaths = new Set(publicPaths);

export function shouldLoadTelemetry() {
  return import.meta.env.PROD && window.location.origin === SITE_URL;
}

export function trackablePath(path) {
  return trackedPaths.has(path) ? path : null;
}

function publicPath(eventUrl) {
  if (!eventUrl) return null;
  try {
    const url = new URL(eventUrl, SITE_URL);
    return url.origin === SITE_URL ? trackablePath(url.pathname) : null;
  } catch {
    return null;
  }
}

export function filterPageView(event) {
  const path = event.type === 'pageview' && publicPath(event.url);
  return path ? { ...event, url: SITE_URL + path } : null;
}

export function filterVital(event) {
  const path = event.type === 'vital' && publicPath(event.url);
  return path ? { ...event, url: SITE_URL + path, route: path } : null;
}
