import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { emptyAnswers, evaluateAnswers, validateAnswers } from '@/lib/admissions/evaluate';
import { clearDraft, loadDraft, saveDraft } from '@/lib/admissions/draft';
import { admissionCopy } from '@/components/admissions/copy';
import SurveyFields from '@/components/admissions/SurveyFields';
import PreliminaryResults from '@/components/admissions/PreliminaryResults';
import SurveyStory from '@/components/admissions/SurveyStory';
import useAdmissionFavorites from '@/components/admissions/useAdmissionFavorites';
import usePublicAdmissionsCatalog from '@/components/admissions/usePublicAdmissionsCatalog';
import CatalogStatus from '@/components/admissions/CatalogStatus';
import '@/components/admissions/admissions.css';

function storage() {
  try { return window.sessionStorage; } catch { return null; }
}

export default function AdmissionsSurvey() {
  const { language } = useLanguage();
  const c = admissionCopy[language] || admissionCopy.en;
  const catalogQuery = usePublicAdmissionsCatalog();
  const catalog = catalogQuery.catalog;
  const [initial] = useState(() => {
    const restored = loadDraft(storage());
    // Stored data is untrusted even when its envelope has the right version.
    if (restored.answers && Object.keys(validateAnswers(restored.answers)).length) {
      clearDraft(storage());
      return { ...restored, answers: null, step: /** @type {0|1|2} */ (0), view: /** @type {'survey'|'results'} */ ('survey'), status: /** @type {'invalid'} */ ('invalid') };
    }
    return restored;
  });
  const [answers, setAnswers] = useState(() => ({ ...emptyAnswers(), ...(initial.answers || {}) }));
  const [step, setStep] = useState(initial.step);
  const [view, setView] = useState(initial.view);
  const [storageStatus, setStorageStatus] = useState(initial.status);
  const [storageBlocked, setStorageBlocked] = useState(initial.status === 'unavailable');
  const [generation, setGeneration] = useState(0);
  const [errors, setErrors] = useState({});
  const title = useRef(null);
  const form = useRef(null);
  const firstRender = useRef(true);
  const evaluation = evaluateAnswers(answers, catalog.options);
  const favorites = useAdmissionFavorites({ answers, step, view, catalog, catalogReady: catalogQuery.canSave, refreshCatalog: catalogQuery.refresh });
  const resumeOption = catalog.options.find(option => option.id === favorites.resumeIntent?.optionId);

  useEffect(() => {
    if (!storageBlocked && !saveDraft(storage(), { answers, step, view })) {
      setStorageStatus('unavailable'); setStorageBlocked(true);
    }
  }, [answers, step, view, generation, storageBlocked]);

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    if (firstRender.current) { window.scrollTo(0, 0); firstRender.current = false; }
    else title.current?.scrollIntoView({ block: 'start' });
  }, [step, view]);

  const update = (name, value) => {
    setAnswers(previous => ({ ...previous, [name]: value, ...(name === 'exam' ? { score: '', examDate: '', listening: '', reading: '', writing: '', speaking: '' } : {}) }));
    setErrors(previous => ({ ...previous, [name]: undefined, ...(name === 'exam' ? { listening: undefined, reading: undefined, writing: undefined, speaking: undefined } : {}) }));
  };
  const showErrors = nextErrors => {
    setErrors(nextErrors);
    // Focus an invalid field only after its error association has rendered.
    requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
  };
  const advance = () => {
    const allErrors = validateAnswers(answers);
    const currentKeys = step === 0 ? ['field', 'regions', 'language'] : step === 1 ? ['exam', 'score', 'grade', 'scale', 'schoolCountry', 'credential'] : ['budget', 'currency', 'scholarship'];
    const relevant = Object.fromEntries(Object.entries(allErrors).filter(([key]) => currentKeys.includes(key)));
    if (Object.keys(relevant).length) { showErrors(relevant); return; }
    setErrors({});
    if (step < 2) setStep(previous => /** @type {0|1|2} */ (previous + 1));
    else setView('results');
  };
  const skip = () => {
    const cleared = step === 0 ? { field: '', regions: [], language: '' } : step === 1 ? { exam: '', score: '', listening: '', reading: '', writing: '', speaking: '', grade: '', scale: '', schoolCountry: '', credential: '', examDate: '' } : { budget: '', currency: '', scholarship: '' };
    setAnswers(previous => ({ ...previous, ...cleared })); setErrors({});
    if (step < 2) setStep(previous => /** @type {0|1|2} */ (previous + 1)); else setView('results');
  };
  const edit = () => { setView('survey'); setStep(0); setErrors({}); };
  const reset = () => {
    if (!window.confirm(c.resetConfirm)) return;
    favorites.clearIntent();
    const removed = clearDraft(storage());
    setAnswers(emptyAnswers()); setStep(0); setView('survey'); setErrors({});
    setStorageStatus(removed ? 'empty' : 'unavailable'); setStorageBlocked(!removed); setGeneration(previous => previous + 1);
  };
  const apply = nextAnswers => {
    const nextErrors = validateAnswers(nextAnswers);
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return false; }
    setAnswers(nextAnswers); setErrors({}); return true;
  };

  return <section className="admissions-page" data-view={view} data-step={step} aria-labelledby="admission-title">
    <div className="admission-topline"><span>{c.eyebrow}</span><button type="button" className="admission-text-button" onClick={reset}>{c.reset}</button></div>
    <div className="admission-layout" data-view={view} data-step={step}>
      <aside className="admission-aside" aria-label={c.subtitle}>
        <SurveyStory step={step} view={view} answers={answers} c={c} />
      </aside>
      <div className="admission-content">
        {view === 'survey' && <ol className="admission-stepper" aria-label={c.subtitle}>{c.steps.map((label, index) => <li key={label} data-done={index < step} aria-current={step === index ? 'step' : undefined}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{label}</li>)}</ol>}
        <p className="admission-eyebrow">{view === 'survey' ? `${step + 1} / 3 · ${c.steps[step]}` : c.subtitle}</p>
        <h1 id="admission-title" tabIndex={-1} ref={title}>{view === 'survey' ? c.stepTitles[step] : c.resultsTitle}</h1>
        {storageStatus === 'restored' && <p role="status" className="admission-hint">{c.restored}</p>}
        {(storageStatus === 'expired' || storageStatus === 'invalid') && <p role="status" className="admission-hint">{c.expired}</p>}
        {storageStatus === 'unavailable' && <p role="status" className="admission-storage-warning">{c.storageError}</p>}
        {favorites.error && <div className="admission-save-feedback" role="alert"><p>{c[favorites.error] || c.saveError}</p><button type="button" className="admission-text-button" disabled={favorites.loading} onClick={favorites.retry}>{c.saveRetry}</button></div>}
        {favorites.notice && <p className="admission-save-feedback" role="status">{c[favorites.notice]}</p>}
        {(favorites.intentStatus === 'expired' || favorites.intentStatus === 'invalid') && <p role="status" className="admission-hint">{c.saveDraftExpired}</p>}
        {favorites.resumeIntent && resumeOption && <section className="admission-resume-save" aria-label={c.resumeSave}>
          <p>{c.resumeSave}</p><strong>{resumeOption.university}</strong><p>{resumeOption.name}</p>
          <div className="admission-card-actions"><button type="button" className="admission-button" disabled={favorites.loading || !favorites.canSave} onClick={favorites.confirmResume}>{favorites.pendingId ? c.saving : c.confirmSave}</button><button type="button" className="admission-text-button" disabled={favorites.loading} onClick={favorites.dismissResume}>{c.dismissSave}</button></div>
        </section>}
        <CatalogStatus query={catalogQuery} c={c} />
        {view === 'survey' ? <form noValidate ref={form} onSubmit={event => { event.preventDefault(); advance(); }}>
          <p className="admission-intro">{c.stepIntros[step]}</p>
          {Object.values(errors).some(Boolean) && <p role="alert" className="admission-error">{c.errors}</p>}
          <SurveyFields key={step} step={step} answers={answers} onChange={update} errors={errors} c={c} />
          <div className="admission-actions">
            {step > 0 && <button type="button" className="admission-button admission-secondary" onClick={() => { setStep(previous => /** @type {0|1|2} */ (previous - 1)); setErrors({}); }}>{c.back}</button>}
            <button type="submit" className="admission-button">{step === 2 ? c.show : c.next} <span aria-hidden="true">↗</span></button>
            <button type="button" className="admission-text-button admission-skip" onClick={skip}>{c.skip}</button>
          </div>
        </form> : catalogQuery.isPending || catalog.version === 'db-v1:unavailable'
          ? <button type="button" className="admission-button admission-secondary" onClick={edit}>{c.edit}</button>
          : <PreliminaryResults evaluation={evaluation} answers={answers} onEdit={edit} onApply={apply} errors={errors} c={c} language={language} favorites={favorites} catalogEmpty={catalog.options.length === 0} />}
      </div>
    </div>
    <footer className="admission-footer"><p>{c.temporary}</p></footer>
  </section>;
}
