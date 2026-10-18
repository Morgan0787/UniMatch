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
