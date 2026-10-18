import { TTL_MS } from './draft.js';
import { favoriteStorageId, institutionIdFromFavorite } from './favoriteKeys.js';

const userQueues = new Map();

/** Serialize favorite writes across mounted hooks for one auth user. */
export async function serializeFavoriteWrite(userId, task) {
  const previous = userQueues.get(userId) || Promise.resolve();
  let release = () => {};
  const current = new Promise(resolve => { release = () => resolve(undefined); });
  userQueues.set(userId, current);
  await previous;
  try {
    return await task();
  } finally {
    release();
    if (userQueues.get(userId) === current) userQueues.delete(userId);
  }
}

/** @param {unknown} value */
export function canonicalFavoriteId(value, institutions = []) {
  if (typeof value !== 'string') return null;
  const key = value.toLowerCase();
  const institution = institutions.find(row => [row.id, ...(row.legacyFavoriteKeys || [])].some(id => id.toLowerCase() === key));
  return institution?.institutionId || institutionIdFromFavorite(value);
}

/** @param {unknown} saved */
export function canonicalFavoriteIds(saved, institutions = []) {
  if (!Array.isArray(saved)) return [];
  return [...new Set(saved.map(value => canonicalFavoriteId(value, institutions)).filter(Boolean))];
}

function storageKeys(institutionId, institutions) {
  if (institutions) {
    const row = institutions.find(item => item.institutionId === institutionId);
    return row ? [row.id, ...(row.legacyFavoriteKeys || [])] : [];
  }
  const legacy = favoriteStorageId(institutionId);
  return legacy ? [legacy] : [];
}

/** @param {unknown} saved @param {string} institutionId */
export function addAdmissionFavorite(saved, institutionId, institutions = null) {
  const aliases = storageKeys(institutionId, institutions);
  const id = aliases[0];
  if (!id) throw new Error('The institution does not have a saved-list key.');
  const values = Array.isArray(saved) ? saved : saved == null ? [] : null;
  if (!values) throw new Error('The saved list has an unexpected format.');
  const key = id;
  return values.some(value => typeof value === 'string' && aliases.some(alias => alias.toLowerCase() === value.toLowerCase()))
    ? [...values]
    : [...values, key];
}

/** @param {unknown} saved @param {string} institutionId */
export function removeAdmissionFavorite(saved, institutionId, institutions = null) {
  const aliases = storageKeys(institutionId, institutions);
  const id = aliases[0];
  if (!id) throw new Error('The institution does not have a saved-list key.');
  if (saved == null) return [];
  if (!Array.isArray(saved)) throw new Error('The saved list has an unexpected format.');
  return saved.filter(value => typeof value !== 'string' || !aliases.some(alias => alias.toLowerCase() === value.toLowerCase()));
}

export const FAVORITE_INTENT_KEY = 'unimatch:admissions-favorite-intent';

/**
 * Storage-independent pending intent helpers. Callers inject storage and the
 * current draft answers so this module never reads browser globals or APIs.
 */
export function createFavoriteIntent(option, answers, catalogVersion, createdAt = Date.now()) {
  if (!option || typeof option.institutionId !== 'string' || !option.institutionId.trim()) {
    throw new Error('A sourced institution id is required.');
  }
  if (typeof option.id !== 'string' || !option.id.trim()
    || typeof catalogVersion !== 'string' || !catalogVersion.trim()
    || !answers || typeof answers !== 'object' || Array.isArray(answers)
    || !Number.isFinite(createdAt) || createdAt < 0) {
    throw new Error('The admission save intent is incomplete.');
  }
  return {
    schemaVersion: 1,
    optionId: option.id,
    institutionId: option.institutionId.trim(),
    catalogVersion,
    answers,
    createdAt,
  };
}

