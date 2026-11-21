import { SITE_URL } from '../src/lib/seo.js';
import { homeHero } from '../src/lib/discoveryContent.js';
import { normalizeIntakeText } from '../src/lib/admissions/factPresentation.js';
import { namedPublicSources } from '../src/lib/admissions/sourcePresentation.js';
import { canonicalCountry } from '../src/lib/universityGeography.js';
import { countries, guides } from './seo-editorial.mjs';

const home = { href: '/', label: 'UniMatch' };
const catalog = { href: '/Search', label: 'Explore and compare universities' };
const survey = { href: '/AdmissionsSurvey', label: 'Find my match' };
const surveyLabels = { en: survey.label, ru: 'Подобрать университеты', uz: 'Mos universitetlarni topish' };
const universityIndex = { href: '/universities', label: 'University profiles' };
const countryIndex = { href: '/countries', label: 'Study destinations' };
const guideIndex = { href: '/guides', label: 'Application guides' };
const universityPath = institution => `/universities/${institution.slug}`;
const countryPath = key => `/countries/${key}`;
const location = institution => [...new Set([institution.city, institution.country].filter(Boolean))].join(', ');
const profileLabel = institution => `${institution.name} — ${location(institution)}`;
const institutionLink = institution => ({ href: universityPath(institution), label: institution.name, detail: location(institution) });
const matchesCountry = (name, country) => canonicalCountry(name)?.toLowerCase() === canonicalCountry(country)?.toLowerCase();
const ABSOLUTE = /^https:\/\//;

export function buildAppFallback(path, catalogLinks) {
  if (path === '/') {
    return {
      path, language: 'en', heading: homeHero.en.lines.join(' '), intro: homeHero.en.intro,
      sections: [
        { heading: 'Explore your options', links: [catalog, { href: '/AdmissionsSurvey', label: 'Find options for your academic profile' }, ...catalogLinks] },
        { heading: 'Confirm the details before applying', paragraphs: ['Start with the published programme sources. Use UniMatch to compare your options, then confirm the application conditions with the university for your chosen intake.'] },
      ],
    };
  }
  return {
    path, language: 'en', heading: 'Find universities for your academic profile',
    intro: 'Use your education, subject interests and available language results to explore possible bachelor’s programmes.',
    sections: [
      { heading: 'What the survey can tell you', paragraphs: ['Your results are a starting point for reviewing programmes. Check the source and applicant scope for each requirement, and confirm any gaps with the university before you apply.'] },
    ],
    actions: [catalog, ...catalogLinks],
  };
}

function breadcrumbs(page) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [...page.breadcrumbs, { href: page.path, label: page.heading }].map(({ href, label }, i) => ({
      '@type': 'ListItem', position: i + 1, name: label, item: SITE_URL + href,
    })),
  };
}

function page(path, heading, intro, crumbs, sections, { actions = [catalog], ...rest } = {}) {
  const result = {
    path, heading, intro, language: 'en', title: `${heading} | UniMatch`, description: intro,
    breadcrumbs: crumbs, sections, actions, ...rest,
  };
  result.schema = [breadcrumbs(result), ...(rest.schema || [])];
  return result;
}

function displayIntake({ text, year }) {
  const normalized = normalizeIntakeText(text);
  return normalized.includes(String(year)) ? normalized : `${normalized} ${year}`;
}

