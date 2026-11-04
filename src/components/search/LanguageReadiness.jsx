import React from 'react';
import { assessLanguage } from '@/lib/languageAssessment';
import { catalogText } from '@/lib/catalogCopy';
import { useLanguage } from '@/lib/i18n';
import ChanceIndicator from '@/components/ui/ChanceIndicator';

export default function LanguageReadiness({ university, ielts, topik, chance, size = 'sm' }) {
    const { language } = useLanguage();
    const assessment = assessLanguage(university, ielts, topik);
    const unknown = {
        en: { score: 'Language score not provided. Eligibility cannot be assessed yet.', programme: 'Choose a programme and confirm its teaching language and test requirements.', requirement: 'Language requirement not published. Confirm it with the university.' },
        ru: { score: 'Результат языкового экзамена не указан. Соответствие пока нельзя оценить.', programme: 'Выберите программу и уточните язык обучения и требования к экзаменам.', requirement: 'Языковое требование не опубликовано. Уточните его у университета.' },
        uz: { score: 'Til imtihoni natijasi kiritilmagan. Moslikni hozircha baholab bo‘lmaydi.', programme: 'Dasturni tanlab, ta’lim tili va imtihon talablarini aniqlang.', requirement: 'Til talabi e’lon qilinmagan. Universitetdan aniqlashtiring.' },
    };
    if (assessment.state === 'unknown') return <p className="text-xs leading-relaxed text-slate-600" data-language-state="unknown">{(unknown[language] || unknown.en)[assessment.reason]}</p>;
    if (assessment.state === 'notMet') return <p className="text-xs leading-relaxed text-amber-800" data-language-state="not-met">{catalogText(language, 'languageNotMet')} ({assessment.supplied} / {assessment.required})</p>;
    return <ChanceIndicator chance={chance} size={size} reason={catalogText(language, university.country === 'United States' ? 'holisticNote' : 'notPublished')} />;
}
