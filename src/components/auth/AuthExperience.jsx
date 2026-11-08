import React, { Component, Suspense, lazy, useEffect, useState } from 'react'

const ParticleScene = lazy(() => import('./ParticleScene'))

function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

function StaticFigure({ method }) {
  return (
    <svg viewBox="0 0 600 500" className="auth-static-figure" aria-hidden="true">
      <defs>
        <radialGradient id="auth-globe" cx="32%" cy="24%" r="80%"><stop stopColor="#ffffff" /><stop offset=".45" stopColor="#f1f3f1" /><stop offset="1" stopColor="#c3ccc8" /></radialGradient>
        <linearGradient id="auth-metal" x2="1" y2="1"><stop stopColor="#ffffff" /><stop offset=".5" stopColor="#edf0ed" /><stop offset="1" stopColor="#c3ccc8" /></linearGradient>
        <linearGradient id="auth-gold"><stop stopColor="#fafbf8" /><stop offset="1" stopColor="#a4b0aa" /></linearGradient>
        <linearGradient id="auth-paper"><stop stopColor="#ffffff" /><stop offset=".48" stopColor="#dbe2dd" /><stop offset="1" stopColor="#fafbf8" /></linearGradient>
        <filter id="auth-relief" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#778d83" floodOpacity=".35" /></filter>
        <clipPath id="auth-sphere"><circle cx="300" cy="246" r="150" /></clipPath>
      </defs>
      {method === 'password' ? <>
        <circle cx="300" cy="246" r="150" fill="url(#auth-globe)" />
        <g clipPath="url(#auth-sphere)" fill="url(#auth-metal)" filter="url(#auth-relief)">
          <path d="m258 130 20-17 24 9 15-10 31 16 30 3 27 18 22 28-12 16-30-2-12 23-21-5-14-24-22 5-11-11-28 9-27-13 9-18-8-13Z" />
          <path d="m254 210 30-16 33 8 22 17 13 29-18 21-4 28-19 35-17 14-16-32-6-31-19-23-10-25Z" />
          <path d="m168 153 27-20 32 9 18 22-17 20-3 29-19 12-18-23-20-14Zm21 83 26 4 21 21-2 30-17 28-14-21-4-29Z" />
        </g>
        <circle cx="300" cy="246" r="150" fill="none" stroke="#ffffff" strokeWidth="1.4" />
      </> : method === 'signup' ? <>
        <path d="M226 253v63c0 43 149 43 149 0v-63" fill="url(#auth-metal)" stroke="#b4c0b9" />
        <path d="M135 222 300 141 465 222 300 309Z" fill="url(#auth-metal)" stroke="#f5f7f3" strokeWidth="1.5" />
        <path d="M135 222v10l165 82 165-82v-10L300 304Z" fill="#b6c1bb" />
        <path d="m300 222 149 8v115" fill="none" stroke="url(#auth-gold)" strokeWidth="3" />
        <path d="m449 342-9 26h18Z" fill="url(#auth-gold)" /><circle cx="300" cy="222" r="5" fill="#e1e7e1" />
      </> : <>
        <path d="M142 176Q220 166 300 208q80-42 158-32v177q-77-12-158 21-81-33-158-21Z" fill="url(#auth-metal)" stroke="#adbab2" strokeWidth="1.5" />
        <path d="M150 162q78-6 150 37 72-43 150-37v176q-78-7-150 27-72-34-150-27Z" fill="url(#auth-paper)" stroke="#fff9ea" />
        <path d="M300 199v166" stroke="#9eafa4" strokeWidth="2" />
        {[0, 1, 2, 3, 4, 5].map(row => <path key={row} d={`M173 ${202 + row * 20}q48 0 100 21m54 0q48-21 100-21`} fill="none" stroke="#9caea2" strokeWidth="1.4" opacity=".5" />)}
      </>}
    </svg>
  )
}

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export default function AuthExperience({ method, copy }) {
  const desktop = useMedia('(min-width: 1024px)')
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)')
  const [visible, setVisible] = useState(() => !document.hidden)
  const [failed, setFailed] = useState(false)
  const [motionEnabled, setMotionEnabled] = useState(false)
  const staticMotion = reducedMotion && !motionEnabled
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  if (!desktop) return null
  const fallback = <StaticFigure method={method} />
  return (
    <aside className="auth-art">
      <div className="auth-art-heading" aria-hidden="true">
        <h2>{copy.headline}</h2>
        <p>{copy.description}</p>
      </div>
      <div className="auth-scene" aria-hidden="true" data-figure={method} data-renderer={staticMotion || failed ? 'static' : 'webgl'}>
        <div className="auth-scene-halo" />
        {staticMotion || failed ? fallback : (
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <ParticleScene method={method} active={visible} onFailure={() => setFailed(true)} fallback={fallback} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <p className="auth-art-caption" aria-hidden="true">{copy.caption}</p>
      {reducedMotion && !failed && <div className="auth-motion-control">
        <span>{copy.motionNotice}</span>
        <button type="button" aria-pressed={motionEnabled} onClick={() => setMotionEnabled(value => !value)}>{motionEnabled ? copy.pauseMotion : copy.enableMotion}</button>
      </div>}
    </aside>
  )
}
