import { normalizeIntakeText } from './factPresentation.js';

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
  en: { page: 'University page', language: 'English language', nonEu: 'Artificial Intelligence · non-EU procedure', programme: 'Programme: Artificial Intelligence', source: 'Official source', fees: 'Tuition and fees', requirements: 'Admission requirements', scholarships: 'Scholarships', admissions: 'Admissions' },
  ru: { page: 'Страница университета', language: 'Английский язык', nonEu: 'Artificial Intelligence · процедура non-EU', programme: 'Программа Artificial Intelligence', source: 'Официальный источник', fees: 'Стоимость обучения и сборы', requirements: 'Требования к поступлению', scholarships: 'Стипендии', admissions: 'Поступление' },
  uz: { page: 'Universitet sahifasi', language: 'Ingliz tili', nonEu: 'Artificial Intelligence · non-EU tartibi', programme: 'Artificial Intelligence dasturi', source: 'Rasmiy manba', fees: 'O‘qish haqi va to‘lovlar', requirements: 'Qabul talablari', scholarships: 'Stipendiyalar', admissions: 'Qabul' },
};
const shorten = text => text.length <= 80 ? text : `${text.slice(0, 77).trimEnd()}…`;
const INTERNAL_TITLE_RE = /^(?:accepted(?:\s+\w+)?\s+field\s+source|manager-accepted\b[^:]*):\s*/i;
const MACHINE_SEGMENT_RE = /^(?:[!~]|w_hu_menu|p_publish|usis|cgi-bin|servlet|lidx|go|link\.aspx$|index\.(?:cfm|php|aspx|jsp|do)$)/i;

/** @param {string} title */
export function isGenericSourceTitle(title) {
  if (typeof title !== 'string') return true;
  const trimmed = title.trim();
  return trimmed.length < 3 || INTERNAL_TITLE_RE.test(trimmed) || /!W_HU_MENU/i.test(trimmed);
}

function readableUrlSegment(url, c) {
  const pathname = url.pathname;
  const tag = url.searchParams.get('p_tag') || '';
  if (/^FEESLEVEL$/i.test(tag)) return `${c.fees} · ${url.hostname.replace(/^www\./i, '')}`;
  if (/^COURSE$/i.test(tag)) return `${c.page} · ${url.hostname.replace(/^www\./i, '')}`;
  if (/\/english-language(?:\/|$)/i.test(pathname)) return c.language;
  if (/artificial-intelligence-procedure-non-eu-students\/?$/i.test(pathname)) return c.nonEu;
  if (/\/artificial-intelligence\/?$/i.test(pathname)) return c.programme;
  if (/\/node\/\d+\/?$/.test(pathname)) return `${c.page} · ${pathname.split('/').filter(Boolean).at(-1)}`;
  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    let segment = segments[i];
    try { segment = decodeURIComponent(segment); } catch { /* Keep raw URL segment. */ }
    const cleaned = segment.replace(/\.(?:html?|php|aspx?|cfm|do|jsp|pdf)$/i, '').trim();
    if (cleaned.length < 3 || MACHINE_SEGMENT_RE.test(segment) || /^\d+$/.test(cleaned) || /^[A-Z0-9_!.-]{4,}$/.test(cleaned)) continue;
    if (/^(?:fees|tuition(?:-fees)?)$/i.test(cleaned)) return c.fees;
    if (/^(?:requirements|entry-requirements)$/i.test(cleaned)) return c.requirements;
    if (/^scholarships?$/i.test(cleaned)) return c.scholarships;
    if (/^(?:admissions?|apply|how-to-apply)$/i.test(cleaned)) return c.admissions;
    return shorten(cleaned.replace(/[-_]+/g, ' '));
  }
  return `${c.source} · ${url.hostname.replace(/^www\./i, '')}`;
}

/** Use document metadata, or a transparent URL-based label when metadata is generic. */
export function publicSourceTitle(source, language = 'en') {
  const c = COPY[language] || COPY.en;
  const titles = Array.isArray(source?.titles) ? source.titles : typeof source?.title === 'string' ? [source.title] : [];
  const title = titles.find(value => typeof value === 'string' && !isGenericSourceTitle(value));
  if (title) return shorten(normalizeIntakeText(title.trim()));
  let url;
  try { url = new URL(source.url); } catch { return c.source; }
  return readableUrlSegment(url, c);
}

/** Different URLs must remain distinguishable even when imported titles coincide. */
export function namedPublicSources(sources, language = 'en') {
  const names = sources.map(source => publicSourceTitle(source, language));
  return sources.map((source, index) => {
    const base = names[index];
    if (names.filter(name => name === base).length <= 1) return { ...source, title: base };
    let suffix = String(index + 1);
    try {
      const url = new URL(source.url);
      const hint = readableUrlSegment(url, COPY[language] || COPY.en);
      if (hint && hint !== base) suffix = hint;
    } catch { /* Keep numeric fallback. */ }
    return { ...source, title: shorten(`${base} — ${suffix}`) };
  });
}
