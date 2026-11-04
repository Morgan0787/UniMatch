import React from 'react';
import { getRegionalEstimate } from '@/lib/regionalEstimates';
import { catalogEstimateNote, catalogText } from '@/lib/catalogCopy';
import { useLanguage } from '@/lib/i18n';

/**
 * Shows a verified value if present. If null, falls back to a regional
 * ballpark range (GPA / IELTS / TOPIK only — see regionalEstimates.js for
 * why other fields don't get this treatment), visually distinguished so it's
 * never confused with a real, university-confirmed number.
 *
 * If there's no verified value AND no honest regional estimate either,
 * shows a plain "not published" note instead of inventing anything.
 */
export default function EstimatedField({ value, field, region, format = (v) => v, unit = '' }) {
  const { language } = useLanguage();

  if (value !== null && value !== undefined && value !== '') {
    return <span className="font-semibold text-slate-800">{format(value)}{unit}</span>;
  }

  const estimate = getRegionalEstimate(region, field);

  if (!estimate) {
    return <span className="text-slate-400 italic text-sm">{catalogText(language, 'notPublished')}</span>;
  }

  const estimateTitle = [
    catalogEstimateNote(region, field, language, estimate.note),
    catalogText(language, 'estimateNote'),
  ].filter(Boolean).join(' ');

  return (
    <span className="italic text-slate-500" title={estimateTitle}>
      ~{format(estimate.min)}–{format(estimate.max)}{unit}
      <span className="ml-1 text-[10px] not-italic uppercase tracking-wide text-amber-600 align-middle">{catalogText(language, 'estimate')}</span>
    </span>
  );
}
