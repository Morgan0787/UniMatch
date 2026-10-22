import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { invokeAI } from '@/lib/aiService';
import { COMPARISON_FIELDS, comparisonFact, comparisonProgrammes, comparisonSources } from '@/lib/comparisonPresentation';

const COPY = {
  en: { title: 'Compare universities', intro: 'Choose a programme at each university. Fees and requirements apply to that programme and published season; they do not confirm admission.', remove: 'Remove', empty: 'No validated programme details yet. Check the university’s official website.', select: 'Choose a programme', degree: 'Degree', teachingLanguage: 'Teaching language', tuition: 'Tuition', intake: 'Intake', deadline: 'Application deadline', academicRequirement: 'Academic requirement', languageRequirement: 'Language requirement', source: 'Official source', ai: 'Explain these differences with AI', loading: 'Preparing explanation…', error: 'The AI explanation is unavailable. You can still compare the published facts above. Try again later.', summary: 'AI explanation', save: 'To keep a university, use Save on its card. Your saved universities are in My Profile.', less: 'Add another university to compare.' },
  ru: { title: 'Сравнение вузов', intro: 'Выберите программу в каждом вузе. Стоимость и требования относятся к этой программе и указанному сезону; они не подтверждают поступление.', remove: 'Убрать', empty: 'Проверенных сведений о программах пока нет. Уточните условия на официальном сайте вуза.', select: 'Выберите программу', degree: 'Степень', teachingLanguage: 'Язык обучения', tuition: 'Стоимость обучения', intake: 'Набор', deadline: 'Срок подачи заявки', academicRequirement: 'Академические требования', languageRequirement: 'Требования к языку', source: 'Официальный источник', ai: 'Объяснить различия с помощью ИИ', loading: 'Готовим объяснение…', error: 'Объяснение ИИ сейчас недоступно. Данные выше можно сравнить самостоятельно. Попробуйте позже.', summary: 'Объяснение ИИ', save: 'Чтобы сохранить вуз, нажмите «Сохранить» на его карточке. Сохранённые вузы находятся в профиле.', less: 'Добавьте ещё один вуз для сравнения.' },
  uz: { title: 'Universitetlarni taqqoslash', intro: 'Har bir universitetda dastur tanlang. Narx va talablar shu dastur va ko‘rsatilgan mavsumga tegishli; ular qabulni tasdiqlamaydi.', remove: 'Olib tashlash', empty: 'Tekshirilgan dastur tafsilotlari hali yo‘q. Universitetning rasmiy saytida tekshiring.', select: 'Dastur tanlang', degree: 'Daraja', teachingLanguage: 'Ta’lim tili', tuition: 'O‘qish haqi', intake: 'Qabul davri', deadline: 'Ariza muddati', academicRequirement: 'Akademik talab', languageRequirement: 'Til talabi', source: 'Rasmiy manba', ai: 'Farqlarni AI bilan tushuntirish', loading: 'Izoh tayyorlanmoqda…', error: 'AI izohi hozir mavjud emas. Yuqoridagi ma’lumotlarni taqqoslashingiz mumkin. Keyinroq urinib ko‘ring.', summary: 'AI izohi', save: 'Universitetni saqlash uchun kartadagi Saqlash tugmasini bosing. Saqlanganlar profilingizda.', less: 'Taqqoslash uchun yana universitet qo‘shing.' },
};

