import { useState } from 'react';
import { catalogValue } from '@/lib/catalogCopy';
import { resultBudgetState, RESULT_COPY } from '@/lib/admissions/resultPresentation';
import { RefineAnswers } from './SurveyFields';
import ComparisonModal from '@/components/comparison/ComparisonModal';
import { comparisonUniversity } from '@/lib/comparisonPresentation';
import InstitutionMedia, { InstitutionLinks } from './InstitutionMedia';
import { describePublicFact } from '@/lib/admissions/factPresentation.js';
import PublishedProgrammeFacts from './PublishedProgrammeFacts';
import TuitionValue from './TuitionValue';

const compareLimitCopy = {
  en: '3 of 3 selected. Remove one university to add another.',
  ru: 'Выбрано 3 из 3. Уберите один университет, чтобы добавить другой.',
  uz: '3 tadan 3 tasi tanlandi. Boshqasini qo‘shish uchun bitta universitetni olib tashlang.',
};

function Reason({ reason, c }) {
  return <li className={`admission-reason admission-reason-${reason.status}`}>
    <span aria-hidden="true">{reason.status === 'met' ? '✓' : reason.status === 'unmet' ? '!' : '?'}</span>
    <div>{c.reasons[reason.code] || c.incomplete}</div>
  </li>;
}

