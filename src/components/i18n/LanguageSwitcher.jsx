import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' }
];

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const currentLang = languages.find(l => l.code === language);
    const label = { en: 'Interface language', ru: 'Язык интерфейса', uz: 'Interfeys tili' }[language];
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={`${label}: ${currentLang?.name}`} className="gap-2"><Globe className="w-4 h-4" /><span className="hidden sm:inline">{currentLang?.flag} {currentLang?.name}</span><span className="sm:hidden">{currentLang?.flag}</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map(lang => (
                    <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)} className={language === lang.code ? 'bg-indigo-50' : ''}><span className="mr-2">{lang.flag}</span>{lang.name}</DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
