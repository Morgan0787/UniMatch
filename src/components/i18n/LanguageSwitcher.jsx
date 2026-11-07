import React, { useId } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import '@/styles/glass-controls.css';

const languages = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'uz', name: "O'zbekcha" }
];

export default function LanguageSwitcher({ inline = false }) {
    const { language, setLanguage } = useLanguage();
    const groupId = useId();
    const currentLang = languages.find(l => l.code === language);
    const label = { en: 'Interface language', ru: 'Язык интерфейса', uz: 'Interfeys tili' }[language];
    if (inline) return <fieldset className="language-inline" aria-label={label}>
        <Globe aria-hidden="true" className="language-inline-globe" />
        <div className="language-inline-options">
            {languages.map(lang => <label key={lang.code} className="language-inline-option" title={lang.name}>
                <input className="sr-only" type="radio" name={groupId} value={lang.code} aria-label={lang.name} checked={language === lang.code} onChange={() => setLanguage(lang.code)} />
                <span>{lang.code.toUpperCase()}</span>
            </label>)}
        </div>
    </fieldset>;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={`${label}: ${currentLang?.name}`} className="language-glass-trigger language-switcher-trigger"><Globe aria-hidden="true" className="language-switcher-globe" /><span>{language.toUpperCase()}</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="language-switcher-menu" onEscapeKeyDown={event => event.stopPropagation()}>
                <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
                    {languages.map(lang => (
                        <DropdownMenuRadioItem key={lang.code} value={lang.code} className="language-switcher-option">
                            {lang.name}
                            {language === lang.code && <span className="language-switcher-check" aria-hidden="true">✓</span>}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
