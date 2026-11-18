import TuitionValue from '@/components/admissions/TuitionValue';
import { describePublicFact } from '@/lib/admissions/factPresentation';
import { catalogValue } from '@/lib/catalogCopy';
import { getCatalogueProgrammeLocation, getCatalogueProgrammeFact } from '@/lib/catalogResults';
import { catalogSearchCopy } from '@/lib/catalogSearchCopy';

const COPY = {
  en: { example: 'Programme example', tuition: 'Tuition', language: 'Language requirements', check: 'What to check:', academic: 'Academic requirements', conditions: 'Conditions' },
  ru: { example: 'Программа (пример)', tuition: 'Стоимость обучения', language: 'Языковые требования', check: 'Что проверить:', academic: 'Академические требования', conditions: 'Условия' },
  uz: { example: 'Dastur namunasi', tuition: 'O‘qish haqi', language: 'Til talablari', check: 'Tekshirish kerak:', academic: 'Akademik talablar', conditions: 'Shartlar' },
};

/** Search preview only: full validated facts and sources remain on the programme detail page. */
export default function SearchProgrammePreview({ programme, budgetReason = '', language = 'en' }) {
  const copy = COPY[language] || COPY.en;
  const catalogCopy = catalogSearchCopy(language);
  if (!programme) return null;
  const fact = key => getCatalogueProgrammeFact(programme, key);
  const name = describePublicFact(fact('name'), language, 'programme');
  const location = getCatalogueProgrammeLocation(programme);
  const languageFact = describePublicFact(fact('languageRequirement'), language, 'rule', { includeScope: false });
  const academic = describePublicFact(fact('academicRequirement'), language, 'rule', { includeScope: false });
  const languageParts = languageFact.value.split(';');

  return <section className="search-programme-preview">
    <p className="search-programme-eyebrow">{copy.example}</p>
    <h4>{name.value}</h4>
    <dl className="search-programme-campus mb-1 text-sm leading-snug">
      <dt className="font-semibold">{catalogCopy.programmeCampus}</dt>
      <dd>{location ? [location.campus, catalogValue(location.country, language)].filter(Boolean).join(' · ') : catalogCopy.unknownCampus}</dd>
    </dl>
    <dl className="search-programme-stats">
      <div>
        <dt>{copy.tuition}</dt>
        <dd><TuitionValue fact={fact('tuition')} language={language} concise /></dd>
        {budgetReason && <dd><small className="catalog-budget-reason">{budgetReason}</small></dd>}
      </div>
      <div>
        <dt>{copy.language}</dt>
        <dd>{languageParts[0]}</dd>
        {(languageParts.length > 1 || languageFact.notice) && <dd>
          <details className="search-language-conditions">
            <summary>{copy.conditions}</summary>
            {languageParts.length > 1 && <p>{languageParts.slice(1).join(';').trim()}</p>}
            {languageFact.notice && <p>{languageFact.notice}</p>}
          </details>
        </dd>}
      </div>
    </dl>
    <div className="search-programme-review">
      <h5>{copy.check}</h5>
      <ul><li>{copy.academic}: {academic.value}</li></ul>
    </div>
  </section>;
}
