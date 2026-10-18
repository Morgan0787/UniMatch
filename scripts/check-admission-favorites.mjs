import assert from 'node:assert/strict';
import {
  addAdmissionFavorite,
  canonicalFavoriteIds,
  clearFavoriteIntent,
  createFavoriteIntent,
  loadFavoriteIntent,
  removeAdmissionFavorite,
  saveFavoriteIntent,
  writeAdmissionFavorite,
} from '../src/lib/admissions/favorites.js';
import { favoriteStorageId, institutionIdFromFavorite } from '../src/lib/admissions/favoriteKeys.js';

const herts = 'gb-university-of-hertfordshire';
const coventry = 'gb-coventry-university';
const hertsKey = favoriteStorageId(herts);
const coventryKey = favoriteStorageId(coventry);
assert.ok(hertsKey && coventryKey);
assert.equal(institutionIdFromFavorite(hertsKey), herts);
assert.equal(favoriteStorageId(herts), hertsKey);
const legacy = ['11111111-1111-4111-8111-111111111111', hertsKey, '22222222-2222-4222-8222-222222222222'];
assert.deepEqual(canonicalFavoriteIds(legacy), [herts]);
assert.deepEqual(addAdmissionFavorite(legacy, herts), legacy);
assert.deepEqual(addAdmissionFavorite(legacy, coventry), [...legacy, coventryKey]);
assert.deepEqual(removeAdmissionFavorite(legacy, herts), ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);
assert.deepEqual(addAdmissionFavorite(null, herts), [hertsKey]);
assert.deepEqual(addAdmissionFavorite(undefined, herts), [hertsKey]);
assert.deepEqual(removeAdmissionFavorite(null, herts), []);
assert.throws(() => addAdmissionFavorite('invalid', herts), /unexpected format/);

const storageMap = new Map();
const storage = {
  getItem: key => storageMap.get(key) ?? null,
  setItem: (key, value) => storageMap.set(key, value),
  removeItem: key => storageMap.delete(key),
};
const intent = createFavoriteIntent({ id: 'herts-cs', institutionId: herts }, { field: 'it' }, 'DATA-03:1.0.0', 1000);
assert.equal(saveFavoriteIntent(storage, intent), true);
assert.equal(loadFavoriteIntent(storage, 1001).intent.optionId, 'herts-cs');
assert.equal(loadFavoriteIntent(storage, 1000 + 2 * 60 * 60 * 1000).status, 'expired');
storage.setItem('unimatch:admissions-favorite-intent', JSON.stringify({ ...intent, createdAt: Number.POSITIVE_INFINITY }));
assert.equal(loadFavoriteIntent(storage, 1001).status, 'invalid');
storage.setItem('unimatch:admissions-favorite-intent', JSON.stringify({ ...intent, createdAt: 1002 }));
assert.equal(loadFavoriteIntent(storage, 1001).status, 'invalid');
storage.setItem('unimatch:admissions-favorite-intent', '[]');
assert.equal(loadFavoriteIntent(storage, 1001).status, 'invalid');
storage.setItem('unimatch:admissions-favorite-intent', 'x'.repeat(64 * 1024 + 1));
assert.equal(loadFavoriteIntent(storage, 1001).status, 'invalid');
assert.equal(clearFavoriteIntent(storage), true);
assert.equal(loadFavoriteIntent(storage).status, 'empty');

const profile = { id: 'profile-1', saved_universities: ['11111111-1111-4111-8111-111111111111', hertsKey] };
const writes = [];
const repository = {
  findProfiles: async email => email === 'student@example.test' ? [profile] : [],
  createProfile: async row => ({ id: 'profile-new', ...row }),
  updateProfile: async (id, row) => {
    writes.push({ id, row });
    Object.assign(profile, row);
    return { ...profile };
  },
  readProfile: async () => ({ ...profile }),
};
const confirmed = await writeAdmissionFavorite(repository, { id: 'auth-id', email: 'student@example.test' }, coventry);
assert.deepEqual(confirmed.saved_universities, ['11111111-1111-4111-8111-111111111111', hertsKey, coventryKey]);
assert.equal(writes.length, 1);
await writeAdmissionFavorite(repository, { id: 'auth-id', email: 'student@example.test' }, herts, true);
assert.deepEqual(profile.saved_universities, ['11111111-1111-4111-8111-111111111111', coventryKey]);
await assert.rejects(
  () => writeAdmissionFavorite({ ...repository, findProfiles: async () => [profile, profile] }, { id: 'auth-id', email: 'student@example.test' }, herts),
  /selected safely/,
);
const nullableProfile = { id: 'profile-null', saved_universities: null };
const nullableRepo = {
  findProfiles: async () => [nullableProfile],
  updateProfile: async (id, row) => { Object.assign(nullableProfile, row); return { ...nullableProfile }; },
  readProfile: async () => ({ ...nullableProfile }),
  createProfile: async row => ({ id: 'new-profile', ...row }),
};
assert.deepEqual((await writeAdmissionFavorite(nullableRepo, { id: 'auth-id', email: 'student@example.test' }, herts)).saved_universities, [hertsKey]);
await writeAdmissionFavorite(nullableRepo, { id: 'auth-id', email: 'student@example.test' }, herts);
assert.deepEqual(nullableProfile.saved_universities, [hertsKey], 'Repeating a save cannot toggle or duplicate it');
await assert.rejects(
  () => writeAdmissionFavorite({ ...nullableRepo, updateProfile: async () => { throw new Error('mock network failure'); } }, { id: 'auth-id', email: 'student@example.test' }, coventry),
  /mock network failure/,
);
await assert.rejects(
  () => writeAdmissionFavorite({ ...nullableRepo, readProfile: async () => ({ id: nullableProfile.id, saved_universities: [] }) }, { id: 'auth-id', email: 'student@example.test' }, coventry),
  /could not be confirmed/,
);
await assert.rejects(
  () => writeAdmissionFavorite({ ...repository, readProfile: async () => ({ id: profile.id, saved_universities: [hertsKey, coventryKey] }) }, { id: 'auth-id', email: 'student@example.test' }, herts),
  /could not be confirmed/,
  'A confirmed requested key cannot hide loss of an unrelated legacy UUID',
);

console.log('Admission favorite mock contract checks passed.');
