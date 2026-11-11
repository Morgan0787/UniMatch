import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { defaultLanguage, storageKey, supportedLanguages, translations } from './translations';
import { catalogLanguage, catalogPath } from '../discoveryContent.js';

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

export function LanguageProvider({ children, publicPage = undefined }) {
  const { pathname, search, hash, state } = useLocation();
  const navigate = useNavigate();
  const catalogLocale = catalogLanguage(pathname);
  const [preferred, setPreferred] = useState(() => {
    if (typeof window === 'undefined') return defaultLanguage;
    try { return normalizeLanguage(window.localStorage.getItem(storageKey) || defaultLanguage); }
    catch { return defaultLanguage; }
  });
  const language = normalizeLanguage(catalogLocale || (publicPage?.path === pathname ? publicPage.language : preferred));

  useEffect(() => {
    if (catalogLocale && catalogLocale !== 'en') setPreferred(catalogLocale);
  }, [catalogLocale]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, preferred); } catch { /* Storage may be disabled. */ }
  }, [preferred]);

  const setLanguage = useCallback((nextLanguage) => {
    const next = normalizeLanguage(nextLanguage);
    setPreferred(next);
    if (catalogLocale && next !== catalogLocale) {
      navigate({ pathname: catalogPath(next), search, hash }, { state });
    }
  }, [catalogLocale, hash, navigate, search, state]);

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
