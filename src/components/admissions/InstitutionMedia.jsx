import { useState } from 'react';
import { ArrowUpRight, Camera, ChevronDown } from 'lucide-react';
import { getInstitutionPresentation } from '@/lib/admissions/presentation';

export default function InstitutionMedia({ option, c, compact = false }) {
  const [failedPath, setFailedPath] = useState(null);
  const { image } = getInstitutionPresentation(option);
  const caption = image?.localized?.[c.locale] || image?.localized?.en;
  const visible = image && failedPath !== image.localPath;
  return <figure className={`admission-photo${compact ? ' admission-photo-compact' : ''}`}>
    {visible ? <img src={image.localPath} width={image.width} height={image.height} loading="lazy" decoding="async" alt={`${option.university} — ${caption?.caption || image.alt}`} onError={() => setFailedPath(image.localPath)} />
      : <div className="admission-photo-fallback" role="img" aria-label={option.university}><span aria-hidden="true">{option.university.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('')}</span><span>{option.university}</span></div>}
    <figcaption>
      {visible && <>
        {!compact && <><p>{caption?.caption || image.caption}</p><p>{c.photoScope}: {caption?.scope || image.matchScope}</p></>}
        <details><summary><Camera size={13} className="shrink-0" aria-hidden="true" /><span>{c.photoCredit}</span><ChevronDown size={13} className="disclosure-chevron shrink-0" aria-hidden="true" /></summary>
          {compact && <><p>{caption?.caption || image.caption}</p><p>{c.photoScope}: {caption?.scope || image.matchScope}</p></>}
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
    {media.homepage && <a className="inline-flex items-center gap-1" href={media.homepage} target="_blank" rel="noopener noreferrer"><span>{c.officialHomepage}</span><ArrowUpRight size={14} className="shrink-0" aria-hidden="true" /></a>}
    {media.programLink && <a className="inline-flex items-center gap-1" href={media.programLink} target="_blank" rel="noopener noreferrer"><span>{c.officialProgramme}</span><ArrowUpRight size={14} className="shrink-0" aria-hidden="true" /></a>}
  </div>;
}
