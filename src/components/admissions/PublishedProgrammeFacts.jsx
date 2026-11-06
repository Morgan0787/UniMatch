import React, { useId, useState } from 'react';
import OptionSelect from '@/components/ui/OptionSelect';
import { Calendar, DollarSign, GraduationCap, Languages } from 'lucide-react';
import { describePublicFact, describePublicScope } from '@/lib/admissions/factPresentation';
import { groupPublicSources } from '@/lib/admissions/sourcePresentation';
import TuitionValue from './TuitionValue';
import OfficialSources from './OfficialSources';

const LABELS = {
  en: { programme: 'Programme', tuition: 'Tuition', costReference: 'Cost reference', includes: 'Includes', excludes: 'Excludes', academic: 'Academic requirement', language: 'Language requirement', languageLevel: 'Language threshold', deadline: 'Application deadline', teaching: 'Teaching language', degree: 'Degree', sources: 'Official sources', warning: 'Some published admissions data could not be validated. Details may be incomplete.', empty: 'No validated programmes are available.' },
  ru: { programme: 'Программа', tuition: 'Стоимость обучения', costReference: 'Справочная стоимость', includes: 'Включено', excludes: 'Не включено', academic: 'Академические требования', language: 'Требования к языку', languageLevel: 'Языковой порог', deadline: 'Срок подачи заявки', teaching: 'Язык обучения', degree: 'Степень', sources: 'Официальные источники', warning: 'Часть опубликованных данных о поступлении не прошла проверку. Сведения могут быть неполными.', empty: 'Нет проверенных программ.' },
  uz: { programme: 'Dastur', tuition: 'O‘qish haqi', costReference: 'Xarajat ma’lumoti', includes: 'Ichiga kiradi', excludes: 'Ichiga kirmaydi', academic: 'Akademik talab', language: 'Til talabi', languageLevel: 'Til chegarasi', deadline: 'Ariza muddati', teaching: 'Ta’lim tili', degree: 'Daraja', sources: 'Rasmiy manbalar', warning: 'E’lon qilingan qabul ma’lumotlarining bir qismi tekshiruvdan o‘tmadi. Tafsilotlar to‘liq bo‘lmasligi mumkin.', empty: 'Tekshirilgan dasturlar mavjud emas.' },
};

function factFor(programme, key) { return programme?.facts?.[key] ?? programme?.[key] ?? null; }
function needsConfirmation(fact) {
  return fact?.status === 'published_unconfirmed' || (fact?.applicability === 'unconfirmed' && !['unknown', 'historical_reference', 'estimate'].includes(fact?.status));
}
function quoteLabel(fact, fallback) {
  const value = fact?.historical?.value ?? fact?.value;
  return typeof value?.label === 'string' && value.label.trim() ? value.label : fallback;
}

function DeadlineValue({ fact, language, fallback }) {
  const value = fact?.status === 'historical_reference' ? fact.historical?.value : fact?.value;
  const entry = value?.entries?.length === 1 ? value.entries[0] : value;
  const date = entry?.date;
  if (fact?.status === 'unknown' || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || (value?.entries?.length > 1)) return fallback;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return fallback;
  const formatted = new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed);
  return <><time dateTime={date}>{formatted}</time><details className="programme-date-details"><summary>{{en:'Deadline conditions',ru:'Условия срока подачи',uz:'Ariza muddati shartlari'}[language]}</summary><p>{fallback}</p></details></>;
}

