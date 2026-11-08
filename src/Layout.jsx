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
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import '@/styles/product-theme.css';
import '@/styles/discovery-polish.css';
import { toast } from 'sonner';

function LayoutContent({ children, currentPageName }) {
    const { t, language } = useLanguage();
    const navigationCopy = {en: ['Main navigation', 'Close menu', 'Open menu'], ru: ['Основная навигация', 'Закрыть меню', 'Открыть меню'], uz: ['Asosiy navigatsiya', 'Menyuni yopish', 'Menyuni ochish']}[language];
    const { user, logout, navigateToLogin } = useAuth();
    const guestCta = {en:'Find my university',ru:'Подобрать университет',uz:'Universitet tanlash'}[language];
    
    const navItems = [
        { name: t('nav.home'), path: 'Home', icon: Home },
        { name: t('nav.findUniversities'), path: 'Search', icon: Search },
        { name: t('nav.recommendations'), path: 'Recommendations', icon: Sparkles },
        { name: t('nav.myProfile'), path: 'Profile', icon: User },
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
        <div className="unimatch-app min-h-screen bg-slate-50" data-page={currentPageName}>
            <nav aria-label={navigationCopy[0]} className={`product-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
            }`}>
                <div className="product-nav-inner max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link to={createPageUrl("Home")} className="product-nav-brand flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="product-wordmark font-bold text-xl text-slate-800">UniMatch</span>
                        </Link>

                        <div className="product-nav-links hidden lg:flex items-center gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={createPageUrl(item.path)}
                                    aria-current={currentPageName === item.path ? 'page' : undefined}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        currentPageName === item.path
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
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
                                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <span className="max-w-[100px] truncate">{user.full_name || user.email}</span>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
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
                                        onClick={() => navigateToLogin()}
                                    >
                                        {t('nav.signIn')}
                                    </Button>
                                    <Button asChild className="product-nav-guest-cta bg-indigo-600 hover:bg-indigo-700"><Link to={createPageUrl("AdmissionsSurvey")}>{guestCta}</Link></Button>
                                </>
                            )}
                        </div>

                        <button
                            ref={menuToggle}
                            aria-label={mobileMenuOpen ? navigationCopy[1] : navigationCopy[2]}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="product-mobile-menu"
                            className="lg:hidden min-h-11 min-w-11 p-2 rounded-lg hover:bg-slate-100"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-slate-600" />
                            ) : (
                                <Menu className="w-6 h-6 text-slate-600" />
                            )}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div ref={menuPanel} id="product-mobile-menu" className="product-mobile-menu lg:hidden bg-white border-t shadow-lg">
                        <div className="product-mobile-menu-inner">
                            {navItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={createPageUrl(item.path)}
                                    aria-current={currentPageName === item.path ? 'page' : undefined}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`product-mobile-link flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                                        currentPageName === item.path
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-100'
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
                                        <div className="px-4 py-2 text-sm text-slate-500">
                                            {t('profile.signedInAs')} <span className="font-medium text-slate-700">{user.email}</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full justify-start text-red-600"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            {t('nav.signOut')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="product-mobile-guest-actions"><Button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => navigateToLogin()}
                                    >
                                        {t('nav.signIn')}
                                    </Button><Button asChild variant="outline" className="w-full"><Link to={createPageUrl('AdmissionsSurvey')} onClick={() => setMobileMenuOpen(false)}>{guestCta}</Link></Button></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main className="product-main pt-16">
                {children}
            </main>

            {currentPageName !== 'Search' && <FeedbackButton />}

            <footer className="product-footer product-footer-compact">
                <div className="product-footer-inner">
                    <Link to={createPageUrl('Home')} className="product-footer-brand">UniMatch<span>®</span></Link>
                    <p>{t('footer.tagline')}</p>
                    <nav aria-label={t('footer.quickLinks')}>
                        {currentPageName === 'Search' && <FeedbackButton />}
                        <Link to={createPageUrl('Search')}>{t('footer.findUniversities')}</Link>
                        <Link to={createPageUrl('AdmissionsSurvey')}>{guestCta}</Link>
                        <button type="button" onClick={() => setHelpOpen(true)}>{t('footer.helpCenter')}</button>
                        <details><summary>{t('footer.contactUs')}</summary><div>
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