function profile(institution, countryLink, needsDisambiguation) {
  const where = location(institution);
  const path = universityPath(institution);
  const programme = institution.programmes[0];
  const intro = [
    `Explore ${programme.name} at ${institution.name} (${where}).`,
    programme.teachingLanguage
      ? `The programme is taught in ${programme.teachingLanguage}${!programme.intake && programme.teachingLanguageYear ? ` for the ${programme.teachingLanguageYear} intake` : ''}.`
      : null,
    programme.intake ? `Its published intake is ${displayIntake(programme.intake)}.` : null,
    programme.tuition
      ? `Published tuition: ${programme.tuition.value}${programme.tuition.notice ? ` (${programme.tuition.notice})` : ''}.`
      : null,
    'Review the official programme sources before applying.',
  ].filter(Boolean).join(' ');
  const programmes = institution.programmes.map(item => {
    return [
      `${item.name} (${item.degree})`, item.campus, item.country,
      item.teachingLanguage ? `Teaching language${item.intake ? '' : ` (${item.teachingLanguageYear})`}: ${item.teachingLanguage}` : null,
      item.intake ? `Intake: ${displayIntake(item.intake)}` : null,
      item.tuition ? `Tuition: ${item.tuition.value}${item.tuition.notice ? ` — ${item.tuition.notice}` : ''}` : 'Tuition: Not published / confirm on official site',
      item.deadline ? `Deadline: ${item.deadline.value}${item.deadline.notice ? ` — ${item.deadline.notice}` : ''}` : null,
      item.languageRequirement ? `Language: ${item.languageRequirement.value}${item.languageRequirement.notice ? ` — ${item.languageRequirement.notice}` : ''}` : null,
      item.academicRequirement ? `Academic requirements: ${item.academicRequirement.value}${item.academicRequirement.notice ? ` — ${item.academicRequirement.notice}` : ''}` : null,
    ].filter(Boolean).join(' · ');
  });
  const sourcesByUrl = new Map();
  for (const item of institution.programmes) {
    for (const source of item.sources) {
      const entry = sourcesByUrl.get(source.url) || { ...source, associations: new Set() };
      const facts = [...new Set((item.evidenceSources || [])
        .filter(evidence => evidence.url === source.url).map(evidence => evidence.fact))];
      entry.associations.add(`${item.name}${facts.length ? ` (${facts.join(', ')})` : ''}`);
      sourcesByUrl.set(source.url, entry);
    }
  }
  const rawSources = [...sourcesByUrl.values()].map(source => ({
    ...source,
    associations: [...source.associations],
  }));
  const cleanSources = namedPublicSources(rawSources, 'en');
  const name = institution.name;
  const overviewItems = [
    where ? `Location: ${where}` : null,
    institution.website ? `Official website: ${institution.website}` : null,
    `Catalogued programmes: ${institution.programmes.length}`,
    programme.tuition ? `Lead programme tuition (${programme.name}): ${programme.tuition.value}${programme.tuition.notice ? ` (${programme.tuition.notice})` : ''}` : null,
    programme.deadline ? `Lead programme deadline (${programme.name}): ${programme.deadline.value}` : null,
    programme.languageRequirement ? `Lead language condition (${programme.name}): ${programme.languageRequirement.value}` : null,
    programme.academicRequirement ? `Lead academic condition (${programme.name}): ${programme.academicRequirement.value}` : null,
  ].filter(Boolean);
  return page(path, name, intro, [home, universityIndex], [
    { heading: 'Programmes in the UniMatch catalog', items: programmes },
    { heading: 'Institution overview & admissions notes', items: overviewItems },
    { heading: 'Official sources', links: cleanSources.map(source => ({
      href: source.url,
      label: source.title,
      detail: `${source.associations.join(' · ')} · Checked ${source.checkedAt}`,
    })) },
  ], {
    title: `${profileLabel(institution)}${needsDisambiguation ? ` (${institution.slug})` : ''} | UniMatch`,
    description: needsDisambiguation ? `${intro} Catalog reference: ${institution.slug}.` : intro,
    universityId: institution.id,
    actions: [
      ...(institution.website ? [{ href: institution.website, label: 'University website' }] : []),
      ...(countryLink ? [countryLink] : []),
      catalog,
      survey,
    ],
    schema: [{
      '@type': 'CollegeOrUniversity', '@id': `${SITE_URL}${path}#university`, name,
      url: institution.website || SITE_URL + path,
      address: { '@type': 'PostalAddress', addressCountry: canonicalCountry(institution.country),
        ...(institution.city ? { addressLocality: institution.city } : {}) },
    }],
  });
}

