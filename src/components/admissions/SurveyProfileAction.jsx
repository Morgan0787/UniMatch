import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { saveDraft } from '@/lib/admissions/draft';
import { SURVEY_PROFILE_INTENT, SURVEY_PROFILE_RETURN, surveyProfileFields } from '@/lib/admissions/surveyProfile';
import { saveStudentProfile } from '@/lib/studentProfile';

const surveyProfileCopy = {
  en: {
    save: 'Save results to your profile and get recommendations', saving: 'Saving to your profile…', signingIn: 'Opening sign-in…',
    hint: 'Add the answers that match your profile fields and continue to your recommendations.',
    budget: 'The survey budget covers tuition. You can set your total budget in your profile.',
    error: 'Your profile could not be saved. Please try again.',
    unavailable: 'Your answers could not be kept for sign-in. Please try again in this tab.',
    resume: 'To save your answers, return to the survey results in the original tab and choose Save again.',
  },
  ru: {
    save: 'Сохранить результаты в профиле и получить рекомендации', saving: 'Сохраняем в профиль…', signingIn: 'Открываем вход…',
    hint: 'Перенесите ответы в подходящие поля профиля и посмотрите персональные рекомендации.',
    budget: 'Бюджет анкеты покрывает обучение. Общий бюджет можно указать в профиле.',
    error: 'Не удалось сохранить профиль. Попробуйте ещё раз.',
    unavailable: 'Не удалось сохранить ответы для входа. Попробуйте ещё раз в этой вкладке.',
    resume: 'Чтобы сохранить ответы, вернитесь к результатам анкеты в исходной вкладке и снова нажмите «Сохранить».',
  },
  uz: {
    save: 'Natijalarni profilga saqlash va tavsiyalarni olish', saving: 'Profilga saqlanmoqda…', signingIn: 'Kirish sahifasi ochilmoqda…',
    hint: 'Javoblarni profilning mos maydonlariga qo‘shing va shaxsiy tavsiyalarni ko‘ring.',
    budget: 'So‘rovnomadagi budjet o‘qish haqini qoplaydi. Umumiy budjetni profilda belgilash mumkin.',
    error: 'Profilni saqlab bo‘lmadi. Qayta urinib ko‘ring.',
    unavailable: 'Kirish uchun javoblar saqlanmadi. Shu varaqda qayta urinib ko‘ring.',
    resume: 'Javoblarni saqlash uchun asl varaqdagi natijalarga qayting va yana saqlashni tanlang.',
  },
};

export default function SurveyProfileAction({ answers, language, restored, storage }) {
  const c = surveyProfileCopy[language] || surveyProfileCopy.en;
  const { session } = useAuth();
  const owner = session?.user;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const resumed = useRef(false);
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const { mutate, isPending, isError } = useMutation({
    /** @param {{ owner: NonNullable<typeof owner>, answers: typeof answers }} request */
    mutationFn: ({ owner, answers }) => saveStudentProfile(queryClient, owner, profile => surveyProfileFields(answers, profile)),
    onSuccess: (_, request) => {
      if (request.owner.id === currentOwner.current?.id && request.owner.email === currentOwner.current?.email) {
        navigate('/Recommendations', { replace: true });
      }
    },
  });

  useEffect(() => {
    if (!owner?.id || !owner.email || params.get('saveProfile') !== '1' || resumed.current) return;
    resumed.current = true;
    let requested = false;
    try {
      requested = storage?.getItem(SURVEY_PROFILE_INTENT) === '1';
      storage?.removeItem(SURVEY_PROFILE_INTENT);
    } catch { requested = false; }
    const clean = new URLSearchParams(params);
    clean.delete('saveProfile');
    setParams(clean, { replace: true });
    if (requested && restored) mutate({ owner, answers });
    else setNotice('resume');
  }, [answers, mutate, owner, params, restored, setParams, storage]);

  const save = async () => {
    if (isPending || redirecting) return;
    setNotice('');
    if (owner?.id && owner.email) {
      mutate({ owner, answers });
      return;
    }
    if (!saveDraft(storage, { answers, step: 2, view: 'results' })) {
      setNotice('unavailable');
      return;
    }
    try {
      storage.setItem(SURVEY_PROFILE_INTENT, '1');
      setRedirecting(true);
      await apiClient.auth.redirectToLogin(SURVEY_PROFILE_RETURN);
    } catch {
      setRedirecting(false);
      setNotice('unavailable');
    }
  };

  return <section className="admission-profile-action">
    <div className="admission-profile-action-copy">
      <p>{c.hint}</p>
      {answers.budget !== '' && <p className="admission-hint">{c.budget}</p>}
    </div>
    <button type="button" className="admission-button" onClick={() => void save()} disabled={isPending || redirecting} aria-busy={isPending || redirecting}>
      <span>{isPending ? c.saving : redirecting ? c.signingIn : c.save}</span><ArrowRight size={18} aria-hidden="true" />
    </button>
    {(notice || isError) && <p role="alert" className="admission-error">{notice ? c[notice] : c.error}</p>}
  </section>;
}
