/** @returns {import('./discoveryContent.js').DiscoveryPage | undefined} */
export function readPublicUniversityPage() {
  if (typeof document === 'undefined') return;
  const payload = document.getElementById('unimatch-public-profile');
  if (!payload?.textContent) return;
  try {
    const page = JSON.parse(payload.textContent);
    if (typeof page?.path === 'string' && page.path === window.location.pathname
      && typeof page.universityId === 'string') return page;
  } catch {
    // The static profile is the fallback if its optional enhancement is unavailable.
  }
}
