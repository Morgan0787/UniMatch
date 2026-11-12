import { withPublicProgrammeFacts } from './admissions/universityCatalog.js';

const parseJsonString = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || !['[', '{', '"'].includes(trimmed[0])) return value;
  try { return JSON.parse(trimmed); } catch { return value; }
};

const asArray = (value) => {
  const parsed = parseJsonString(value);
  if (Array.isArray(parsed)) return parsed;
  return typeof parsed === 'string' ? parsed.split(',').map(item => item.trim()).filter(Boolean) : [];
};

const asObject = (value) => {
  const parsed = parseJsonString(value);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
};

const asNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const normalized = typeof value === 'string' ? Number(value.replace(/,/g, '').trim()) : Number(value);
  return Number.isFinite(normalized) ? normalized : null;
};

const asString = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const asBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no', ''].includes(normalized)) return false;
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
};

/** Normalize the database row into the public university shape used by search. */
export const normalizeUniversity = (university) => {
  const row = university && typeof university === 'object' ? university : {};
  return withPublicProgrammeFacts({
    ...row,
    id: row.id ?? null,
    name: asString(row.name, 'Unknown university'),
    country: asString(row.country),
    city: asString(row.city),
    region: asString(row.region),
    language: asString(row.language),
    website: asString(row.website),
    image_url: asString(row.image_url),
    description: asString(row.description),
    application_deadline: asString(row.application_deadline),
    topikLevel: asString(row.topikLevel),
    degree_levels: asArray(row.degree_levels),
    notable_programs: asArray(row.notable_programs),
    preferred_languages: asArray(row.preferred_languages),
    // FIX (2026-07-26): these three used to fall back to 0 via an `asNumber(x, 0)`
    // helper, which made every US university with a NULL min_gpa show "GPA 0.0" and
    // every university with a NULL tuition_min show as "Free". Using
    // asNullableNumber preserves null so EstimatedField / the "Not published"
    // UI branch can do its job instead of a fake zero looking like real data.
    //
    // living_cost_estimate was the same defect with a different number: it used
    // `asNumber(x, 8000)`, so a NULL became the literal 8000 upstream and every
    // cost surface downstream had a real figure to print with no data behind it
    // (~1,944 College Scorecard rows). It now preserves null like the others,
    // which leaves `asNumber` with no call sites — deliberately not reinstated:
    // defaulting a missing field to a plausible number is the defect, not the fix.
    // Consumers must null-check both cost fields before doing arithmetic — see
    // hasCostData() in src/pages/Recommendations.jsx.
    tuition_min: asNullableNumber(row.tuition_min),
    tuition_max: asNullableNumber(row.tuition_max),
    living_cost_estimate: asNullableNumber(row.living_cost_estimate),
    min_gpa: asNullableNumber(row.min_gpa),
    required_ielts: asNullableNumber(row.required_ielts),
    international_students_percent: asNullableNumber(row.international_students_percent),
    scholarships_available: asBoolean(row.scholarships_available),
    campus_life: asObject(row.campus_life),
    admission_requirements: asObject(row.admission_requirements),
    international_support: asObject(row.international_support),
  });
};
