import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { studentProfileQueryOptions, writeConfirmedFavorite } from '@/lib/studentProfile';
import { EMPTY_CATALOG } from '@/lib/admissions/catalog';
import { evaluateAnswers } from '@/lib/admissions/evaluate';
import { DRAFT_KEY, TTL_MS, loadDraft, saveDraft } from '@/lib/admissions/draft';
import {
  canonicalFavoriteIds,
  clearFavoriteIntent,
  createFavoriteIntent,
  loadFavoriteIntent,
  saveFavoriteIntent,
} from '@/lib/admissions/favorites';

function sessionStorageOrNull() {
  try { return window.sessionStorage; } catch { return null; }
}

/**
 * Admission favorites use deterministic UUID keys in saved_universities. A
 * guest intent is temporary and requires explicit confirmation later.
 */
export default function useAdmissionFavorites({ answers, view, step, catalog = EMPTY_CATALOG, catalogReady = false, refreshCatalog = null }) {
  const { options, institutions, version: catalogVersion } = catalog;
  const { session, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const user = session?.user || null;
  const userId = user?.id || null;
  const email = user?.email || null;
  const profileQuery = useQuery(studentProfileQueryOptions(user));
  const saved = profileQuery.data?.[0]?.saved_universities;
  const savedIds = useMemo(() => canonicalFavoriteIds(saved, institutions), [saved, institutions]);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resumeIntent, setResumeIntent] = useState(null);
  const [intentStatus, setIntentStatus] = useState('empty');
  const previousOwner = useRef({ userId, email });
  const operation = useRef(null);
  const checkingCatalog = useRef(false);
  const retryOption = useRef(null);
  const retryDesired = useRef(null);
  const identityRef = useRef({ userId, email });
  identityRef.current = { userId, email };

  useEffect(() => {
    const previous = previousOwner.current;
    if (previous.userId && previous.userId !== userId) {
      clearFavoriteIntent(sessionStorageOrNull());
      setResumeIntent(null);
    }
    if (previous.userId !== userId || previous.email !== email) {
      retryOption.current = null; retryDesired.current = null;
      setPendingId(null); setError(''); setNotice('');
    }
    previousOwner.current = { userId, email };
    if (userId) {
      const loaded = loadFavoriteIntent(sessionStorageOrNull());
      setIntentStatus(loaded.status);
      setResumeIntent(loaded.status === 'restored' ? loaded.intent : null);
    } else {
      setResumeIntent(null);
    }
  }, [email, userId]);

  const clearIntent = useCallback(() => {
    const removed = clearFavoriteIntent(sessionStorageOrNull());
    setResumeIntent(null);
    setIntentStatus(removed ? 'empty' : 'unavailable');
    return removed;
  }, []);

  const requestSave = useCallback(async (option, desiredSaved) => {
    if (isLoadingAuth) { setError('saveLoading'); return false; }
    if (!catalogReady || checkingCatalog.current) { setError('catalogUnavailable'); return false; }
    const institutionId = option?.institutionId;
    const id = typeof institutionId === 'string' ? institutionId.trim() : '';
    if (!id || (operation.current?.userId === userId && operation.current?.email === email)) return false;
    if (!institutions.some(item => item.institutionId === id)) { setError('saveCatalogExpired'); return false; }
    checkingCatalog.current = true;
    try {
      const latest = refreshCatalog ? await refreshCatalog() : catalog;
      if (latest.version !== catalogVersion) { setError('saveCatalogExpired'); return false; }
      if (identityRef.current.userId !== userId || identityRef.current.email !== email) { setError('sessionChanged'); return false; }
    } catch { setError('catalogUnavailable'); return false; }
    finally { checkingCatalog.current = false; }
    retryOption.current = option;
    retryDesired.current = typeof desiredSaved === 'boolean' ? desiredSaved : !savedIds.includes(id);
    setError(''); setNotice('');
    if (!userId || !email) {
      const storage = sessionStorageOrNull();
      const existingDraft = loadDraft(storage);
      if (existingDraft.status === 'unavailable') {
        setError('saveStorageError');
        return false;
      }
      if (existingDraft.status === 'expired' || existingDraft.status === 'invalid') {
        setError('saveDraftExpired');
        return false;
      }
      const draft = { answers, step, view };
      if (!saveDraft(storage, draft)) {
        setError('saveStorageError');
        return false;
      }
      const restored = loadDraft(storage);
      if (restored.status !== 'restored') {
        setError(restored.status === 'unavailable' ? 'saveStorageError' : 'saveDraftExpired');
        return false;
      }
      let createdAt;
      try {
        const raw = storage.getItem(DRAFT_KEY);
        createdAt = JSON.parse(raw).createdAt;
      } catch {
        setError('saveStorageError');
        return false;
      }
      if (!Number.isFinite(createdAt) || Date.now() - createdAt >= TTL_MS) {
        setError('saveDraftExpired');
        return false;
      }
      const intent = createFavoriteIntent(option, restored.answers, catalogVersion, createdAt);
      if (!saveFavoriteIntent(storage, intent)) {
        setError('saveStorageError');
        return false;
      }
      setResumeIntent(intent); setIntentStatus('restored');
      await apiClient.auth.redirectToLogin('/AdmissionsSurvey');
      return true;
    }
    const remove = !retryDesired.current;
    const operationToken = { userId, email };
    operation.current = operationToken; setPendingId(id);
    try {
      const owner = { id: userId, email };
      await writeConfirmedFavorite(queryClient, owner, id, remove, institutions);
      if (identityRef.current.userId !== userId || identityRef.current.email !== email || operation.current !== operationToken) return false;
      setNotice(remove ? 'removedFromAccount' : 'savedInAccount');
      retryOption.current = null; retryDesired.current = null;
      return true;
    } catch (err) {
      if (identityRef.current.userId === userId && identityRef.current.email === email && operation.current === operationToken) {
        setError(err?.message === 'Your profile could not be selected safely.' ? 'saveDuplicates'
          : err?.message === 'sessionChanged' ? 'sessionChanged' : 'saveError');
      }
      return false;
    } finally {
      if (operation.current === operationToken) {
        operation.current = null;
        if (identityRef.current.userId === userId && identityRef.current.email === email) setPendingId(null);
      }
    }
  }, [answers, catalog, catalogReady, catalogVersion, email, institutions, isLoadingAuth, queryClient, refreshCatalog, savedIds, step, userId, view]);

  const confirmResume = useCallback(async () => {
    if (!resumeIntent || !userId || !email) return false;
    const option = options.find(item => item.id === resumeIntent.optionId
      && item.institutionId === resumeIntent.institutionId);
    if (!option || resumeIntent.catalogVersion !== catalogVersion) {
      setError('saveCatalogExpired');
      return false;
    }
    const current = loadDraft(sessionStorageOrNull());
    if (current.status !== 'restored' || JSON.stringify(current.answers) !== JSON.stringify(resumeIntent.answers)) {
      setError('saveDraftExpired');
      return false;
    }
    const evaluation = evaluateAnswers(resumeIntent.answers, options);
    const selected = [...(evaluation.results || []), ...(evaluation.alternatives || [])]
      .some(row => row.option?.id === option.id);
    if (!selected) {
      setError('saveDraftExpired');
      return false;
    }
    const saved = await requestSave(option, true);
    if (saved) clearIntent();
    return saved;
  }, [catalogVersion, clearIntent, email, options, requestSave, resumeIntent, userId]);

  const retry = useCallback(() => {
    if (resumeIntent) return confirmResume();
    if (retryOption.current) return requestSave(retryOption.current, retryDesired.current ?? true);
    setError('');
    void profileQuery.refetch();
    return false;
  }, [confirmResume, profileQuery.refetch, requestSave, resumeIntent]);

  const profileError = profileQuery.isError
    ? profileQuery.error?.message === 'Your profile could not be selected safely.' ? 'saveDuplicates' : 'saveError'
    : '';

  return {
    savedIds, pendingId, loading: Boolean(pendingId) || profileQuery.isLoading || isLoadingAuth, canSave: catalogReady,
    isAuthenticated: Boolean(userId && email), error: error || profileError, notice, resumeIntent, intentStatus,
    requestSave, confirmResume, dismissResume: clearIntent, retry, clearIntent,
  };
}
