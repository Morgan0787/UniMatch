import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { 
    GraduationCap, Search, User, Menu, X, LogOut, 
    Home, Bookmark, ChevronDown, Sparkles, ShieldCheck, Database
} from 'lucide-react';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import HelpDialog from '@/components/HelpDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from '@/lib/i18n';
import { catalogPath } from '@/lib/discoveryContent';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import '@/styles/product-theme.css';
import '@/styles/ambient-light.css';
import '@/styles/discovery-polish.css';
import { toast } from 'sonner';

function LayoutContent({ children, currentPageName }) {
    const { t, language } = useLanguage();
    const navigationCopy = {en: ['Main navigation', 'Close menu', 'Open menu'], ru: ['Основная навигация', 'Закрыть меню', 'Открыть меню'], uz: ['Asosiy navigatsiya', 'Menyuni yopish', 'Menyuni ochish']}[language];
    const { user, logout, navigateToLogin } = useAuth();
    const guestCta = {en:'Find my university',ru:'Подобрать университет',uz:'Universitet tanlash'}[language];
    
    const navItems = [
        { name: t('nav.home'), path: 'Home', href: '/', icon: Home },
        { name: t('nav.findUniversities'), path: 'Search', href: catalogPath(language), icon: Search },
        { name: t('nav.recommendations'), path: 'Recommendations', href: '/Recommendations', icon: Sparkles },
        { name: t('nav.myProfile'), path: 'Profile', href: '/Profile', icon: User },
    ];
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const menuToggle = useRef(null);
    const menuPanel = useRef(null);

    useEffect(() => {
        document.body.dataset.unimatchTheme = 'warm-glass';
        return () => { delete document.body.dataset.unimatchTheme; };
    }, []);

    useEffect(() => { setMobileMenuOpen(false); }, [currentPageName]);
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setMobileMenuOpen(false);
                menuToggle.current?.focus();
            }
        };
        const closeOutside = (event) => {
            if (!menuPanel.current?.contains(event.target) && !menuToggle.current?.contains(event.target)) setMobileMenuOpen(false);
        };
        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('pointerdown', closeOutside);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('pointerdown', closeOutside);
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try { await logout(); }
        catch { toast.error({ en: 'Could not sign out. Please try again.', ru: 'Не удалось выйти. Попробуйте ещё раз.', uz: 'Chiqib bo‘lmadi. Qayta urinib ko‘ring.' }[language]); }
    };

    if (currentPageName === 'Home') return <>{children}<div className="landing-feedback"><FeedbackButton /></div></>;

    return (
        <div className="unimatch-app min-h-screen" data-page={currentPageName}>
            <div className="ambient-light-field" aria-hidden="true">
                <span className="ambient-glow ambient-glow--north" />
                <span className="ambient-glow ambient-glow--west" />
                <span className="ambient-glow ambient-glow--center" />
                <span className="ambient-glow ambient-glow--east" />
                <span className="ambient-glow ambient-glow--south" />
            </div>
            <nav aria-label={navigationCopy[0]} className={`product-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? 'is-scrolled' : ''
            }`}>
                <div className="product-nav-inner mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 gap-2">
                        <Link to="/" className="product-nav-brand flex items-center gap-2 min-h-11">
                            <div className="w-9 h-9 bg-[#292823] rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="product-wordmark font-bold text-xl text-[#292823]">UniMatch</span>
                        </Link>

                        <div className="product-nav-links hidden lg:flex items-center gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    aria-current={currentPageName === item.path ? 'page' : undefined}
                                    className={`inline-flex items-center min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        currentPageName === item.path
                                            ? 'bg-white/90 text-[#292823] shadow-sm'
                                            : 'text-[#47443f] hover:text-[#292823] hover:bg-white/60'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        <div className="product-nav-account hidden lg:flex items-center gap-3">
                            <LanguageSwitcher />
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-[#292823] to-[#6e4b2a] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <span className="max-w-[100px] truncate">{user.full_name || user.email}</span>
                                            <ChevronDown className="w-4 h-4 text-[#625e59]" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl("Profile")} className="cursor-pointer">
                                                <User className="w-4 h-4 mr-2" />
                                                {t('nav.myProfile')}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl("Profile")} className="cursor-pointer">
                                                <Bookmark className="w-4 h-4 mr-2" />
                                                {t('nav.savedUniversities')}
                                            </Link>
                                        </DropdownMenuItem>
                                        {user?.role === 'admin' && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("AdminFeedback")} className="cursor-pointer">
                                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                                        {t('nav.adminFeedback')}
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("AdminDataQuality")} className="cursor-pointer">
                                                        <Database className="w-4 h-4 mr-2" />
                                                        {t('nav.adminDataQuality')}
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            {t('nav.signOut')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <>
                                    <Button 
                                        variant="ghost" 
                                        className="min-h-11 rounded-full text-[#292823] hover:bg-white/60"
                                        onClick={() => navigateToLogin()}
                                    >
                                        {t('nav.signIn')}
                                    </Button>
                                    <Button asChild className="product-nav-guest-cta min-h-11 rounded-full bg-[#252c2f] hover:bg-[#354044] text-white"><Link to={createPageUrl("AdmissionsSurvey")} aria-current={currentPageName === 'AdmissionsSurvey' ? 'page' : undefined}>{guestCta}</Link></Button>
                                </>
                            )}
                        </div>

                        <button
                            ref={menuToggle}
                            aria-label={mobileMenuOpen ? navigationCopy[1] : navigationCopy[2]}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="product-mobile-menu"
                            className="lg:hidden min-h-11 min-w-11 p-2 rounded-full text-[#292823] hover:bg-white/65 inline-flex items-center justify-center"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-[#292823]" />
                            ) : (
                                <Menu className="w-6 h-6 text-[#292823]" />
                            )}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div ref={menuPanel} id="product-mobile-menu" className="product-mobile-menu lg:hidden shadow-lg">
                        <div className="product-mobile-menu-inner">
                            {navItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    aria-current={currentPageName === item.path ? 'page' : undefined}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`product-mobile-link flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                                        currentPageName === item.path
                                            ? 'bg-[#f4e4cc]/85 text-[#5c3c1b]'
                                            : 'text-[#47443f] hover:bg-white/70'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                            
                            <div className="product-mobile-menu-account">
                                <div className="product-mobile-menu-language">
                                    <LanguageSwitcher inline />
                                </div>
                                {user ? (
                                    <div className="space-y-2">
                                        <div className="px-4 py-2 text-sm text-[#55504a]">
                                            {t('profile.signedInAs')} <span className="font-medium text-[#292823]">{user.email}</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full min-h-11 justify-start rounded-xl text-red-700 hover:bg-red-50/70"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            {t('nav.signOut')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="product-mobile-guest-actions"><Button
                                        className="w-full min-h-11 rounded-full bg-[#252c2f] hover:bg-[#354044] text-white"
                                        onClick={() => navigateToLogin()}
                                    >
                                        {t('nav.signIn')}
                                    </Button><Button asChild variant="outline" className="w-full min-h-11 rounded-full border-[#d7c7b2] bg-white/80 text-[#292823] hover:bg-white"><Link to={createPageUrl('AdmissionsSurvey')} onClick={() => setMobileMenuOpen(false)}>{guestCta}</Link></Button></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main className="product-main pt-24">
                {children}
            </main>

            {currentPageName !== 'Search' && <FeedbackButton />}

            <footer className="product-footer product-footer-compact">
                <div className="product-footer-inner">
                    <Link to="/" className="product-footer-brand">UniMatch<span>®</span></Link>
                    <p>{t('footer.tagline')}</p>
                    <nav aria-label={t('footer.quickLinks')}>
                        {currentPageName === 'Search' && <FeedbackButton />}
                        <Link to={catalogPath(language)}>{t('footer.findUniversities')}</Link>
                        <Link to={createPageUrl('AdmissionsSurvey')}>{guestCta}</Link>
                        <button type="button" onClick={() => setHelpOpen(true)}>{t('footer.helpCenter')}</button>
                        <details><summary className="inline-flex items-center gap-1.5"><span>{t('footer.contactUs')}</span><ChevronDown size={14} className="disclosure-chevron shrink-0" aria-hidden="true" /></summary><div>
                            <a href="https://t.me/qebzo" target="_blank" rel="noopener noreferrer">Telegram: @qebzo</a>
                            <a href="https://t.me/Abubakr_786" target="_blank" rel="noopener noreferrer">Telegram: @Abubakr_786</a>
                            <a href="https://t.me/Mr_xomidov" target="_blank" rel="noopener noreferrer">Telegram: @Mr_xomidov</a>
                            <a href="https://instagram.com/ismailov0787_08" target="_blank" rel="noopener noreferrer">Instagram: @ismailov0787_08</a>
                        </div></details>
                    </nav>
                    <small>© {new Date().getFullYear()} {t('footer.copyright')}</small>
                </div>
            </footer>
            <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
        </div>
    );
}

export default function Layout({ children, currentPageName }) {
    return (
        <LayoutContent children={children} currentPageName={currentPageName} />
    );
}
