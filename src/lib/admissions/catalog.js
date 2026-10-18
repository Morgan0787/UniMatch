import { adaptPublicCatalog } from './publicCatalog.js';

/** @type {{options:any[], institutions:any[], issues:{id:string,code:string}[], version:string}} */
export const EMPTY_CATALOG = Object.freeze({ options: [], institutions: [], issues: [], version: 'db-v1:unavailable' });
export const PUBLIC_CATALOG_SELECT = 'id,name,country,city,region,website,catalog:admission_requirements->unimatch_catalog_v1';
export const PUBLIC_CATALOG_LIMIT = 200;

/** Public factual rows only. The caller supplies its existing anonymous client. */
export async function loadPublicCatalog(client, { signal = undefined, table = 'universities' } = {}) {
  let request = client.from(table).select(PUBLIC_CATALOG_SELECT, { count: 'exact' })
    .eq('admission_requirements->unimatch_catalog_v1->>state', 'published')
    .order('id').range(0, PUBLIC_CATALOG_LIMIT - 1);
  if (signal) request = request.abortSignal(signal);
  const { data, error, count } = await request;
  if (error) throw new Error('catalog_read_failed');
  if (!Array.isArray(data) || data.length > PUBLIC_CATALOG_LIMIT
    || (typeof count === 'number' && (count > PUBLIC_CATALOG_LIMIT || count !== data.length))
    || (count == null && data.length === PUBLIC_CATALOG_LIMIT)) throw new Error('catalog_incomplete');
  const adapted = adaptPublicCatalog(data);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(adapted.version));
  adapted.version = `db-v1:${Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  return adapted;
}
