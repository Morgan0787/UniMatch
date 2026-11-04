import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { universityPageUrl } from '@/lib/universityNavigation';
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
  const profile = useQuery({
    queryKey: ['landing-profile', user?.email],
    queryFn: () => apiClient.entities.StudentProfile.filter({ created_by: user.email }),
    enabled: Boolean(user?.email),
  });
  const currentProfile = profile.data?.[0];
  const saved = Array.isArray(currentProfile?.saved_universities) ? currentProfile.saved_universities : [];
  const mutation = useMutation({
    mutationFn: next => apiClient.entities.StudentProfile.update(currentProfile.id, { saved_universities: next }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['landing-profile', user?.email] }),
    onError: () => setNotice(labels.saveError),
  });
  const rows = query.data ?? [];
  const universities = useMemo(() => selectDiscoveryUniversities(rows, language), [rows, language]);
  const filtered = useMemo(() => selectDiscoveryUniversities(rows, language, filter), [rows, language, filter]);
  const toggleSave = id => {
    setNotice('');
    if (!user) { navigateToLogin('/Profile'); return; }
    if (!currentProfile) { navigate('/Profile'); return; }
    if (!mutation.isPending) mutation.mutate(saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id]);
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
