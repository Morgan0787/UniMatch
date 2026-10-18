import { adaptPublicCatalog } from './publicCatalog.js';

/** A reviewed programme is not a university-wide EUR/GPA requirement. */
export function withPublicProgrammeFacts(row) {
  const requirements = row?.admission_requirements;
  if (!requirements || typeof requirements !== 'object' || !Object.hasOwn(requirements, 'unimatch_catalog_v1')) return row;
  const adapted = adaptPublicCatalog([{ id: row.id, name: row.name, country: row.country,
    city: row.city || null, region: row.region || null, website: row.website || null,
    catalog: requirements.unimatch_catalog_v1 }]);
  const institution = adapted.institutions[0];
  return {
    ...row,
    admissionCatalog: { status: institution ? 'valid' : 'invalid', identity: institution ? { id: institution.id, institutionId: institution.institutionId, legacyFavoriteKeys: institution.legacyFavoriteKeys } : null, programmes: institution?.programmes || [], sources: institution?.sources || {} },
    tuition_min: null, tuition_max: null, living_cost_estimate: null, min_gpa: null, required_ielts: null,
    language: '', topikLevel: '', application_deadline: '', scholarships_available: null, verified: false,
    image_url: institution?.media?.image?.url || '',
    website: institution?.media?.homepage || row.website,
    degree_levels: institution ? [...new Set(institution.programmes.map(programme => typeof programme.degree?.value === 'string' ? programme.degree.value : programme.degree?.value?.level).filter(Boolean))] : [],
    notable_programs: institution?.programmes.map(programme => programme.name?.value).filter(Boolean) || [],
  };
}
