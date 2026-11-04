// Catalogue browsing needs the complete collection before filtering and paging.
// Keep this separate from limited list calls used by recommendations.
/** @param {any} client @param {string} table */
export async function loadUniversityCatalog(client, table) {
  const rows = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from(table).select('*')
      .order('id', { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}
