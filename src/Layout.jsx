import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { 
    GraduationCap, Search, User, Menu, X, LogOut, 
    Home, Bookmark, ChevronDown, Sparkles, ShieldCheck, Database
} from 'lucide-react';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

function LayoutContent({ children, currentPageName }) {
    const { t } = useLanguage();
    const { user, logout, navigateToLogin } = useAuth();
    
    const navItems = [
        { name: t('nav.home'), path: 'Home', icon: Home },
        { name: t('nav.findUniversities'), path: 'Search', icon: Search },
        { name: t('nav.recommendations'), path: 'Recommendations', icon: Sparkles },
        { name: t('nav.myProfile'), path: 'Profile', icon: User },
    ];
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-slate-800">UniMatch</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={createPageUrl(item.path)}
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

                        <div className="hidden md:flex items-center gap-3">
                            <LanguageSwitcher />
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {user.full_name?.[0] || user.email[0].toUpperCase()}
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
                                    <Button 
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => navigateToLogin()}
                                    >
                                        {t('nav.getStarted')}
                                    </Button>
                                </>
                            )}
                        </div>

                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
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
                    <div className="md:hidden bg-white border-t shadow-lg">
                        <div className="px-4 py-4 space-y-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={createPageUrl(item.path)}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                                        currentPageName === item.path
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                            
                            <div className="pt-4 border-t mt-4">
                                <div className="mb-3">
                                    <LanguageSwitcher />
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
                                    <Button 
                                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => navigateToLogin()}
                                    >
                                        {t('nav.signIn')} / {t('nav.getStarted')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main className="pt-16">
                {children}
            </main>

            <FeedbackButton />

            <footer className="bg-white border-t border-slate-100 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-xl text-slate-800">UniMatch</span>
                            </div>
                            <p className="text-slate-500 max-w-sm">
                                {t('footer.tagline')}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-4">{t('footer.quickLinks')}</h4>
                            <div className="space-y-2">
                                <Link to={createPageUrl("Search")} className="block text-slate-500 hover:text-indigo-600 transition-colors">
                                    {t('footer.findUniversities')}
                                </Link>
                                <Link to={createPageUrl("Profile")} className="block text-slate-500 hover:text-indigo-600 transition-colors">
                                    {t('footer.myProfile')}
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-4">{t('footer.support')}</h4>
                            <div className="space-y-2">
                                <a href="#" className="block text-slate-500 hover:text-indigo-600 transition-colors">
                                    {t('footer.helpCenter')}
                                </a>
                                <div>
                                    <p className="text-slate-800 font-medium mb-2">{t('footer.contactUs')}</p>
                                    <a href="https://t.me/qebzo" target="_blank" rel="noopener noreferrer" className="block text-slate-500 hover:text-indigo-600 transition-colors text-sm">
                                        Telegram: @qebzo
                                    </a>
                                    <a href="https://t.me/Abubakr_786" target="_blank" rel="noopener noreferrer" className="block text-slate-500 hover:text-indigo-600 transition-colors text-sm">
                                        Telegram: @Abubakr_786
                                    </a>
                                    <a href="https://t.me/Mr_xomidov" target="_blank" rel="noopener noreferrer" className="block text-slate-500 hover:text-indigo-600 transition-colors text-sm">
                                        Telegram: @Mr_xomidov
                                    </a>
                                    <a href="https://instagram.com/ismailov0787_08" target="_blank" rel="noopener noreferrer" className="block text-slate-500 hover:text-indigo-600 transition-colors text-sm">
                                        Instagram: @ismailov0787_08
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 mt-10 pt-8 text-center text-slate-400 text-sm">
                        © {new Date().getFullYear()} {t('footer.copyright')}
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function Layout({ children, currentPageName }) {
    return (
        <LanguageProvider>
            {currentPageName === 'Home'
                ? children
                : <LayoutContent children={children} currentPageName={currentPageName} />}
        </LanguageProvider>
    );
}
