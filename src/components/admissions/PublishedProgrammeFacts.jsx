import React from 'react';
import { describePublicFact } from '@/lib/admissions/factPresentation';

const LABELS = {
  en: { programme: 'Programme', tuition: 'Tuition', costReference: 'Cost reference', includes: 'Includes', excludes: 'Excludes', academic: 'Academic requirement', language: 'Language requirement', languageLevel: 'Language threshold', deadline: 'Application deadline', teaching: 'Teaching language', degree: 'Degree', sources: 'Official sources', warning: 'Some published admissions data could not be validated. Details may be incomplete.', empty: 'No validated programmes are available.' },
  ru: { programme: 'Программа', tuition: 'Стоимость обучения', costReference: 'Справочная стоимость', includes: 'Включено', excludes: 'Не включено', academic: 'Академические требования', language: 'Требования к языку', languageLevel: 'Языковой порог', deadline: 'Срок подачи заявки', teaching: 'Язык обучения', degree: 'Степень', sources: 'Официальные источники', warning: 'Часть опубликованных данных о поступлении не прошла проверку. Сведения могут быть неполными.', empty: 'Нет проверенных программ.' },
  uz: { programme: 'Dastur', tuition: 'O‘qish haqi', costReference: 'Xarajat ma’lumoti', includes: 'Ichiga kiradi', excludes: 'Ichiga kirmaydi', academic: 'Akademik talab', language: 'Til talabi', languageLevel: 'Til chegarasi', deadline: 'Ariza muddati', teaching: 'Ta’lim tili', degree: 'Daraja', sources: 'Rasmiy manbalar', warning: 'E’lon qilingan qabul ma’lumotlarining bir qismi tekshiruvdan o‘tmadi. Tafsilotlar to‘liq bo‘lmasligi mumkin.', empty: 'Tekshirilgan dasturlar mavjud emas.' },
};

