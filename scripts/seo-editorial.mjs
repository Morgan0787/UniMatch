// Editorial records are opt-in. A draft is never emitted or linked.
const polandSource = {
  label: 'Study in Poland — application guide', href: 'https://study.gov.pl/how-to-apply', detail: 'Checked 11 November 2026',
};
const germanySource = {
  label: 'DAAD — admission requirements overview', href: 'https://www.daad.de/en/studying-in-germany/requirements/overview/', detail: 'Checked 11 November 2026',
};

export const countries = {
  poland: {
    name: 'Poland',
    intro: 'Build a shortlist of Polish universities by degree, subject and city. For each programme, follow its source link to check the language of instruction and the current application round.',
    advice: 'Applications go directly to each institution. Make a separate checklist for each programme: required school documents, any translations, language evidence and the application deadline. The national study portal explains the process, and the university publishes the requirements for its own programme.',
    source: polandSource,
  },
  germany: {
    name: 'Germany',
    intro: 'Explore German universities and use the programme sources to compare degree options. Before you settle on a shortlist, check whether your school qualification gives you direct access to the course you want.',
    advice: 'Use the DAAD admission resources to check how your qualification is recognised. Confirm the outcome and the accepted language evidence with the university. Keep possible preparatory routes separate from direct entry when comparing how long each option could take.',
    source: germanySource,
  },
};

export const guides = [
  {
    state: 'published',
    slug: 'check-university-application-requirements',
    language: 'en',
    heading: 'How to check university application requirements',
    intro: 'Turn an overseas university shortlist into a checklist you can verify. Keep one record per programme and intake so requirements for different degrees or applicant groups do not get mixed together.',
    sections: [
      {
        heading: 'Record the exact programme and intake',
        paragraphs: ['Save the official programme and admissions links. Record the degree, campus, teaching language and intake. In Poland, apply directly to the institution and use its programme page to confirm the required documents and deadlines.'],
        links: [polandSource],
      },
      {
        heading: 'Check how your qualification is assessed',
        paragraphs: ['Identify your school qualification by its exact name and country. For Germany, start with the DAAD recognition resources, then ask the university whether your qualification gives you direct access to that programme or whether you need a preparatory route.'],
        links: [germanySource],
      },
      {
        heading: 'Separate confirmed details from open questions',
        paragraphs: ['Write down the date you checked each source, the language evidence it lists and the deadline that applies to your applicant group. If a page describes an earlier intake or another qualification, leave the field open and ask the admissions office to confirm it in writing.'],
      },
    ],
  },
];
