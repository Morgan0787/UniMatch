import { useRef, useState } from 'react';

export function AnswerField({ name, label, value, onChange, options = null, error = false, hint = undefined, c, type = 'text', min = undefined, max = undefined, step = undefined }) {
  const id = `admission-${name}`;
  const description = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  const props = { id, name, value, onChange: event => onChange(name, event.target.value), 'aria-invalid': Boolean(error), 'aria-describedby': description || undefined };
  return <div className={`admission-field${hint ? ' admission-field-priority' : ''}`}>
    <label htmlFor={id}>{label}</label>
    {options ? <select {...props}><option value="">{c.any}</option>{Object.entries(options).map(([key, title]) => <option value={key} key={key}>{String(title)}</option>)}</select>
      : <input {...props} type={type} min={min} max={max} step={step} maxLength={type === 'text' ? 200 : undefined} inputMode={type === 'number' ? 'decimal' : undefined} />}
    {hint && <p id={`${id}-hint`} className="admission-hint">{hint}</p>}
    {error && <p id={`${id}-error`} className="admission-error">{c.invalid}</p>}
  </div>;
}

function QualificationFields({ answers, field, c }) {
  // Preserve names from older drafts instead of silently reclassifying a document.
  const credentials = { ...c.credentials };
  const countries = { ...c.schoolCountries };
  if (answers.credential && !Object.hasOwn(credentials, answers.credential)) credentials[answers.credential] = answers.credential;
  if (answers.schoolCountry && !Object.hasOwn(countries, answers.schoolCountry)) countries[answers.schoolCountry] = answers.schoolCountry;
  return <>
    <div className="admission-pair">{field('schoolCountry', c.schoolCountry, { options: countries })}{field('credential', c.credential, { options: credentials })}</div>
    <p className="admission-hint">{c.qualificationHint}</p>
  </>;
}

export default function SurveyFields({ step, answers, onChange, errors, c }) {
  const [gradesOpen, setGradesOpen] = useState(Boolean(answers.grade || answers.scale || answers.schoolCountry || answers.credential));
  const field = (name, label, extras = {}) => <AnswerField name={name} label={label} value={answers[name]} onChange={onChange} error={errors[name]} c={c} {...extras} />;
  if (step === 0) return <div className="admission-fields">
    <fieldset className="admission-fieldset admission-fieldset-directions">
      <legend>{c.field}</legend>
      <div className="admission-direction-grid" role="radiogroup" aria-label={c.field}>
        {Object.entries(c.fields).map(([value, label], index) => <label className="admission-direction-card" key={value}>
          <input type="radio" name="admission-field" value={value} aria-labelledby={`admission-direction-${value}`} aria-describedby={`admission-direction-${value}-hint`} checked={answers.field === value} onChange={() => onChange('field', value)} />
          <span className="admission-direction-mark" aria-hidden="true">{['01', '02', '03', '04', '05', '↗'][index % 6]}</span>
          <span className="admission-direction-body"><span id={`admission-direction-${value}`}>{String(label)}</span><small id={`admission-direction-${value}-hint`}>{c.fieldDescriptions[value]}</small></span>
        </label>)}
        <label className="admission-direction-card admission-direction-open">
          <input type="radio" name="admission-field" value="" aria-labelledby="admission-direction-open" aria-describedby="admission-direction-open-hint" checked={!answers.field} onChange={() => onChange('field', '')} />
          <span className="admission-direction-mark" aria-hidden="true">↗</span>
          <span className="admission-direction-body"><span id="admission-direction-open">{c.any}</span><small id="admission-direction-open-hint">{c.fieldDescriptions.open}</small></span>
        </label>
      </div>
    </fieldset>
    {field('language', c.language, { options: c.languages })}
    <fieldset aria-describedby="admission-region-hint"><legend>{c.regions}</legend><div className="admission-regions">
      {Object.entries(c.regionNames).map(([region, label]) => <label className="admission-choice" key={region}>
        <input type="checkbox" checked={answers.regions.includes(region)} onChange={event => onChange('regions', event.target.checked ? [...answers.regions, region] : answers.regions.filter(item => item !== region))} />
        <span>{String(label)}</span>
      </label>)}
    </div><p id="admission-region-hint" className="admission-hint">{c.regionHint}</p></fieldset>
  </div>;
  if (step === 1) return <div className="admission-fields">
    {field('exam', c.exam, { options: c.exams })}
    {answers.exam && answers.exam !== 'not_taken' && field('score', c.score, { type: 'number', min: 0, max: answers.exam === 'IELTS' ? 9 : answers.exam === 'TOPIK' ? 6 : 120, step: answers.exam === 'IELTS' ? 0.5 : answers.exam === 'TOPIK' ? 1 : 'any' })}
    <p className="admission-hint">{c.examHint}</p>
    <details open={gradesOpen} onToggle={event => setGradesOpen(event.currentTarget.open)}>
      <summary>{c.gradesToggle}</summary>
      <QualificationFields answers={answers} field={field} c={c} />
      <div className="admission-pair">{field('grade', c.grade, { type: 'number', min: 0, max: answers.scale ? Number(answers.scale) : undefined, step: 'any' })}{field('scale', c.scale, { options: c.scales })}</div>
      <p className="admission-hint">{c.gradeHint}</p>
    </details>
  </div>;
  return <div className="admission-fields">
    <div className="admission-pair">{field('budget', c.budget, { type: 'number', min: 0, step: 'any' })}{field('currency', c.currency, { options: { EUR: 'EUR', USD: 'USD', UZS: 'UZS', KRW: 'KRW', GBP: 'GBP', CAD: 'CAD' } })}</div>
    {field('scholarship', c.scholarship, { options: c.scholarships })}
    <p className="admission-hint">{c.budgetHint}</p>
  </div>;
}

