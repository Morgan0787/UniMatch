import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { universityPageUrl } from '@/lib/universityNavigation';
import { isUniversityFavorite, studentProfileQueryOptions, writeConfirmedUniversityFavorite } from '@/lib/studentProfile';
import { copy } from './content';
import { uzCopy } from './uz';
import { getLandingLabels } from './labels';
import { selectDiscoveryUniversities } from '@/lib/landingDiscovery';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function useDiscovery(language) {
  const navigate = useNavigate();
  const { user, navigateToLogin } = useAuth();
  const client = useQueryClient();
  const c = language === 'uz' ? uzCopy : copy[language === 'ru' ? 'ru' : 'en'];
  const labels = getLandingLabels(language);
  const [filter, setFilter] = useState(0);
  const detail = null;
  const setDetail = row => { if (row?.id) navigate(universityPageUrl(row.id, '/Home'), { state: { fromApp: true } }); };
  const [notice, setNotice] = useState('');
  const [legal, setLegal] = useState(null);
  const query = useQuery({ queryKey: ['universities'], queryFn: () => apiClient.entities.University.list() });
  const profile = useQuery(studentProfileQueryOptions(user));
  const currentProfile = profile.data?.[0];
  const rows = query.data ?? [];
  const savedKeys = currentProfile?.saved_universities;
  const saved = useMemo(() => {
    if (!Array.isArray(savedKeys)) return [];
    const aliases = new Map();
    for (const row of rows) {
      for (const alias of row.admissionCatalog?.identity?.legacyFavoriteKeys ?? []) aliases.set(alias.toLowerCase(), row.id);
    }
    return [...new Set(savedKeys.map(key => typeof key === 'string' ? aliases.get(key.toLowerCase()) ?? key : key))];
  }, [savedKeys, rows]);
  const mutation = useMutation({
    /** @param {import('@/lib/studentProfile').UniversityFavoriteRequest} request */
    mutationFn: ({ owner, university, remove }) => writeConfirmedUniversityFavorite(client, owner, university, remove),
    onError: () => setNotice(labels.saveError),
  });
  const universities = useMemo(() => selectDiscoveryUniversities(rows, language), [rows, language]);
  const filtered = useMemo(() => selectDiscoveryUniversities(rows, language, filter), [rows, language, filter]);
  const toggleSave = id => {
    setNotice('');
    if (!user) { navigateToLogin('/Profile'); return; }
    if (!currentProfile) { navigate('/Profile'); return; }
    const university = rows.find(row => row.id === id);
    if (university && !mutation.isPending) {
      mutation.mutate({ owner: user, university, remove: isUniversityFavorite(savedKeys, university) });
    }
  };
  return {
    c, l: language === 'ru' ? 1 : 0, universities, saved, filtered,
    filter, setFilter, onlySaved: false,
    setOnlySaved: next => { if (next) navigate('/Profile'); }, toggleSave, detail, setDetail,
    quiz: false, legal, setLegal,
    openQuiz: () => navigate('/AdmissionsSurvey'),
    isLoading: query.isLoading, isError: query.isError, refetch: () => query.refetch(),
    notice, isSaving: mutation.isPending,
    userProfile: currentProfile,
  };
}

export function DiscoveryDialogs({ discovery: d }) {
  return <>
    {d.notice && <p role="alert" className="catalog-status">{d.notice}</p>}
    <Dialog open={Boolean(d.legal)} onOpenChange={open => { if (!open) d.setLegal(null); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{d.legal === 'privacy' ? d.c.privacy : d.c.terms}</DialogTitle>
          <DialogDescription className="pt-4 leading-relaxed whitespace-pre-line">
            {d.legal === 'privacy' ? d.c.privacyText : d.c.termsText}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  </>;
}
