import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import OfficialSources from '@/components/admissions/OfficialSources';
import '@/styles/release-pages.css';
import {
  COMPARISON_FIELDS,
  comparisonFact,
  comparisonInstitutionValue,
  comparisonProgrammes,
  comparisonProgrammeSources,
} from '@/lib/comparisonPresentation';

const COPY = {
  en: { title: 'Compare universities', intro: 'Choose a programme at each university. Fees and requirements apply to that programme and published season; they do not confirm admission.', remove: 'Remove', empty: 'No validated programme details yet. Check the university’s official website.', select: 'Choose a programme', degree: 'Degree', teachingLanguage: 'Teaching language', tuition: 'Tuition', intake: 'Intake', deadline: 'Application deadline', academicRequirement: 'Academic requirement', languageRequirement: 'Language requirement', source: 'Official source', ai: 'Explain these differences with AI', loading: 'Preparing explanation…', error: 'The AI explanation is unavailable. You can still compare the published facts above. Try again later.', summary: 'AI explanation', save: 'To keep a university, use Save on its card. Your saved universities are in My Profile.', less: 'Add another university to compare.', country: 'Country', city: 'City', website: 'Official website', institution: 'University facts', programme: 'Selected programme', unknown: 'Unknown', scope: 'Sources and scope', reviewed: 'Checked' },
  ru: { title: 'Сравнение вузов', intro: 'Выберите программу в каждом вузе. Стоимость и требования относятся к этой программе и указанному сезону; они не подтверждают поступление.', remove: 'Убрать', empty: 'Проверенных сведений о программах пока нет. Уточните условия на официальном сайте вуза.', select: 'Выберите программу', degree: 'Степень', teachingLanguage: 'Язык обучения', tuition: 'Стоимость обучения', intake: 'Набор', deadline: 'Срок подачи заявки', academicRequirement: 'Академические требования', languageRequirement: 'Требования к языку', source: 'Официальный источник', ai: 'Объяснить различия с помощью ИИ', loading: 'Готовим объяснение…', error: 'Объяснение ИИ сейчас недоступно. Данные выше можно сравнить самостоятельно. Попробуйте позже.', summary: 'Объяснение ИИ', save: 'Чтобы сохранить вуз, нажмите «Сохранить» на его карточке. Сохранённые вузы находятся в профиле.', less: 'Добавьте ещё один вуз для сравнения.', country: 'Страна', city: 'Город', website: 'Официальный сайт', institution: 'Данные университета', programme: 'Выбранная программа', unknown: 'Неизвестно', scope: 'Источники и область применения', reviewed: 'Проверено' },
  uz: { title: 'Universitetlarni taqqoslash', intro: 'Har bir universitetda dastur tanlang. Narx va talablar shu dastur va ko‘rsatilgan mavsumga tegishli; ular qabulni tasdiqlamaydi.', remove: 'Olib tashlash', empty: 'Tekshirilgan dastur tafsilotlari hali yo‘q. Universitetning rasmiy saytida tekshiring.', select: 'Dastur tanlang', degree: 'Daraja', teachingLanguage: 'Ta’lim tili', tuition: 'O‘qish haqi', intake: 'Qabul davri', deadline: 'Ariza muddati', academicRequirement: 'Akademik talab', languageRequirement: 'Til talabi', source: 'Rasmiy manba', ai: 'Farqlarni AI bilan tushuntirish', loading: 'Izoh tayyorlanmoqda…', error: 'AI izohi hozir mavjud emas. Yuqoridagi ma’lumotlarni taqqoslashingiz mumkin. Keyinroq urinib ko‘ring.', summary: 'AI izohi', save: 'Universitetni saqlash uchun kartadagi Saqlash tugmasini bosing. Saqlanganlar profilingizda.', less: 'Taqqoslash uchun yana universitet qo‘shing.', country: 'Davlat', city: 'Shahar', website: 'Rasmiy sayt', institution: 'Universitet ma’lumotlari', programme: 'Tanlangan dastur', unknown: 'Noma’lum', scope: 'Manbalar va qo‘llanish doirasi', reviewed: 'Tekshirilgan' },
};

function ComparisonCell({ fact, copy }) {
  return <>
    <span>{fact?.value || copy.unknown}</span>
    {fact?.notice && fact.value !== copy.unknown && <p className="mt-1 text-xs text-amber-800">{fact.notice}</p>}
    {fact?.detail && <details className="mt-2 text-xs text-slate-600">
      <summary className="cursor-pointer text-teal-800">{copy.scope}</summary>
      {fact.detail && <p className="mt-2">{fact.detail}</p>}
    </details>}
  </>;
}

