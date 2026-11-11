import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { UniversityDetails } from '@/components/search/UniversityDetailModal';
import { Button } from '@/components/ui/button';
import { readCatalogState } from '@/lib/catalogState';
import { universityReturnPath } from '@/lib/universityNavigation';
import { admissionFavoriteRepository } from '@/lib/admissions/favoriteRepository';
import { canonicalFavoriteIds, serializeFavoriteWrite, writeAdmissionFavorite } from '@/lib/admissions/favorites';
import { catalogLanguage, catalogPath } from '@/lib/discoveryContent';
import '@/styles/release-pages.css';
import '@/styles/university-glass.css';

const COPY = {
  en: { back: 'Back to universities', loading: 'Loading university…', missing: 'University not found', error: 'Unable to load this university', retry: 'Try again', saveError: 'Saving could not be confirmed. Please try again.' },
  ru: { back: 'Назад к университетам', loading: 'Загружаем университет…', missing: 'Университет не найден', error: 'Не удалось загрузить университет', retry: 'Попробовать снова', saveError: 'Не удалось подтвердить сохранение. Попробуйте ещё раз.' },
  uz: { back: 'Universitetlarga qaytish', loading: 'Universitet yuklanmoqda…', missing: 'Universitet topilmadi', error: 'Universitetni yuklab bo‘lmadi', retry: 'Qayta urinish', saveError: 'Saqlash tasdiqlanmadi. Qayta urinib ko‘ring.' },
};

/** @param {{publicId?: string}} props */
export default function University({ publicId } = {}) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const c = COPY[language] || COPY.en;
  const { session } = useAuth();
  const client = useQueryClient();
  const id = publicId || params.get('id') || '';
  const validId = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id);
  const returnTo = universityReturnPath(params.get('from') || catalogPath(language));
  const { filters } = readCatalogState(new URLSearchParams(returnTo.split('?')[1]?.split('#')[0]));
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
  const ownerKey = owner?.id || null;
  const currentOwner = useRef(ownerKey);
  currentOwner.current = ownerKey;
  const profile = useQuery({
    queryKey: ['studentProfile', ownerKey], enabled: Boolean(owner?.id && owner?.email),
    queryFn: async () => {
      const rows = await apiClient.entities.StudentProfile.filter({ created_by: owner.email });
      if (rows.length > 1) throw new Error('Ambiguous profile');
      return rows[0] || null;
    },
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const pending = useRef(false);
  const identity = university?.admissionCatalog?.identity || (university ? { id: university.id, institutionId: university.id, legacyFavoriteKeys: [] } : null);
  const registry = identity ? [identity] : [];
  const saved = canonicalFavoriteIds(profile.data?.saved_universities, registry).includes(identity?.institutionId);
  useEffect(() => { if (!publicId) window.scrollTo(0, 0); }, [id, publicId]);

  const save = async () => {
    if (!owner?.id || !owner?.email) {
      await apiClient.auth.redirectToLogin(location.pathname + location.search + location.hash);
      return;
    }
    if (!identity || pending.current) return;
    pending.current = true; setSaving(true); setSaveError(false);
    try {
      const account = { id: owner.id, email: owner.email };
      const confirmed = await serializeFavoriteWrite(owner.id, () => writeAdmissionFavorite(admissionFavoriteRepository(account), account, identity.institutionId, saved, registry));
      if (currentOwner.current === owner.id) client.setQueryData(['studentProfile', owner.id], confirmed);
      await client.invalidateQueries({ queryKey: ['studentProfile'] });
      await client.invalidateQueries({ queryKey: ['landing-profile'] });
    } catch { if (currentOwner.current === owner.id) setSaveError(true); }
    finally { pending.current = false; setSaving(false); }
  };

  const Heading = publicId ? 'h2' : 'h1';
  return <div className={`university-page release-page catalog-page${publicId ? '' : ' min-h-screen'}`}>
    <div className="university-page-layout max-w-5xl mx-auto px-4 sm:px-6 py-4">
      {!publicId && <Link className="university-back inline-flex items-center gap-2 min-h-11 mb-3 text-sm" to={returnTo} onClick={event => {
        if (location.state?.fromApp && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); navigate(-1); }
      }}><ArrowLeft className="w-4 h-4" />{c.back}</Link>}
      {saveError && <p role="alert" className="mb-4 text-amber-800">{c.saveError}</p>}
      {validId && query.isLoading ? <p role="status">{c.loading}</p> : query.isError ? <div role="alert"><Heading>{c.error}</Heading><Button className="mt-4" onClick={() => void query.refetch()}>{c.retry}</Button></div> : !university || (publicId && university.admissionCatalog?.status !== 'valid') ? <Heading>{c.missing}</Heading> : <>
        <UniversityDetails university={university} heading={Heading} userGpa={fromSearch ? filters.gpa : profile.data?.gpa} userIelts={fromSearch ? filters.ielts : profile.data?.english_proficiency} userTopik={fromSearch ? filters.topikLevel : profile.data?.topikLevel} isSaved={saved} saveDisabled={saving || Boolean(ownerKey && (profile.isLoading || profile.isError))} onSave={save} />
      </>}
    </div>
  </div>;
}
