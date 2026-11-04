export const DEFAULT_FILTERS = { gpa: null, ielts: null, topikLevel: null, budget: null, region: '', country: '', languages: [], degree: '', scholarshipsOnly: false };

/** @param {Record<string, any>} [value] */
export function normalizeFilters(value = {}) {
    const input = value && typeof value === 'object' ? value : {};
    const number = key => input[key] == null || input[key] === '' ? null : Number.isFinite(Number(input[key])) ? Number(input[key]) : null;
    return {
        ...DEFAULT_FILTERS,
        gpa: number('gpa'), ielts: number('ielts'), budget: number('budget'),
        topikLevel: typeof input.topikLevel === 'string' && input.topikLevel ? input.topikLevel : null,
        region: typeof input.region === 'string' && input.region !== 'all' ? input.region : '',
        country: typeof input.country === 'string' && input.country !== 'all' ? input.country : '',
        languages: Array.isArray(input.languages) ? input.languages.filter(v => typeof v === 'string' && v) : [],
        degree: typeof input.degree === 'string' ? input.degree : '',
        scholarshipsOnly: Boolean(input.scholarshipsOnly),
    };
}

export function readCatalogState(params, fallback = DEFAULT_FILTERS) {
    let filters = fallback;
    try { if (params.has('filters')) filters = JSON.parse(params.get('filters')); } catch { filters = DEFAULT_FILTERS; }
    const page = Number(params.get('page'));
    return { query: params.get('q') || '', filters: normalizeFilters(filters), page: Number.isInteger(page) && page > 0 ? page : 1 };
}

export function writeCatalogState(params, patch, fallback) {
    const next = new URLSearchParams(params);
    const state = { ...readCatalogState(params, fallback), ...patch };
    if (state.query) next.set('q', state.query); else next.delete('q');
    next.set('filters', JSON.stringify(normalizeFilters(state.filters)));
    if (state.page > 1) next.set('page', String(state.page)); else next.delete('page');
    return next;
}
