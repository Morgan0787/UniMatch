import { useState } from 'react';
import { getInstitutionPresentation } from '@/lib/admissions/presentation';

export default function InstitutionMedia({ option, c }) {
  const [failedPath, setFailedPath] = useState(null);
  const { image } = getInstitutionPresentation(option);
  const caption = image?.localized?.[c.locale] || image?.localized?.en;
  const visible = image && failedPath !== image.localPath;
  return <figure className="admission-photo">
    {visible ? <img src={image.localPath} width={image.width} height={image.height} loading="lazy" decoding="async" alt={`${option.university} — ${caption?.caption || image.alt}`} onError={() => setFailedPath(image.localPath)} />
      : <div className="admission-photo-fallback" role="img" aria-label={option.university}><span aria-hidden="true">{option.university.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('')}</span><span>{option.university}</span></div>}
    <figcaption>
      {visible && <><p>{caption?.caption || image.caption}</p><p>{c.photoScope}: {caption?.scope || image.matchScope}</p>
        <details><summary>{c.photoCredit}</summary>
          <p><a href={image.sourcePage} target="_blank" rel="noopener noreferrer">{image.title}</a> — {image.creator} · <a href={image.license.url} target="_blank" rel="noopener noreferrer">{image.license.id}</a></p>
          <p>{image.attribution}</p><p>{image.changes}</p><p>{image.rightsNotes}</p>
          <p>{c.photoOriginal}: {image.title} {image.localized?.en?.scope}</p>
        </details></>}
    </figcaption>
  </figure>;
}

export function InstitutionLinks({ option, c }) {
  const media = getInstitutionPresentation(option);
  return <div className="admission-official-links">
    {media.homepage && <a href={media.homepage} target="_blank" rel="noopener noreferrer">{c.officialHomepage} ↗</a>}
    {media.programLink && <a href={media.programLink} target="_blank" rel="noopener noreferrer">{c.officialProgramme} ↗</a>}
  </div>;
}
