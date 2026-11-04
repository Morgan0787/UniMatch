import { catalogValue } from './catalogCopy.js';
import { canonicalCountry, discoveryRegion, matchesDiscoveryTab } from './universityGeography.js';

const FEATURED_COUNTRIES = ['United Kingdom', 'Netherlands', 'Canada', 'Singapore'];

/** Select actual catalogue rows only; an empty response stays empty. */
export function selectDiscoveryUniversities(rows, language = 'en', tab = 0) {
  const available = rows.filter(row => matchesDiscoveryTab(row, tab));
  const selected = [];
  for (const country of FEATURED_COUNTRIES) {
    const row = available.find(item => canonicalCountry(item.country) === country);
    if (row) selected.push(row);
  }
  for (const row of available) {
    if (selected.length === 4) break;
    if (!selected.some(item => item.id === row.id || canonicalCountry(item.country) === canonicalCountry(row.country))) selected.push(row);
  }
  for (const row of available) {
    if (selected.length === 4) break;
    if (!selected.some(item => item.id === row.id)) selected.push(row);
  }
  return selected.map(row => {
    const country = catalogValue(canonicalCountry(row.country), language);
    const region = catalogValue(discoveryRegion(row), language) || country;
    return { ...row, record: row, country: [country, country],
      description: [row.city || country, row.city || country], tags: [region, region],
      image: row.image_url || '/images/community.jpg' };
  });
}
