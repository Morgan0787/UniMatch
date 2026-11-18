const FILTERS = new Set(['all', 'budget', 'unknown']);
const SORT_ORDERS = new Set(['match', 'name']);

/** @param {URLSearchParams} params */
export function readRecommendationState(params) {
  const filter = params.get('filter');
  const sort = params.get('sort');
  return {
    filter: FILTERS.has(filter) ? filter : 'all',
    sort: SORT_ORDERS.has(sort) ? sort : 'match',
  };
}

/** @param {URLSearchParams} params @param {{filter?: string, sort?: string}} patch */
export function writeRecommendationState(params, patch) {
  const next = new URLSearchParams(params);
  const { filter, sort } = { ...readRecommendationState(params), ...patch };
  if (filter !== 'all' && FILTERS.has(filter)) next.set('filter', filter);
  else next.delete('filter');
  if (sort !== 'match' && SORT_ORDERS.has(sort)) next.set('sort', sort);
  else next.delete('sort');
  return next;
}
