import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { getSeo, PUBLIC_PATHS, PRIVATE_PATHS, SITE_URL } from '../src/lib/seo.js';
import { catalogContent, catalogLanguage, catalogPath, CATALOG_LANGUAGES, DiscoveryContent } from '../src/lib/discoveryContent.js';
import { buildAppFallback, buildDiscoveryPages } from './seo-pages.mjs';
import { loadSeoCatalogPreview, loadSeoInstitutions } from './seo-catalog.mjs';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const scriptJson = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const virtualLinks = 'virtual:seo-discovery-links';
const basePaths = [...PUBLIC_PATHS, ...CATALOG_LANGUAGES.filter(lang => lang !== 'en').map(catalogPath)];

export function renderSeo(pathname, page) {
  const seo = getSeo(pathname, 'en', page);
  const title = escape(seo.title);
  const description = escape(seo.description);
  return `<!-- seo:start -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${seo.robots}" />
    ${seo.canonical ? `<link rel="canonical" href="${escape(seo.canonical)}" />
    <meta property="og:url" content="${escape(seo.canonical)}" />` : ''}
    ${Object.entries(seo.alternates).map(([language, path]) =>
      `<link rel="alternate" hreflang="${language}" href="${escape(SITE_URL + path)}" />`).join('\n    ')}
    <meta property="og:type" content="${seo.type}" />
    <meta property="og:site_name" content="UniMatch" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${seo.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="UniMatch — Find your university abroad" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${seo.image}" />
    ${seo.schema ? `<script id="route-schema" type="application/ld+json">${scriptJson(seo.schema)}</script>` : ''}
    <!-- seo:end -->`;
}

function withSeo(html, path, page) {
  const marker = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;
  if (!marker.test(html)) throw new Error('Missing SEO template marker');
  return html.replace(marker, () => renderSeo(path, page))
    .replace('<html lang="en">', `<html lang="${getSeo(path, 'en', page).language}">`);
}

function withContent(html, page, { standalone = false, interactive = false } = {}) {
  const root = '<div id="root"></div>';
  if (!html.includes(root)) throw new Error('Missing app root in SEO template');
  const content = renderToStaticMarkup(createElement(DiscoveryContent, { page, standalone }));
  let output = html.replace(root, () => `<div id="root">${content}</div>`);
  if (standalone && !interactive) {
    output = output.replace(/<script\b[^>]*\btype="module"[^>]*><\/script>/g, '')
      .replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, '');
  }
  if (interactive) {
    output = output.replace('</body>', () =>
      `<script id="unimatch-public-profile" type="application/json">${scriptJson(page)}</script>\n  </body>`);
  }
  return output;
}

