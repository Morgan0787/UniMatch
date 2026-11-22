import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeedbackPanel from '@/components/essay/FeedbackPanel';
import BrainstormPanel from '@/components/essay/BrainstormPanel';
import ParticleLoader from '@/components/ui/ParticleLoader';
import { invokeAI } from '@/lib/aiService';
import { useAuth } from '@/lib/AuthContext';
import { getEssayCopy } from '@/lib/essayCopy';
import { useLanguage } from '@/lib/i18n';
import { catalogPath } from '@/lib/discoveryContent';
import '@/styles/internal-pages.css';
import '@/styles/release-pages.css';

const LOGIN_URL = '/Login?redirect_to=%2FEssayChecker';

export default function EssayChecker() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const copy = getEssayCopy(language);
  const aiEnabled = import.meta.env.VITE_AI_ENABLED === 'true';
  const [action, setAction] = useState('review');
  const [essay, setEssay] = useState('');
  const [interests, setInterests] = useState([]);
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [errorCode, setErrorCode] = useState(null);
  const pendingRef = useRef(false);

  const clearResult = () => {
    setResult(null);
    setErrorCode(null);
  };

  const changeAction = (nextAction) => {
    if (nextAction === action || pendingRef.current) return;
    setAction(nextAction);
    clearResult();
  };

  const changeEssay = (nextEssay) => {
    setEssay(nextEssay);
    clearResult();
  };

  const changeInterests = (nextInterests) => {
    setInterests(nextInterests);
    clearResult();
  };

  const submit = async () => {
    if (pendingRef.current || !aiEnabled || !isAuthenticated) return;

    const normalizedEssay = essay.trim();
    if (action === 'review' && (normalizedEssay.length < 50 || normalizedEssay.length > 12000)) {
      setErrorCode('invalid_request');
      return;
    }

    const normalizedInterests = interests.map((interest) => interest.trim()).filter(Boolean);
    if (action === 'brainstorm' && normalizedInterests.some((interest) => interest.length > 80)) {
      setErrorCode('invalid_request');
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setErrorCode(null);
    setResult(null);
    try {
      const request = action === 'review'
        ? { action: 'review', essay: normalizedEssay, language }
        : {
          action: 'brainstorm',
          language,
          ...(normalizedInterests.length ? { interests: normalizedInterests } : {}),
        };
      const response = await invokeAI(request);
      setResult({ action, language, data: response });
    } catch (error) {
      const knownCodes = new Set([
        'unauthorized',
        'rate_limited',
        'unavailable',
        'invalid_response',
        'timeout',
        'invalid_request',
      ]);
      setErrorCode(knownCodes.has(error?.code) ? error.code : 'default');
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  if (!aiEnabled) {
    return (
      <main className="release-page min-h-[calc(100dvh-190px)] flex items-center justify-center px-4 py-12">
        <UnavailableState copy={copy} catalogHref={catalogPath(language)} />
      </main>
    );
  }

  if (isLoadingAuth) {
    return (
      <main className="release-page min-h-[calc(100dvh-190px)] flex items-center justify-center px-4 py-12">
        <ParticleLoader variant="card" className="mx-auto w-full max-w-xl" label={copy.loadingAuth} />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="release-page min-h-[calc(100dvh-190px)] flex items-center justify-center px-4 py-12">
        <Card className="mx-auto w-full max-w-xl rounded-[24px] border-white/95 bg-[#fffdf8]/90 shadow-sm">
          <CardHeader className="p-6 sm:p-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e4cc] text-[#6e4b2a]">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="essay-gate-title text-2xl font-semibold leading-tight tracking-tight text-[#292823]">{copy.signInTitle}</h1>
            <CardDescription className="text-base leading-relaxed text-[#55504a]">{copy.signInDescription}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
            <Button asChild className="w-full min-h-11 rounded-full bg-[#252c2f] text-white hover:bg-[#354044] sm:w-auto">
              <Link to={LOGIN_URL}>{copy.signIn}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const errorMessage = errorCode === 'unauthorized' ? copy.errors.unauthorized : copy.errors[errorCode] || copy.errors.default;
  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  return (
    <main className="release-page internal-page essay-page min-h-screen [overflow-wrap:anywhere] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#252c2f] text-white shadow-sm sm:h-14 sm:w-14">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
          </div>
          <div className="pt-0.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[#292823] sm:text-3xl">{copy.title}</h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-[#47443f]">{copy.intro}</p>
          </div>
        </header>

        <div className="rounded-2xl border border-[#e3d7c6] bg-[#fffdf8]/80 p-4 text-sm leading-relaxed text-[#47443f] sm:p-5">
          <p className="font-semibold text-[#5c3c1b]">{copy.privacyTitle}</p>
          <p className="mt-1.5">{copy.privacy}</p>
        </div>

        <Tabs value={action} onValueChange={changeAction} className="space-y-5">
          <TabsList className="grid h-auto w-full max-w-lg grid-cols-2 rounded-full border border-[#e3d7c6] bg-[#fffdf8]/85 p-1">
            <TabsTrigger value="review" disabled={pending} className="min-h-11 whitespace-normal rounded-full px-3 py-2 text-sm">
              <FileText className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
              {copy.reviewTab}
            </TabsTrigger>
            <TabsTrigger value="brainstorm" disabled={pending} className="min-h-11 whitespace-normal rounded-full px-3 py-2 text-sm">
              <Sparkles className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
              {copy.brainstormTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="mt-0 space-y-5">
            <Card className="border-white/90 bg-[#fffdf8]/90 shadow-sm">
              <CardHeader className="p-5 sm:p-7">
                <CardTitle className="text-xl">{copy.reviewTitle}</CardTitle>
                <CardDescription>{copy.reviewDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5 sm:px-7 sm:pb-7">
                <label htmlFor="essay-draft" className="text-sm font-medium text-[#292823]">{copy.essayLabel}</label>
                <textarea
                  id="essay-draft"
                  value={essay}
                  onChange={(event) => changeEssay(event.target.value)}
                  placeholder={copy.essayPlaceholder}
                  maxLength={12000}
                  disabled={pending}
                  aria-describedby="essay-count essay-minimum"
                  className="min-h-[260px] w-full resize-y rounded-2xl border border-[#d6ccc0] bg-[#fffdf8] px-4 py-3 text-base leading-relaxed text-[#292823] shadow-sm placeholder:text-[#6e6a63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#855a36] disabled:cursor-not-allowed disabled:bg-[#f4efe6] sm:min-h-[360px]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#47443f]">
                  <span>{copy.wordCount.replace('{count}', String(wordCount))}</span>
                  <span id="essay-count" aria-live="polite">{copy.charCount.replace('{count}', String(essay.length))}</span>
                </div>
                <p id="essay-minimum" className="text-sm text-[#47443f]">
                  {essay.trim().length < 50 ? copy.minLength : copy.maxLength}
                </p>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={pending || essay.trim().length < 50 || essay.trim().length > 12000}
                  aria-busy={pending}
                  className="w-full rounded-full bg-[#252c2f] text-white hover:bg-[#354044] sm:w-auto"
                >
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
                  {pending ? copy.workingReview : copy.reviewAction}
                </Button>
              </CardContent>
            </Card>
            {result?.action === 'review' && result.language === language && <FeedbackPanel feedback={result.data} language={language} />}
          </TabsContent>

          <TabsContent value="brainstorm" className="mt-0 space-y-5">
            <BrainstormPanel
              interests={interests}
              onInterestsChange={changeInterests}
              onSubmit={submit}
              pending={pending}
              copy={copy}
            />
            {result?.action === 'brainstorm' && result.language === language && <BrainstormPanel.Result ideas={result.data} copy={copy} />}
          </TabsContent>
        </Tabs>

        {errorCode && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div><p className="font-medium">{copy.errorTitle}</p><p className="mt-1">{errorMessage}</p></div>
            </div>
            {errorCode === 'unauthorized' && <Link className="font-medium underline underline-offset-4" to={LOGIN_URL}>{copy.loginAgain}</Link>}
          </div>
        )}
      </div>
    </main>
  );
}

function UnavailableState({ copy, catalogHref }) {
  return (
    <Card className="mx-auto w-full max-w-xl rounded-[24px] border-white/95 bg-[#fffdf8]/90 shadow-sm">
      <CardHeader className="p-6 sm:p-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e4cc] text-[#6e4b2a]">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="essay-gate-title text-2xl font-semibold leading-tight tracking-tight text-[#292823]">{copy.disabledTitle}</h1>
        <CardDescription className="text-base leading-relaxed text-[#55504a]">{copy.disabledDescription}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
        <Button asChild className="w-full min-h-11 rounded-full bg-[#252c2f] text-white hover:bg-[#354044] sm:w-auto">
          <Link to={catalogHref}>{copy.explore}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
