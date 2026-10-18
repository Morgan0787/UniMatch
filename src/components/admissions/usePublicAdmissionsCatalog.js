import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EMPTY_CATALOG, loadPublicCatalog } from '@/lib/admissions/catalog.js';

const project = import.meta.env.VITE_SUPABASE_URL || 'unconfigured';
const table = import.meta.env.VITE_TABLE_UNIVERSITY || 'universities';

/** Shared in-memory public catalogue; never contains profile/user records. */
export default function usePublicAdmissionsCatalog() {
  const query = useQuery({
    queryKey: ['publicAdmissionsCatalog', project, table, 1],
    queryFn: async ({ signal }) => {
      const timeout = new AbortController();
      const timer = setTimeout(() => timeout.abort(), 10_000);
      const cancel = () => timeout.abort();
      signal.addEventListener('abort', cancel, { once: true });
      if (signal.aborted) cancel();
      try { return await loadPublicCatalog(supabase, { signal: timeout.signal, table }); }
      finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const refresh = useCallback(async () => {
    const result = await query.refetch();
    if (result.isError || !result.data) throw new Error('catalog_read_failed');
    return result.data;
  }, [query.refetch]);
  return {
    catalog: query.data || EMPTY_CATALOG,
    isPending: query.isPending,
    isError: query.isError,
    isRefreshing: query.isFetching,
    isStale: Boolean(query.data && query.isStale),
    canSave: Boolean(query.data && !query.isError && !query.isFetching && !query.isStale),
    refresh,
  };
}
