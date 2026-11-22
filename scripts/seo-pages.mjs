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
const studyIndex = { href: '/study', label: 'Study fields and degrees' };
const guideIndex = { href: '/guides', label: 'Application guides' };
const universityPath = institution => `/universities/${institution.slug}`;
const countryPath = key => `/countries/${key}`;
const COUNTRY_SLUGS = {
  uk: 'united-kingdom',
  'united kingdom': 'united-kingdom',
  usa: 'united-states',
  us: 'united-states',
  'united states': 'united-states',
  'south korea': 'south-korea',
  'republic of korea': 'south-korea',
};
const countrySlug = name => {
  const canonical = (canonicalCountry(name) || name || '').trim().toLowerCase();
  return COUNTRY_SLUGS[canonical] || canonical.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};
const location = institution => [...new Set([institution.city, institution.country].filter(Boolean))].join(', ');
const profileLabel = institution => `${institution.name} — ${location(institution)}`;
const institutionLink = institution => ({ href: universityPath(institution), label: institution.name, detail: location(institution) });
const matchesCountry = (name, country) => canonicalCountry(name)?.toLowerCase() === canonicalCountry(country)?.toLowerCase();
const ABSOLUTE = /^https:\/\//;

const STUDY_HUB_SPECS = [
  {
    slug: 'computer-science',
    heading: 'Study Computer Science bachelor’s degrees abroad',
    shortLabel: 'Computer Science',
    intro: 'Compare verified bachelor’s programmes in computer science, computing and informatics across Europe, the UK, the US and Asia. Open any university profile to verify tuition, teaching language and entry criteria.',
    advice: 'Check whether each programme follows a theoretical mathematics track, an applied software track or includes an international foundation option, and confirm language and math prerequisites directly on the official source.',
    matchesProgramme: item => item.field === 'computer_science' || /computer science|informatik|computing|informatics/i.test(item.name || ''),
  },
  {
    slug: 'business-and-management',
    heading: 'Study Business and Management bachelor’s degrees abroad',
    shortLabel: 'Business & Management',
    intro: 'Browse international bachelor’s programmes in business administration, international management, finance and economics. Review verified tuition periods and IELTS or school grade requirements before applying.',
    advice: 'Check carefully whether tuition is listed per year or per semester, whether international non-EU rates differ from domestic fees, and which mathematics or English test scores each business school accepts.',
    matchesProgramme: item => item.field === 'business' || /business|management|economics|finance|commerce/i.test(item.name || ''),
  },
  {
    slug: 'software-engineering',
    heading: 'Study Software Engineering and IT degrees abroad',
    shortLabel: 'Software Engineering & IT',
    intro: 'Explore accredited bachelor’s degrees in software engineering, information technology (IT) and information systems. Compare verified entry rules, application deadlines and teaching languages across countries.',
    advice: 'Compare project-based applied universities and research universities separately, check whether an entrance assessment or portfolio is required, and confirm deadlines on the linked official admissions page.',
    matchesProgramme: item => item.field === 'software_engineering' || item.field === 'it' || /software engineering|information technology|\bit\b|\bict\b|business information/i.test(item.name || ''),
  },
  {
    slug: 'computer-engineering',
    heading: 'Study Computer Engineering bachelor’s degrees abroad',
    shortLabel: 'Computer Engineering',
    intro: 'Discover verified undergraduate computer engineering degrees combining hardware architecture, embedded systems and software fundamentals, alongside published tuition and admission notes.',
    advice: 'Verify mathematics, physics and English test prerequisites on each programme source, as engineering tracks often list subject-specific secondary diploma minimums.',
    matchesProgramme: item => item.field === 'computer_engineering' || /computer engineering/i.test(item.name || ''),
  },
  {
    slug: 'data-science-and-ai',
    heading: 'Study Artificial Intelligence and Data Science abroad',
    shortLabel: 'AI & Data Science',
    intro: 'Compare undergraduate programmes in artificial intelligence, data science and machine learning with sourced tuition details and verified admission links.',
    advice: 'Pay close attention to mathematics entry scores and programming prerequisites, as AI and data science tracks frequently require higher secondary math grades or specific entrance exams.',
    matchesProgramme: item => /artificial intelligence|data science|machine learning/i.test(item.name || ''),
  },
  {
    slug: 'english-taught-bachelors',
    heading: 'English-taught bachelor’s degrees abroad',
    shortLabel: 'English-taught bachelor’s',
    intro: 'Compare bachelor’s programmes whose teaching language has been verified as English across the United Kingdom, Germany, Italy, Poland, the United States, Finland, the Netherlands, South Korea and more.',
    advice: 'Verify IELTS, TOEFL or Cambridge minimum overall and section scores for the target intake year, and check whether domestic administrative fees apply separately from tuition.',
    matchesProgramme: item => /english/i.test(item.teachingLanguage || ''),
  },
];

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