function Fact({ label, fact, language, kind = 'text', includeScope = true, compact = false, tile = false, icon: Icon = null, children = null }) {
  const result = describePublicFact(fact, language, kind, { includeScope: false });
  const scope = includeScope ? describePublicScope(fact?.scope, language) : '';
  const compactNotice = fact?.status === 'published_unconfirmed' || (fact?.applicability === 'unconfirmed' && fact?.status !== 'historical_reference')
    ? ({ en: 'Confirm for your intake', ru: 'Уточните для своего набора', uz: 'Qabul davri uchun aniqlashtiring' }[language] || 'Confirm for your intake')
    : result.notice;
  const ieltsParts = kind === 'rule' && /^(IELTS|минимальный IELTS)/.test(result.value) ? result.value.split(';') : [];
  const value = ieltsParts.length > 1 ? <><span className="programme-rule-main">{ieltsParts[0]}</span><span className="programme-rule-detail">{ieltsParts.slice(1).join(';').trim()}</span></> : result.value;
  const longRule = compact && kind === 'rule' && result.value.length > 100;
  const ruleValue = longRule ? <details className="programme-rule-conditions"><summary>{{en:'See full requirements',ru:'Смотреть все требования',uz:'Barcha talablarni ko‘rish'}[language] || 'See full requirements'}</summary><p>{value}</p></details> : value;
  const tuitionDetails = kind === 'tuition' && (fact?.value != null || fact?.historical?.value != null);
  return (
    <div className={tile ? 'programme-stat' : compact && kind !== 'tuition' ? 'programme-inline-fact' : undefined}>
      <dt className="text-xs text-slate-500">{Icon && <Icon size={16} aria-hidden="true" />}{label}</dt>
      <dd className={`programme-value font-medium text-slate-800 ${!fact || fact.status === 'unknown' ? 'programme-value-unknown' : ''} ${tuitionDetails ? 'catalog-tuition' : ''}`}>{kind === 'tuition' ? <TuitionValue fact={fact} language={language} concise /> : kind === 'deadline' ? <DeadlineValue fact={fact} language={language} fallback={result.value} /> : ruleValue}</dd>
      {kind !== 'tuition' && result.notice && fact?.status !== 'unknown' && !(compact && needsConfirmation(fact)) && <dd className="programme-fact-status text-xs text-amber-800"><details><summary>{compactNotice}</summary><p>{result.notice}</p></details></dd>}
      {tuitionDetails && <dd className="programme-price-details text-xs text-slate-600"><details><summary>{{en:'Price details',ru:'Что входит в цену',uz:'Narx tafsilotlari'}[language] || 'Price details'}</summary><p>{result.value}</p>{result.notice && <p>{result.notice}</p>}{scope && <p>{scope}</p>}</details></dd>}
      {scope && !compact && !tuitionDetails && <dd className="text-xs text-slate-600"><details><summary className="cursor-pointer">{{en:'Who this applies to',ru:'К кому относится',uz:'Kimga tegishli'}[language] || 'Who this applies to'}</summary>{scope}</details></dd>}
      {children && <dd className="programme-stat-note">{children}</dd>}
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
export default function PublishedProgrammeFacts({ admissionCatalog, language = 'en', compact = false, expandable = false, focused = false, additionalSources = [] }) {
  const selectorId = useId();
  const [selectedId, setSelectedId] = useState('');
  if (!admissionCatalog) return null;
  const labels = LABELS[language] || LABELS.en;
  const extra = { en:{notes:'Published conditions',location:'Programme campus',intake:'Intake'},ru:{notes:'Опубликованные условия',location:'Кампус программы',intake:'Набор'},uz:{notes:'E’lon qilingan shartlar',location:'Dastur kampusi',intake:'Qabul davri'} }[language] || {notes:'Published conditions',location:'Programme campus',intake:'Intake'};
  const guide = { en: { example: 'Programme example', requirements: 'Entry requirements', more: 'Other published conditions', see: 'See entry requirements in details', cost: 'Tuition only; other expenses may apply.', many: 'More programmes in details' }, ru: { example: 'Пример программы', requirements: 'Требования для поступления', more: 'Другие опубликованные условия', see: 'Требования — в подробностях', cost: 'Только обучение; могут быть другие расходы.', many: 'Другие программы — в подробностях' }, uz: { example: 'Dastur namunasi', requirements: 'Qabul talablari', more: 'Boshqa e’lon qilingan shartlar', see: 'Qabul talablarini tafsilotlarda ko‘ring', cost: 'Faqat o‘qish haqi; boshqa xarajatlar bo‘lishi mumkin.', many: 'Boshqa dasturlar tafsilotlarda' } }[language] || { example: 'Programme example', requirements: 'Entry requirements', more: 'Other published conditions', see: 'See entry requirements in details', cost: 'Tuition only; other expenses may apply.', many: 'More programmes in details' };
  const programmes = Array.isArray(admissionCatalog.programmes) ? admissionCatalog.programmes : [];
  const selectedProgramme = programmes.find(programme => programme.id === selectedId) || programmes[0];
  const shown = compact ? programmes.slice(0, 1) : focused ? (selectedProgramme ? [selectedProgramme] : []) : programmes;
  const help = {
    en: { choose: 'Choose a programme', scope: 'Prices and requirements below apply to this programme. Other programmes may differ.', budget: 'Plan your budget', cost: 'This is tuition, not the full cost of studying. Check housing, living expenses and additional fees separately.', dates: 'Plan your application', read: 'How to compare with your results', results: 'Compare GPA in the scale stated in the requirement. If IELTS, SAT or another exam is not listed, that does not mean it is not required. Confirm missing conditions with the university.', count: 'Programmes in this profile', more: 'Other programmes in details' },
    ru: { choose: 'Выберите программу', scope: 'Ниже — стоимость и требования этой программы. У других программ условия могут отличаться.', budget: 'Оцените бюджет', cost: 'Это стоимость обучения, а не полный бюджет. Жильё, повседневные расходы и дополнительные сборы нужно уточнить отдельно.', dates: 'Спланируйте подачу', read: 'Как сравнить со своими результатами', results: 'Сравнивайте GPA в шкале, указанной в требовании. Если IELTS, SAT или другой экзамен не указан, это не означает, что он не нужен. Неизвестные условия уточните в вузе.', count: 'Программ в карточке', more: 'Другие программы — в подробностях' },
    uz: { choose: 'Dasturni tanlang', scope: 'Quyidagi narx va talablar shu dasturga tegishli. Boshqa dastur shartlari farq qilishi mumkin.', budget: 'Budjetni baholang', cost: 'Bu umumiy budjet emas, o‘qish haqi. Turar joy, kundalik xarajatlar va qo‘shimcha to‘lovlarni alohida aniqlang.', dates: 'Arizani rejalashtiring', read: 'Natijalaringiz bilan qanday solishtirish kerak', results: 'GPAni talabda ko‘rsatilgan shkala bo‘yicha solishtiring. IELTS, SAT yoki boshqa imtihon ko‘rsatilmagan bo‘lsa, bu u talab qilinmaydi degani emas. Noma’lum shartlarni universitetdan aniqlang.', count: 'Profildagi dasturlar', more: 'Boshqa dasturlar tafsilotlarda' },
  }[language] || { choose: 'Choose a programme', scope: 'Prices and requirements apply to this programme.', budget: 'Plan your budget', cost: 'Tuition only; check other expenses separately.', dates: 'Plan your application', read: 'How to compare with your results', results: 'Use the stated GPA scale. Missing exam requirements need confirmation.', count: 'Programmes in this profile', more: 'Other programmes in details' };
  const sourceMap = admissionCatalog.sources && typeof admissionCatalog.sources === 'object' ? admissionCatalog.sources : {};
  const sources = groupPublicSources(shown.flatMap(programme => {
    const facts = programme?.facts || programme || {};
    const names = { name: labels.programme, degree: labels.degree, tuition: labels.tuition, teachingLanguage: labels.teaching, location: extra.location, intake: extra.intake, deadline: labels.deadline, academicRequirement: labels.academic, languageRequirement: labels.language, languageThreshold: labels.languageLevel };
    return [...Object.entries(facts).filter(([key]) => names[key]).map(([key, fact]) => ({fact, label: names[key]})),
      ...(programme.costReferences || []).map(fact => ({fact, label: labels.costReference})),
      ...(programme.publicNotes || []).map(fact => ({fact, label: extra.notes}))];
  }).concat(additionalSources), sourceMap);

  return (
    <section className={`space-y-3 ${compact ? 'programme-summary' : 'programme-details'}`} aria-label={labels.programme}>
      {admissionCatalog.status === 'invalid' && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2" role="status">{labels.warning}</p>}
      {focused && programmes.length > 1 && <div className="programme-picker">
        <label htmlFor={selectorId}>{help.choose}<span>{help.count}: {programmes.length}</span></label><OptionSelect id={selectorId} value={selectedProgramme.id} onValueChange={setSelectedId} options={programmes.map(programme => ({ value: programme.id, label: describePublicFact(factFor(programme, 'name'), language, 'programme').value }))} />
      </div>}
      {shown.length === 0 ? <p className="text-sm text-slate-500">{labels.empty}</p> : shown.map(programme => {
        const name = describePublicFact(factFor(programme, 'name'), language, 'programme').value;
        const scopeFields = [['tuition', labels.tuition], ['teachingLanguage', labels.teaching], ['degree', labels.degree], ['location', extra.location], ['intake', extra.intake], ['deadline', labels.deadline], ['academicRequirement', labels.academic], ['languageRequirement', labels.language], ['languageThreshold', labels.languageLevel]].map(([key, label]) => ({ key, label, scope: describePublicScope(factFor(programme, key)?.scope, language) })).filter(item => item.scope);
        const languageFact = factFor(programme, 'languageRequirement');
        const thresholdFact = factFor(programme, 'languageThreshold');
        const repeatedThreshold = languageFact && thresholdFact && describePublicFact(languageFact, language, 'rule').value === describePublicFact(thresholdFact, language, 'rule').value;
        const toConfirm = [['academicRequirement', labels.academic], ['languageRequirement', labels.language], ['teachingLanguage', labels.teaching]].map(([key, label]) => ({ label, fact: factFor(programme, key) })).filter(({fact}) => needsConfirmation(fact));
        const scopeLabel = { en: 'Who these programme facts apply to', ru: 'К кому относятся данные программы', uz: 'Dastur ma’lumotlari kimga tegishli' }[language] || 'Who these programme facts apply to';
        return (
          <article key={programme.id || name} className="programme-fact-card rounded-lg border border-slate-200 p-3 space-y-2">
            <div className={`programme-heading ${focused && programmes.length > 1 ? 'sr-only' : ''}`}><p className="programme-label">{compact ? guide.example : labels.programme}</p>{compact ? <h4 className="font-semibold text-slate-800">{name}</h4> : <h2>{name}</h2>}</div>
            {compact ? <>
              <dl className="programme-preview-facts text-sm">
                <Fact label={labels.tuition} fact={factFor(programme, 'tuition')} language={language} kind="tuition" compact />
                <Fact label={labels.academic} fact={factFor(programme, 'academicRequirement')} language={language} kind="rule" includeScope={false} compact />
                <Fact label={labels.language} fact={languageFact} language={language} kind="rule" includeScope={false} compact />
                <Fact label={labels.teaching} fact={factFor(programme, 'teachingLanguage')} language={language} includeScope={false} compact />
              </dl>
              {toConfirm.length > 0 && <details className="programme-confirmation programme-fact-status"><summary>{{en:'Conditions to confirm',ru:'Какие условия нужно уточнить',uz:'Aniqlashtiriladigan shartlar'}[language]}</summary><ul>{toConfirm.map(({label, fact}) => <li key={label}><strong>{label}:</strong> {describePublicFact(fact, language).notice}</li>)}</ul></details>}
              <p className="programme-summary-hint">{programmes.length > 1 ? help.more : guide.cost}</p>
            </> : <>
            <p className="programme-context">{help.scope}</p>
            <dl className="programme-stat-grid">
              <Fact label={labels.tuition} fact={factFor(programme, 'tuition')} language={language} kind="tuition" includeScope={false} tile icon={DollarSign}>{guide.cost}</Fact>
              <Fact label={labels.language} fact={languageFact} language={language} kind="rule" includeScope={false} tile icon={Languages}>
                {!repeatedThreshold && thresholdFact?.status !== 'unknown' && thresholdFact && <dl><Fact label={labels.languageLevel} fact={thresholdFact} language={language} kind="rule" includeScope={false} /></dl>}
              </Fact>
              <Fact label={labels.academic} fact={factFor(programme, 'academicRequirement')} language={language} kind="rule" includeScope={false} tile icon={GraduationCap} />
              <Fact label={labels.deadline} fact={factFor(programme, 'deadline')} language={language} kind="deadline" includeScope={false} tile icon={Calendar}>
                <details className="programme-intake-details"><summary>{extra.intake}</summary><dl className="programme-intake"><Fact label={extra.intake} fact={factFor(programme, 'intake')} language={language} kind="intake" includeScope={false} /></dl></details>
              </Fact>
            </dl>
            <dl className="programme-meta text-sm">
              <Fact label={labels.teaching} fact={factFor(programme, 'teachingLanguage')} language={language} includeScope={false} />
              <Fact label={labels.degree} fact={factFor(programme, 'degree')} language={language} kind="degree" includeScope={false} />
              {factFor(programme, 'location') && <Fact label={extra.location} fact={factFor(programme, 'location')} language={language} kind="location" includeScope={false} />}
            </dl>
            <details className="programme-disclosure"><summary>{{en:'Details & conditions',ru:'Подробности и условия',uz:'Tafsilotlar va shartlar'}[language] || 'Details & conditions'}</summary>
            <div className="space-y-4">
            <p>{help.results}</p>
            {(repeatedThreshold || !thresholdFact || thresholdFact.status === 'unknown') && <dl>
              <Fact label={labels.languageLevel} fact={thresholdFact} language={language} kind="rule" includeScope={false} />
            </dl>}
            {scopeFields.length > 0 && <div><h3>{scopeLabel}</h3><ul>{scopeFields.map(item => <li key={item.key}><strong>{item.label}:</strong> {item.scope}</li>)}</ul></div>}
            {(programme.costReferences?.length > 0 || programme.publicNotes?.length > 0) && <dl className="grid sm:grid-cols-2 gap-3">
              {(Array.isArray(programme.costReferences) ? programme.costReferences : []).map((reference, index) => <CostReference key={`${programme.id}-cost-${index}`} label={quoteLabel(reference, labels.costReference)} fact={reference} language={language} labels={labels} />)}
              {(programme.publicNotes || []).map((note, index) => <Fact key={`${programme.id}-note-${index}`} label={extra.notes} fact={note} language={language} />)}
            </dl>}
            </div></details></>}
          </article>
        );
      })}
      {compact && expandable && programmes.length > 0 && <details className="text-sm">
        <summary className="cursor-pointer rounded text-indigo-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">{{ en: 'Programme details and sources', ru: 'Условия программы и источники', uz: 'Dastur shartlari va manbalar' }[language] || 'Programme details and sources'}</summary>
        <div className="mt-3"><PublishedProgrammeFacts admissionCatalog={admissionCatalog} language={language} /></div>
      </details>}
      {!compact && sources.length > 0 && <details className="programme-disclosure programme-sources">
        <summary>{labels.sources}<span>{sources.length}</span></summary>
        <OfficialSources sources={sources} language={language} />
      </details>}
    </section>
  );
}
