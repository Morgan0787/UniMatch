import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { filterPageView, filterVital, shouldLoadTelemetry, trackablePath } from './telemetry.js';

if (shouldLoadTelemetry()) {
  inject({ mode: 'production', beforeSend: filterPageView });
  injectSpeedInsights({ route: trackablePath(window.location.pathname), beforeSend: filterVital });
}
