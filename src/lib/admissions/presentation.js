/** @param {unknown} value */
export function sourcedHttps(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

/** Public presentation only: never contributes admissions/ranking evidence.
 * @param {any} option
 */
export function getInstitutionPresentation(option) {
  const media = option?.media;
  const photo = media?.image;
  const image = photo && sourcedHttps(photo.url) && sourcedHttps(photo.sourcePage) && sourcedHttps(photo.license?.url)
    && photo.license?.id && photo.creator && photo.attribution && photo.width > 0 && photo.height > 0
    ? { ...photo, localPath: photo.url } : null;
  return {
    homepage: sourcedHttps(media?.homepage),
    programLink: sourcedHttps(media?.programLinks?.find(link => link.programId === option?.id)?.url),
    image,
  };
}

/** Only reviewed, attributed photos are usable in the public catalogue.
 * @param {any} university
 */
export function getUniversityPhoto(university) {
  if (university?.admissionCatalog?.status !== 'valid') return null;
  return getInstitutionPresentation(university.admissionCatalog).image;
}

/** @param {string} url */
export function getWikimediaResponsiveSources(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(parsed.hostname)
      || parsed.port || parsed.username || parsed.password || !/^\/wikipedia\/commons\/thumb\//.test(parsed.pathname)) return null;
    const match = parsed.pathname.match(/^(.*\/)(960px-)([^/]+\.jpe?g)$/i);
    if (!match) return null;
    const srcSet = widths => widths.map(width => `${parsed.origin}${match[1]}${width}px-${match[3]} ${width}w`).join(', ');
    return {
      srcSet: srcSet([250, 500, 960]),
      mobileSrcSet: srcSet([250, 500]),
      sizes: '(min-width: 1600px) calc((100vw - 100px) / 4), (min-width: 1100px) calc((100vw - 100px) / 3), (min-width: 700px) calc((100vw - 80px) / 2), calc(100vw - 56px)',
    };
  } catch {
    return null;
  }
}
