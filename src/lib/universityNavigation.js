import { safeLoginReturn } from './loginReturn.js';

const RETURN_ROUTES = new Set(['/', '/home', '/search', '/recommendations', '/profile', '/admissionssurvey']);

export function universityReturnPath(value) {
  const safe = safeLoginReturn(value);
  return RETURN_ROUTES.has(safe.split(/[?#]/)[0].toLowerCase()) ? safe : '/Search';
}

export function universityPageUrl(id, from = '/Search') {
  return `/University?${new URLSearchParams({ id, from: universityReturnPath(from) })}`;
}
