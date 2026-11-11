import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useLocation } from 'react-router-dom';
import { filterPageView, filterVital, shouldLoadTelemetry, trackablePath } from './telemetry';

export default function VercelTelemetry() {
  const { pathname } = useLocation();
  if (!shouldLoadTelemetry()) return null;

  const path = trackablePath(pathname);
  return <>
    <Analytics route={path} path={path} mode="production" beforeSend={filterPageView} />
    <SpeedInsights route={path} beforeSend={filterVital} />
  </>;
}
