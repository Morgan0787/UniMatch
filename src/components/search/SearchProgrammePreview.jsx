import { CircleAlert } from 'lucide-react';
import TuitionValue from '@/components/admissions/TuitionValue';
import { describePublicFact } from '@/lib/admissions/factPresentation';

const COPY = {
  en: { example: 'Programme example', tuition: 'Tuition', language: 'Language requirements', check: 'What to check:', notice: 'Confirm programme conditions', academic: 'Academic requirements', conditions: 'Conditions' },
  ru: { example: 'Программа (пример)', tuition: 'Стоимость обучения', language: 'Языковые требования', check: 'Что проверить:', notice: 'Нужно уточнить условия', academic: 'Академические требования', conditions: 'Условия' },
  uz: { example: 'Dastur namunasi', tuition: 'O‘qish haqi', language: 'Til talablari', check: 'Tekshirish kerak:', notice: 'Dastur shartlarini aniqlashtiring', academic: 'Akademik talablar', conditions: 'Shartlar' },
};

/** Search preview only: full validated facts and sources remain on the programme detail page. */
export default function SearchProgrammePreview({ admissionCatalog, language = 'en' }) {
  const copy = COPY[language] || COPY.en;
  const programme = admissionCatalog?.programmes?.[0];
  if (!programme) return null;
  const fact = key => programme.facts?.[key] ?? programme[key] ?? null;
  const name = describePublicFact(fact('name'), language, 'programme');
  const languageFact = describePublicFact(fact('languageRequirement'), language, 'rule', { includeScope: false });
  const academic = describePublicFact(fact('academicRequirement'), language, 'rule', { includeScope: false });
  const languageParts = languageFact.value.split(';');

  return <section className="search-programme-preview">
    <p className="search-programme-eyebrow">{copy.example}</p>
    <h4>{name.value}</h4>
    <dl className="search-programme-stats">
      <div>
        <dt>{copy.tuition}</dt>
        <dd><TuitionValue fact={fact('tuition')} language={language} concise /></dd>
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
      <p className="search-programme-status"><CircleAlert size={18} aria-hidden="true" />{copy.notice}</p>
      <h5>{copy.check}</h5>
      <ul><li>{copy.academic}: {academic.value}</li></ul>
    </div>
  </section>;
}