export function buildDiscoveryPages(institutions, editorial = guides) {
  const profiles = [];
  const destinations = [];
  const study = [];
  const articles = [];

  for (const [key, country] of Object.entries(countries)) {
    const rows = institutions.filter(item => matchesCountry(item.country, country.name));
    if (rows.length < 3) continue;
    const countryLink = { href: countryPath(key), label: `Study in ${country.name}` };
    const subjectLinks = [];
    if (key === 'poland') {
      // Deliberately curated; classification alone can include AI or engineering tracks.
      const examples = new Set(['oc90-032', 'oc90-035', 'oc90-038', 'oc90-033']);
      const links = rows.filter(item => examples.has(item.slug)).flatMap(item => {
        const programme = item.programmes.find(p => p.field === 'computer_science' && p.degree === 'Bachelor'
          && matchesCountry(p.country, 'Poland') && /computer science/i.test(p.name));
        return programme ? [{ ...institutionLink(item), detail: programme.name }] : [];
      });
      if (links.length >= 2) {
        const path = '/study/computer-science-in-poland';
        study.push(page(path, 'Study computer science in Poland',
          'Compare selected bachelor’s programmes in computer science at Polish universities. Start with the programme name and campus, then follow the sources on each university profile.',
          [home, countryIndex, countryLink], [
            { heading: 'Computer science programmes', links },
            { heading: 'How to compare the programmes', paragraphs: ['Read the course lists to see how each programme balances programming, mathematics and systems. Confirm the teaching language for your track and check what documents the university requires for the intake you plan to apply to.'], links: [country.source] },
          ]));
        subjectLinks.push({ href: path, label: 'Computer science in Poland' });
      }
    }
    destinations.push(page(countryLink.href, countryLink.label, country.intro, [home, countryIndex], [
      { heading: `University profiles in ${country.name}`, links: rows.map(institutionLink) },
      { heading: 'Planning your application', paragraphs: [country.advice], links: [country.source] },
      ...(subjectLinks.length ? [{ heading: 'Explore by subject', links: subjectLinks }] : []),
    ]));
  }

  const nameCounts = new Map();
  for (const item of institutions) {
    const label = profileLabel(item).toLowerCase();
    nameCounts.set(label, (nameCounts.get(label) || 0) + 1);
  }
  for (const item of institutions) {
    const destination = destinations.find(dest => dest.path === countryPath(item.country.trim().toLowerCase()));
    profiles.push(profile(item, destination && { href: destination.path, label: destination.heading },
      nameCounts.get(profileLabel(item).toLowerCase()) > 1));
  }

  const published = editorial.filter(entry => entry.state === 'published');
  for (const guide of published) {
    const { language, slug, heading, intro, sections } = guide;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !['en', 'ru', 'uz'].includes(language)
      || !heading?.trim() || !intro?.trim() || !sections?.some(section => section.paragraphs?.some(text => text.trim()))
      || !sections.some(section => section.links?.some(link => ABSOLUTE.test(link.href) && link.detail))) {
      throw new Error(`Invalid published guide: ${slug}`);
    }
    const path = `${language === 'en' ? '' : `/${language}`}/guides/${slug}`;
    const alternateEntries = published.filter(entry => entry.translationKey && entry.translationKey === guide.translationKey);
    if (new Set(alternateEntries.map(entry => entry.language)).size !== alternateEntries.length) {
      throw new Error(`Duplicate language in guide translations: ${guide.translationKey}`);
    }
    const alternates = alternateEntries.length > 1
      ? Object.fromEntries(alternateEntries.map(entry => [entry.language, `${entry.language === 'en' ? '' : `/${entry.language}`}/guides/${entry.slug}`])) : null;
    if (alternates?.en) alternates['x-default'] = alternates.en;
    articles.push(page(path, heading, intro, [home, guideIndex], sections, {
      language, actions: [catalog, { ...survey, label: surveyLabels[language] }],
      ...(alternates ? { alternates } : {}),
      schema: [{
        '@type': 'Article', headline: heading, description: intro, inLanguage: language,
        ...(guide.datePublished ? { datePublished: guide.datePublished } : {}),
        ...(guide.dateModified ? { dateModified: guide.dateModified } : {}),
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: SITE_URL + path,
      }],
    }));
  }

  const indexes = [
    ...(profiles.length ? [page(universityIndex.href, universityIndex.label,
      'Browse university profiles with official programme sources. Open a profile to find degree options and links you can use to confirm current admission details.',
      [home], [{ heading: 'Universities', links: institutions.map(institutionLink) }])] : []),
    ...(destinations.length ? [page(countryIndex.href, countryIndex.label,
      'Explore destinations with sourced university profiles and practical steps for checking your application requirements.',
      [home], [{ heading: 'Countries', links: destinations.map(dest => ({ href: dest.path, label: dest.heading })) }])] : []),
    ...(articles.length ? [page(guideIndex.href, guideIndex.label,
      'Use these practical checklists to prepare your study shortlist and verify information before you apply.',
      [home], [{ heading: 'Guides', links: articles.map(article => ({ href: article.path, label: article.heading })) }])] : []),
  ];
  const pages = [...indexes, ...profiles, ...destinations, ...study, ...articles];
  if (new Set(pages.map(entry => entry.path)).size !== pages.length) throw new Error('Duplicate discovery path');
  return { pages, catalogLinks: indexes.map(entry => ({ href: entry.path, label: entry.heading })) };
}