/** @param {Storage | null} storage @param {ReturnType<typeof createFavoriteIntent>} intent */
export function saveFavoriteIntent(storage, intent) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    const serialized = JSON.stringify(intent);
    if (typeof serialized !== 'string' || serialized.length > 64 * 1024) return false;
    storage.setItem(FAVORITE_INTENT_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

/** @param {Storage | null} storage @param {number} [now] */
export function loadFavoriteIntent(storage, now = Date.now()) {
  const unavailable = { status: 'unavailable', intent: null };
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.removeItem !== 'function') return unavailable;
  try {
    const raw = storage.getItem(FAVORITE_INTENT_KEY);
    if (raw === null) return { status: 'empty', intent: null };
    if (typeof raw !== 'string' || raw.length > 64 * 1024) {
      storage.removeItem(FAVORITE_INTENT_KEY);
      return { status: 'invalid', intent: null };
    }
    const value = JSON.parse(raw);
    const valid = value && typeof value === 'object' && !Array.isArray(value) && value.schemaVersion === 1
      && typeof value.optionId === 'string' && value.optionId.length > 0 && value.optionId.length <= 500
      && typeof value.institutionId === 'string' && value.institutionId.length > 0 && value.institutionId.length <= 500
      && typeof value.catalogVersion === 'string' && value.catalogVersion.length > 0 && value.catalogVersion.length <= 500
      && value.answers && typeof value.answers === 'object'
      && !Array.isArray(value.answers) && Number.isFinite(value.createdAt) && value.createdAt >= 0
      && Number.isFinite(now) && value.createdAt <= now;
    if (!valid) {
      storage.removeItem(FAVORITE_INTENT_KEY);
      return { status: 'invalid', intent: null };
    }
    if (now - value.createdAt >= TTL_MS) {
      storage.removeItem(FAVORITE_INTENT_KEY);
      return { status: 'expired', intent: null };
    }
    return { status: 'restored', intent: value };
  } catch {
    return unavailable;
  }
}

/** @param {Storage | null} storage */
export function clearFavoriteIntent(storage) {
  if (!storage || typeof storage.removeItem !== 'function') return false;
  try {
    storage.removeItem(FAVORITE_INTENT_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save against an injected profile repository. The read/write/read sequence
 * confirms persistence but cannot prevent a concurrent cross-tab array race.
 * @param {{findProfiles: (email: string) => Promise<any[]>, createProfile: (row: any) => Promise<any>, updateProfile: (id: string, row: any) => Promise<any>, readProfile: (id: string) => Promise<any>}} repository
 * @param {{id: string, email: string}} owner
 * @param {string} institutionId
 * @param {boolean} remove
 */
export async function writeAdmissionFavorite(repository, owner, institutionId, remove = false, institutions = null) {
  if (!owner?.id || !owner?.email) throw new Error('Your signed-in account could not be confirmed.');
  const profiles = await repository.findProfiles(owner.email);
  if (!Array.isArray(profiles) || profiles.length > 1) throw new Error('Your profile could not be selected safely.');
  const profile = profiles[0] || null;
  if (profile && profile.saved_universities != null && !Array.isArray(profile.saved_universities)) {
    throw new Error('The saved list has an unexpected format.');
  }
  const current = Array.isArray(profile?.saved_universities) ? profile.saved_universities : [];
  const next = remove
    ? removeAdmissionFavorite(current, institutionId, institutions)
    : addAdmissionFavorite(current, institutionId, institutions);
  const returned = profile
    ? await repository.updateProfile(profile.id, { saved_universities: next })
    : await repository.createProfile({ created_by: owner.email, saved_universities: next });
  const matchesExpected = row => Array.isArray(row?.saved_universities)
    && row.saved_universities.length === next.length
    && next.every((value, index) => row.saved_universities[index] === value);
  if (!matchesExpected(returned)) {
    throw new Error('The save could not be confirmed. Please retry.');
  }
  if (!returned?.id || (profile && returned.id !== profile.id)) throw new Error('Your profile could not be confirmed.');
  const confirmed = await repository.readProfile(returned.id);
  const persisted = confirmed?.id === returned.id && matchesExpected(confirmed);
  if (!persisted) throw new Error('The save could not be confirmed. Please retry.');
  return confirmed;
}
