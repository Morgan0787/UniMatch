import { Component } from 'react';
import ParticleLoader from '@/components/ui/ParticleLoader';
import { getLandingLabels } from './labels';
import './hero-scene.css';

export function HeroLoadingScreen({ language }) {
  const copy = getLandingLabels(language);
  return <div className="hero-loading-screen" role="status" aria-live="polite">
    <ParticleLoader variant="orbit" size={30} label="" decorative />
    <span className="hero-loading-copy">
      <span>{copy.building}</span>
      <span className="hero-loading-note">{copy.sceneLoadingNote}</span>
    </span>
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