function CandidateCard({ row, c, language, favorites, compared, onCompare, compareDisabled, alternative = false }) {
  const { option, reasons, isTop } = row;
  const ui = RESULT_COPY[language] || RESULT_COPY.en;
  const budgetState = resultBudgetState(reasons);
  const mainReason = reasons.find(reason => reason.status === 'unmet' && !['ACADEMIC_UNMET', 'LANGUAGE_UNMET'].includes(reason.code)) || reasons.find(reason => reason.status === 'unmet') || reasons.find(reason => reason.code === 'LANGUAGE_SECTIONS_UNKNOWN') || reasons.find(reason => reason.code === 'ASU_SPRING_CS_INTAKE_UNCONFIRMED') || reasons.find(reason => reason.code === 'PERSONAL_CREDENTIAL_UNKNOWN') || reasons.find(reason => reason.status === 'unknown');
  const knownReason = reasons.find(reason => reason.status === 'met' && ['FIELD_MATCH', 'REGION_MATCH'].includes(reason.code));
  const route = option.sources.find(source => source.key === option.routeSourceKey || source.key.endsWith('route') || source.key === 'asu-first-year') || option.sources[0];
  const tuition = option.tuition;
  const tuitionFact = option.facts?.tuition;
  const teachingLanguage = describePublicFact(option.facts?.teachingLanguage, language, 'text');
  const languageReference = option.publishedLanguageReference && reasons.some(reason => ['LANGUAGE_BELOW_PUBLISHED_THRESHOLD', 'LANGUAGE_THRESHOLD_REACHED'].includes(reason.code))
    ? describePublicFact(option.facts.languageThreshold, language, 'rule') : null;
  const saved = favorites.savedIds.includes(option.institutionId);
  const pending = favorites.pendingId === option.institutionId;
  return <article className="admission-candidate" data-institution={option.institutionId || option.university} data-top={Boolean(isTop)}>
    <div className="admission-candidate-overview">
    <div className="admission-candidate-meta"><span>{option.university}</span><span>{c.regionNames[option.region]} · {catalogValue(option.country, language)}</span></div>
    {isTop && <p className="admission-top-badge">{c.topBadge}</p>}
    <h2>{option.name}</h2>
    <InstitutionMedia option={option} c={c} compact />
    </div>
    <div className="admission-candidate-body">
    <p className={`admission-status ${alternative ? 'admission-status-attention' : ''}`}>{alternative ? c.attention : c.unknown}</p>
    <p className={`admission-budget admission-budget-${budgetState}`}>{ui[budgetState]}</p>
    <p className="admission-key-reason">{mainReason ? c.cardReasons[mainReason.code] || c.reasons[mainReason.code] || c.incomplete : c.incomplete}</p>
    <dl className="admission-facts">
      <div><dt>{{en:'Teaching language',ru:'Язык обучения',uz:'Ta’lim tili'}[language] || 'Teaching language'}</dt><dd>{c.languages[teachingLanguage.value] || teachingLanguage.value}</dd></div>
      <div><dt>{ui.tuition}</dt><dd>{tuitionFact ? <TuitionValue fact={tuitionFact} language={language} /> : tuition?.amount != null ? `${tuition.amount.toLocaleString(language)} ${tuition.currency} / ${c.periods[tuition.period] || c.unknownShort}` : c.unknownShort}{!tuitionFact && tuition?.feeYear && <small> · {tuition.feeYear}</small>}</dd></div>
      <div><dt>{c.intake}</dt><dd>{option.intakeText || c.unknownShort}</dd></div>
    </dl>
    <div className="admission-card-actions">
      <InstitutionLinks option={option} c={c} />
      <button type="button" className="admission-button admission-secondary" aria-pressed={compared} aria-disabled={compareDisabled && !compared} aria-describedby={compareDisabled ? 'admission-compare-status' : undefined} onClick={() => onCompare(option)}>{compared ? ({en:'Remove from comparison',ru:'Убрать из сравнения',uz:'Taqqoslashdan olib tashlash'}[language]) : compareDisabled ? ui.limit : ({en:'Compare',ru:'Сравнить',uz:'Taqqoslash'}[language])}</button>
      <button type="button" className="admission-button admission-secondary" aria-pressed={saved} aria-label={`${saved ? c.removeSaved : c.save}: ${option.university}`} aria-busy={pending} disabled={favorites.loading || !favorites.canSave} onClick={() => favorites.requestSave(option)}>{pending ? (saved ? c.removing : c.saving) : saved ? c.removeSaved : c.save}</button>
    </div>
    <details>
      <summary>{ui.details}</summary>
    {knownReason && <p className="admission-known-reason">{c.cardReasons[knownReason.code]}</p>}
    {languageReference && <p className="admission-language-reference">{c.languageReference}: {languageReference.value}. {languageReference.notice} {c.languageReferenceLimit}</p>}
    {row.academicReferences?.length > 0 && <p className="admission-language-reference">{c.academicReference}: {[...new Set(row.academicReferences.map(reference => `${reference.minimum}/${reference.scale}${reference.season ? ` (${reference.season})` : ''}`))].join(', ')}. {c.academicReferenceLimit}</p>}
      <p>{option.entryPath === 'unknown' ? c.entryUnknown : c.entryConditional}</p>
      <p>{c.living}</p>
      <ul className="admission-reasons">{reasons.map(reason => <Reason key={reason.code} reason={reason} c={c} />)}</ul>
      {option.facts && <PublishedProgrammeFacts admissionCatalog={{ status: 'valid', programmes: [{ id: option.id, ...option.facts }], sources: Object.fromEntries(option.sources.map(source => [source.key, source])) }} language={language} additionalSources={[
        ...reasons.filter(reason => reason.sourceKey).map(reason => ({ fact: { sourceIds: [reason.sourceKey] }, label: c.reasons[reason.code] || c.incomplete })),
        ...(route ? [{ fact: { sourceIds: [route.key] }, label: c.nextStep }] : []),
      ]} />}
      <div className="admission-next-step"><h3>{c.nextStep}</h3><p>{c.noDeadline}</p></div>
    </details>
    </div>
  </article>;
}

