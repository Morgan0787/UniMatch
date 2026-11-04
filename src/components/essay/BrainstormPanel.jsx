import React from 'react';
import { BookOpen, Lightbulb, LoaderCircle, Plus, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BrainstormPanel({ interests, onInterestsChange, onSubmit, pending, copy }) {
  const updateInterest = (index, value) => {
    onInterestsChange(interests.map((interest, currentIndex) => currentIndex === index ? value : interest));
  };

  const addInterest = () => {
    if (interests.length < 8) onInterestsChange([...interests, '']);
  };

  const removeInterest = (index) => {
    onInterestsChange(interests.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <Card className="border-white/80 bg-white/90 shadow-sm">
      <CardHeader className="p-5 sm:p-7">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf1ee] text-[#416158]">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">{copy.brainstormingTitle}</CardTitle>
        <CardDescription>{copy.brainstormingDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-5 pb-5 sm:px-7 sm:pb-7">
        <fieldset disabled={pending} className="min-w-0 space-y-3">
          <legend className="mb-3 text-sm font-medium text-slate-800">{copy.interestsLabel}</legend>
          {interests.map((interest, index) => (
            <div key={index} className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`essay-interest-${index}`}>
                {copy.interestsLabel} {index + 1}
              </label>
              <input
                id={`essay-interest-${index}`}
                type="text"
                value={interest}
                onChange={(event) => updateInterest(index, event.target.value)}
                placeholder={copy.interestPlaceholder}
                maxLength={80}
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f8294] disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500" aria-live="polite">{interest.length}/80</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeInterest(index)}
                aria-label={copy.removeInterest.replace('{number}', String(index + 1))}
                className="h-10 w-10 shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addInterest} disabled={pending || interests.length >= 8}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {copy.addInterest}
          </Button>
        </fieldset>
        <Button type="button" onClick={onSubmit} disabled={pending} aria-busy={pending} className="w-full bg-[#294750] text-white hover:bg-[#203b43] sm:w-auto">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          {pending ? copy.workingBrainstorm : copy.brainstormAction}
        </Button>
      </CardContent>
    </Card>
  );
}

function BrainstormResults({ ideas, copy }) {
  return (
    <div className="space-y-5" aria-live="polite">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
        <Sparkles className="h-5 w-5 text-[#416158]" aria-hidden="true" />
        {copy.brainstormingResult}
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ideas.topic_ideas.map((topic, index) => (
          <Card key={`${topic.title}-${index}`} className="border-white/80 bg-white/90 shadow-sm">
            <CardHeader className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e5edf0] text-sm font-semibold text-[#294750]" aria-hidden="true">{index + 1}</span>
                <div className="min-w-0">
                  <CardTitle className="text-base leading-snug">{topic.title}</CardTitle>
                  <CardDescription className="mt-2 leading-relaxed">{topic.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="rounded-xl bg-[#f0f4f1] p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#416158]">{copy.whyItWorks}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{topic.why_it_works}</p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <BookOpen className="h-4 w-4 text-[#416158]" aria-hidden="true" />
                  {copy.startingQuestions}
                </h3>
                <ul className="mt-2 space-y-2">
                  {topic.starting_questions.map((question, questionIndex) => (
                    <li key={questionIndex} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                      <span aria-hidden="true" className="text-[#719084]">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-[#416158]" aria-hidden="true" />
            {copy.commonPrompts}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
            {ideas.common_prompts.map((prompt, index) => <li key={index}>{prompt}</li>)}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

BrainstormPanel.Result = BrainstormResults;
