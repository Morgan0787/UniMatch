import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { UniversityDetails } from '@/components/search/UniversityDetailModal';
import { Button } from '@/components/ui/button';
import { admissionCopy } from '@/components/admissions/copy';
import { readCatalogState } from '@/lib/catalogState';
import { isRecommendationsReturn, universityReturnPath } from '@/lib/universityNavigation';
import { isUniversityFavorite, studentProfileQueryOptions, writeConfirmedUniversityFavorite } from '@/lib/studentProfile';
import { catalogLanguage, catalogPath } from '@/lib/discoveryContent';
import '@/styles/release-pages.css';
import '@/styles/university-glass.css';

const COPY = {
  en: { back: 'Back to universities', backToRecommendations: 'Back to recommendations', loading: 'Loading university…', missing: 'University not found', error: 'Unable to load this university', retry: 'Try again' },
  ru: { back: 'Назад к университетам', backToRecommendations: 'Назад к рекомендациям', loading: 'Загружаем университет…', missing: 'Университет не найден', error: 'Не удалось загрузить университет', retry: 'Попробовать снова' },
  uz: { back: 'Universitetlarga qaytish', backToRecommendations: 'Tavsiyalarga qaytish', loading: 'Universitet yuklanmoqda…', missing: 'Universitet topilmadi', error: 'Universitetni yuklab bo‘lmadi', retry: 'Qayta urinish' },
};

/** @param {{publicId?: string}} props */
export default function University({ publicId } = {}) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const c = COPY[language] || COPY.en;
  const favoriteText = admissionCopy[language] || admissionCopy.en;
  const { session } = useAuth();
  const client = useQueryClient();
  const id = publicId || params.get('id') || '';
  const validId = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id);
  const returnTo = universityReturnPath(params.get('from') || catalogPath(language));
  const { filters } = readCatalogState(new URL(returnTo, window.location.origin).searchParams);
  const fromSearch = !publicId && Boolean(catalogLanguage(returnTo.split(/[?#]/)[0]));
  const query = useQuery({
    queryKey: ['university', id], enabled: validId,
    queryFn: async () => (await apiClient.entities.University.filter({ id }))[0] || null,
    initialData: () => {
      const cached = client.getQueryData(['universities']);
      return Array.isArray(cached) ? cached.find(row => row.id === id) : undefined;
    },
  });
  const university = query.data;
  const owner = session?.user;
  const profileQuery = useQuery(studentProfileQueryOptions(owner));
  const profile = profileQuery.data?.[0];
  const favoriteMutation = useMutation({
    /** @param {import('@/lib/studentProfile').UniversityFavoriteRequest} request */
    mutationFn: ({ owner, university, remove }) => writeConfirmedUniversityFavorite(client, owner, university, remove),
  });
  const favoriteOwner = favoriteMutation.variables?.owner;
  const savingAction = favoriteOwner?.id === owner?.id && favoriteOwner?.email === owner?.email
    && favoriteMutation.variables?.university.id === id ? favoriteMutation.variables : null;
  const saving = Boolean(savingAction && favoriteMutation.isPending);
  const saved = isUniversityFavorite(profile?.saved_universities, university);
  const savePendingLabel = saving ? favoriteText[savingAction.remove ? 'removing' : 'saving'] : undefined;
  useEffect(() => { if (!publicId) window.scrollTo(0, 0); }, [id, publicId]);

  const save = async () => {
    if (!owner?.id || !owner?.email) {
      await apiClient.auth.redirectToLogin(location.pathname + location.search + location.hash);
      return;
    }
    if (!university || saving) return;
    favoriteMutation.mutate({ owner, university, remove: saved });
  };

  const Heading = publicId ? 'h2' : 'h1';
  return <div className={`university-page release-page catalog-page${publicId ? '' : ' min-h-screen'}`}>
    <div className="university-page-layout mx-auto px-4 sm:px-6 py-4">
      {!publicId && <Link className="university-back inline-flex items-center gap-2 min-h-11 px-4 mb-3 text-sm rounded-full border border-white/90 bg-white/75 text-[#292823] shadow-sm hover:bg-white transition-colors" to={returnTo} onClick={event => {
        if (location.state?.fromApp && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); navigate(-1); }
      }}><ArrowLeft className="w-4 h-4" aria-hidden="true" />{isRecommendationsReturn(returnTo) ? c.backToRecommendations : c.back}</Link>}
      {savingAction && favoriteMutation.isError && <p role="alert" className="mb-4 text-amber-800">{favoriteText.saveError}</p>}
      <span role="status" className="sr-only">{savePendingLabel || (savingAction && favoriteMutation.isSuccess ? favoriteText[savingAction.remove ? 'removedFromAccount' : 'savedInAccount'] : '')}</span>
      {validId && query.isLoading ? <p role="status">{c.loading}</p> : query.isError ? <div role="alert"><Heading>{c.error}</Heading><Button className="mt-4" onClick={() => void query.refetch()}>{c.retry}</Button></div> : !university || (publicId && university.admissionCatalog?.status !== 'valid') ? <Heading>{c.missing}</Heading> : <>
        <UniversityDetails university={university} heading={Heading} programmeId={params.get('programme')} userGpa={fromSearch ? filters.gpa : profile?.gpa} userIelts={fromSearch ? filters.ielts : profile?.english_proficiency} userTopik={fromSearch ? filters.topikLevel : profile?.topikLevel} isSaved={saved} saveDisabled={saving || Boolean(owner?.id && (profileQuery.isLoading || profileQuery.isError))} savePendingLabel={savePendingLabel} onSave={save} />
      </>}
    </div>
  </div>;
}
