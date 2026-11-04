import React from 'react';
import { AlertCircle, ArrowDown, Award, CheckCircle2, Eye, Lightbulb, MessageSquareText, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEssayCopy } from '@/lib/essayCopy';

export default function FeedbackPanel({ feedback, language }) {
  const copy = getEssayCopy(language);

  return (
    <div className="space-y-5" aria-live="polite">
      <Card className="border-[#d7e0e3] bg-white/90 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div role="img" className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#e5edf0] text-[#294750]" aria-label={`${feedback.overall_score} ${copy.scoreLabel}`}>
            <Award className="mb-0.5 h-4 w-4" aria-hidden="true" />
            <span className="text-lg font-semibold leading-none">{feedback.overall_score}<span className="text-xs font-normal">/10</span></span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-800">{copy.score}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{copy.summaryHint}</p>
          </div>
          <div className="w-full sm:w-40">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>{copy.clarity}</span><span>{feedback.clarity_score}/10</span>
            </div>
            <div
              role="progressbar"
              aria-label={copy.clarity}
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={feedback.clarity_score}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div className="h-full rounded-full bg-[#719084]" style={{ width: `${feedback.clarity_score * 10}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="border-white/80 bg-white/90 shadow-sm md:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-[#56836e]" aria-hidden="true" />
              {copy.strengths}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ul className="space-y-3">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#719084]" aria-hidden="true" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 shadow-sm">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-[#557887]" aria-hidden="true" />
              {copy.clarityExplanation}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm leading-relaxed text-slate-700">{feedback.clarity_explanation}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-[#a77b49]" aria-hidden="true" />
            {copy.grammarIssues}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {feedback.grammar_issues.length ? (
            <ul className="space-y-2.5">
              {feedback.grammar_issues.map((issue, index) => (
                <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                  <span aria-hidden="true" className="text-[#a77b49]">•</span><span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm leading-relaxed text-slate-600">{copy.noGrammarIssues}</p>}
        </CardContent>
      </Card>

      <Card className="border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="h-4 w-4 text-[#74678a]" aria-hidden="true" />
            {copy.tone}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-sm leading-relaxed text-slate-700">{feedback.tone_assessment}</p>
        </CardContent>
      </Card>

      <Card className="border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-[#927a4e]" aria-hidden="true" />
            {copy.suggestions}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ol className="space-y-3">
            {feedback.suggestions.map((suggestion, index) => (
              <li key={index} className="flex gap-3 rounded-xl bg-[#f5f5f2] p-3.5 text-sm leading-relaxed text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e7e9e4] text-xs font-semibold text-[#465750]" aria-hidden="true">{index + 1}</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDown className="h-4 w-4 text-[#56836e]" aria-hidden="true" />
            {copy.revisions}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5">
          {feedback.revised_sentences.map((sentence, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.before}</p>
                <p className="text-sm leading-relaxed text-slate-700">{sentence.original}</p>
              </div>
              <div className="rounded-xl border border-[#d7e5dc] bg-[#f1f6f2] p-3.5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#416158]">{copy.after}</p>
                <p className="text-sm leading-relaxed text-slate-700">{sentence.improved}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
