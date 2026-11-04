import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getUniversityPhoto } from '@/lib/admissions/presentation';

export default function UniversityPhoto({ university, language }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const image = getUniversityPhoto(university);
  if (!image || failedUrl === image.url) return null;
  const localized = image.localized?.[language] || image.localized?.en;
  const caption = localized?.caption || image.caption || image.title;
  const creditLabel = { en: 'Photo details and credit', ru: 'О фото и его авторе', uz: 'Surat va muallif haqida' }[language] || 'Photo details and credit';

  return <figure className="catalog-photo">
    <img src={image.url} width={image.width} height={image.height}
      loading="lazy" decoding="async" alt={caption}
      onError={() => setFailedUrl(image.url)} />
    <figcaption>
      <details>
        <summary aria-label={`${creditLabel}: ${caption}`}>
          <span>{caption}</span><ChevronDown size={14} aria-hidden="true" />
        </summary>
        <div className="catalog-photo-credit">
          <p>{caption}</p>
          <p>{localized?.scope || image.matchScope}</p>
          <p><a href={image.sourcePage} target="_blank" rel="noopener noreferrer">{image.title}</a> — {image.creator} · <a href={image.license.url} target="_blank" rel="noopener noreferrer">{image.license.id}</a></p>
          <p>{image.attribution}</p><p>{image.changes}</p><p>{image.rightsNotes}</p>
        </div>
      </details>
    </figcaption>
  </figure>;
}
