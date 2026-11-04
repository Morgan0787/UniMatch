import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLanguage, storageKey, supportedLanguages, translations } from './translations';

const LanguageContext = createContext(undefined);

function normalizeLanguage(language) {
  return supportedLanguages.includes(language) ? language : defaultLanguage;
}

function getNestedValue(locale, key) {
  return key.split('.').reduce((value, segment) => value?.[segment], locale);
}

function formatTemplate(message, params = {}) {
  if (typeof message !== 'string') return message;
  return message.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
}

function createTranslator(language) {
  return (key, params) => {
    const localizedValue = getNestedValue(translations[language], key);
    const fallbackValue = getNestedValue(translations[defaultLanguage], key);
    const resolvedValue = localizedValue ?? fallbackValue;

    if (resolvedValue == null) {
      return key;
    }

    return formatTemplate(resolvedValue, params);
  };
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return defaultLanguage;
    return normalizeLanguage(window.localStorage.getItem(storageKey) || defaultLanguage);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    setLanguageState(normalizeLanguage(nextLanguage));
  }, []);

  const t = useMemo(() => createTranslator(language), [language]);
  const value = useMemo(() => ({ language, setLanguage, t, supportedLanguages }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export { defaultLanguage, supportedLanguages, storageKey, translations };
