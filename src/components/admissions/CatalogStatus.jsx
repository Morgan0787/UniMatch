export default function CatalogStatus({ query, c }) {
  const retry = <button type="button" className="admission-text-button" disabled={query.isRefreshing} onClick={() => void query.refresh().catch(() => {})}>{c.catalogRetry}</button>;
  if (query.isPending) return <p role="status" className="admission-hint">{c.catalogLoading}</p>;
  if (query.isError) return <p role="alert" className="admission-error">{c.catalogError} {retry}</p>;
  return <>
    {query.isStale && <p role="status" className="admission-hint">{c.catalogStale} {retry}</p>}
    {query.catalog.issues.length > 0 && <p role="status" className="admission-hint">{c.catalogPartial}</p>}
  </>;
}