function factFor(programme, key) { return programme?.facts?.[key] ?? programme?.[key] ?? null; }
function sourcesFor(fact) {
  return [...(Array.isArray(fact?.sourceIds) ? fact.sourceIds : []), ...(Array.isArray(fact?.historical?.sourceIds) ? fact.historical.sourceIds : [])];
}
function quoteLabel(fact, fallback) {
  const value = fact?.historical?.value ?? fact?.value;
  return typeof value?.label === 'string' && value.label.trim() ? value.label : fallback;
}
function sourceUrl(source) {
  if (typeof source?.url !== 'string') return null;
  try {
    const url = new URL(source.url);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function Fact({ label, fact, language, kind = 'text', includeScope = true }) {
  const result = describePublicFact(fact, language, kind, { includeScope });
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{result.value}</dd>
      {result.notice && <dd className="text-xs text-amber-700 mt-0.5">{result.notice}</dd>}
    </div>
  );
}

function CostReference({ fact, label, language, labels }) {
  const value = fact?.historical?.value ?? fact?.value;
  return <div className="sm:col-span-2 grid sm:grid-cols-2 gap-x-4 gap-y-2">
    <Fact label={label} fact={fact} language={language} kind="tuition" />
    {Array.isArray(value?.includedFees) && value.includedFees.length > 0 && <p className="text-xs text-slate-600">{labels.includes}: {value.includedFees.join(', ')}</p>}
    {Array.isArray(value?.excludedFees) && value.excludedFees.length > 0 && <p className="text-xs text-slate-600">{labels.excludes}: {value.excludedFees.join(', ')}</p>}
  </div>;
}

/** Displays only validated namespace facts; source links are resolved from its validated source map. */
export default function PublishedProgrammeFacts({ admissionCatalog, language = 'en', compact = false, expandable = false }) {
  if (!admissionCatalog) return null;
  const labels = LABELS[language] || LABELS.en;
  const extra = { en:{notes:'Published conditions',location:'Programme campus',intake:'Intake'},ru:{notes:'Опубликованные условия',location:'Кампус программы',intake:'Набор'},uz:{notes:'E’lon qilingan shartlar',location:'Dastur kampusi',intake:'Qabul davri'} }[language] || {notes:'Published conditions',location:'Programme campus',intake:'Intake'};
  const programmes = Array.isArray(admissionCatalog.programmes) ? admissionCatalog.programmes : [];
  const shown = compact ? programmes.slice(0, 1) : programmes;
  const sourceMap = admissionCatalog.sources && typeof admissionCatalog.sources === 'object' ? admissionCatalog.sources : {};
  const sourceIds = [...new Set(shown.flatMap(programme => {
    const facts = programme?.facts || programme || {};
    const factIds = Object.entries(facts).flatMap(([key, fact]) => ['costReferences','publicNotes'].includes(key) ? [] : sourcesFor(fact));
    const costIds = Array.isArray(programme?.costReferences) ? programme.costReferences.flatMap(sourcesFor) : [];
    const noteIds = Array.isArray(programme?.publicNotes) ? programme.publicNotes.flatMap(sourcesFor) : [];
    return [...factIds, ...costIds, ...noteIds];
  }))];
  const sources = sourceIds.map(id => sourceMap[id]).filter(sourceUrl);

  return (
    <section className="space-y-3" aria-label={labels.sources}>
      {admissionCatalog.status === 'invalid' && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2" role="status">{labels.warning}</p>}
      {shown.length === 0 ? <p className="text-sm text-slate-500">{labels.empty}</p> : shown.map(programme => {
        const name = describePublicFact(factFor(programme, 'name'), language).value;
        return (
          <article key={programme.id || name} className="rounded-lg border border-slate-200 p-3 space-y-2">
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">{labels.programme}</p><h4 className="font-semibold text-slate-800">{name}</h4></div>
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {compact ? <Fact label={labels.tuition} fact={factFor(programme, 'tuition')} language={language} kind="tuition" includeScope={false} /> : <>
              <Fact label={labels.degree} fact={factFor(programme, 'degree')} language={language} kind="degree" />
              {factFor(programme, 'location') && <Fact label={extra.location} fact={factFor(programme, 'location')} language={language} kind="location" />}
              <Fact label={extra.intake} fact={factFor(programme, 'intake')} language={language} kind="intake" />
              <Fact label={labels.teaching} fact={factFor(programme, 'teachingLanguage')} language={language} />
              <Fact label={labels.deadline} fact={factFor(programme, 'deadline')} language={language} kind="deadline" />
              <Fact label={labels.tuition} fact={factFor(programme, 'tuition')} language={language} kind="tuition" />
              </>}
            </dl>
            {!compact && <details className="text-sm"><summary className="cursor-pointer text-teal-800 underline underline-offset-2">{extra.notes}</summary><dl className="mt-3 grid sm:grid-cols-2 gap-3">
              <Fact label={labels.academic} fact={factFor(programme, 'academicRequirement')} language={language} kind="rule" />
              <Fact label={labels.language} fact={factFor(programme, 'languageRequirement')} language={language} kind="rule" />
              <Fact label={labels.languageLevel} fact={factFor(programme, 'languageThreshold')} language={language} kind="rule" />
              {(Array.isArray(programme.costReferences) ? programme.costReferences : []).map((reference, index) => <CostReference key={`${programme.id}-cost-${index}`} label={quoteLabel(reference, labels.costReference)} fact={reference} language={language} labels={labels} />)}
            </dl></details>}
          </article>
        );
      })}
      {compact && expandable && programmes.length > 0 && <details className="text-sm">
        <summary className="cursor-pointer rounded text-indigo-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">{{ en: 'Programme details and sources', ru: 'Условия программы и источники', uz: 'Dastur shartlari va manbalar' }[language] || 'Programme details and sources'}</summary>
        <div className="mt-3"><PublishedProgrammeFacts admissionCatalog={admissionCatalog} language={language} /></div>
      </details>}
      {!compact && sources.length > 0 && <div className="text-xs text-slate-600">
        <p className="font-medium mb-1">{labels.sources}</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {sources.map(source => <li key={source.key}><a className="underline underline-offset-2 text-indigo-700" href={sourceUrl(source)} target="_blank" rel="noopener noreferrer">{source.title || labels.sources}</a></li>)}
        </ul>
      </div>}
    </section>
  );
}
