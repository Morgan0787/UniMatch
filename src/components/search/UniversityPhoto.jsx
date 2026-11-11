import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getUniversityPhoto } from '@/lib/admissions/presentation';

const getWikimediaResponsiveSources = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(parsed.hostname)
      || parsed.port || parsed.username || parsed.password || !/^\/wikipedia\/commons\/thumb\//.test(parsed.pathname)) return null;
    const match = parsed.pathname.match(/^(.*\/)(960px-)([^/]+\.jpe?g)$/i);
    if (!match) return null;
    return {
      srcSet: [250, 500, 960].map(width => `${parsed.origin}${match[1]}${width}px-${match[3]} ${width}w`).join(', '),
      sizes: '(min-width: 1600px) calc((100vw - 100px) / 4), (min-width: 1100px) calc((100vw - 100px) / 3), (min-width: 700px) calc((100vw - 80px) / 2), calc(100vw - 56px)',
    };
  } catch {
    return null;
  }
};

export default function UniversityPhoto({ university, language, showDetails = true, prioritizeLoading = false, responsivePreview = false }) {
  const [failedResponsiveUrl, setFailedResponsiveUrl] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const image = getUniversityPhoto(university);
  if (!image || failedUrl === image.url) return null;
  const responsiveSources = responsivePreview && failedResponsiveUrl !== image.url ? getWikimediaResponsiveSources(image.url) : null;
  const localized = image.localized?.[language] || image.localized?.en;
  const caption = localized?.caption || image.caption || image.title;
  const creditLabel = { en: 'Photo details and credit', ru: 'О фото и его авторе', uz: 'Surat va muallif haqida' }[language] || 'Photo details and credit';

  return <figure className="catalog-photo">
    <img src={image.url} width={image.width} height={image.height}
      srcSet={responsiveSources?.srcSet}
      sizes={responsiveSources?.sizes}
      loading={prioritizeLoading ? 'eager' : 'lazy'} fetchPriority={prioritizeLoading ? 'high' : 'auto'} decoding="async" alt={caption}
      onError={() => responsiveSources ? setFailedResponsiveUrl(image.url) : setFailedUrl(image.url)} />
    {showDetails && <figcaption>
      <details>
        <summary aria-label={`${creditLabel}: ${caption}`}>
          <span>{{en:'Photo credit',ru:'О фото',uz:'Surat haqida'}[language] || 'Photo credit'}</span><ChevronDown size={14} aria-hidden="true" />
        </summary>
        <div className="catalog-photo-credit">
          <img className="catalog-photo-original" src={image.url} width={image.width} height={image.height}
            loading="lazy" decoding="async" alt={caption} />
          <p>{caption}</p>
          <p>{localized?.scope || image.matchScope}</p>
          <p><a href={image.sourcePage} target="_blank" rel="noopener noreferrer">{image.title}</a> — {image.creator} · <a href={image.license.url} target="_blank" rel="noopener noreferrer">{image.license.id}</a></p>
          <p>{image.attribution}</p><p>{image.changes}</p><p>{image.rightsNotes}</p>
        </div>
      </details>
    </figcaption>}
  </figure>;
}