/** @param {{universities: any[], isOpen: boolean, onClose: () => void, onRemove: (id: any) => void, userProfile?: any}} props */
export default function ComparisonModal({ universities, isOpen, onClose, onRemove }) {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.en;
  const [selection, setSelection] = useState({});
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const signature = JSON.stringify([isOpen, language, universities, selection]);
  useEffect(() => { request.current += 1; setInsights(''); setError(false); setLoading(false); }, [signature]);
  useEffect(() => () => { request.current += 1; }, []);
  const columns = universities.map(university => {
    const programmes = comparisonProgrammes(university);
    const programme = programmes.find(item => item.id === selection[university.id]) || programmes[0];
    return { university, programmes, programme, facts: COMPARISON_FIELDS.map(([key, kind]) => ({ key, ...comparisonFact(programme, key, kind, language) })) };
  });
  async function explain() {
    const id = ++request.current;
    setLoading(true); setError(false);
    try {
      const facts = columns.map(({ university, programme, facts: rows }) => ({ university: university.name, programme: comparisonFact(programme, 'name', 'text', language).value, facts: rows.map(({ key, value, notice, detail }) => ({ label: c[key], value, notice, detail })) }));
      const result = await invokeAI({ prompt: `In ${language}, briefly explain these published programme facts: ${JSON.stringify(facts)}. Use only these facts. Preserve unknowns, currencies, periods, seasons and applicability warnings. Do not estimate admission chances, invent requirements or declare a best/easiest university. Under 150 words.`, add_context_from_internet: false });
      if (id !== request.current) return;
      if (typeof result !== 'string' || !result.trim()) throw new Error('Empty explanation');
      setInsights(result);
    } catch { if (id === request.current) setError(true); }
    finally { if (id === request.current) setLoading(false); }
  }
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="w-[calc(100%_-_1.5rem)] max-w-6xl max-h-[90dvh] overflow-y-auto rounded-2xl p-4 sm:p-6">
      <DialogHeader className="pr-6"><DialogTitle>{c.title}</DialogTitle><DialogDescription>{c.intro}</DialogDescription></DialogHeader>
      {universities.length < 2 && <p role="status" className="text-sm text-slate-600">{c.less}</p>}
      <div className={`grid items-start gap-4 ${columns.length === 1 ? '' : columns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
        {columns.map(({ university, programmes, programme, facts }) => <section key={university.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white/70">
          <div className="border-b border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{university.name}</h3><p className="text-sm text-slate-500">{university.country}</p></div><Button variant="ghost" size="sm" aria-label={`${c.remove}: ${university.name}`} onClick={() => onRemove(university.id)}>{c.remove}</Button></div>
            {programmes.length > 1 ? <label className="block text-sm font-medium">{c.select}<select className="mt-1 w-full rounded-lg border p-2 text-sm" value={programme?.id || ''} onChange={event => setSelection(previous => ({ ...previous, [university.id]: event.target.value }))}>{programmes.map(item => <option key={item.id} value={item.id}>{comparisonFact(item, 'name', 'text', language).value}</option>)}</select></label> : programme && <p className="text-sm font-medium text-slate-700">{comparisonFact(programme, 'name', 'text', language).value}</p>}
          </div>
          {!programme ? <p className="p-4 text-sm text-slate-600">{c.empty}</p> : <dl className="divide-y divide-slate-100">{facts.map(fact => <div key={fact.key} className="p-4 break-words"><dt className="text-xs font-medium text-slate-500">{c[fact.key]}</dt><dd className="mt-1 text-sm text-slate-900">{fact.value}</dd>{fact.notice && <dd className="mt-1 text-xs text-amber-800">{fact.notice}</dd>}{(fact.detail || comparisonSources(university, fact).length > 0) && <dd className="mt-2"><details className="text-xs text-slate-600"><summary className="cursor-pointer text-teal-800">{language === 'ru' ? 'Источники и применимость' : language === 'uz' ? 'Manbalar va qo‘llanish doirasi' : 'Sources and scope'}</summary>{fact.detail && <p className="mt-2">{fact.detail}</p>}{comparisonSources(university, fact).map(source => <p key={source.key || source.url} className="mt-1"><a className="underline text-teal-800" href={source.url} target="_blank" rel="noopener noreferrer">{c.source}</a></p>)}</details></dd>}</div>)}</dl>}
        </section>)}
      </div>
      <p className="text-sm text-slate-600">{c.save}</p>
      {columns.length >= 2 && columns.every(column => column.programme) && <Button variant="outline" disabled={loading} onClick={explain}>{loading ? c.loading : c.ai}</Button>}
      {error && <p role="alert" className="text-sm text-amber-800">{c.error}</p>}
      {insights && <section aria-label={c.summary} className="rounded-xl bg-teal-50 p-4"><h3 className="font-semibold">{c.summary}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{insights}</p></section>}
    </DialogContent>
  </Dialog>;
}
