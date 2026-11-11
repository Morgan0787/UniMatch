import { SITE_URL } from '../src/lib/seo.js';
import { countries, guides } from './seo-editorial.mjs';

const home = { href: '/', label: 'UniMatch' };
const catalog = { href: '/Search', label: 'Explore and compare universities' };
const universityIndex = { href: '/universities', label: 'University profiles' };
const countryIndex = { href: '/countries', label: 'Study destinations' };
const guideIndex = { href: '/guides', label: 'Application guides' };
const universityPath = institution => `/universities/${institution.slug}`;
const countryPath = key => `/countries/${key}`;
const location = institution => [...new Set([institution.city, institution.country].filter(Boolean))].join(', ');
const profileLabel = institution => `${institution.name} — ${location(institution)}`;
const institutionLink = institution => ({ href: universityPath(institution), label: institution.name, detail: location(institution) });
const matchesCountry = (name, country) => name?.trim().toLowerCase() === country.toLowerCase();
const ABSOLUTE = /^https:\/\//;

export function buildAppFallback(path, catalogLinks) {
  if (path === '/') {
    return {
      path, language: 'en', heading: 'Find your university abroad',
      intro: 'Explore international programmes and build a shortlist based on what you want to study, where you want to live and which requirements you can meet.',
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

function profile(institution, countryLink, needsDisambiguation) {
  const where = location(institution);
  const path = universityPath(institution);
  const programme = institution.programmes[0];
  const intro = `Explore ${institution.name} in ${where}, including ${programme.name}. See the official programme sources before you apply.`;
  const programmes = institution.programmes.map(programme =>
    [programme.name, programme.degree, programme.campus, programme.country].filter(Boolean).join(' · '));
  const sources = [...new Map(institution.programmes.flatMap(programme => programme.sources)
    .map(source => [source.url, source])).values()];
  const name = institution.name;
  return page(path, name, intro, [home, universityIndex], [
    { heading: 'Programmes in the UniMatch catalog', items: programmes },
    { heading: 'Official sources', links: sources.map(source => ({
      href: source.url,
      label: sources.some(other => other !== source && other.title === source.title)
        ? `${source.title} — ${new URL(source.url).pathname.split('/').filter(Boolean).at(-1) || new URL(source.url).hostname}` : source.title,
      detail: `Checked ${source.checkedAt}`,
    })) },
  ], {
    title: `${profileLabel(institution)}${needsDisambiguation ? ` (${institution.slug})` : ''} | UniMatch`,
    description: needsDisambiguation ? `${intro} Catalog reference: ${institution.slug}.` : intro,
    universityId: institution.id,
    actions: [
      ...(institution.website ? [{ href: institution.website, label: 'University website' }] : []),
      ...(countryLink ? [countryLink] : []),
      catalog,
      { href: `/University?id=${encodeURIComponent(institution.id)}`, label: 'Open interactive university details' },
    ],
    schema: [{
      '@type': 'CollegeOrUniversity', '@id': `${SITE_URL}${path}#university`, name,
      url: institution.website || SITE_URL + path,
      address: { '@type': 'PostalAddress', addressCountry: institution.country,
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
      language, ...(alternates ? { alternates } : {}),
      schema: [{
        '@type': 'Article', headline: heading, description: intro, inLanguage: language,
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
