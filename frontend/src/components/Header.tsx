import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LANGUAGE_FLAGS, SupportedLanguage, SUPPORTED_LANGUAGES } from '../i18n/index.js';

interface HeaderProps {
  onOpenDrawer: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDrawer, searchQuery, onSearchChange }) => {
  const { t, i18n } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLang = (i18n.language?.substring(0, 2) || 'en') as SupportedLanguage;
  const currentLangInfo = LANGUAGE_FLAGS[currentLang] || LANGUAGE_FLAGS.en;

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setIsLangMenuOpen(false);
  };

  // Close language menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-md border-b border-surface-750/70">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-4">
        
        {/* Hamburger Menu & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDrawer}
            aria-label="Open Navigation Drawer"
            className="p-2 text-slate-300 hover:text-white hover:bg-surface-800 rounded-xl border border-surface-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan shadow-lg shadow-brand-500/25 group-hover:shadow-brand-500/45 transition-all">
              <img
                src="/streamxi-logo.jpg"
                alt="StreamXI Logo"
                className="w-full h-full object-cover rounded-[10px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.svg';
                }}
              />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                Stream<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-cyan">XI</span>
              </span>
              <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">
                {t('tagline')}
              </p>
            </div>
          </Link>
        </div>

        {/* Center Search Bar with Filter Effect */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2.5 bg-surface-850/80 border border-surface-700/80 rounded-xl text-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right Header Controls: Multilingual Selector with Flags */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-surface-850 border border-surface-700 hover:border-surface-600 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
              aria-expanded={isLangMenuOpen}
              aria-label="Language selector"
            >
              <div className="w-5 h-3.5 flex-shrink-0 overflow-hidden rounded-[2px] shadow-sm flex items-center justify-center">
                <img
                  src={currentLangInfo.flagUrl}
                  alt={currentLangInfo.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span>{currentLangInfo.label}</span>
              <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-surface-850 border border-surface-700/90 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-md">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const info = LANGUAGE_FLAGS[lang];
                  return (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-left transition-colors ${
                        currentLang === lang
                          ? 'text-brand-400 bg-surface-750'
                          : 'text-slate-300 hover:text-white hover:bg-surface-750'
                      }`}
                    >
                      <div className="w-5 h-3.5 flex-shrink-0 overflow-hidden rounded-[2px] shadow-sm flex items-center justify-center">
                        <img
                          src={info.flagUrl}
                          alt={info.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{info.name} ({info.label})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
