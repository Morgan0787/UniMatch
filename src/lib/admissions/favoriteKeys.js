// Frozen v1 storage identity, NOT universities table row IDs. UUIDv5 using the
// RFC URL namespace and https://unimatch-two.vercel.app/admissions/institutions/<id>.
// student_profiles.saved_universities is uuid[]; Profile resolves these keys
// against public static sources without inserting invented University records.
export const FAVORITE_KEYS = Object.freeze({
  'gb-university-of-hertfordshire': '18f7ab53-1623-5e5c-a440-bfea963a56db',
  'gb-coventry-university': '02dd30b2-9a13-50d0-9a50-cc6458a904ca',
  'gb-university-of-west-of-england': 'ea2f380e-78f2-5669-9e45-8df00b98a6a9',
  'gb-nottingham-trent-university': '3b8f631e-b203-5803-af2b-4e8dbe427369',
  'gb-university-of-portsmouth': 'd8c40f9e-7e2e-5755-8cdd-f4f1760e5597',
  'us-iowa-state-university': '8528a83f-2960-5699-9212-1d401b4bfbcc',
  'hu-university-of-debrecen': '8c451c55-728f-54ef-b5e8-a20a2fff1012',
  'hu-university-of-pecs': '445884e5-58e9-55ef-a7d9-d0633572ce99',
  'kr-woosong-university': '29a774b0-9e2f-5058-b6ba-2282ffcdeaa0',
  'fi-turku-university-of-applied-sciences': '3c9e9245-f6ef-5b9a-bb39-732490850123',
  'us-arizona-state-university': 'cba252bd-851a-57f2-afdb-6cdd519fb859',
  'us-stony-brook-university': '2c2a1db8-3237-5f63-b3db-8ba90b3172ba',
});
/** @param {string} institutionId */
export function favoriteStorageId(institutionId) { return Object.hasOwn(FAVORITE_KEYS, institutionId) ? FAVORITE_KEYS[institutionId] : null; }
/** @param {unknown} key */
export function institutionIdFromFavorite(key) {
  if (typeof key !== 'string') return null;
  return Object.keys(FAVORITE_KEYS).find(id => FAVORITE_KEYS[id] === key.toLowerCase()) || null;
}
