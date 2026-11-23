import { createElement as h } from 'react';
import { getWikimediaResponsiveSources } from './admissions/presentation.js';

/** @typedef {{label: string, href: string, detail?: string}} DiscoveryLink */
/** @typedef {{heading: string, paragraphs?: string[], items?: string[], links?: DiscoveryLink[]}} DiscoverySection */
/** @typedef {{
 * path: string, language: string, heading: string, intro: string,
 * breadcrumbs?: DiscoveryLink[], sections: DiscoverySection[], actions?: DiscoveryLink[],
 * universityId?: string, title?: string, description?: string,
 * schema?: Record<string, unknown>[], alternates?: Record<string, string>
 * }} DiscoveryPage */

export const CATALOG_LANGUAGES = ['en', 'ru', 'uz'];
export const catalogPath = (language = 'en') => language === 'en' ? '/Search' : `/${language}/Search`;

/** @param {string} pathname */
export function catalogLanguage(pathname) {
  const path = pathname.replace(/\/+$/, '').toLowerCase();
  return CATALOG_LANGUAGES.find(language => catalogPath(language).toLowerCase() === path);
}

export const catalogAlternates = Object.fromEntries([
  ...CATALOG_LANGUAGES.map(language => [language, catalogPath(language)]),
  ['x-default', '/Search'],
]);

export const LANGUAGE_NAMES = { en: 'English', ru: 'Русский', uz: 'Oʻzbekcha' };

export const homeHero = {
  en: { lines: ['Find your university', 'abroad.'], intro: 'Compare universities by subject, destination and entry requirements. Explore programmes and build your shortlist for studying abroad.' },
  ru: { lines: ['Найдите свой вуз', 'за рубежом.'], intro: 'Сравнивайте университеты по специальности, стране и требованиям к поступлению. Изучайте программы и сохраняйте подходящие варианты.' },
  uz: { lines: ['Xorijda o‘qing.', 'Universitet tanlang.'], intro: 'Universitetlarni yo‘nalish, mamlakat va qabul talablari bo‘yicha solishtiring. Dasturlarni ko‘rib chiqing va mos variantlarni saqlang.' },
};

const catalogCopy = {
  en: {
    heading: 'Explore universities abroad',
    intro: 'Start with the country, degree and subject you want to study. Compare programmes with similar entry routes and check the official programme page before you decide where to apply.',
    checklist: 'What to check before you shortlist',
    advice: 'Write down the teaching language and the certificate the programme accepts. Compare tuition for the same study period, and keep housing and other living expenses separate. If a cost or requirement is missing, confirm it with the university.',
    explore: 'Explore university profiles, countries, study fields and guides',
    links: ['University profiles', 'Study destinations', 'Study fields & degrees', 'Application guides'],
    searchHeroTitle: 'Find your university',
    searchHeroIntro: 'Compare tuition, entry requirements and location.',
    cta: 'Find my university',
    details: 'Details',
  },
  ru: {
    heading: 'Университеты за рубежом',
    intro: 'Начните со страны, уровня образования и специальности. Сравнивайте программы с похожими условиями поступления и сверяйте сведения на официальном сайте перед подачей документов.',
    checklist: 'Что проверить перед выбором вуза',
    advice: 'Уточните язык обучения и список принимаемых сертификатов. Сравнивайте плату за один и тот же период, а жильё и другие расходы учитывайте отдельно. Если стоимость или требование не указаны, уточните их в университете.',
    explore: 'Профили вузов, страны, направления и руководства',
    links: ['Профили университетов', 'Страны обучения', 'Направления обучения', 'Руководства по поступлению'],
    searchHeroTitle: 'Найдите свой университет',
    searchHeroIntro: 'Сравните стоимость, требования и расположение.',
    cta: 'Подобрать университет',
    details: 'Подробнее',
  },
  uz: {
    heading: 'Xorijiy universitetlar',
    intro: 'Avval mamlakat, ta’lim bosqichi va yo‘nalishni tanlang. Qabul tartibi o‘xshash dasturlarni solishtiring va hujjat topshirishdan oldin dastur haqidagi ma’lumotni rasmiy saytdan tekshiring.',
    checklist: 'Universitet tanlashdan oldin nimalarni tekshirish kerak?',
    advice: 'Ta’lim tili va qabul qilinadigan sertifikatlarni aniqlang. Bir xil muddat uchun o‘qish to‘lovini taqqoslang, turar joy va boshqa yashash xarajatlarini alohida hisoblang. Narx yoki talab ko‘rsatilmagan bo‘lsa, universitetdan so‘rang.',
    explore: 'Universitet profillari, davlatlar, yo‘nalishlar va qo‘llanmalar',
    links: ['Universitet profillari', 'Ta’lim mamlakatlari', 'Ta’lim yo‘nalishlari', 'Qabul bo‘yicha qo‘llanmalar'],
    searchHeroTitle: 'Universitetingizni toping',
    searchHeroIntro: 'O‘qish haqi, qabul talablari va joylashuvni solishtiring.',
    cta: 'Universitet tanlash',
    details: 'Batafsil',
  },
};

