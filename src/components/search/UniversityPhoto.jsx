import { useState } from 'react';
import { Camera, ChevronDown } from 'lucide-react';
import { getUniversityPhoto, getWikimediaResponsiveSources } from '@/lib/admissions/presentation';

export default function UniversityPhoto({ university, language, showDetails = true, prioritizeLoading = false, responsivePreview = false }) {
  const [failedResponsiveUrl, setFailedResponsiveUrl] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const image = getUniversityPhoto(university);
  if (!image || failedUrl === image.url) return null;
  const responsiveSources = responsivePreview && failedResponsiveUrl !== image.url ? getWikimediaResponsiveSources(image.url) : null;
  const localized = image.localized?.[language] || image.localized?.en;
  const caption = localized?.caption || image.caption || image.title;

  const preview = <img src={image.url} width={image.width} height={image.height}
      srcSet={responsiveSources?.srcSet}
      sizes={responsiveSources?.sizes}
      loading={prioritizeLoading ? 'eager' : 'lazy'} fetchPriority={prioritizeLoading ? 'high' : 'auto'} decoding="async" alt={caption}
      onError={() => responsiveSources ? setFailedResponsiveUrl(image.url) : setFailedUrl(image.url)} />;

  return <figure className="catalog-photo">
    {responsiveSources ? <picture>
      <source media="(max-width: 500px)" srcSet={responsiveSources.mobileSrcSet} sizes={responsiveSources.sizes} />
      {preview}
    </picture> : preview}
    {showDetails && <figcaption>
      <details>
        <summary>
          <Camera size={13} className="shrink-0" aria-hidden="true" />
          <span>{{en:'Photo credit',ru:'О фото',uz:'Surat haqida'}[language] || 'Photo credit'}</span>
          {caption ? <span className="sr-only"> — {caption}</span> : null}
          <ChevronDown size={14} className="disclosure-chevron shrink-0" aria-hidden="true" />
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
