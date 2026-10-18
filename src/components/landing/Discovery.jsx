import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import UniversityDetailModal from '@/components/search/UniversityDetailModal';
import { copy } from './content';
import { uzCopy } from './uz';
import { getLandingLabels } from './labels';

const regions = ['', '', 'Europe', 'North America', 'Asia'];
const featuredCountries = ['United Kingdom', 'Netherlands', 'Canada', 'Singapore'];
function selectFeatured(rows) {
  const selected = [];
  for (const country of featuredCountries) {
    const row = rows.find(item => item.country === country);
    if (row) selected.push(row);
  }
  for (const row of rows) {
    if (selected.length === 4) break;
    if (!selected.some(item => item.id === row.id || item.country === row.country)) selected.push(row);
  }
  for (const row of rows) {
    if (selected.length === 4) break;
    if (!selected.some(item => item.id === row.id)) selected.push(row);
  }
  return selected.map(row => ({
    ...row,
    record: row,
    country: [row.country || '', row.country || ''],
    description: [row.city || row.country || '', row.city || row.country || ''],
    tags: [row.region || row.country || '', row.region || row.country || ''],
    image: row.image_url || '/images/community.jpg',
  }));
}

export function useDiscovery(language) {
  const navigate = useNavigate();
  const { user, navigateToLogin } = useAuth();
  const client = useQueryClient();
  const c = language === 'uz' ? uzCopy : copy[language === 'ru' ? 'ru' : 'en'];
  const labels = getLandingLabels(language);
  const [filter, setFilter] = useState(0);
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState('');
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
  const universities = useMemo(() => selectFeatured(rows), [rows]);
  const filtered = useMemo(() => selectFeatured(rows.filter(row => filter === 1 ? row.country === 'United Kingdom' : !regions[filter] || row.region === regions[filter])), [rows, filter]);
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
    quiz: false, legal: null, setLegal: () => {},
    openQuiz: () => navigate('/AdmissionsSurvey'),
    isLoading: query.isLoading, isError: query.isError, refetch: () => query.refetch(),
    notice, isSaving: mutation.isPending,
    userProfile: currentProfile,
  };
}

export function DiscoveryDialogs({ discovery: d }) {
  return <>
    {d.notice && <p role="alert" className="catalog-status">{d.notice}</p>}
    <UniversityDetailModal university={d.detail?.record ?? null} isOpen={Boolean(d.detail)} onClose={() => d.setDetail(null)} userGpa={d.userProfile?.gpa} userIelts={d.userProfile?.english_proficiency ?? 0} userTopik={d.userProfile?.topikLevel ?? 'Not taken'} isSaved={Boolean(d.detail && d.saved.includes(d.detail.id))} onSave={() => d.toggleSave(d.detail.id)} />
  </>;
}