export default function PreliminaryResults({ evaluation, answers, onEdit, onApply, errors, c, language, favorites, institutions = [], catalogEmpty = false }) {
  const ui = RESULT_COPY[language] || RESULT_COPY.en;
  const [compared, setCompared] = useState([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const compareCopy = {en:'Compare selected',ru:'Сравнить выбранные',uz:'Tanlanganlarni taqqoslash'}[language] || 'Compare selected';
  const toggleCompare = option => setCompared(previous => previous.some(item => item.id === option.institutionId)
    ? previous.filter(item => item.id !== option.institutionId)
    : previous.length < 3 ? [...previous, comparisonUniversity(option, institutions.find(item => item.institutionId === option.institutionId))] : previous);
  const compareProps = option => ({ compared: compared.some(item => item.id === option.institutionId), onCompare: toggleCompare, compareDisabled: compared.length >= 3 });
  const alternatives = evaluation.alternatives || [];
  const shown = evaluation.results.length + alternatives.length;
  return <>
    <p className="admission-results-lead">{c.resultsLead}</p>
    <div className="admission-results-heading">
<div className="admission-selection-summary" aria-label={ui.summary}><strong>{ui.count.replace('{count}', String(shown))}</strong><p>{[c.fields[answers.field] || c.any, (answers.regions || []).map(region => c.regionNames[region] || catalogValue(region, language)).join(', ') || c.any, answers.language && catalogValue(answers.language, language), answers.exam && answers.score && [answers.exam, answers.score].join(' '), answers.budget && [Number(answers.budget).toLocaleString(language), answers.currency].join(' ')].filter(Boolean).join(' · ')}</p></div>
      {compared.length > 0 && <button type="button" className="admission-button" disabled={compared.length < 2} onClick={() => setComparisonOpen(true)}>{compareCopy} ({compared.length}/3)</button>}
      <button type="button" className="admission-button admission-secondary" onClick={onEdit}>{c.edit}</button>
    </div>
    <p id="admission-compare-status" role="status" aria-live="polite" className="admission-hint">{compared.length === 3 ? compareLimitCopy[language] : ui.comparison.replace('{count}', String(compared.length))}</p>
    <details className="admission-coverage"><summary>{c.coverageSummary.replace('{shown}', String(shown))}</summary><p>{c.resultsIntro}</p><p>{evaluation.mode === 'ranked' ? c.topExplanation : c.exploreExplanation}</p><p>{c.coverage.replace('{shown}', String(shown))}</p></details>
    {!favorites.isAuthenticated && <p className="admission-hint">{c.signInToSave}</p>}
    {favorites.loading && !favorites.pendingId && <p role="status" className="admission-hint">{c.saveLoading}</p>}
    {Object.keys(errors).length > 0 && <p role="alert" className="admission-error">{c.errors}</p>}
    {!shown && <section className="admission-empty" aria-labelledby="admission-empty-title">
      <h2 id="admission-empty-title">{catalogEmpty ? c.catalogEmptyTitle : c.noResults}</h2><p>{catalogEmpty ? c.catalogEmpty : c.noResultsBody}</p>
      <button type="button" className="admission-button" onClick={onEdit}>{c.editFields}</button>
    </section>}
    <div className="admission-candidates">
      {evaluation.results.map(row => <CandidateCard key={row.option.id} row={row} c={c} language={language} favorites={favorites} {...compareProps(row.option)} />)}
    </div>
    {alternatives.length > 0 && <section className="admission-alternatives" aria-labelledby="admission-alternatives-title">
      <h2 id="admission-alternatives-title">{c.alternativesTitle}</h2><p className="admission-hint">{c.alternativesExplanation}</p>
      <div className="admission-candidates">{alternatives.map(row => <CandidateCard key={row.option.id} row={row} c={c} language={language} favorites={favorites} {...compareProps(row.option)} alternative />)}</div>
    </section>}
    {compared.length > 0 && <button type="button" className="admission-button" disabled={compared.length < 2} onClick={() => setComparisonOpen(true)}>{compareCopy} ({compared.length}/3)</button>}
    <ComparisonModal universities={compared} isOpen={comparisonOpen} onClose={() => setComparisonOpen(false)} onRemove={id => setCompared(previous => previous.filter(item => item.id !== id))} />
    <RefineAnswers answers={answers} onApply={next => { setCompared([]); setComparisonOpen(false); return onApply(next); }} c={c} errors={errors} />
  </>;
}
