// Catalogue browsing needs the complete collection before filtering and paging.
// Keep this separate from limited list calls used by recommendations.
/** @param {any} client @param {string} table */
export async function loadUniversityCatalog(client, table) {
  const pageSize = 500;
  const maxConcurrent = 4;

  async function readPage(offset, includeCount = false) {
    const { data, error, count } = await client.from(table)
      .select('*', includeCount ? { count: 'exact' } : undefined)
      .order('id', { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    return { data: data || [], count };
  }

  const firstPage = await readPage(0, true);
  const rows = [...firstPage.data];
  if (rows.length < pageSize) return rows;

  for (let offset = pageSize; ;) {
    // Treat the count as a hint. Continue until a short page if rows were added
    // after the initial request or the server didn't return a total.
    const remainingPages = Math.ceil(((firstPage.count ?? offset) - offset) / pageSize);
    const batchSize = Math.max(1, Math.min(maxConcurrent, remainingPages));
    const pages = await Promise.all(Array.from({ length: batchSize }, (_, index) =>
      readPage(offset + index * pageSize)));
    for (const { data } of pages) {
      rows.push(...data);
      if (data.length < pageSize) return rows;
      offset += pageSize;
    }
  }
}
