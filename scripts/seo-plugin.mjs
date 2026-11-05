import { getSeo, PUBLIC_PATHS, siteSchema } from '../src/lib/seo.js';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function renderSeo(pathname) {
  const seo = getSeo(pathname);
  return `<!-- seo:start -->
    <title>${escape(seo.title)}</title>
    <meta name="description" content="${escape(seo.description)}" />
    <meta name="robots" content="${seo.robots}" />
    ${seo.canonical ? `<link rel="canonical" href="${seo.canonical}" />\n    <meta property="og:url" content="${seo.canonical}" />` : ''}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="UniMatch" />
    <meta property="og:title" content="${escape(seo.title)}" />
    <meta property="og:description" content="${escape(seo.description)}" />
    <meta property="og:image" content="${seo.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="UniMatch — Find your university abroad" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(seo.title)}" />
    <meta name="twitter:description" content="${escape(seo.description)}" />
    <meta name="twitter:image" content="${seo.image}" />
    <script type="application/ld+json">${JSON.stringify(siteSchema)}</script>
    <!-- seo:end -->`;
}

function withSeo(html, path) {
  if (!html.includes('<!-- seo:start -->')) throw new Error('Missing SEO template marker');
  return html.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, () => renderSeo(path));
}

export default function seoPlugin() {
  return {
    name: 'unimatch-seo',
    // Vite emits index.html before post plugins run generateBundle.
    enforce: 'post',
    transformIndexHtml: html => withSeo(html, '/'),
    generateBundle(_options, bundle) {
      const entry = bundle['index.html'];
      if (!entry || entry.type !== 'asset') throw new Error('Missing built index.html');
      const html = String(entry.source);
      for (const path of PUBLIC_PATHS.filter(path => path !== '/')) {
        this.emitFile({ type: 'asset', fileName: `seo${path}.html`, source: withSeo(html, path) });
      }
      const privateHtml = withSeo(html, '/Login');
      this.emitFile({ type: 'asset', fileName: 'seo/private.html', source: privateHtml });
      this.emitFile({ type: 'asset', fileName: '404.html', source: withSeo(html, '/not-found') });
    },
  };
}