/** @param {{universities: any[], isOpen: boolean, onClose: () => void, onRemove: (id: any) => void, userProfile?: any}} props */
export default function ComparisonModal({ universities, isOpen, onClose, onRemove }) {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.en;
  const [selection, setSelection] = useState({});
  const columns = universities.map(university => {
    const programmes = comparisonProgrammes(university);
    const programme = programmes.find(item => item.id === selection[university.id]) || programmes[0];
    return {
      university,
      programmes,
      programme,
      sources: comparisonProgrammeSources(university, programme, c),
      facts: COMPARISON_FIELDS.map(([key, kind]) => ({ key, ...comparisonFact(programme, key, kind, language) })),
      institutionFacts: ['country', 'city', 'website'].map(key => ({ key, value: comparisonInstitutionValue(university, key, language) })),
    };
  });

  const rowLabel = key => c[key] || key;
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="release-comparison w-[calc(100%_-_1.5rem)] max-w-6xl max-h-[90dvh] overflow-y-auto rounded-2xl p-4 sm:p-6">
      <DialogHeader className="pr-6"><DialogTitle>{c.title}</DialogTitle><DialogDescription>{c.intro}</DialogDescription></DialogHeader>
      {universities.length < 2 && <p role="status" className="text-sm text-slate-600">{c.less}</p>}
      <p className="comparison-scroll-hint text-xs text-slate-600">{{en:'Scroll across to compare universities →',ru:'Прокрутите вправо, чтобы сопоставить вузы →',uz:'Universitetlarni taqqoslash uchun o‘ngga suring →'}[language]}</p>
      <div className="comparison-scroll overflow-auto rounded-xl border border-slate-200" role="region" aria-label={c.title} tabIndex={0}>
        <table className="comparison-table min-w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="comparison-label sticky left-0 z-20 min-w-40 bg-slate-100 p-3 text-xs font-semibold uppercase tracking-wide text-slate-600">{c.institution}</th>
              {columns.map(({ university, programmes, programme }) => <th scope="col" key={university.id} className="comparison-university min-w-64 border-l border-slate-200 bg-white p-3 align-top">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{university.name}</h3>
                  <Button variant="ghost" size="sm" aria-label={`${c.remove}: ${university.name}`} onClick={() => onRemove(university.id)}>{c.remove}</Button>
                </div>
                {programmes.length > 1 && <label className="mt-3 block text-xs font-medium text-slate-700">{c.select}
                  <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={programme?.id || ''} onChange={event => setSelection(previous => ({ ...previous, [university.id]: event.target.value }))}>
                    {programmes.map(item => <option key={item.id} value={item.id}>{comparisonFact(item, 'name', 'programme', language).value}</option>)}
                  </select>
                </label>}
              </th>)}
            </tr>
          </thead>
          <tbody>
            <tr><th scope="rowgroup" colSpan={columns.length + 1} className="bg-slate-50 p-3 text-xs font-semibold uppercase tracking-wide text-slate-600">{c.institution}</th></tr>
            {['country', 'city', 'website'].map(key => <tr key={key} className="border-t border-slate-100">
              <th scope="row" className="comparison-label sticky left-0 z-10 bg-white p-3 align-top font-medium text-slate-700">{rowLabel(key)}</th>
              {columns.map(({ university, institutionFacts }) => {
                const value = institutionFacts.find(fact => fact.key === key)?.value;
                return <td key={university.id} className="border-l border-slate-100 p-3 align-top break-words">
                  {key === 'website' && value ? <a className="break-all text-teal-800 underline" href={value} target="_blank" rel="noopener noreferrer">{value}</a> : value || c.unknown}
                </td>;
              })}
            </tr>)}
            <tr><th scope="rowgroup" colSpan={columns.length + 1} className="bg-slate-50 p-3 text-xs font-semibold uppercase tracking-wide text-slate-600">{c.programme}</th></tr>
            <tr className="border-t border-slate-100">
              <th scope="row" className="comparison-label sticky left-0 z-10 bg-white p-3 align-top font-medium text-slate-700">{c.programme}</th>
              {columns.map(({ university, programme }) => <td key={university.id} className="border-l border-slate-100 p-3 align-top font-medium text-slate-900">
                {programme ? comparisonFact(programme, 'name', 'programme', language).value : c.empty}
              </td>)}
            </tr>
            {COMPARISON_FIELDS.map(([key]) => <tr key={key} className="border-t border-slate-100">
              <th scope="row" className="comparison-label sticky left-0 z-10 bg-white p-3 align-top font-medium text-slate-700">{rowLabel(key)}</th>
              {columns.map(({ university, programme, facts }) => <td key={university.id} className="border-l border-slate-100 p-3 align-top break-words text-slate-900">
                {programme ? <ComparisonCell fact={facts.find(fact => fact.key === key)} copy={c} /> : c.unknown}
              </td>)}
            </tr>)}
            <tr className="border-t border-slate-100">
              <th scope="row" className="comparison-label sticky left-0 z-10 bg-white p-3 align-top font-medium text-slate-700">{c.source}</th>
              {columns.map(({ university, sources }) => <td key={university.id} className="border-l border-slate-100 p-3 align-top text-xs text-slate-600">
                {sources.length ? <OfficialSources sources={sources} language={language} /> : c.unknown}
              </td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-600">{c.save}</p>
    </DialogContent>
  </Dialog>;
}
