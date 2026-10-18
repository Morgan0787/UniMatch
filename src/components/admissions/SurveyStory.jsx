// Pearl route geometry from the accepted UX05r2 artifact; static and decorative.
const routeShape = 'M65 256 C39 121 322 335 319 159 C316 48 134 6 113 112 C95 203 364 268 373 81';

function selectionFor(step, answers, c, story) {
  if (step === 0) return answers.field ? c.fields[answers.field] || '' : '';
  if (step === 1) return answers.exam && answers.exam !== 'not_taken' ? c.exams[answers.exam] || '' : '';
  if (step === 2) return [answers.budget, answers.currency].filter(Boolean).join(' ');
  return story.resultLabel;
}

export default function SurveyStory({ step, view, answers, c }) {
  const story = c.story;
  if (!story) return null;
  const resultView = view === 'results';
  const index = resultView ? 2 : Math.max(0, Math.min(2, step));
  const title = resultView ? story.resultsTitle : story.titles[index];
  const mobileTitle = resultView ? story.resultsMobileTitle : story.mobileTitles[index];
  const description = resultView ? story.resultsDescription : story.descriptions[index];
  const selection = resultView ? story.resultLabel : selectionFor(index, answers, c, story);
  const currentLabel = resultView ? story.resultLabel : [story.interest, story.preparation, story.possibilities][index];

  return <div className="admission-story">
    <p className="admission-story-label">{story.origin}</p>
    <h2>
      <span className="admission-story-title-desktop">{title}</span>
      <span className="admission-story-title-mobile">{mobileTitle}</span>
    </h2>
    <p className="admission-story-description">{description}</p>
    <div className="admission-story-ribbon" aria-hidden="true">
      <svg viewBox="0 0 440 350" role="presentation" focusable="false">
        <defs>
          <linearGradient id="admission-pearl" x1=".15" y1=".1" x2=".85" y2=".9">
            <stop stopColor="#fffefa" /><stop offset=".23" stopColor="#d2d7d7" /><stop offset=".42" stopColor="#fff8eb" />
            <stop offset=".69" stopColor="#e2b68d" /><stop offset=".86" stopColor="#9daeb2" /><stop offset="1" stopColor="#fff6e8" />
          </linearGradient>
          <linearGradient id="admission-edge" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity=".1" /></linearGradient>
        </defs>
        <ellipse cx="222" cy="300" rx="140" ry="15" fill="#283a43" opacity=".1" />
        <g fill="none" strokeLinecap="round">
          <path d={routeShape} stroke="url(#admission-pearl)" strokeWidth="48" />
          <path d="M48 246 C39 97 305 319 302 148 C302 52 138 8 99 105 C58 200 345 254 355 73" stroke="url(#admission-edge)" strokeWidth="2" />
          <path d="M82 265 C72 147 337 351 336 173 C335 42 141 1 129 122 C119 211 384 283 392 89" stroke="#fff" strokeOpacity=".55" />
        </g>
        <path d="M63 267 C119 255 161 211 214 173 S311 140 371 70" fill="none" stroke="#566970" strokeWidth="1.3" strokeDasharray="2 7" />
        <g fill="#fff9ed" stroke="#8b7b68"><circle cx="63" cy="267" r="7" /><circle cx="214" cy="173" r="7" /><circle cx="371" cy="70" r="7" /></g>
        <circle cx="63" cy="267" r="4" fill="#a75c27" />
      </svg>
      <span className="admission-story-route admission-story-route-start">{story.labels[0]}</span>
      <span className="admission-story-route admission-story-route-middle">{story.labels[1]}</span>
      <span className="admission-story-route admission-story-route-end">{story.labels[2]}</span>
    </div>
    <div className="admission-story-current">
      <span className="admission-story-marker" aria-hidden="true">{resultView ? '↗' : String(index + 1).padStart(2, '0')}</span>
      <div>
        <span className="admission-story-current-label">{currentLabel}</span>
        <p>{selection || story.openRoute}</p>
      </div>
    </div>
  </div>;
}
