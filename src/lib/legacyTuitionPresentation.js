import { formatUsd, toUsd, TUITION_RATE_DATE } from './tuitionCurrency.js';

const COPY = {
  en: 'Original tuition in EUR · ECB reference rate {date}',
  ru: 'Исходная стоимость в EUR · курс ЕЦБ на {date}',
  uz: 'Asl o‘qish narxi EURda · ECB kursi {date}',
};

function formatEur(amount, language) {
  return new Intl.NumberFormat(language === 'uz' ? 'uz-UZ' : language, {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
  }).format(amount);
}

/** Legacy tuition fields contain annual amounts in EUR. */
export function legacyTuitionPresentation(minimum, maximum, language = 'en') {
  const lowUsd = toUsd(minimum, 'EUR');
  const highUsd = maximum == null ? null : toUsd(maximum, 'EUR');
  if (lowUsd == null || (maximum != null && highUsd == null)) return null;

  const originalRange = maximum != null && maximum !== minimum
    ? `${formatEur(minimum, language)}–${formatEur(maximum, language)}`
    : formatEur(minimum, language);
  const convertedRange = highUsd != null && highUsd !== lowUsd
    ? `${formatUsd(lowUsd, language)}–${formatUsd(highUsd, language)}`
    : formatUsd(lowUsd, language);

  return {
    amount: `≈ ${convertedRange}`,
    note: (COPY[language] || COPY.en).replace('{date}', TUITION_RATE_DATE),
    originalRange,
  };
}