function sitemap(paths) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map(path => `  <url><loc>${escape(SITE_URL + path)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

// Vite's default preview applies the SPA fallback to unknown routes. Match the
// static files and explicit app rewrites instead, so local HTTP checks see 404.
function usePreviewRoutes(server) {
  const out = resolve(server.config.root, server.config.build.outDir);
  server.middlewares.use(async (request, response, next) => {
    if (!['GET', 'HEAD'].includes(request.method)) return next();
    const [pathname, query = ''] = request.url.split(/\?(.*)/s, 2);
    const validPath = /^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*(?:\.html)?\/?$/.test(pathname);
    if (!validPath && !/^\/(?:universities|countries|study|guides|(?:ru|uz)\/guides)\//.test(pathname)) return next();
    let path = pathname.replace(/\/+$/, '') || '/';
    if (validPath && (path === '/Home' || path === '/en/Search' || path !== pathname || path.endsWith('.html'))) {
      if (path === '/Home') path = '/';
      else if (path === '/en/Search') path = '/Search';
      else if (path.endsWith('.html')) path = path.slice(0, -5) || '/';
      response.writeHead(308, { Location: path + (query ? `?${query}` : '') });
      response.end();
      return;
    }
    const file = !validPath ? '404.html' : path === '/' ? 'index.html' : PRIVATE_PATHS.includes(path) ? 'seo/private.html' : `${path.slice(1)}.html`;
    try {
      const result = await readFile(resolve(out, file));
      response.writeHead(file === '404.html' ? 404 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : result);
    } catch (error) {
      if (error.code !== 'ENOENT') return next(error);
      try {
        const result = await readFile(resolve(out, '404.html'));
        response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(request.method === 'HEAD' ? undefined : result);
      } catch (missing) { next(missing); }
    }
  });
}

export default function seoPlugin() {
  let config;
  let discovery = buildDiscoveryPages([]);
  let telemetryEntry;
  let catalogPreview = null;
  return {
    name: 'unimatch-seo',
    enforce: 'post',
    configResolved(resolved) { config = resolved; },
    async buildStart() {
      if (config.command === 'build' && !config.build.ssr) {
        const env = { ...loadEnv(config.mode, config.envDir, ['VITE_', 'SEO_']), ...process.env };
        const [institutions, preview] = await Promise.all([
          loadSeoInstitutions(env),
          loadSeoCatalogPreview(env).catch(() => null),
        ]);
        discovery = buildDiscoveryPages(institutions);
        catalogPreview = preview;
        telemetryEntry = this.emitFile({ type: 'chunk', id: resolve(config.root, 'src/lib/staticTelemetry.js') });
      }
    },
    resolveId(id) { return id === virtualLinks ? `\0${id}` : null; },
    load(id) {
      if (id !== `\0${virtualLinks}`) return null;
      const paths = [...basePaths, ...discovery.pages.map(page => page.path)];
      return `export default ${JSON.stringify(discovery.catalogLinks)}; export const publicPaths = ${JSON.stringify(paths)};`;
    },
    transformIndexHtml: html => withSeo(html, '/'),
    configurePreviewServer: usePreviewRoutes,
    generateBundle(_options, bundle) {
      if (config.build.ssr) return;
      const entry = bundle['index.html'];
      if (!entry || entry.type !== 'asset') throw new Error('Missing built index.html');
      const html = String(entry.source);
      const telemetryScript = `<script type="module" src="/${escape(this.getFileName(telemetryEntry))}"></script>`;
      const emit = (fileName, source) => this.emitFile({ type: 'asset', fileName, source });
      const preloadCatalog = html => html.replace('<head>', '<head>\n    <link rel="preload" href="/assets/catalog-preview.json" as="fetch" crossorigin />');
      if (catalogPreview) emit('assets/catalog-preview.json', JSON.stringify(catalogPreview));
      entry.source = withContent(html, buildAppFallback('/', discovery.catalogLinks));
      for (const path of basePaths.filter(path => path !== '/')) {
        const language = catalogLanguage(path);
        let output = withSeo(html, path);
        const page = language ? catalogContent(language, discovery.catalogLinks) : buildAppFallback(path, discovery.catalogLinks);
        output = withContent(output, page);
        if (catalogPreview && (language || path === '/Search')) output = preloadCatalog(output);
        emit(`${path.slice(1)}.html`, output);
      }
      for (const page of discovery.pages) {
        const interactive = Boolean(page.universityId);
        const output = withContent(withSeo(html, page.path, page), page, { standalone: true, interactive });
        emit(`${page.path.slice(1)}.html`, interactive ? output : output.replace('</body>', `${telemetryScript}\n  </body>`));
      }
      emit('seo/private.html', withSeo(html, '/Login'));
      emit('404.html', withContent(withSeo(html, '/not-found'), {
        heading: 'Page not found', intro: 'This page may have moved or is no longer available.',
        sections: [], actions: [{ href: '/Search', label: 'Explore universities' }],
      }, { standalone: true }));
      emit('sitemap.xml', sitemap([...basePaths, ...discovery.pages.map(page => page.path)]));
    },
  };
}
