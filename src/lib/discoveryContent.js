import { createElement as h } from 'react';

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
    explore: 'Explore university profiles and study guides',
    links: ['University profiles', 'Study destinations', 'Application guides'],
  },
  ru: {
    heading: 'Университеты за рубежом',
    intro: 'Начните со страны, уровня образования и специальности. Сравнивайте программы с похожими условиями поступления и сверяйте сведения на официальном сайте перед подачей документов.',
    checklist: 'Что проверить перед выбором вуза',
    advice: 'Уточните язык обучения и список принимаемых сертификатов. Сравнивайте плату за один и тот же период, а жильё и другие расходы учитывайте отдельно. Если стоимость или требование не указаны, уточните их в университете.',
    explore: 'Профили вузов и материалы о поступлении',
    links: ['Профили университетов', 'Страны обучения', 'Руководства по поступлению'],
  },
  uz: {
    heading: 'Xorijiy universitetlar',
    intro: 'Avval mamlakat, ta’lim bosqichi va yo‘nalishni tanlang. Qabul tartibi o‘xshash dasturlarni solishtiring va hujjat topshirishdan oldin dastur haqidagi ma’lumotni rasmiy saytdan tekshiring.',
    checklist: 'Universitet tanlashdan oldin nimalarni tekshirish kerak?',
    advice: 'Ta’lim tili va qabul qilinadigan sertifikatlarni aniqlang. Bir xil muddat uchun o‘qish to‘lovini taqqoslang, turar joy va boshqa yashash xarajatlarini alohida hisoblang. Narx yoki talab ko‘rsatilmagan bo‘lsa, universitetdan so‘rang.',
    explore: 'Universitet profillari va qo‘llanmalar',
    links: ['Universitet profillari', 'Ta’lim mamlakatlari', 'Qabul bo‘yicha qo‘llanmalar'],
  },
};

/** @param {string} language @param {DiscoveryLink[]} links */
export function localizedDiscoveryLinks(language, links) {
  const copy = catalogCopy[language] || catalogCopy.en;
  const labels = Object.fromEntries(['/universities', '/countries', '/guides'].map((path, i) => [path, copy.links[i]]));
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
  return h('main', { className: standalone ? 'discovery-canvas' : 'discovery-canvas discovery-embedded' },
    h('div', { className: 'discovery-card' },
      standalone && h('header', { className: 'discovery-header' },
        h('a', { href: '/', className: 'discovery-brand' }, 'UniMatch'),
        h('a', { href: '/Search', className: 'discovery-link text-sm font-medium' }, 'Explore catalog')),
      page.breadcrumbs?.length ? h('nav', { 'aria-label': 'Breadcrumb', className: 'discovery-breadcrumb mb-5 text-sm' },
        h('ol', { className: 'flex flex-wrap gap-x-2 gap-y-1' }, page.breadcrumbs.map(({ href, label }) =>
          h('li', { key: href }, h('a', { href }, label), ' /')))) : null,
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
      h(DiscoverySections, { sections: page.sections, cards: directory }),
      !directory && page.actions?.length ? linkList(page.actions) : null,
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
