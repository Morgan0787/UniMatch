/** Resolve safe public links once per URL, retaining every field association. */
export function groupPublicSources(entries, sourceMap = {}) {
  const grouped = new Map();
  for (const { fact, label } of entries) {
    const ids = [...(fact?.sourceIds || []), ...(fact?.historical?.sourceIds || [])];
    for (const id of ids) {
      const source = sourceMap[id];
      let url;
      try { url = new URL(source?.url); } catch { continue; }
      if (url.protocol !== 'https:' || url.username || url.password) continue;
      const previous = grouped.get(url.href) || { url: url.href, labels: [], checkedAt: [], titles: [], scopes: [] };
      if (label && !previous.labels.includes(label)) previous.labels.push(label);
      if (source.checkedAt && !previous.checkedAt.includes(source.checkedAt)) previous.checkedAt.push(source.checkedAt);
      if (source.title && !previous.titles.includes(source.title)) previous.titles.push(source.title);
      if (source.scope && !previous.scopes.includes(source.scope)) previous.scopes.push(source.scope);
      grouped.set(url.href, previous);
    }
  }
  return [...grouped.values()];
}

const COPY = {
  en: { page: 'University page', language: 'English language', nonEu: 'Artificial Intelligence · non-EU procedure', programme: 'Programme: Artificial Intelligence', source: 'Official source' },
  ru: { page: 'Страница университета', language: 'Английский язык', nonEu: 'Artificial Intelligence · процедура non-EU', programme: 'Программа Artificial Intelligence', source: 'Официальный источник' },
  uz: { page: 'Universitet sahifasi', language: 'Ingliz tili', nonEu: 'Artificial Intelligence · non-EU tartibi', programme: 'Artificial Intelligence dasturi', source: 'Rasmiy manba' },
};
const shorten = text => text.length <= 80 ? text : `${text.slice(0, 77).trimEnd()}…`;

/** Use document metadata, or a transparent URL-based label when metadata is generic. */
export function publicSourceTitle(source, language = 'en') {
  const c = COPY[language] || COPY.en;
  const title = source.titles?.find(value => typeof value === 'string' && value.trim() && !/^Accepted field source:/i.test(value));
  if (title) return shorten(title.trim());
  let url;
  try { url = new URL(source.url); } catch { return c.source; }
  // These labels describe the URL, rather than inventing an unpublished page title.
  if (/\/english-language\/?$/.test(url.pathname)) return c.language;
  if (/artificial-intelligence-procedure-non-eu-students\/?$/.test(url.pathname)) return c.nonEu;
  if (/\/artificial-intelligence\/?$/.test(url.pathname)) return c.programme;
  if (/\/node\/\d+\/?$/.test(url.pathname)) return `${c.page} · ${url.pathname.split('/').filter(Boolean).at(-1)}`;
  const tail = url.pathname.split('/').filter(Boolean).at(-1);
  if (!tail) return `${c.source} · ${url.hostname}`;
  let name = tail;
  try { name = decodeURIComponent(tail); } catch { /* Keep the original URL segment. */ }
  return shorten(name.replace(/[-_]/g, ' '));
}

/** Different URLs must remain distinguishable even when imported titles coincide. */
export function namedPublicSources(sources, language = 'en') {
  const names = sources.map(source => publicSourceTitle(source, language));
  return sources.map((source, index) => ({ ...source, title: names.filter(name => name === names[index]).length > 1
    ? `${names[index]} · ${index + 1}` : names[index] }));
}
