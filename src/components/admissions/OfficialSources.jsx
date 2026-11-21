import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { namedPublicSources } from '@/lib/admissions/sourcePresentation';

const COPY = {
  en: { checked: 'Checked', details: 'Fields and applicability', notes: 'Source notes (original)' },
  ru: { checked: 'Проверено', details: 'Сведения и применимость', notes: 'Примечания к источнику (оригинал)' },
  uz: { checked: 'Tekshirilgan', details: 'Ma’lumotlar va qo‘llanishi', notes: 'Manba izohlari (asl nusxa)' },
};

/** One compact link per safe URL, with all merged provenance kept in disclosure. */
export default function OfficialSources({ sources, language = 'en' }) {
  const c = COPY[language] || COPY.en;
  return <ul className="official-sources space-y-3">
    {namedPublicSources(sources, language).map(source => <li key={source.url}>
      <a className="inline-flex items-center gap-1 underline underline-offset-2 text-[#704a2d] hover:text-[#4e311a] break-words" href={source.url} target="_blank" rel="noopener noreferrer"><span>{source.title}</span><ArrowUpRight size={14} className="shrink-0" aria-hidden="true" /></a>
      <span className="block mt-0.5 text-xs text-[#55504a] break-words">{new URL(source.url).hostname}{source.checkedAt.length > 0 && ` · ${c.checked}: ${source.checkedAt.join(', ')}`}</span>
      {(source.labels.length > 0 || source.scopes?.length > 0) && <details className="mt-1 text-xs text-[#55504a]">
        <summary className="inline-flex items-center gap-1 cursor-pointer text-[#704a2d]"><span>{c.details}</span><ChevronDown size={13} className="disclosure-chevron shrink-0" aria-hidden="true" /></summary>
        {source.labels.length > 0 && <p className="mt-1">{source.labels.join(' · ')}</p>}
        {source.scopes?.length > 0 && <div className="mt-2"><p>{c.notes}</p>{source.scopes.map(scope => <p key={scope} className="mt-1">{scope}</p>)}</div>}
      </details>}
    </li>)}
  </ul>;
}
