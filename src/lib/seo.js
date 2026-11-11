import { catalogAlternates, catalogLanguage, catalogPath } from './discoveryContent.js';

export const SITE_URL = 'https://getunimatch.app';
export const SOCIAL_IMAGE = `${SITE_URL}/og-unimatch.png`;

// Existing application routes. The build adds reviewed discovery pages and
// localized catalog variants; account and legacy UUID routes remain noindex.
export const PUBLIC_PATHS = ['/', '/Search', '/AdmissionsSurvey'];
export const PRIVATE_PATHS = ['/University', '/Login', '/Profile', '/Recommendations', '/AdminDataQuality', '/AdminFeedback', '/EssayChecker'];

const copy = {
  en: {
    '/': ['UniMatch — Find your university abroad', 'Explore universities abroad, compare options and build your shortlist. Start with your study interests, budget and language skills.'],
    '/Search': ['Explore universities abroad | UniMatch', 'Browse international universities and compare countries, tuition, scholarships and admission requirements to build your university shortlist.'],
    '/AdmissionsSurvey': ['Find universities for your academic profile | UniMatch', 'Explore university options using your academic background and language exam results. Check preliminary admission matches and official requirements.'],
    private: ['Your workspace | UniMatch', 'Manage your UniMatch profile and explore your study options.'],
    missing: ['Page not found | UniMatch', 'This page could not be found. Explore universities with UniMatch.'],
  },
  ru: {
    '/': ['UniMatch — Найдите университет за рубежом', 'Изучайте университеты за рубежом, сравнивайте варианты и сохраняйте избранное с учётом ваших интересов, бюджета и знания языков.'],
    '/Search': ['Университеты за рубежом | UniMatch', 'Сравнивайте зарубежные университеты, страны, стоимость обучения, стипендии и требования к поступлению.'],
    '/AdmissionsSurvey': ['Подбор университетов по вашему профилю | UniMatch', 'Найдите варианты обучения с учётом образования и языковых экзаменов. Проверьте предварительное соответствие и официальные требования.'],
    private: ['Личный кабинет | UniMatch', 'Управляйте профилем UniMatch и изучайте варианты обучения.'],
    missing: ['Страница не найдена | UniMatch', 'Эта страница не найдена. Изучайте университеты с UniMatch.'],
  },
  uz: {
    '/': ['UniMatch — Xorijda universitetingizni toping', 'Xorijiy universitetlarni o‘rganing, variantlarni solishtiring va qiziqishlaringiz, budjetingiz hamda til bilimingizga mos ro‘yxat tuzing.'],
    '/Search': ['Xorijiy universitetlar | UniMatch', 'Xorijiy universitetlar, mamlakatlar, o‘qish narxlari, stipendiyalar va qabul talablarini solishtiring.'],
    '/AdmissionsSurvey': ['Akademik profilingizga mos universitetlar | UniMatch', 'Ta’limingiz va til imtihoni natijalaringiz asosida universitetlarni o‘rganing. Dastlabki moslik va rasmiy talablarni tekshiring.'],
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
  publisher: { '@id': `${SITE_URL}/#organization` },
};


const organization = { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'UniMatch', url: `${SITE_URL}/` };

/** @param {Record<string, unknown>[]} [entities] */
function schemaGraph(entities = []) {
  return { '@context': 'https://schema.org', '@graph': [siteSchema, organization, ...entities] };
}
