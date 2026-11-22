import { catalogAlternates, catalogLanguage, catalogPath } from './discoveryContent.js';
import { SITE_URL } from './siteUrl.js';

export { SITE_URL };
export const SOCIAL_IMAGE = `${SITE_URL}/og-unimatch.png`;

// Existing application routes. The build adds reviewed discovery pages and
// localized catalog variants; account and legacy UUID routes remain noindex.
export const PUBLIC_PATHS = ['/', '/Search', '/AdmissionsSurvey'];
export const PRIVATE_PATHS = ['/University', '/Login', '/Profile', '/Recommendations', '/AdminDataQuality', '/AdminFeedback', '/EssayChecker'];

const copy = {
  en: {
    '/': ['UniMatch — Compare Universities Abroad, Tuition & Admission Requirements', 'Compare bachelor’s programmes abroad by tuition, IELTS/GPA requirements and country across the UK, Germany, Italy, Poland, the USA, Finland and more.'],
    '/Search': ['Explore Universities Abroad — Tuition, IELTS & Requirements | UniMatch', 'Search and compare international universities by tuition fees, English-taught bachelor’s degrees, deadlines, GPA and language requirements.'],
    '/AdmissionsSurvey': ['Find Universities by GPA, IELTS & Budget | UniMatch', 'Enter your academic background, study field and IELTS or TOPIK results to explore matched bachelor’s programmes and official entry requirements.'],
    private: ['Your workspace | UniMatch', 'Manage your UniMatch profile and explore your study options.'],
    missing: ['Page not found | UniMatch', 'This page could not be found. Explore universities with UniMatch.'],
  },
  ru: {
    '/': ['UniMatch — Поиск университетов и бакалавриата за рубежом', 'Сравнивайте зарубежные университеты по стоимости обучения, требованиям IELTS и GPA, срокам подачи и странам: Великобритания, Германия, Италия, Польша, США и др.'],
    '/Search': ['Университеты за рубежом — цены, требования и страны | UniMatch', 'Поиск и сравнение программ бакалавриата за рубежом: стоимость обучения, программы на английском, требования GPA, IELTS, TOPIK и дедлайны.'],
    '/AdmissionsSurvey': ['Подбор университетов по GPA, IELTS и бюджету | UniMatch', 'Укажите направление обучения, оценки и результаты IELTS или TOPIK, чтобы подобрать подходящие зарубежные университеты и проверить официальные требования.'],
    private: ['Личный кабинет | UniMatch', 'Управляйте профилем UniMatch и изучайте варианты обучения.'],
    missing: ['Страница не найдена | UniMatch', 'Эта страница не найдена. Изучайте университеты с UniMatch.'],
  },
  uz: {
    '/': ['UniMatch — Xorijiy universitetlar va bakalavr dasturlarini solishtirish', 'Xorijdagi bakalavr dasturlarini o‘qish haqi, IELTS va GPA talablari hamda mamlakatlar (Buyuk Britaniya, Germaniya, Italiya, Polsha, AQSh va boshqalar) bo‘yicha solishtiring.'],
    '/Search': ['Xorijiy universitetlar — narxlar, IELTS talablari va davlatlar | UniMatch', 'Xorijiy universitetlar va ingliz tilidagi bakalavr dasturlarini o‘qish narxi, muddatlar, GPA va til talablari bo‘yicha qidiring va solishtiring.'],
    '/AdmissionsSurvey': ['GPA, IELTS va budjet bo‘yicha universitet tanlash | UniMatch', 'Ta’lim yo‘nalishingiz, baholaringiz va IELTS yoki TOPIK natijalaringiz asosida mos xorijiy universitetlar hamda rasmiy qabul talablarini ko‘ring.'],
    private: ['Shaxsiy kabinet | UniMatch', 'UniMatch profilingizni boshqaring va ta’lim imkoniyatlarini o‘rganing.'],
    missing: ['Sahifa topilmadi | UniMatch', 'Bu sahifa topilmadi. UniMatch bilan universitetlarni o‘rganing.'],
  },
};

/** @param {string} pathname @param {string} [language] @param {import('./discoveryContent.js').DiscoveryPage} [discovery] */
export function getSeo(pathname, language = 'en', discovery) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (discovery?.path === normalized) {
    return {
      title: discovery.title, description: discovery.description,
      canonical: SITE_URL + discovery.path, robots: 'index, follow', image: SOCIAL_IMAGE,
      language: discovery.language, alternates: discovery.alternates || {},
      type: discovery.schema?.some(node => node['@type'] === 'Article') ? 'article' : 'website',
      schema: schemaGraph(discovery.schema),
    };
  }
  const catalogLocale = catalogLanguage(normalized);
  const knownPath = [...PUBLIC_PATHS, ...PRIVATE_PATHS, '/Home'].find(path => path.toLowerCase() === normalized.toLowerCase());
  const path = catalogLocale ? '/Search' : knownPath === '/Home' ? '/' : knownPath;
  const indexable = PUBLIC_PATHS.includes(path);
  const locale = catalogLocale || (Object.hasOwn(copy, language) ? language : 'en');
  const localized = copy[locale];
  const [title, description] = localized[indexable ? path : path ? 'private' : 'missing'];
  return {
    title,
    description,
    canonical: indexable ? SITE_URL + (catalogLocale ? catalogPath(catalogLocale) : path) : null,
    robots: indexable ? 'index, follow' : 'noindex, follow',
    image: SOCIAL_IMAGE,
    language: locale,
    alternates: catalogLocale ? catalogAlternates : {},
    type: 'website',
    schema: indexable ? schemaGraph() : null,
  };
}

export const siteSchema = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'UniMatch',
  url: `${SITE_URL}/`,
  inLanguage: ['en', 'ru', 'uz'],
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/Search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};


const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'UniMatch',
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: SOCIAL_IMAGE },
};

/** @param {Record<string, unknown>[]} [entities] */
function schemaGraph(entities = []) {
  return { '@context': 'https://schema.org', '@graph': [siteSchema, organization, ...entities] };
}
