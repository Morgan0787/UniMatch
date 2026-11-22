import { describePublicFact } from '@/lib/admissions/factPresentation';
import { tuitionStatus } from '@/lib/admissions/tuitionPresentation';

export default function TuitionValue({ fact, language = 'en', concise = false }) {
  const status = tuitionStatus(fact, language);
  // Keep the amount, currency, period and fee year visible. The original quote
  // remains in the parent fact's disclosure, rather than competing with the price.
  const displayFact = concise && fact ? {
    ...fact,
    value: fact.value && { ...fact.value, label: '', feeYear: '' },
    historical: fact.historical && { ...fact.historical, value: fact.historical.value && { ...fact.historical.value, label: '', feeYear: '' } },
  } : fact;
  const value = fact?.status === 'historical_reference' ? fact.historical?.value : fact?.value;
  const feeYear = fact?.status !== 'unknown' && (value?.feeYear || (fact?.status === 'historical_reference' && fact.historical?.referenceSeason));
  const yearLabel = typeof feeYear === 'string' ? feeYear.match(/^(\d{4}\/\d{2,4})(?:\s|$)/)?.[1] || feeYear : feeYear;
  const unknownAmountText = {
    en: value?.currency ? `Amount unconfirmed (${value.currency})` : 'Amount unconfirmed',
    ru: value?.currency ? `Сумма не уточнена (${value.currency})` : 'Сумма не уточнена',
    uz: value?.currency ? `Summa tasdiqlanmagan (${value.currency})` : 'Summa tasdiqlanmagan',
  }[language] || 'Amount unconfirmed';
  const mainLabel = concise && value && typeof value === 'object' && !Number.isFinite(value.amount) && fact?.status !== 'unknown'
    ? unknownAmountText
    : describePublicFact(displayFact, language, 'tuition').value;
  return <><span className="tuition-amount">{mainLabel}</span>{(concise && yearLabel || status) && <span className="tuition-meta">{concise && yearLabel && <small className="tuition-year">{yearLabel}</small>}{status && <small className="tuition-status">{status}</small>}</span>}</>;
}
