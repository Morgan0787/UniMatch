import assert from 'node:assert/strict';
import { clearDraft, DRAFT_KEY, loadDraft, saveDraft, TTL_MS } from '../src/lib/admissions/draft.js';

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const blankAnswers = {
  field: '',
  regions: [],
  exam: '',
  score: '',
  grade: '',
  scale: '',
  budget: '',
  currency: '',
  scholarship: '',
  schoolCountry: '',
  credential: '',
  startYear: '',
  language: '',
  examDate: '',
};
const sampleDraft = {
  answers: { ...blankAnswers, field: 'Engineering', regions: ['Canada', 'Germany'] },
  step: 2,
  view: 'results',
};
const t0 = 1_900_000_000_000;

// Round-trip restores all accepted answers and state.
{
  const storage = new MemoryStorage();
  assert.equal(saveDraft(storage, sampleDraft, t0), true);
  assert.deepEqual(loadDraft(storage, t0 + 1), {
    answers: sampleDraft.answers,
    step: 2,
    view: 'results',
    status: 'restored',
  });
}

// Expiry occurs exactly at the TTL, and expiration removes only this key.
{
  const storage = new MemoryStorage();
  storage.setItem('unrelated', 'keep');
  assert.equal(saveDraft(storage, sampleDraft, t0), true);
  assert.equal(loadDraft(storage, t0 + TTL_MS - 1).status, 'restored');
  assert.equal(loadDraft(storage, t0 + TTL_MS).status, 'expired');
  assert.equal(storage.getItem(DRAFT_KEY), null);
  assert.equal(storage.getItem('unrelated'), 'keep');
}

// Repeated saves do not renew the original expiration time.
{
  const storage = new MemoryStorage();
  assert.equal(saveDraft(storage, sampleDraft, t0), true);
  assert.equal(saveDraft(storage, { ...sampleDraft, step: 1 }, t0 + TTL_MS - 10), true);
  const envelope = JSON.parse(storage.getItem(DRAFT_KEY));
  assert.equal(envelope.createdAt, t0);
  assert.equal(saveDraft(storage, sampleDraft, t0 + TTL_MS), false);
  assert.equal(storage.getItem(DRAFT_KEY), null);
}

// Arbitrary payload data and prototype-like keys never enter the saved answers.
{
  const storage = new MemoryStorage();
  const answers = JSON.parse('{"field":"Math","regions":["US"],"__proto__":{"polluted":true},"isAdmin":true}');
  assert.equal(saveDraft(storage, { answers, step: 0, view: 'survey', extra: 'secret' }, t0), true);
  const envelope = JSON.parse(storage.getItem(DRAFT_KEY));
  assert.deepEqual(Object.keys(envelope.answers).sort(), Object.keys(blankAnswers).sort());
  assert.equal(Object.hasOwn(envelope.answers, '__proto__'), false);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.hasOwn(envelope, 'extra'), false);
}

// Text and region entries are trimmed and bounded; oversized collections are capped.
{
  const storage = new MemoryStorage();
  const manyRegions = Array.from({ length: 25 }, (_, i) => ` ${i}${'x'.repeat(130)} `);
  assert.equal(saveDraft(storage, { ...sampleDraft, answers: { ...blankAnswers, field: ` ${'a'.repeat(600)} `, regions: manyRegions } }, t0), true);
  const restored = loadDraft(storage, t0 + 1);
  assert.equal(restored.answers.field.length, 500);
  assert.equal(restored.answers.regions.length, 20);
  assert.equal(restored.answers.regions[0].length, 100);
}

// Malformed JSON, versions, answer types, views, and steps are rejected and removed.
for (const raw of [
  '{not json',
  JSON.stringify({ schemaVersion: 2 }),
  JSON.stringify({ schemaVersion: 1, createdAt: t0, answers: { ...blankAnswers, exam: 7 }, step: 1, view: 'survey' }),
  JSON.stringify({ schemaVersion: 1, createdAt: t0, answers: blankAnswers, step: 3, view: 'survey' }),
  JSON.stringify({ schemaVersion: 1, createdAt: t0, answers: blankAnswers, step: 1, view: 'profile' }),
]) {
  const storage = new MemoryStorage();
  storage.setItem(DRAFT_KEY, raw);
  storage.setItem('unrelated', 'keep');
  assert.equal(loadDraft(storage, t0).status, 'invalid');
  assert.equal(storage.getItem(DRAFT_KEY), null);
  assert.equal(storage.getItem('unrelated'), 'keep');
}

// Oversized serialized input is rejected without parsing and removed.
{
  const storage = new MemoryStorage();
  storage.setItem(DRAFT_KEY, ' '.repeat(70 * 1024));
  assert.equal(loadDraft(storage, t0).status, 'invalid');
  assert.equal(storage.getItem(DRAFT_KEY), null);
}

// Invalid save state does not write data.
{
  const storage = new MemoryStorage();
  assert.equal(saveDraft(storage, { ...sampleDraft, step: 4 }, t0), false);
  assert.equal(saveDraft(storage, { ...sampleDraft, view: 'unknown' }, t0), false);
  assert.equal(storage.getItem(DRAFT_KEY), null);
}

// Throwing storage methods are contained at the boundary.
{
  const getFailure = { getItem() { throw new Error('blocked'); }, setItem() {}, removeItem() {} };
  assert.equal(loadDraft(getFailure, t0).status, 'unavailable');
  assert.equal(saveDraft(getFailure, sampleDraft, t0), false);

  const setFailure = { getItem() { return null; }, setItem() { throw new Error('blocked'); }, removeItem() {} };
  assert.equal(saveDraft(setFailure, sampleDraft, t0), false);

  const removeFailure = { getItem() { return 'broken'; }, setItem() {}, removeItem() { throw new Error('blocked'); } };
  assert.equal(loadDraft(removeFailure, t0).status, 'unavailable');
  assert.equal(clearDraft(removeFailure), false);
}

// Clear removes only the draft key, and absent drafts load as empty.
{
  const storage = new MemoryStorage();
  storage.setItem('unrelated', 'keep');
  assert.equal(loadDraft(storage, t0).status, 'empty');
  assert.equal(clearDraft(storage), true);
  assert.equal(storage.getItem('unrelated'), 'keep');
}

console.log('Admission draft storage checks passed.');
