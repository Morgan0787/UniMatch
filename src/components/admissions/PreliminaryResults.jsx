import { RefineAnswers } from './SurveyFields';

function Reason({ reason, option, c }) {
  const evidence = option.sources.find(source => source.key === reason.sourceKey);
  return <li className={`admission-reason admission-reason-${reason.status}`}>
    <span aria-hidden="true">{reason.status === 'met' ? '✓' : reason.status === 'unmet' ? '!' : '?'}</span>
    <div>{c.reasons[reason.code] || c.incomplete}{evidence && <a className="admission-inline-source" href={evidence.url} target="_blank" rel="noopener noreferrer">↗ <span className="sr-only">{evidence.title}</span></a>}</div>
  </li>;
}

function CandidateCard({ row, c, language, alternative = false }) {
  const { option, reasons, isTop } = row;
  const mainReason = reasons.find(reason => reason.status === 'unmet') || reasons.find(reason => reason.code === 'ASU_SPRING_CS_INTAKE_UNCONFIRMED') || reasons.find(reason => reason.code === 'PERSONAL_CREDENTIAL_UNKNOWN') || reasons.find(reason => reason.status === 'unknown');
  const route = option.sources.find(source => source.key === option.routeSourceKey || source.key.endsWith('route') || source.key === 'asu-first-year') || option.sources[0];
  const tuition = option.tuition;
  return <article className="admission-candidate" data-institution={option.institutionId || option.university} data-top={Boolean(isTop)}>
    <div className="admission-candidate-meta"><span>{option.university}</span><span>{c.regionNames[option.region]} · {option.country}</span></div>
    {isTop && <p className="admission-top-badge">{c.topBadge}</p>}
    <h2>{option.name}</h2>
    <p className={`admission-status ${alternative ? 'admission-status-attention' : ''}`}>{alternative ? c.attention : c.unknown}</p>
    <p>{mainReason ? c.reasons[mainReason.code] || c.incomplete : c.incomplete}</p>
    <dl className="admission-facts">
      <div><dt>{c.publishedCost}</dt><dd>{tuition?.amount != null ? `${tuition.amount.toLocaleString(language)} ${tuition.currency} / ${c.periods[tuition.period] || c.unknownShort}` : c.unknownShort}{tuition?.feeYear && <small> · {tuition.feeYear}</small>}</dd></div>
      <div><dt>{c.intake}</dt><dd>{option.intakeText || c.unknownShort}</dd></div>
    </dl>
    <p className="admission-hint">{option.entryPath === 'unknown' ? c.entryUnknown : c.entryConditional}</p>
    <p className="admission-hint">{option.tuitionNote || (option.notes?.includes('TURKU_TUITION_SCOPE') ? c.notes.TURKU_TUITION_SCOPE : option.notes?.includes('ASU_BASE_TUITION_SCOPE') ? c.notes.ASU_BASE_TUITION_SCOPE : c.living)}</p>
    <details>
      <summary>{c.sources}</summary>
      <p>{c.living}</p>
      <ul className="admission-reasons">{reasons.map(reason => <Reason key={reason.code} reason={reason} option={option} c={c} />)}</ul>
      {option.missing?.length > 0 && <><h3>{c.publishedGaps}</h3><ul>{option.missing.map(gap => <li key={gap}>{gap}</li>)}</ul></>}
      <div className="admission-source-list">{option.sources.map(source => <div key={source.key}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a>
        <p>{c.checked}: <time dateTime={source.checkedAt}>{source.checkedAt}</time></p>
        <p>{c.scope}: {c.sourceScopes[source.key] || source.scope}</p>
      </div>)}</div>
    </details>
    <div className="admission-next-step"><h3>{c.nextStep}</h3><p>{c.noDeadline}</p>{route && <a href={route.url} target="_blank" rel="noopener noreferrer">{c.official} ↗</a>}</div>
  </article>;
}

export default function PreliminaryResults({ evaluation, answers, onEdit, onApply, errors, c, language }) {
  const alternatives = evaluation.alternatives || [];
  const shown = evaluation.results.length + alternatives.length;
  return <>
    <p className="admission-hint">{c.resultsIntro}</p>
    <p className="admission-coverage" role="status">{c.coverage.replace('{shown}', String(shown))}</p>
    {evaluation.mode === 'ranked' ? <p className="admission-hint">{c.topExplanation}</p> : <p className="admission-hint">{c.exploreExplanation}</p>}
    <button type="button" className="admission-button admission-secondary" onClick={onEdit}>{c.edit}</button>
    {Object.keys(errors).length > 0 && <p role="alert" className="admission-error">{c.errors}</p>}
    {!shown && <section className="admission-empty" aria-labelledby="admission-empty-title">
      <h2 id="admission-empty-title">{c.noResults}</h2><p>{c.noResultsBody}</p>
      <button type="button" className="admission-button" onClick={onEdit}>{c.editFields}</button>
    </section>}
    <div className="admission-candidates">
      {evaluation.results.map(row => <CandidateCard key={row.option.id} row={row} c={c} language={language} />)}
    </div>
    {alternatives.length > 0 && <section className="admission-alternatives" aria-labelledby="admission-alternatives-title">
      <h2 id="admission-alternatives-title">{c.alternativesTitle}</h2><p className="admission-hint">{c.alternativesExplanation}</p>
      {alternatives.map(row => <CandidateCard key={row.option.id} row={row} c={c} language={language} alternative />)}
    </section>}
    <RefineAnswers answers={answers} onApply={onApply} c={c} errors={errors} />
  </>;
}
