import referenceRates from './tuitionExchangeRates.json' with { type: 'json' };

/** @param {number} amount @param {string} currency @returns {number | null} */
export function toUsd(amount, currency) {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (currency === 'USD') return amount;
  if (!Object.hasOwn(referenceRates.perEuro, currency)) return null;
  const converted = amount * (referenceRates.perEuro.USD / referenceRates.perEuro[currency]);
  return Number.isFinite(converted) ? converted : null;
}

/** @param {number} amount @param {string} [language] */
export function formatUsd(amount, language = 'en') {
  return new Intl.NumberFormat(language, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(amount);
}
