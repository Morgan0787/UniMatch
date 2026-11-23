import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { Suspense, useLayoutEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RequireAuth from '@/components/RequireAuth';
import { MotionConfig } from 'framer-motion';
import { LanguageProvider } from '@/lib/i18n';
import RouteSeo from '@/lib/RouteSeo';
import VercelTelemetry from '@/lib/VercelTelemetry';
import { CATALOG_LANGUAGES, catalogLanguage, catalogPath, DiscoveryContent } from '@/lib/discoveryContent';
import { readPublicUniversityPage } from '@/lib/publicUniversityPage';
import ParticleLoader from '@/components/ui/ParticleLoader';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const PROTECTED_PAGES = new Set(['Profile', 'Recommendations']);

function PageLoading() {
  if (document.getElementById('public-entry')) return null;
  return <ParticleLoader variant="full" />;
}

function PublicEntryReady() {
  useLayoutEffect(() => {
    document.getElementById('public-entry')?.remove();
  }, []);
  return null;
}

function LayoutWrapper({ children, currentPageName }) {
  const [hasPublicEntry] = useState(() => Boolean(document.getElementById('public-entry')));
  if (hasPublicEntry) {
    return <Suspense fallback={<PageLoading />}>
      <PublicEntryReady />
      <Layout currentPageName={currentPageName}>{children}</Layout>
    </Suspense>;
  }
  const content = <Suspense fallback={<PageLoading />}>{children}</Suspense>;
  return Layout ? <Layout currentPageName={currentPageName}>{content}</Layout> : content;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { pathname } = useLocation();

  if (isLoadingPublicSettings || (isLoadingAuth && !catalogLanguage(pathname))) {
    return <PageLoading />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              {PROTECTED_PAGES.has(path) ? (
                <RequireAuth><Page /></RequireAuth>
              ) : (
                <Page />
              )}
            </LayoutWrapper>
          }
        />
      ))}
      {CATALOG_LANGUAGES.filter(language => language !== 'en').map(language => (
        <Route key={language} path={catalogPath(language)} element={
          <LayoutWrapper currentPageName="Search"><Pages.Search /></LayoutWrapper>
        } />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function AppContent({ publicPage }) {
  const { pathname } = useLocation();
  const { isLoadingAuth } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);
  if (publicPage?.path !== pathname) return <AuthenticatedApp />;
  const content = <DiscoveryContent page={publicPage} standalone={false}>
    {publicPage.universityId && (
      <details className="discovery-details" onToggle={event => setDetailsOpen(event.currentTarget.open)}>
        <summary className="inline-flex items-center gap-2"><span>Show details and save this university</span><ChevronDown size={15} className="disclosure-chevron shrink-0" aria-hidden="true" /></summary>
        {detailsOpen && (isLoadingAuth ? <ParticleLoader variant="card" size={104} label={{ en: 'Loading university…', ru: 'Загружаем университет…', uz: 'Universitet yuklanmoqda…' }[publicPage.language] || 'Loading university…'} /> :
          <Suspense fallback={<ParticleLoader variant="card" size={104} label={{ en: 'Loading university…', ru: 'Загружаем университет…', uz: 'Universitet yuklanmoqda…' }[publicPage.language] || 'Loading university…'} />}>
            <Pages.University publicId={publicPage.universityId} />
          </Suspense>)}
      </details>
    )}
  </DiscoveryContent>;
  return Layout ? <Layout currentPageName="Discovery">{content}</Layout> : content;
}

function App() {
  const [publicPage] = useState(readPublicUniversityPage);
  return (
    <AuthProvider>
      <MotionConfig reducedMotion="never">
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <LanguageProvider publicPage={publicPage}>
            <RouteSeo publicPage={publicPage} />
            <NavigationTracker />
            <VercelTelemetry />
            <AppContent publicPage={publicPage} />
          </LanguageProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
      </MotionConfig>
    </AuthProvider>
  )
}

export default App