const discoveryLinkOrder = ['/universities', '/countries', '/study', '/guides'];

/** @param {string} language @param {DiscoveryLink[]} links */
export function localizedDiscoveryLinks(language, links) {
  const copy = catalogCopy[language] || catalogCopy.en;
  const labels = Object.fromEntries(discoveryLinkOrder.map((path, i) => [path, copy.links[i]]));
  return links.map(link => ({ ...link, label: labels[link.href] || link.label }));
}

/** @param {string} language @param {DiscoveryLink[]} links @returns {DiscoveryPage} */
export function catalogContent(language, links) {
  const copy = catalogCopy[language] || catalogCopy.en;
  return {
    path: catalogPath(language), language, heading: copy.heading, intro: copy.intro, alternates: catalogAlternates,
    sections: [
      { heading: copy.checklist, paragraphs: [copy.advice] },
      ...(links.length ? [{ heading: copy.explore, links: localizedDiscoveryLinks(language, links) }] : []),
    ],
  };
}

/** @param {DiscoveryLink[]} links */
function linkList(links, cards = false) {
  return h('ul', { className: cards ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3 pl-5 list-disc' },
    links.map(({ href, label, detail }, i) =>
      h('li', { key: `${href}-${i}` }, h('a', {
        href,
        className: cards
          ? 'discovery-card-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#855a36]'
          : 'discovery-link',
      }, label, cards && detail ? h('span', null, detail) : null),
      !cards && detail ? h('span', null, ` — ${detail}`) : null)));
}

/** @param {{page: DiscoveryPage, children?: import('react').ReactNode, standalone?: boolean}} props */
export function DiscoveryContent({ page, children = null, standalone = true }) {
  const directory = page.path === '/universities';
  const guideDirectory = page.path === '/guides';
  const guide = guideDirectory || Boolean(page.path?.includes('/guides/'));
  const breadcrumbs = guide ? page.breadcrumbs?.filter(({ href }) => href !== '/') : page.breadcrumbs;
  const canvas = standalone ? 'discovery-canvas' : 'discovery-canvas discovery-embedded';
  const actions = !directory && page.actions?.length ? linkList(page.actions) : null;
  return h('main', { className: guide ? `${canvas} discovery-guides` : canvas },
    h('div', { className: 'discovery-card' },
      standalone && h('header', { className: 'discovery-header' },
        h('a', { href: '/', className: 'discovery-brand' }, 'UniMatch'),
        h('a', { href: '/Search', className: 'discovery-link text-sm font-medium' }, 'Explore catalog')),
      breadcrumbs?.length ? h('nav', { 'aria-label': 'Breadcrumb', className: 'discovery-breadcrumb mb-5 text-sm' },
        h('ol', { className: 'flex flex-wrap gap-x-2 gap-y-1' }, breadcrumbs.map(({ href, label }, i) =>
          h('li', { key: `${href}-${i}`, className: 'inline-flex items-center' }, h('a', { href, className: 'inline-flex items-center min-h-[36px] py-1' }, label))))) : null,
      h('h1', { className: 'text-3xl font-bold sm:text-4xl mb-4' }, page.heading),
      h('p', { className: 'text-lg leading-relaxed mb-6 text-[#47443f]' }, page.intro),
      directory && h('a', {
        href: '/Search',
        className: 'discovery-cta mb-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#855a36]',
      }, 'Search and compare universities'),
      page.alternates && h('nav', { 'aria-label': 'Language', className: 'mb-6' },
        h('ul', { className: 'flex flex-wrap gap-4' }, Object.entries(page.alternates).filter(([lang]) => lang !== 'x-default')
          .map(([lang, href]) => h('li', { key: lang }, h('a', {
            href, hrefLang: lang, lang, 'aria-current': lang === page.language ? 'page' : undefined,
            className: 'discovery-link',
          }, LANGUAGE_NAMES[lang] || lang))))),
      h(DiscoverySections, { sections: page.sections, cards: directory || guideDirectory }),
      guide && actions ? h('div', { className: 'discovery-guide-actions' }, actions) : actions,
      children));
}

/** @param {{sections: DiscoverySection[], cards?: boolean}} props */
export function DiscoverySections({ sections, cards = false }) {
  return sections.map(({ heading, paragraphs, items, links }) => h('section', { key: heading, className: 'mb-7' },
    h('h2', { className: 'text-xl font-semibold mb-3' }, heading),
    paragraphs?.map((paragraph, i) => h('p', { key: i, className: 'leading-relaxed mb-3' }, paragraph)),
    items?.length ? h('ul', { className: 'space-y-3 pl-5 list-disc' }, items.map((item, i) => h('li', { key: i }, item))) : null,
    links?.length ? linkList(links, cards) : null));
}

function collectPublicEntryLinks(page) {
  const seen = new Set();
  const out = [];
  for (const link of [...(page.sections || []).flatMap(section => section.links || []), ...(page.actions || [])]) {
    if (!link?.href || seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
  }
  return out;
}

function EntryNav({ active = '/Search', language = 'en', showDestinations = false }) {
  const c = catalogCopy[language] || catalogCopy.en;
  const labels = {
    en: { home: 'Home', search: 'Find Universities', destinations: 'Destinations', survey: c.cta },
    ru: { home: 'Главная', search: 'Поиск вузов', destinations: 'Страны', survey: c.cta },
    uz: { home: 'Bosh sahifa', search: 'Universitetlar', destinations: 'Mamlakatlar', survey: c.cta },
  }[language] || { home: 'Home', search: 'Find Universities', destinations: 'Destinations', survey: c.cta };
  return h('header', { className: 'entry-nav-bar' },
    h('div', { className: 'entry-nav-pill' },
      h('a', { href: '/', className: 'entry-brand' }, 'UNIMATCH'),
      h('nav', { 'aria-label': 'Primary', className: 'entry-nav-links' },
        h('a', { href: '/', className: active === '/' ? 'is-active' : undefined }, labels.home),
        h('a', { href: catalogPath(language), className: active.endsWith('/Search') ? 'is-active' : undefined }, labels.search),
        showDestinations && h('a', { href: '/countries' }, labels.destinations)),
      h('div', { className: 'entry-nav-right' },
        h('span', { className: 'entry-lang-pill' }, language.toUpperCase()),
        h('a', { href: '/AdmissionsSurvey', className: 'entry-cta-dark' }, labels.survey))));
}

/** @param {NonNullable<ReturnType<typeof import('./admissions/presentation.js').getUniversityPhoto>>} photo */
function EntryPreviewPhoto(photo, language) {
  const responsive = getWikimediaResponsiveSources(photo.url);
  const localized = photo.localized?.[language] || photo.localized?.en;
  const image = h('img', {
    className: 'entry-preview-photo', src: photo.url, width: photo.width, height: photo.height,
    alt: localized?.caption || photo.caption || photo.title || '',
    srcSet: responsive?.srcSet, sizes: responsive?.sizes, decoding: 'async', fetchPriority: 'high',
  });
  return responsive ? h('picture', null,
    h('source', { media: '(max-width: 500px)', srcSet: responsive.mobileSrcSet, sizes: responsive.sizes }), image) : image;
}

/** Pre-mount HTML shell for /, /Search, /ru/Search, /uz/Search and /AdmissionsSurvey matching the live Warm Pearl Glass UI.
 * @param {{page: DiscoveryPage, previewRows?: {name: string, country?: string, city?: string, href: string, photo?: ReturnType<typeof import('./admissions/presentation.js').getUniversityPhoto>}[]}} props */
export function PublicEntryContent({ page, previewRows = [] }) {
  const language = page.language || 'en';
  const c = catalogCopy[language] || catalogCopy.en;
  const discoveryLinks = collectPublicEntryLinks(page);
  const hasDestinations = discoveryLinks.some(link => link.href === '/countries');

  if (page.path === '/') {
    return h('div', { className: 'entry-shell entry-shell--home' },
      h('header', { className: 'entry-home-header' },
        h('a', { href: '/', className: 'entry-home-brand' }, 'UNIMATCH'),
        h('nav', { 'aria-label': 'Primary', className: 'entry-home-top-links' },
          h('a', { href: '/Search' }, 'Explore universities'),
          hasDestinations && h('a', { href: '/countries' }, 'Destinations'),
          h('a', { href: '/AdmissionsSurvey', className: 'entry-home-match-link' }, 'FIND MY UNIVERSITY'))),
      h('main', { className: 'entry-home-main' },
        h('div', { className: 'entry-home-orb', 'aria-hidden': 'true' }),
        h('div', { className: 'entry-home-grid' },
          h('div', { className: 'entry-home-copy' },
            h('h1', { className: 'entry-home-title' }, page.heading),
            h('p', { className: 'entry-home-intro' }, page.intro),
            h('a', { href: '/AdmissionsSurvey', className: 'entry-cta-dark' }, 'FIND MY UNIVERSITY')),
          h('aside', { className: 'entry-home-side' },
            h('h2', { className: 'sr-only' }, 'Browse verified bachelor’s hubs'),
            h('p', { className: 'entry-home-side-copy' }, 'Compare verified bachelor’s programmes, tuition scope and entry requirements across Europe, the UK, the US and Asia.'),
            h('nav', { 'aria-label': 'Explore' },
              h('ul', { className: 'entry-home-pills' },
                discoveryLinks.filter(link => link.href !== '/AdmissionsSurvey').slice(0, 6).map(link =>
                  h('li', { key: link.href },
                    h('a', { href: link.href, className: 'entry-pill-link' }, link.label)
                  )
                )
              )
            )
          )
        )
      )
    );
  }

  if (page.path === '/AdmissionsSurvey') {
    const fieldChips = ['Business', 'Information Technology (IT)', 'Computer Engineering', 'Software Engineering', 'Computer Science'];
    return h('div', { className: 'entry-shell entry-shell--app' },
      h(EntryNav, { active: '/AdmissionsSurvey', language: 'en', showDestinations: hasDestinations }),
      h('main', { className: 'entry-app-main' },
        h('div', { className: 'entry-topline' },
          h('span', null, 'Bachelor’s studies after school')),
        h('div', { className: 'entry-survey-frame' },
          h('aside', { className: 'entry-survey-story' },
            h('p', { className: 'entry-eyebrow' }, 'YOUR NEXT CHAPTER'),
            h('h2', { className: 'entry-story-title' }, 'A direction starts with curiosity.')),
          h('section', { className: 'entry-survey-panel' },
            h('p', { className: 'entry-stepper-text' }, '01 Direction · 02 Preparation · 03 Budget'),
            h('h1', { className: 'entry-app-h1' }, page.heading),
            h('p', { className: 'entry-app-intro' }, page.intro),
            h('p', { className: 'sr-only' }, 'Select your study field, language test results such as IELTS or TOPIK, and target countries to check verified programme requirements before applying.'),
            h('ul', { className: 'entry-chip-grid', 'aria-hidden': 'true' },
              fieldChips.map(label => h('li', { key: label, className: 'entry-chip' }, label))),
            h('ul', { className: 'entry-footer-links' },
              discoveryLinks.map(link =>
                h('li', { key: link.href },
                  h('a', { href: link.href, className: 'discovery-link text-sm' }, link.label)
                )
              )
            )
          )
        )
      )
    );
  }

  // /Search, /ru/Search, /uz/Search
  return h('div', { className: 'entry-shell entry-shell--app' },
    h(EntryNav, { active: page.path, language, showDestinations: hasDestinations }),
    h('main', { className: 'entry-app-main entry-app-main--search' },
      h('div', { className: 'entry-search-header' },
        h('h1', { className: 'entry-app-h1' }, c.searchHeroTitle),
        h('p', { className: 'entry-app-intro' }, c.searchHeroIntro)),
      h('div', { className: 'entry-search-bar' },
        h('p', { className: 'entry-search-placeholder' }, page.intro)),
      previewRows.length > 0 && h('section', { 'aria-label': page.heading, className: 'entry-preview-grid' },
        previewRows.map(row => h('article', { key: row.href, className: 'entry-preview-card' },
          h('h2', { className: 'entry-preview-title' }, row.name),
          h('p', { className: 'entry-preview-meta' }, [row.city, row.country].filter(Boolean).join(', ') || 'International university'),
          row.photo && EntryPreviewPhoto(row.photo, language),
          h('a', { href: row.href, className: 'entry-preview-link' }, c.details, h('span', { className: 'sr-only' }, ` — ${row.name}`))))),
      h('section', { className: 'entry-discovery-strip' },
        h('h2', { className: 'entry-strip-heading' }, page.heading),
        h('nav', { 'aria-label': c.explore },
          h('ul', { className: 'entry-footer-links' },
            discoveryLinks.map(link =>
              h('li', { key: link.href },
                h('a', { href: link.href, className: 'discovery-link text-sm' }, link.label)
              )
            ),
            page.alternates && Object.entries(page.alternates).filter(([lang]) => lang !== 'x-default').map(([lang, href]) =>
              h('li', { key: lang },
                h('a', { href, hrefLang: lang, lang, className: 'discovery-link text-sm' }, LANGUAGE_NAMES[lang] || lang)
              )
            )
          )
        )
      )
    )
  );
}
