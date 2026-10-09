import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, ArrowRight, Globe2, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import HomeGlobe from '@/components/home/HomeGlobe';
import './Home.css';

function HowMatchingWorks() {
    return (
        <Dialog.Root>
            <Dialog.Trigger className="um-secondary">
                Как работает подбор <ArrowRight size={17} aria-hidden="true" />
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="um-dialog-overlay" />
                <Dialog.Content className="um-dialog" lang="ru">
                    <Dialog.Title>От интереса к выбору</Dialog.Title>
                    <Dialog.Description>
                        Начни с поиска. UniMatch поможет сравнить варианты обучения за рубежом.
                    </Dialog.Description>
                    <ol className="um-steps">
                        <li><h3>Задай свои ориентиры</h3><p>Выбери страну, бюджет и уровень обучения. Укажи оценки и результаты языковых экзаменов, если они есть.</p></li>
                        <li><h3>Посмотри подходящие варианты</h3><p>Изучи требования и стоимость, сравни университеты. Если данных нет, мы обозначаем это в карточке.</p></li>
                        <li><h3>Спланируй следующий шаг</h3><p>Проверь актуальные условия и сроки на официальном сайте университета. Оценка шансов — ориентир, а не гарантия поступления.</p></li>
                    </ol>
                    <Link className="um-primary" to={createPageUrl('Search')}>
                        Найти университет <ArrowUpRight size={19} aria-hidden="true" />
                    </Link>
                    <Dialog.Close className="um-dialog-close" aria-label="Закрыть объяснение">
                        <X size={21} aria-hidden="true" />
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default function Home() {
    const { user } = useAuth();
    const [chapter, setChapter] = useState(0);

    return (
        <div className="um-home" lang="ru">
            <a className="um-skip" href="#um-main">Перейти к содержимому</a>
            <header className="um-header">
                <Link className="um-brand" to={createPageUrl('Home')} aria-label="UniMatch — главная">
                    <svg width="30" height="31" viewBox="0 0 30 31" fill="none" aria-hidden="true">
                        <path d="M4 4v13a9 9 0 0 0 18 0V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M11 4v12a3 3 0 0 0 6 0V4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="26" cy="4" r="3" fill="#c64b2c" />
                    </svg>
                    <span>UniMatch</span>
                </Link>
                <nav className="um-nav" aria-label="Основная навигация">
                    <Link className="um-catalog-link" to={createPageUrl('Search')}>Университеты</Link>
                    <Link className="um-account" to={createPageUrl(user ? 'Profile' : 'Login')}>
                        {user ? 'Мой профиль' : 'Войти'} <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                </nav>
            </header>
            <main className="um-main" id="um-main" tabIndex={-1}>
                <div className="um-story">
                    <section className="um-hero" aria-labelledby="um-title">
                        <p className="um-origin">Из Центральной Азии —<br />в университеты мира.</p>
                        <HomeGlobe onChapterChange={setChapter} />
                        <div className={`um-copy um-copy-intro${chapter === 0 ? ' um-copy-active' : ''}`} aria-hidden={chapter !== 0}>
                        <h1 id="um-title">Твой университет.<br />Твой новый мир.</h1>
                        <p className="um-description">Найди, где продолжить свою историю.<br className="um-desktop-break" /> Подбери университет за рубежом под свои<br className="um-desktop-break" /> цели, результаты и бюджет.</p>
                        <div className="um-actions">
                            <Link className="um-primary" to={createPageUrl('Search')}>
                                Найти университет <ArrowUpRight size={20} aria-hidden="true" />
                            </Link>
                            <HowMatchingWorks />
                        </div>
                        <p className="um-search-note">Для поиска не нужна регистрация</p>
                        </div>
                        <div className={`um-copy um-copy-chapter${chapter === 1 ? ' um-copy-active' : ''}`} aria-hidden={chapter !== 1}>
                            <p className="um-chapter-number">01 / ОРИЕНТИР</p>
                            <h2>У каждого свой маршрут.</h2>
                            <p className="um-description">Определи, где и чему хочешь учиться. Начни с направлений, которые тебе близки.</p>
                        </div>
                        <div className={`um-copy um-copy-chapter${chapter === 2 ? ' um-copy-active' : ''}`} aria-hidden={chapter !== 2}>
                            <p className="um-chapter-number">02 / ВЫБОР</p>
                            <h2>Возможности обретают форму.</h2>
                            <p className="um-description">Сравни требования, стоимость и условия обучения — в своём темпе.</p>
                        </div>
                        <div className={`um-copy um-copy-final${chapter === 3 ? ' um-copy-active' : ''}`} aria-hidden={chapter !== 3}>
                            <p className="um-chapter-number">03 / ТВОЙ ШАГ</p>
                            <h2>Будущее начинается с выбора.</h2>
                            <Link className="um-primary" to={createPageUrl('Search')}>
                                Найти университет <ArrowUpRight size={20} aria-hidden="true" />
                            </Link>
                        </div>
                        <div className="um-horizon">
                        <span><Globe2 size={16} strokeWidth={1.4} aria-hidden="true" /> Европа, США и Азия</span>
                        <span>{String(chapter + 1).padStart(2, '0')} / 04 · Большой мир. Твой выбор.</span>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
