import { RefineAnswers } from './SurveyFields';
import InstitutionMedia, { InstitutionLinks } from './InstitutionMedia';
import { describePublicFact } from '@/lib/admissions/factPresentation.js';
import PublishedProgrammeFacts from './PublishedProgrammeFacts';

function Reason({ reason, option, c }) {
  const evidence = option.sources.find(source => source.key === reason.sourceKey);
  return <li className={`admission-reason admission-reason-${reason.status}`}>
    <span aria-hidden="true">{reason.status === 'met' ? '✓' : reason.status === 'unmet' ? '!' : '?'}</span>
    <div>{c.reasons[reason.code] || c.incomplete}{evidence && <a className="admission-inline-source" href={evidence.url} target="_blank" rel="noopener noreferrer">↗ <span className="sr-only">{evidence.title}</span></a>}</div>
  </li>;
}

function CandidateCard({ row, c, language, favorites, alternative = false }) {
  const { option, reasons, isTop } = row;
  const mainReason = reasons.find(reason => reason.status === 'unmet' && !['ACADEMIC_UNMET', 'LANGUAGE_UNMET'].includes(reason.code)) || reasons.find(reason => reason.status === 'unmet') || reasons.find(reason => reason.code === 'LANGUAGE_SECTIONS_UNKNOWN') || reasons.find(reason => reason.code === 'ASU_SPRING_CS_INTAKE_UNCONFIRMED') || reasons.find(reason => reason.code === 'PERSONAL_CREDENTIAL_UNKNOWN') || reasons.find(reason => reason.status === 'unknown');
  const knownReason = reasons.find(reason => reason.status === 'met' && ['FIELD_MATCH', 'REGION_MATCH'].includes(reason.code));
  const route = option.sources.find(source => source.key === option.routeSourceKey || source.key.endsWith('route') || source.key === 'asu-first-year') || option.sources[0];
  const tuition = option.tuition;
  const tuitionFact = option.facts?.tuition ? describePublicFact(option.facts.tuition, language, 'tuition') : null;
  const languageReference = option.publishedLanguageReference && reasons.some(reason => ['LANGUAGE_BELOW_PUBLISHED_THRESHOLD', 'LANGUAGE_THRESHOLD_REACHED'].includes(reason.code))
    ? describePublicFact(option.facts.languageThreshold, language, 'rule') : null;
  const saved = favorites.savedIds.includes(option.institutionId);
  const pending = favorites.pendingId === option.institutionId;
  return <article className="admission-candidate" data-institution={option.institutionId || option.university} data-top={Boolean(isTop)}>
    <div className="admission-candidate-meta"><span>{option.university}</span><span>{c.regionNames[option.region]} · {option.country}</span></div>
    {isTop && <p className="admission-top-badge">{c.topBadge}</p>}
    <h2>{option.name}</h2>
    <p className={`admission-status ${alternative ? 'admission-status-attention' : ''}`}>{alternative ? c.attention : c.unknown}</p>
    {knownReason && <p className="admission-known-reason">{c.cardReasons[knownReason.code]}</p>}
    <p className="admission-key-reason">{mainReason ? c.cardReasons[mainReason.code] || c.reasons[mainReason.code] || c.incomplete : c.incomplete}</p>
    {languageReference && <p className="admission-language-reference">{c.languageReference}: {languageReference.value}. {languageReference.notice} {c.languageReferenceLimit}</p>}
    <InstitutionMedia option={option} c={c} />
    <dl className="admission-facts">
      <div><dt>{c.publishedCost}</dt><dd>{tuitionFact ? tuitionFact.value : tuition?.amount != null ? `${tuition.amount.toLocaleString(language)} ${tuition.currency} / ${c.periods[tuition.period] || c.unknownShort}` : c.unknownShort}{!tuitionFact && tuition?.feeYear && <small> · {tuition.feeYear}</small>}{tuitionFact?.notice && <small className="block">{tuitionFact.notice}</small>}</dd></div>
      <div><dt>{c.intake}</dt><dd>{option.intakeText || c.unknownShort}</dd></div>
    </dl>
    <div className="admission-card-actions">
      <InstitutionLinks option={option} c={c} />
      <button type="button" className="admission-button admission-secondary" aria-pressed={saved} aria-label={`${saved ? c.removeSaved : c.save}: ${option.university}`} aria-busy={pending} disabled={favorites.loading || !favorites.canSave} onClick={() => favorites.requestSave(option)}>{pending ? (saved ? c.removing : c.saving) : saved ? c.removeSaved : c.save}</button>
    </div>
    <details>
      <summary>{c.sources}</summary>
      <p>{option.entryPath === 'unknown' ? c.entryUnknown : c.entryConditional}</p>
      <p>{c.living}</p>
      <ul className="admission-reasons">{reasons.map(reason => <Reason key={reason.code} reason={reason} option={option} c={c} />)}</ul>
      {option.facts && <PublishedProgrammeFacts admissionCatalog={{ status: 'valid', programmes: [{ id: option.id, ...option.facts }], sources: Object.fromEntries(option.sources.map(source => [source.key, source])) }} language={language} />}
      {option.missing?.length > 0 && <><h3>{c.publishedGaps}</h3><ul>{option.missing.map(gap => <li key={gap}>{gap}</li>)}</ul></>}
      <div className="admission-source-list">{option.sources.map(source => <div key={source.key}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a>
        <p>{c.checked}: <time dateTime={source.checkedAt}>{source.checkedAt}</time></p>
        <p>{c.scope}: {c.sourceScopes[source.key] || source.scope}</p>
      </div>)}</div>
      <div className="admission-next-step"><h3>{c.nextStep}</h3><p>{c.noDeadline}</p>{route && <a href={route.url} target="_blank" rel="noopener noreferrer">{c.official} ↗</a>}</div>
    </details>
  </article>;
}

