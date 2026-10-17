export const DRAFT_KEY = 'unimatch:admissions-draft';
export const TTL_MS = 2 * 60 * 60 * 1000;

const SCHEMA_VERSION = 1;
const MAX_ENVELOPE_LENGTH = 64 * 1024;
const MAX_TEXT_LENGTH = 500;
const MAX_REGION_LENGTH = 100;
const MAX_REGIONS = 20;
const ANSWER_KEYS = [
  'field',
  'regions',
  'exam',
  'score',
  'grade',
  'scale',
  'budget',
  'currency',
  'scholarship',
  'schoolCountry',
  'credential',
  'startYear',
  'language',
  'examDate',
];
const TEXT_ANSWER_KEYS = ANSWER_KEYS.filter((key) => key !== 'regions');

/**
 * @param {unknown} answers
 * @returns {Record<string, string | string[]> | null}
 */
function normalizeAnswers(answers) {
  if (answers === null || typeof answers !== 'object' || Array.isArray(answers)) {
    return null;
  }

  const source = /** @type {Record<string, unknown>} */ (answers);
  const normalized = /** @type {Record<string, string | string[]>} */ ({});

  for (const key of TEXT_ANSWER_KEYS) {
    const value = Object.hasOwn(source, key) ? source[key] : '';
    if (typeof value !== 'string') return null;
    normalized[key] = value.trim().slice(0, MAX_TEXT_LENGTH);
  }

  const regions = Object.hasOwn(source, 'regions') ? source.regions : [];
  if (!Array.isArray(regions) || regions.some((region) => typeof region !== 'string')) {
    return null;
  }
  normalized.regions = regions
    .slice(0, MAX_REGIONS)
    .map((region) => region.trim().slice(0, MAX_REGION_LENGTH));

  return normalized;
}

/** @param {unknown} step @returns {step is 0 | 1 | 2} */
function isValidStep(step) {
  return step === 0 || step === 1 || step === 2;
}

/** @param {unknown} view @returns {view is 'survey' | 'results'} */
function isValidView(view) {
  return view === 'survey' || view === 'results';
}

/** @param {unknown} storage @returns {storage is Storage} */
function hasStorageMethods(storage) {
  if (storage === null || typeof storage !== 'object') return false;
  const candidate = /** @type {Partial<Storage>} */ (storage);
  return typeof candidate.getItem === 'function'
    && typeof candidate.setItem === 'function'
    && typeof candidate.removeItem === 'function';
}

/** @param {Storage} storage */
function removeOwnKey(storage) {
  storage.removeItem(DRAFT_KEY);
}

/**
 * Validate and normalize one serialized envelope.
 * @param {string} raw
 * @param {number} now
 * @returns {{status: 'restored', envelope: {schemaVersion: 1, createdAt: number, answers: Record<string, string | string[]>, step: 0 | 1 | 2, view: 'survey' | 'results'}} | {status: 'invalid' | 'expired'}}
 */
function inspectEnvelope(raw, now) {
  if (raw.length > MAX_ENVELOPE_LENGTH) return { status: 'invalid' };

  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: 'invalid' };
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { status: 'invalid' };
  }

  const envelope = /** @type {Record<string, unknown>} */ (value);
  const createdAt = envelope.createdAt;
  if (
    envelope.schemaVersion !== SCHEMA_VERSION
    || typeof createdAt !== 'number'
    || !Number.isFinite(createdAt)
    || createdAt < 0
    || createdAt > now
    || !isValidStep(envelope.step)
    || !isValidView(envelope.view)
  ) {
    return { status: 'invalid' };
  }

  const answers = normalizeAnswers(envelope.answers);
  if (!answers) return { status: 'invalid' };
  if (now - createdAt >= TTL_MS) return { status: 'expired' };

  return {
    status: 'restored',
    envelope: {
      schemaVersion: SCHEMA_VERSION,
      createdAt,
      answers,
      step: envelope.step,
      view: envelope.view,
    },
  };
}

/**
 * Restore a guest-only draft from an injected session storage object.
 * @param {Storage} storage
 * @param {number} [now]
 * @returns {{answers: Record<string, string | string[]> | null, step: 0 | 1 | 2, view: 'survey' | 'results', status: 'empty' | 'restored' | 'expired' | 'invalid' | 'unavailable'}}
 */
export function loadDraft(storage, now = Date.now()) {
  const empty = /** @type {ReturnType<typeof loadDraft>} */ ({ answers: null, step: 0, view: 'survey', status: 'empty' });
  if (!Number.isFinite(now) || now < 0 || !hasStorageMethods(storage)) {
    return { ...empty, status: 'unavailable' };
  }

  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (raw === null) return empty;
    if (typeof raw !== 'string') {
      removeOwnKey(storage);
      return { ...empty, status: 'invalid' };
    }

    const result = inspectEnvelope(raw, now);
    if (result.status !== 'restored') {
      removeOwnKey(storage);
      return { ...empty, status: result.status };
    }

    return {
      answers: result.envelope.answers,
      step: result.envelope.step,
      view: result.envelope.view,
      status: 'restored',
    };
  } catch {
    return { ...empty, status: 'unavailable' };
  }
}

/**
 * Save a normalized guest draft. The original creation time is retained, so
 * repeated saves cannot extend its two-hour lifetime.
 * @param {Storage} storage
 * @param {{answers: unknown, step: unknown, view: unknown}} draft
 * @param {number} [now]
 * @returns {boolean}
 */
export function saveDraft(storage, draft, now = Date.now()) {
  if (!Number.isFinite(now) || now < 0 || !hasStorageMethods(storage)) return false;
  if (draft === null || typeof draft !== 'object') return false;

  const answers = normalizeAnswers(draft.answers);
  if (!answers || !isValidStep(draft.step) || !isValidView(draft.view)) return false;

  try {
    const raw = storage.getItem(DRAFT_KEY);
    let createdAt = now;
    if (raw !== null) {
      if (typeof raw !== 'string') {
        removeOwnKey(storage);
        return false;
      }
      const previous = inspectEnvelope(raw, now);
      if (previous.status !== 'restored') {
        removeOwnKey(storage);
        return false;
      }
      createdAt = previous.envelope.createdAt;
    }

    const serialized = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      createdAt,
      answers,
      step: draft.step,
      view: draft.view,
    });
    if (serialized.length > MAX_ENVELOPE_LENGTH) return false;
    storage.setItem(DRAFT_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

/** @param {Storage} storage @returns {boolean} */
export function clearDraft(storage) {
  if (!hasStorageMethods(storage)) return false;
  try {
    removeOwnKey(storage);
    return true;
  } catch {
    return false;
  }
}
