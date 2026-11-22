import { formatUsd, toUsd } from './tuitionCurrency.js';

/** Legacy tuition fields contain annual amounts in EUR. */
export function legacyTuitionPresentation(minimum, maximum, language = 'en') {
  const lowUsd = toUsd(minimum, 'EUR');
  const highUsd = maximum == null ? null : toUsd(maximum, 'EUR');
  if (lowUsd == null || (maximum != null && highUsd == null)) return null;

  const low = formatUsd(lowUsd, language);
  const high = highUsd == null ? null : formatUsd(highUsd, language);
  return high && high !== low ? `${low}–${high}` : low;
}