export default function PreliminaryResults({ evaluation, answers, onEdit, onApply, errors, c, language, favorites, catalogEmpty = false }) {
  const alternatives = evaluation.alternatives || [];
  const shown = evaluation.results.length + alternatives.length;
  return <>
    <div className="admission-results-heading">
      <p className="admission-hint">{c.resultsLead}</p>
      <button type="button" className="admission-button admission-secondary" onClick={onEdit}>{c.edit}</button>
    </div>
    <details className="admission-coverage"><summary>{c.coverageSummary.replace('{shown}', String(shown))}</summary><p>{c.resultsIntro}</p><p>{evaluation.mode === 'ranked' ? c.topExplanation : c.exploreExplanation}</p><p>{c.coverage.replace('{shown}', String(shown))}</p></details>
    {!favorites.isAuthenticated && <p className="admission-hint">{c.signInToSave}</p>}
    {favorites.loading && !favorites.pendingId && <p role="status" className="admission-hint">{c.saveLoading}</p>}
    {Object.keys(errors).length > 0 && <p role="alert" className="admission-error">{c.errors}</p>}
    {!shown && <section className="admission-empty" aria-labelledby="admission-empty-title">
      <h2 id="admission-empty-title">{catalogEmpty ? c.catalogEmptyTitle : c.noResults}</h2><p>{catalogEmpty ? c.catalogEmpty : c.noResultsBody}</p>
      <button type="button" className="admission-button" onClick={onEdit}>{c.editFields}</button>
    </section>}
    <div className="admission-candidates">
      {evaluation.results.map(row => <CandidateCard key={row.option.id} row={row} c={c} language={language} favorites={favorites} />)}
    </div>
    {alternatives.length > 0 && <section className="admission-alternatives" aria-labelledby="admission-alternatives-title">
      <h2 id="admission-alternatives-title">{c.alternativesTitle}</h2><p className="admission-hint">{c.alternativesExplanation}</p>
      <div className="admission-candidates">{alternatives.map(row => <CandidateCard key={row.option.id} row={row} c={c} language={language} favorites={favorites} alternative />)}</div>
    </section>}
    <RefineAnswers answers={answers} onApply={onApply} c={c} errors={errors} />
  </>;
}
