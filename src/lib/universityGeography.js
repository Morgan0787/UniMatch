// Discovery geography is presentation only; it never changes admission eligibility.
const COUNTRY_ALIASES = {
  uk: 'United Kingdom', 'great britain': 'United Kingdom',
  us: 'United States', usa: 'United States', 'united states of america': 'United States',
  'republic of korea': 'South Korea', 'korea, republic of': 'South Korea',
  czechia: 'Czech Republic', 'united arab emirates': 'UAE',
};
const CONTINENTS = {
  Europe: ['United Kingdom', 'Germany', 'Netherlands', 'Czech Republic', 'Poland', 'Hungary', 'Austria', 'France', 'Italy', 'Spain', 'Portugal', 'Belgium', 'Sweden', 'Finland', 'Norway', 'Denmark', 'Switzerland', 'Ireland', 'Lithuania', 'Latvia', 'Estonia', 'Greece', 'Romania', 'Bulgaria', 'Croatia', 'Slovenia', 'Slovakia', 'Malta', 'Cyprus', 'Luxembourg', 'Iceland'],
  'North America': ['United States', 'Canada', 'Mexico'],
  Asia: ['South Korea', 'China', 'Japan', 'Singapore', 'Malaysia', 'India', 'Pakistan', 'Bangladesh', 'Vietnam', 'Indonesia', 'Uzbekistan', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan'],
};
const KNOWN_COUNTRIES = Object.values(CONTINENTS).flat();

export function canonicalCountry(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  return COUNTRY_ALIASES[name.toLowerCase()] || KNOWN_COUNTRIES.find(country => country.toLowerCase() === name.toLowerCase()) || name;
}

export function discoveryRegion(row) {
  const country = canonicalCountry(row.country);
  const known = Object.entries(CONTINENTS).find(([, countries]) => countries.includes(country));
  if (known) return known[0];
  const region = typeof row.region === 'string' ? row.region.trim() : '';
  return Object.keys(CONTINENTS).find(name => name.toLowerCase() === region.toLowerCase()) || region;
}

export function matchesDiscoveryTab(row, tab) {
  if (tab === 1) return canonicalCountry(row.country) === 'United Kingdom';
  const region = { 2: 'Europe', 3: 'North America', 4: 'Asia' }[tab];
  return !region || discoveryRegion(row) === region;
}