function trimMetaText(text, maxLen = 158) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0];
  if (firstSentence.length <= maxLen && firstSentence.length >= 60) return firstSentence;
  return `${clean.slice(0, maxLen - 1).replace(/\s+\S*$/, '')}.`;
}

function page(path, heading, intro, crumbs, sections, { actions = [catalog], ...rest } = {}) {
  const result = {
    path, heading, intro, language: 'en', title: `${heading} | UniMatch`, description: rest.description || trimMetaText(intro, 158),
    breadcrumbs: crumbs, sections, actions, ...rest,
  };
  result.schema = [breadcrumbs(result), ...(rest.schema || [])];
  return result;
}

function displayIntake({ text, year }) {
  const normalized = normalizeIntakeText(text);
  return normalized.includes(String(year)) ? normalized : `${normalized} ${year}`;
}

function profile(institution, countryLink, needsDisambiguation, { studyLinks = [], peerLinks = [], guideLinks = [] } = {}) {
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
    programme.languageRequirement ? `Language requirement: ${programme.languageRequirement.value}.` : null,
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

  const hubAndPeerLinks = [...new Map([
    ...(countryLink ? [[countryLink.href, countryLink]] : []),
    ...studyLinks.map(link => [link.href, link]),
    ...peerLinks.map(link => [link.href, link]),
    ...guideLinks.map(link => [link.href, link]),
  ]).values()];

  const sections = [
    { heading: 'Programmes in the UniMatch catalog', items: programmes },
    { heading: 'Institution overview & admissions notes', items: overviewItems },
    { heading: 'Official sources', links: cleanSources.map(source => ({
      href: source.url,
      label: source.title,
      detail: `${source.associations.join(' · ')} · Checked ${source.checkedAt}`,
    })) },
    ...(hubAndPeerLinks.length ? [{ heading: 'Related destinations, study fields and universities', links: hubAndPeerLinks }] : []),
  ];

  const baseLabel = profileLabel(institution);
  const disambig = needsDisambiguation ? ` (${institution.slug})` : '';
  const progSuffix = !needsDisambiguation && programme.name && baseLabel.length + programme.name.length < 72
    ? ` — ${programme.name}`
    : '';
  const universitySchemaId = `${SITE_URL}${path}#university`;
  const courseSchemas = institution.programmes.slice(0, 3).map((item, idx) => ({
    '@type': 'Course',
    '@id': `${SITE_URL}${path}#course-${idx + 1}`,
    name: item.name,
    provider: { '@id': universitySchemaId },
    ...(item.teachingLanguage ? { inLanguage: item.teachingLanguage } : {}),
    ...(item.degree ? { educationalCredentialAwarded: item.degree } : {}),
    ...(item.intake ? {
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'onsite',
        ...(item.teachingLanguage ? { inLanguage: item.teachingLanguage } : {}),
      },
    } : {}),
  }));
  const faqEntries = [
    {
      question: `Which programmes at ${name} are indexed in the UniMatch catalog?`,
      answer: `${name} (${where}) lists ${institution.programmes.slice(0, 3).map(item => `${item.name} (${item.degree})`).join(', ')}${programme.teachingLanguage ? `, with teaching language verified as ${programme.teachingLanguage}` : ''}${programme.intake ? ` for intake ${displayIntake(programme.intake)}` : ''}.`,
    },
    ...((programme.tuition || programme.languageRequirement || programme.academicRequirement || programme.deadline) ? [{
      question: `What verified tuition and entry facts are listed for ${programme.name} at ${name}?`,
      answer: [
        programme.tuition ? `Published tuition: ${programme.tuition.value}${programme.tuition.notice ? ` (${programme.tuition.notice})` : ''}.` : 'Tuition is not published in full on this record; verify on the official university source.',
        programme.languageRequirement ? `Language condition: ${programme.languageRequirement.value}.` : null,
        programme.academicRequirement ? `Academic condition: ${programme.academicRequirement.value}.` : null,
        programme.deadline ? `Published deadline: ${programme.deadline.value}.` : null,
      ].filter(Boolean).join(' '),
    }] : []),
    ...(cleanSources.length ? [{
      question: `Where should applicants verify official admission conditions for ${name}?`,
      answer: `Verify all current intake fees, documents and deadlines directly via ${cleanSources[0].title} (checked ${cleanSources[0].checkedAt})${institution.website ? ` or ${institution.website}` : ''}.`,
    }] : []),
  ];

  const tuitionShort = programme.tuition ? programme.tuition.value.replace(/\s*·\s*International.*$/i, '').trim() : null;
  const metaParts = [
    `${programme.name} at ${institution.name} (${where})`,
    programme.teachingLanguage ? `taught in ${programme.teachingLanguage}` : null,
    programme.intake ? displayIntake(programme.intake) : null,
    tuitionShort ? `tuition ${tuitionShort}` : null,
  ].filter(Boolean).join(', ');
  const disambigSuffix = needsDisambiguation ? ` (${institution.slug})` : '';
  const profileDesc = `${trimMetaText(`${metaParts}. Compare verified admission requirements.`, 158 - disambigSuffix.length)}${disambigSuffix}`;

  return page(path, name, intro, [home, universityIndex, ...(countryLink ? [countryLink] : [])], sections, {
    title: `${baseLabel}${progSuffix}${disambig} | UniMatch`,
    description: profileDesc,
    universityId: institution.id,
    actions: [
      ...(institution.website ? [{ href: institution.website, label: 'University website' }] : []),
      ...(countryLink ? [countryLink] : []),
      catalog,
      survey,
    ],
    schema: [
      {
        '@type': 'CollegeOrUniversity',
        '@id': universitySchemaId,
        name,
        url: institution.website || SITE_URL + path,
        ...(institution.website ? { sameAs: [institution.website] } : {}),
        address: {
          '@type': 'PostalAddress',
          addressCountry: canonicalCountry(institution.country),
          ...(institution.city ? { addressLocality: institution.city } : {}),
        },
      },
      ...courseSchemas,
      {
        '@type': 'FAQPage',
        mainEntity: faqEntries.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  });
}

export function buildDiscoveryPages(institutions, editorial = guides) {
  const profiles = [];
  const destinations = [];
  const study = [];
  const articles = [];

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
      language, actions: [{ ...survey, label: surveyLabels[language] }, catalog],
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

  // Build verified study field & language hubs (>= 3 institutions) plus Poland CS specialty page.
  const studyHubsByInstitution = new Map();
  for (const spec of STUDY_HUB_SPECS) {
    const matchingLinks = [];
    const matchingIds = new Set();
    for (const item of institutions) {
      const matchedProg = item.programmes.find(spec.matchesProgramme);
      if (!matchedProg) continue;
      matchingIds.add(item.id);
      matchingLinks.push({ ...institutionLink(item), detail: `${location(item)} · ${matchedProg.name}` });
    }
    if (matchingLinks.length < 3) continue;
    const hubPath = `/study/${spec.slug}`;
    const hubLink = { href: hubPath, label: spec.heading, detail: `${matchingLinks.length} universities` };
    for (const id of matchingIds) {
      const list = studyHubsByInstitution.get(id) || [];
      list.push({ href: hubPath, label: spec.shortLabel });
      studyHubsByInstitution.set(id, list);
    }
    const enGuides = articles.filter(article => article.language === 'en').slice(0, 2).map(a => ({ href: a.path, label: a.heading }));
    study.push(page(hubPath, spec.heading, spec.intro, [home, studyIndex], [
      { heading: `Universities offering ${spec.shortLabel}`, links: matchingLinks },
      { heading: 'What to check before applying', paragraphs: [spec.advice], ...(enGuides.length ? { links: enGuides } : {}) },
    ]));
  }

  const emittedDestinationsMeta = [];
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
    const matchingHubsForCountry = study.filter(hub =>
      hub.path !== '/study/computer-science-in-poland'
      && rows.some(inst => (studyHubsByInstitution.get(inst.id) || []).some(h => h.href === hub.path)));
    for (const hub of matchingHubsForCountry) subjectLinks.push({ href: hub.path, label: hub.heading });
    emittedDestinationsMeta.push({ key, country, rows, countryLink, subjectLinks });
  }

  for (const meta of emittedDestinationsMeta) {
    const siblingDestinations = emittedDestinationsMeta
      .filter(other => other.countryLink.href !== meta.countryLink.href)
      .slice(0, 5)
      .map(other => ({ href: other.countryLink.href, label: other.countryLink.label, detail: `${other.rows.length} universities` }));
    const planningLinks = [meta.country.source, ...(meta.country.extraSources || [])];
    destinations.push(page(meta.countryLink.href, meta.countryLink.label, meta.country.intro, [home, countryIndex], [
      { heading: `University profiles in ${meta.country.name}`, links: meta.rows.map(institutionLink) },
      { heading: 'Planning your application', paragraphs: [meta.country.advice], links: planningLinks },
      ...(meta.subjectLinks.length ? [{ heading: 'Explore by subject', links: meta.subjectLinks }] : []),
      ...(siblingDestinations.length ? [{ heading: 'Other study destinations', links: siblingDestinations }] : []),
    ]));
  }

  const nameCounts = new Map();
  for (const item of institutions) {
    const label = profileLabel(item).toLowerCase();
    nameCounts.set(label, (nameCounts.get(label) || 0) + 1);
  }
  const byCountryKey = new Map();
  for (const item of institutions) {
    const cSlug = countrySlug(item.country);
    const list = byCountryKey.get(cSlug) || [];
    list.push(item);
    byCountryKey.set(cSlug, list);
  }
  const enArticleLinks = articles.filter(a => a.language === 'en').slice(0, 1).map(a => ({ href: a.path, label: a.heading }));
  for (const item of institutions) {
    const cSlug = countrySlug(item.country);
    const destination = destinations.find(dest => dest.path === countryPath(cSlug));
    const peers = (byCountryKey.get(cSlug) || [])
      .filter(peer => peer.id !== item.id && peer.slug !== item.slug)
      .slice(0, 4)
      .map(institutionLink);
    profiles.push(profile(
      item,
      destination && { href: destination.path, label: destination.heading },
      nameCounts.get(profileLabel(item).toLowerCase()) > 1,
      {
        studyLinks: studyHubsByInstitution.get(item.id) || [],
        peerLinks: peers,
        guideLinks: enArticleLinks,
      },
    ));
  }

  const languageDetail = { en: 'English guide', ru: 'Русский · Руководство', uz: 'Oʻzbekcha · Qo‘llanma' };
  const indexes = [
    ...(profiles.length ? [page(universityIndex.href, universityIndex.label,
      'Browse university profiles with official programme sources. Open a profile to find degree options and links you can use to confirm current admission details.',
      [home], [{ heading: 'Universities', links: institutions.map(institutionLink) }])] : []),
    ...(destinations.length ? [page(countryIndex.href, countryIndex.label,
      'Explore destinations with sourced university profiles and practical steps for checking your application requirements.',
      [home], [{ heading: 'Countries', links: destinations.map(dest => ({ href: dest.path, label: dest.heading })) }])] : []),
    ...(study.length ? [page(studyIndex.href, studyIndex.label,
      'Explore verified bachelor’s programmes grouped by study subject and English-taught availability across top destinations.',
      [home], [{ heading: 'Study fields & tracks', links: study.map(hub => ({ href: hub.path, label: hub.heading })) }])] : []),
    ...(articles.length ? [page(guideIndex.href, guideIndex.label,
      'Use these practical checklists to prepare your study shortlist and verify information before you apply.',
      [home], [{ heading: 'Guides', links: articles.map(article => ({ href: article.path, label: article.heading, detail: languageDetail[article.language] || article.language })) }])] : []),
  ];
  const pages = [...indexes, ...profiles, ...destinations, ...study, ...articles];
  if (new Set(pages.map(entry => entry.path)).size !== pages.length) throw new Error('Duplicate discovery path');
  return { pages, catalogLinks: indexes.map(entry => ({ href: entry.path, label: entry.heading })) };
}
