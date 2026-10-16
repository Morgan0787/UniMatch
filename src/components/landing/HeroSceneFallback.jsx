import { Component, useEffect } from 'react';
import { getLandingLabels } from './labels';
import './hero-scene.css';

export function HeroLoadingScreen({ language }) {
  const copy = getLandingLabels(language);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  return <div className="hero-loading-screen" role="status" aria-live="polite" data-lenis-prevent>
    <span className="hero-loading-brand" aria-hidden="true">UNIMATCH</span>
    <span className="hero-loading-orbit" aria-hidden="true" />
    <p>{copy.building}</p>
    <span className="hero-loading-note">{copy.sceneLoadingNote}</span>
  </div>;
}

// A failed lazy chunk must never remove the page, catalog or navigation.
export class HeroSceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="hero-explorer hero-static-fallback">
      <p className="scene-instructions">{getLandingLabels(this.props.language).sceneUnavailable}</p>
    </div>;
  }
}
