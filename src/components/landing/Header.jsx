import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowUpRight, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { getLandingLabels } from './labels';

export function Header({ language, setLanguage, menu, setMenu, onMatch }) {
  const { user, navigateToLogin } = useAuth();
  const { t } = useLanguage();
  const copy = getLandingLabels(language);
  const [scrolled, setScrolled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const dialog = useRef(null);
  const toggle = useRef(null);
  const audio = useRef(null);
  const ru = language === 'ru';
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 0);
    handle();
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const element = dialog.current;
    const old = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = old;
      toggle.current?.focus({ preventScroll: true });
    };
  }, [menu]);
  useEffect(() => {
    const stop = () => { if (document.hidden) { audio.current?.pause(); setPlaying(false); } };
    document.addEventListener('visibilitychange', stop);
    return () => { document.removeEventListener('visibilitychange', stop); audio.current?.pause(); };
  }, []);
  const toggleAudio = () => {
    if (!audio.current) { audio.current = new Audio('/reference/soundtrack.mp3'); audio.current.loop = true; audio.current.volume = 0.3; }
    if (playing) { audio.current.pause(); setPlaying(false); }
    else audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  const labels = [['/Home','nav.home'],['/Search','nav.findUniversities'],['/Recommendations','nav.recommendations'],['/Profile','nav.myProfile']];
  const languages = <div className="language-switch" aria-label={copy.language}>{['en','ru','uz'].map(locale => <button key={locale} onClick={() => setLanguage(locale)} aria-pressed={language === locale}>{locale.toUpperCase()}</button>)}</div>;
  return <>
    <header className={`site-header ${scrolled ? 'is-away' : ''}`} aria-hidden={scrolled}>
      <div className="header-brand"><Link to="/Home" className="wordmark" aria-label="UniMatch home">UNI<span>MATCH</span></Link><span className="header-divider" /><button className="sound-control" onClick={toggleAudio} aria-label={playing ? copy.mute : copy.sound} aria-pressed={playing}>{playing ? <Volume2 size={17} /> : <VolumeX size={17} />}</button></div>
      <div className="header-right">{languages}<Link className="header-account" to={user ? '/Profile' : '/Login'}>{t(user ? 'nav.myProfile' : 'nav.signIn')}</Link><button className="header-match" onClick={onMatch}><span>{ru ? 'Найти свой вуз' : language === 'uz' ? 'Menga mos universitet' : 'Find my match'}</span><ArrowUpRight size={19} /></button><span className="header-divider" /><button ref={toggle} className="menu-toggle" onClick={() => setMenu(true)} aria-label={copy.openMenu} aria-expanded={menu} aria-controls="navigation-dialog"><span /><span /></button></div>
    </header>
    {menu && <dialog ref={dialog} id="navigation-dialog" className="menu-dialog" aria-label={copy.navigation} onCancel={event => { event.preventDefault(); setMenu(false); }}>
      <div className="menu-panel"><div className="menu-top"><Link className="wordmark" to="/Home" onClick={() => setMenu(false)}>UNI<span>MATCH</span></Link><div className="menu-top-actions">{languages}<button className="menu-close" onClick={() => setMenu(false)} aria-label={copy.closeMenu}><X size={29} strokeWidth={1} /></button></div></div>
        <div className="menu-content"><div className="menu-intro"><span className="orange-label"><i />UNIMATCH</span><h2>{copy.menuTitle}</h2><p>{copy.menuIntro}</p></div><nav className="menu-navigation" aria-label={copy.mainNav}><span className="eyebrow">{copy.navigation.toUpperCase()}</span>{labels.map(([href,key]) => <Link to={href} key={href} onClick={() => setMenu(false)}>{t(key)}</Link>)}</nav><div className="menu-explore"><span className="eyebrow">{copy.nextChapter}</span><a href="#approach" onClick={() => setMenu(false)}>{copy.approach}</a><a href="#experience" onClick={() => setMenu(false)}>{copy.experience}</a><a href="#discover" onClick={() => setMenu(false)}>{copy.universities}</a></div></div>
        <div className="menu-bottom"><button className="text-link" onClick={() => { setMenu(false); if (user) onMatch(); else navigateToLogin('/Recommendations'); }}>{t(user ? 'nav.recommendations' : 'nav.signIn')}<ArrowUpRight size={18}/></button><a href="https://t.me/qebzo" target="_blank" rel="noopener noreferrer">Telegram ↗</a></div>
      </div>
    </dialog>}
  </>;
}
