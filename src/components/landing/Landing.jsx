import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowDown, Bookmark, Compass, Globe2, Sprout, Instagram, Linkedin, ArrowRight, Play, Pause, } from "lucide-react";
import { Header } from "./Header";
import { HeroSceneBoundary, HeroLoadingScreen } from './HeroSceneFallback';
const HeroExplorer = lazy(() => import("./HeroExplorer"));
import { usePageMotion } from "./usePageMotion";
import { useDiscovery, DiscoveryDialogs } from "./Discovery";
import { Action, Lines } from "./ui";
import { useLanguage } from "@/lib/i18n";
import "./landing.css";
import "./story.css";
import { uzEditorial } from './uz';
import { getLandingLabels } from './labels';
const editorial = {
    en: {
        hero: ["A future that fits.", "A place to become."],
        description: "Thoughtful university discovery. Connecting your interests, ambitions, and curiosity with a place that feels like you.",
        side: [
            "Somewhere, there’s a campus that feels like home.",
            "A subject that sparks something. A future that’s unmistakably yours.",
        ],
        pills: ["YOUR INTERESTS", "YOUR WORLD", "YOUR FUTURE"],
        introLabel: "EVERY FUTURE BEGINS WITH A FEELING",
        intro: ["A new perspective.", "A world of possibility."],
        introBody: "The right place can change how you see the world — and what you imagine for yourself. We help you take the first step, with a little less noise and a lot more intention.",
        experienceLabel: "YOUR NEXT CHAPTER",
        experience: ["Find your people.", "Find your perspective."],
        mediaLabel: "THE WORLD IS YOUR CAMPUS",
        mediaTitle: "Somewhere new.\nSomething more.",
        mediaAction: "START YOUR JOURNEY",
        approach: ["Made with intention.", "Meant to fit."],
        approachText: "From the subjects you love to the life you want to live, every part of your university journey should feel like you.",
        orbit: [
            "YOUR INTERESTS",
            "YOUR COMMUNITY",
            "YOUR WORLD",
            "YOUR NEXT CHAPTER",
        ],
        center: ["More than a university.", "Your place in the world."],
        centerBody: "Your goals. A considered shortlist. A beginning that belongs to you.",
        collection: ["Your world.", "Your possibilities."],
        collectionLabel: "A FEW PLACES TO BEGIN",
        viewAll: "EXPLORE UNIVERSITIES",
        footerLabel: "GET STARTED",
        footer: ["Your next chapter", "starts with you."],
        footerBody: "You don’t need all the answers. Just a little curiosity, and a place to start.",
        footerAction: "LET’S FIND YOUR PLACE",
        footerPrompt: "The right place changes everything.",
        discover: "DISCOVER",
        navigation: "NAVIGATION",
        pause: "Pause video",
        play: "Play video",
    },
    ru: {
        hero: ["Будущее для вас.", "Место для роста."],
        description: "Осознанный выбор университета. Найдите место, где ваши интересы, амбиции и любопытство могут расцвести.",
        side: [
            "Где-то есть кампус, в котором вы почувствуете себя дома.",
            "Предмет, который вдохновит. Будущее, которое станет вашим.",
        ],
        pills: ["ВАШИ ИНТЕРЕСЫ", "ВАШ МИР", "ВАШЕ БУДУЩЕЕ"],
        introLabel: "КАЖДОЕ БУДУЩЕЕ НАЧИНАЕТСЯ С ЧУВСТВА",
        intro: ["Новый взгляд.", "Мир возможностей."],
        introBody: "Правильное место меняет ваш взгляд на мир — и представление о себе. Мы поможем сделать первый шаг: меньше шума, больше осознанности.",
        experienceLabel: "ВАША СЛЕДУЮЩАЯ ГЛАВА",
        experience: ["Найдите своих людей.", "Откройте новые горизонты."],
        mediaLabel: "ВАШ КАМПУС — ВЕСЬ МИР",
        mediaTitle: "Новое место.\nНовые возможности.",
        mediaAction: "НАЧАТЬ СВОЙ ПУТЬ",
        approach: ["Выбрано с заботой.", "Создано для вас."],
        approachText: "От любимых предметов до образа жизни — каждая часть вашего университетского пути должна быть близка вам.",
        orbit: ["ВАШИ ИНТЕРЕСЫ", "ВАШЕ СООБЩЕСТВО", "ВАШ МИР", "ВАША НОВАЯ ГЛАВА"],
        center: ["Больше, чем университет.", "Ваше место в мире."],
        centerBody: "Ваши цели. Продуманный список. Начало пути, которое принадлежит вам.",
        collection: ["Ваш мир.", "Ваши возможности."],
        collectionLabel: "НЕСКОЛЬКО МЕСТ ДЛЯ НАЧАЛА",
        viewAll: "ОТКРЫТЬ УНИВЕРСИТЕТЫ",
        footerLabel: "НАЧНИТЕ СЕЙЧАС",
        footer: ["Ваша новая глава", "начинается с вас."],
        footerBody: "Не обязательно знать все ответы. Достаточно любопытства и первого шага.",
        footerAction: "НАЙДЁМ ВАШЕ МЕСТО",
        footerPrompt: "Правильное место меняет всё.",
        discover: "ОТКРЫТЬ",
        navigation: "НАВИГАЦИЯ",
        pause: "Приостановить видео",
        play: "Воспроизвести видео",
    },
};
export default function App() {
    const { language, setLanguage } = useLanguage();
    const labels = getLandingLabels(language);
    const [menu, setMenu] = useState(false), [videoAvailable, setVideoAvailable] = useState(false), [videoPaused, setVideoPaused] = useState(false);
    const root = useRef(null), hero = useRef(null), video = useRef(null), reduced = Boolean(useReducedMotion());
    const d = useDiscovery(language), { c, l, saved, filtered, filter, setFilter, onlySaved, setOnlySaved, toggleSave, } = d, p = language === 'uz' ? uzEditorial : editorial[language === "ru" ? "ru" : "en"], ru = language === "ru";
    usePageMotion(root, language, menu || d.quiz || Boolean(d.detail) || Boolean(d.legal), reduced);
    useEffect(() => {
        const oldTitle = document.title;
        document.title = language === 'uz' ? 'UniMatch — Sizga mos kelajak.' : ru
            ? "UniMatch — Ваше место в мире."
            : "UniMatch — A future that fits.";
        return () => { document.title = oldTitle; };
    }, [language, ru]);
    useEffect(() => {
        if (reduced) {
            video.current?.pause();
            setVideoPaused(true);
        }
    }, [reduced]);
    const match = () => d.openQuiz();
    const universities = d.universities;
    return (<div ref={root} className={`unimatch-landing site ${ru ? "lang-ru" : ""}`}>
      <a className="skip-link" href="#discover">
        {labels.skip}
      </a>
      <Header language={language} setLanguage={setLanguage} menu={menu} setMenu={setMenu} onMatch={match}/>
      <main>
        <section ref={hero} id="home" className="hero" aria-labelledby="hero-title">
          <HeroSceneBoundary language={language}>
          <Suspense fallback={<HeroLoadingScreen language={language} />}>
            <HeroExplorer universities={universities} heroRef={hero} language={language} reduced={reduced} blocked={menu || d.quiz || Boolean(d.detail) || Boolean(d.legal)} onDetail={d.setDetail}/>
          </Suspense>
          </HeroSceneBoundary>
          <div className="hero-soft-light"/>
          <div className="hero-content">
            <div className="hero-copy">
              <h1 id="hero-title" className="hero-title">
                <Lines lines={p.hero}/>
              </h1>
              <p className="hero-description">{p.description}</p>
              <Action className="hero-action" onClick={match}>
                {c.match.toUpperCase()}
              </Action>
            </div>
            <div className="hero-side">
              <p>
                {p.side[0]} <span>{p.side[1]}</span>
              </p>
              <div className="hero-pills">
                {p.pills.map((pill, i) => (<a key={pill} href={i === 0
                ? "#approach"
                : i === 1
                    ? "#discover"
                    : "#experience"}>
                    {pill}
                  </a>))}
                <button aria-label={c.explore} onClick={() => document.getElementById("discover")?.scrollIntoView({
            behavior: reduced ? "instant" : "smooth",
        })}>
                  +
                </button>
              </div>
            </div>
          </div>
          <a className="scroll-hint" href="#intro" aria-label={labels.more}>
            <ArrowDown size={14}/>
            <span>{labels.chapter}</span>
          </a>
        </section>

        <section id="intro" className="intro-section" aria-labelledby="intro-title">
          <div className="intro-upper">
            <span className="eyebrow" data-reveal>
              <span className="orange-dot"/>
              {p.introLabel}
            </span>
            <div className="intro-grid">
              <h2 id="intro-title" className="display-title" data-text-reveal>
                <Lines lines={p.intro}/>
              </h2>
              <div className="intro-copy" data-reveal>
                <p>{p.introBody}</p>
                <a className="text-link" href="#approach">
                  {labels.approach.toUpperCase()}
                  <ArrowUpRight size={18}/>
                </a>
              </div>
            </div>
          </div>

        </section>

        <section id="experience" className="experience-section" aria-labelledby="experience-title">
          <div className="experience-heading">
            <span className="eyebrow" data-reveal>
              {p.experienceLabel}
            </span>
            <h2 id="experience-title" className="display-title" data-text-reveal>
              <Lines lines={p.experience}/>
            </h2>
            <p className="experience-lead">{p.centerBody}</p>
          </div>
          <div className="experience-media">
            <img src="/images/hero.jpg" alt={labels.mediaAlt} loading="lazy" data-parallax/>
            {videoAvailable && (<video ref={video} className="experience-video" src="/video.mp4" autoPlay={!reduced} muted loop playsInline poster="/images/hero.jpg" onError={() => setVideoAvailable(false)}/>)}
            <div className="experience-media-shade"/>
            <span className="media-eyebrow">{p.mediaLabel}</span>
            <div className="media-center">
              <h3>{p.mediaTitle}</h3>
              <Action onClick={match} light>
                {p.mediaAction}
              </Action>
            </div>
            <span className="media-caption">
              {labels.mediaCaption}
            </span>
            {videoAvailable && (<button className="video-control" aria-label={videoPaused ? p.play : p.pause} onClick={() => {
                if (videoPaused) {
                    video.current
                        ?.play()
                        .then(() => setVideoPaused(false))
                        .catch(() => { });
                }
                else {
                    video.current?.pause();
                    setVideoPaused(true);
                }
            }}>
                {videoPaused ? <Play size={18}/> : <Pause size={18}/>}
              </button>)}
          </div>
          <div className="experience-details">
            <article data-reveal>
              <span className="eyebrow">01 / {labels.people}</span>
              <h3>{c.benefitOne}</h3>
              <p>{c.benefitOneText}</p>
              <a className="text-link" href="#discover">
                {c.benefitOneLink}
                <ArrowUpRight size={18}/>
              </a>
            </article>
            <article data-reveal>
              <span className="eyebrow">
                02 / {labels.possibilities}
              </span>
              <h3>{c.benefitTwo}</h3>
              <p>{c.benefitTwoText}</p>
              <button className="text-link" onClick={match}>
                {c.benefitTwoLink}
                <ArrowUpRight size={18}/>
              </button>
            </article>
          </div>
          <div className="values-grid">
            {c.values.map((value, i) => {
            const Icon = [Sprout, Compass, Globe2][i];
            return (<article className="value-card" key={i} data-reveal>
                  <div className="value-top">
                    <span>0{i + 1}</span>
                    <Icon strokeWidth={1.2} size={28}/>
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </article>);
        })}
          </div>
        </section>

        <section id="approach" className="approach-section" aria-labelledby="approach-title">
          <div className="approach-stage">
            <img className="approach-background" src="/reference/breathing-sphere.avif" alt="" loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/community.jpg"; }}/>
            <div className="approach-title">
              <h2 id="approach-title">
                <Lines lines={p.approach}/>
              </h2>
              <p>{p.approachText}</p>
            </div>
            <div className="approach-orbit">
              {p.orbit.map((label, i) => (<a key={i} className={`orbit-tag orbit-tag-${i}`} href={i === 2 ? "#discover" : "#experience"}>
                  <span className="orbit-num">0{i + 1}</span>
                  {label}
                  <ArrowUpRight size={15}/>
                </a>))}
            </div>
            <div className="approach-center-copy">
              <h3>
                <Lines lines={p.center}/>
              </h3>
              <p>{p.centerBody}</p>
              <Action onClick={match}>{c.match.toUpperCase()}</Action>
            </div>
          </div>
          <div className="stats-grid" id="possibilities">
            {[3, 4, 1].map((value, i) => (<div className="stat" key={i} data-reveal>
                <span className="stat-number">
                  <span data-counter={value}>0{value}</span>
                  <span>{i === 2 ? "↗" : "+"}</span>
                </span>
                <p>{c.stats[i]}</p>
              </div>))}
          </div>
        </section>

        <section id="discover" className="discover-section" aria-labelledby="discover-title">
          <div className="discover-heading">
            <div>
              <span className="eyebrow" data-reveal>
                {p.collectionLabel}
              </span>
              <h2 id="discover-title" className="display-title" data-text-reveal>
                <Lines lines={p.collection}/>
              </h2>
            </div>
            <Action className="discover-action" onClick={match}>
              {c.match.toUpperCase()}
            </Action>
          </div>
          <div className="collection-controls" data-reveal>
            <div className="filters" aria-label={labels.destinations}>
              {c.filters.map((f, i) => (<button key={i} className={filter === i && !onlySaved ? "active" : ""} aria-pressed={filter === i && !onlySaved} onClick={() => {
                setFilter(i);
                setOnlySaved(false);
            }}>
                  {f.toUpperCase()}
                </button>))}
            </div>
            <button className={`saved-filter ${onlySaved ? "active" : ""}`} aria-pressed={onlySaved} onClick={() => {
            setOnlySaved(!onlySaved);
            setFilter(0);
        }}>
              <Bookmark size={15}/>
              {c.viewSaved}
              <span>{saved.length}</span>
            </button>
          </div>
          {d.isLoading && <p className="catalog-status" role="status">{labels.loading}</p>}
          {d.isError && <div className="catalog-status" role="alert"><p>{labels.unavailable}</p><button className="text-link" onClick={d.refetch}>{labels.retry}</button></div>}
          <div className="university-grid">
            {filtered.map((u, i) => (<article className="university-card" key={u.id}>
                <div className="university-image">
                  <button className="university-image-link" onClick={() => d.setDetail(u)} aria-label={`${c.cardLink}: ${u.name}`}>
                    <img src={u.image} alt={u.country[l]} loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/community.jpg"; }}/>
                    <span className="image-shade"/>
                    <span className="card-discover">
                      <ArrowUpRight size={26}/>
                    </span>
                  </button>
                  <span className="card-location">
                    <span className="orange-dot"/>
                    {u.country[l]}
                  </span>
                  <button className={`save-button ${saved.includes(u.id) ? "is-saved" : ""}`} disabled={d.isSaving} onClick={() => toggleSave(u.id)} aria-label={`${saved.includes(u.id) ? c.saved : c.save}: ${u.name}`} aria-pressed={saved.includes(u.id)}>
                    <Bookmark size={18} fill={saved.includes(u.id) ? "currentColor" : "none"}/>
                  </button>
                  <span className="card-number">
                    0{i + 1}
                  </span>
                </div>
                <div className="university-info">
                  <div>
                    <h3>
                      <button onClick={() => d.setDetail(u)}>{u.name}</button>
                    </h3>
                    <p>{u.description[l]}</p>
                  </div>
                  <button className="university-arrow" aria-label={`${c.cardLink}: ${u.name}`} onClick={() => d.setDetail(u)}>
                    <ArrowUpRight size={21}/>
                  </button>
                </div>
                <span className="university-tag">{u.tags[l]}</span>
              </article>))}
          </div>
          {!d.isLoading && !d.isError && filtered.length === 0 && (<div className="empty-state">
              <Bookmark size={25}/>
              <p>{c.empty}</p>
              <button className="text-link" onClick={() => {
                setOnlySaved(false);
                setFilter(0);
            }}>
                {c.all}
                <ArrowRight size={17}/>
              </button>
            </div>)}
          <div className="discover-bottom">
            <span>
              {labels.places}
            </span>
            <a className="text-link" href="/Search">
              {p.viewAll}
              <ArrowUpRight size={16}/>
            </a>
          </div>
        </section>
      </main>

      <footer id="footer" className="footer">
        <div className="footer-start">
          <div className="footer-start-copy">
            <span className="eyebrow" data-reveal>
              <span className="orange-dot"/>
              {p.footerLabel}
            </span>
            <h2 className="display-title" data-text-reveal>
              <Lines lines={p.footer}/>
            </h2>
            <p data-reveal>{p.footerBody}</p>
          </div>
          <div className="footer-start-action" data-reveal>
            <Action onClick={match}>{p.footerAction}</Action>
            <span>
              {labels.profileChapter}
            </span>
          </div>
        </div>
        <div className="footer-dark">
          <div className="footer-top">
            <div className="footer-prompt">
              <h3>{p.footerPrompt}</h3>
              <button onClick={match}>
                {c.match}
                <ArrowUpRight size={19}/>
              </button>
              <div className="social-links">
                <a href="https://instagram.com/ismailov0787_08" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram size={18}/>
                </a>
                <a href="https://t.me/qebzo" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <Linkedin size={18}/>
                </a>
                <a href="#discover" aria-label={c.explore}>
                  <Globe2 size={18}/>
                </a>
              </div>
            </div>
            <nav className="footer-navigation" aria-label={labels.footerNav}>
              <span className="eyebrow">{p.navigation}</span>
              <a href="#home">{labels.home}</a>
              <a href="#discover">{labels.universities}</a>
              <a href="#approach">{labels.approach}</a>
              <a href="#experience">{labels.experience}</a>
            </nav>
            <div className="footer-summary">
              <span className="eyebrow">{p.discover}</span>
              <p>{c.footerText}</p>
            </div>
          </div>
          <a className="footer-wordmark" href="#home" aria-label="UniMatch home">
            UNIMATCH
          </a>
          <div className="footer-bottom">
            <span>© 2026 UniMatch</span>
            <span>{labels.world}</span>
            <div>
              <a href="https://t.me/qebzo" target="_blank" rel="noopener noreferrer">{labels.contact}</a>
            </div>
          </div>
        </div>
      </footer>
      <DiscoveryDialogs discovery={d}/>
    </div>);
}
