import { ChevronDown } from 'lucide-react';
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
      {location ? (
        <p className="search-programme-campus">
          <span>{catalogCopy.programmeCampus}: </span>
          {[location.campus, catalogValue(location.country, language)].filter(Boolean).join(' · ')}
        </p>
      ) : (
        <p className="search-programme-campus search-programme-campus-muted">
          {catalogCopy.unknownCampus}
        </p>
      )}
    <dl className="search-programme-stats">
      <div className="search-stat-item">
        <dt>{copy.tuition}</dt>
        <dd><TuitionValue fact={fact('tuition')} language={language} concise /></dd>
        {budgetReason && <dd><small className="catalog-budget-reason">{budgetReason}</small></dd>}
      </div>
      <div className="search-stat-item">
        <dt>{copy.language}</dt>
        <dd>{languageParts[0]}</dd>
        {(languageParts.length > 1 || languageFact.notice) && <dd>
          <details className="search-language-conditions">
            <summary><span>{copy.conditions}</span><ChevronDown size={14} className="disclosure-chevron shrink-0" aria-hidden="true" /></summary>
            <div className="search-language-conditions-body">
              {languageParts.length > 1 && <p>{languageParts.slice(1).join(';').trim()}</p>}
              {languageFact.notice && <p>{languageFact.notice}</p>}
            </div>
          </details>
        </dd>}
      </div>
    </dl>
    <div className="search-programme-review">
      <h5>{copy.check}</h5>
      <p className="search-programme-check-item"><span>{copy.academic}:</span> {academic.value}</p>
    </div>
  </section>;
}