export function RefineAnswers({ answers, onApply, c, errors }) {
  const [refinement, setRefinement] = useState(answers);
  const [applied, setApplied] = useState(false);
  const form = useRef(null);
  const update = (name, value) => { setRefinement(previous => ({ ...previous, [name]: value })); setApplied(false); };
  const field = (name, label, extras = {}) => <AnswerField name={name} label={label} value={refinement[name]} onChange={update} error={errors[name]} c={c} {...extras} />;
  return <details className="admission-refine">
    <summary>{c.refine}</summary><p className="admission-hint">{!answers.credential ? c.refinePriority : c.refineIntro}</p>
    <form ref={form} noValidate onSubmit={event => {
      event.preventDefault();
      const accepted = onApply(refinement);
      setApplied(accepted);
      if (!accepted) requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
    }}>
      <div className="admission-fields">
        {answers.exam === 'IELTS' && <fieldset className="admission-fieldset">
          <legend>{c.ieltsSections}</legend>
          <p className="admission-hint">{c.ieltsSectionsHint}</p>
          <div className="admission-pair">
            {field('listening', c.ieltsListening, { type: 'number', min: 0, max: 9, step: 0.5 })}
            {field('reading', c.ieltsReading, { type: 'number', min: 0, max: 9, step: 0.5 })}
            {field('writing', c.ieltsWriting, { type: 'number', min: 0, max: 9, step: 0.5 })}
            {field('speaking', c.ieltsSpeaking, { type: 'number', min: 0, max: 9, step: 0.5 })}
          </div>
        </fieldset>}
        <QualificationFields answers={refinement} field={field} c={c} />
        <div className="admission-pair">{field('startYear', c.startYear, { type: 'number', min: 2000, max: 9999, step: 1 })}{field('language', c.language, { options: c.languages })}</div>
        {answers.exam && answers.exam !== 'not_taken' && field('examDate', c.examDate, { type: 'date' })}
      </div>
      <button type="submit" className="admission-button">{c.apply}</button>
      <p role="status">{applied ? c.applied : ''}</p>
    </form>
  </details>;
}
