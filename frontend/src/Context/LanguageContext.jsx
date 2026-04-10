import React, { createContext, useState, useContext, useEffect } from 'react';
import translations from './translations.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Try to load from localStorage, otherwise default to English
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  // Translation function
  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
