import { safeLoginReturn } from './loginReturn.js';

const RETURN_ROUTES = new Set(['/', '/home', '/search', '/ru/search', '/uz/search', '/recommendations', '/profile', '/admissionssurvey']);

function returnRoute(path) {
  return path.split(/[?#]/, 1)[0].toLowerCase().replace(/\/$/, '') || '/';
}

export function universityReturnPath(value) {
  const safe = safeLoginReturn(value);
  if (safe === '/' && value !== '/') return '/Search';
  return RETURN_ROUTES.has(returnRoute(safe)) ? safe : '/Search';
}

export function isRecommendationsReturn(path) {
  return returnRoute(universityReturnPath(path)) === '/recommendations';
}

export function universityPageUrl(id, from = '/Search', programmeId = '') {
  const params = new URLSearchParams({ id, from: universityReturnPath(from) });
  if (typeof programmeId === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(programmeId)) params.set('programme', programmeId);
  return `/University?${params}`;
}
