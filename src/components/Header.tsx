import React, { useState } from 'react';
import { Globe, Menu as MenuIcon, X, Calendar, Phone, HeartHandshake, Search } from 'lucide-react';
import { LANGUAGES, SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { SiteSettings } from '../types';

interface HeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenReservation: () => void;
  onOpenSupport: () => void;
  onOpenSearch: () => void;
  activeView: 'home' | 'menu' | 'admin' | 'not-found';
  setActiveView: (view: 'home' | 'menu' | 'admin' | 'not-found') => void;
  settings?: SiteSettings;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenReservation,
  onOpenSupport,
  onOpenSearch,
  activeView,
  setActiveView,
  settings
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  const handleNavClick = (view: 'home' | 'menu', hash?: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">
          
          {/* Zone 1: Text-only Restaurant Wordmark: GIA Restaurant */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className="text-left rtl:text-right group flex flex-col focus:outline-none cursor-pointer"
            >
              <span className="font-serif text-2xl sm:text-[26px] font-bold tracking-tight text-[#1c1917] group-hover:text-[#283618] transition-colors whitespace-nowrap">
                GIA Restaurant
              </span>
              <span className="text-[10px] tracking-widest uppercase text-stone-500 font-medium whitespace-nowrap -mt-0.5">
                Dubai Mall · Fashion Avenue
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-700">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-[#283618] transition-colors whitespace-nowrap py-1 border-b-2 ${
                activeView === 'home' ? 'border-[#283618] text-[#283618] font-semibold' : 'border-transparent'
              }`}
            >
              {t('nav_home')}
            </button>
            <button
              onClick={() => handleNavClick('menu')}
              className={`hover:text-[#283618] transition-colors whitespace-nowrap py-1 border-b-2 ${
                activeView === 'menu' ? 'border-[#283618] text-[#283618] font-semibold' : 'border-transparent'
              }`}
            >
              {t('nav_menu')}
            </button>
            <button
              onClick={() => handleNavClick('home', 'about-section')}
              className="hover:text-[#283618] transition-colors whitespace-nowrap py-1 border-b-2 border-transparent"
            >
              {t('nav_about')}
            </button>
            <button
              onClick={() => handleNavClick('home', 'location-section')}
              className="hover:text-[#283618] transition-colors whitespace-nowrap py-1 border-b-2 border-transparent"
            >
              {t('nav_location')}
            </button>
            <button
              onClick={onOpenSupport}
              className="text-stone-600 hover:text-[#283618] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <HeartHandshake className="w-4 h-4 text-[#bc6c25]" />
              <span>{t('nav_support')}</span>
            </button>
          </nav>

          {/* Zone 3: Search, Language Selector + Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Search Button (Triggers Product Search & Secret Admin Door) */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-stone-600 hover:text-[#283618] hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title={currentLang === 'ar' ? 'بحث عن الأطباق' : 'Search dishes'}
              aria-label="Search dishes"
            >
              <Search className="w-4 h-4" />
              <span className="hidden xl:inline">{currentLang === 'ar' ? 'بحث' : 'Search'}</span>
            </button>

            {/* 11-Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white/90 text-xs font-medium text-stone-800 hover:bg-stone-50 transition-colors shadow-xs"
                title="Select Language / اختر اللغة"
                aria-expanded={langDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">{currentLangObj.flag}</span>
                <span className="font-semibold">{currentLangObj.nativeName}</span>
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                      Languages ({LANGUAGES.length})
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left rtl:text-right px-3.5 py-2 text-xs flex items-center justify-between hover:bg-stone-50 transition-colors ${
                          currentLang === lang.code ? 'font-bold text-[#283618] bg-stone-50/80' : 'text-stone-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className="text-[10px] text-stone-400 uppercase">{lang.code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Direct Phone Call Button */}
            {settings?.phone && (
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:text-[#283618] hover:bg-stone-100/60 transition-colors"
                title={t('location_call_us')}
              >
                <Phone className="w-3.5 h-3.5 text-[#283618]" />
                <span className="dir-ltr">{settings.phone}</span>
              </a>
            )}

            {/* Primary Action Button: Reserve a Table (Redirects to Servmeco widget) */}
            <button
              onClick={onOpenReservation}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#283618] hover:bg-[#1f2b13] text-[#faf8f5] text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap active:scale-98"
            >
              <Calendar className="w-4 h-4 text-[#dda15e]" />
              <span>{t('nav_reserve')}</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone-200/80 animate-in fade-in duration-150">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="text-left rtl:text-right px-3 py-2 rounded-md text-sm font-medium text-stone-800 hover:bg-stone-100 flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-stone-500" />
                <span>{currentLang === 'ar' ? 'بحث عن الأطباق' : 'Search dishes'}</span>
              </button>
              <button
                onClick={() => handleNavClick('home')}
                className={`text-left rtl:text-right px-3 py-2 rounded-md text-sm font-medium ${
                  activeView === 'home' ? 'bg-[#283618] text-white' : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                {t('nav_home')}
              </button>
              <button
                onClick={() => handleNavClick('menu')}
                className={`text-left rtl:text-right px-3 py-2 rounded-md text-sm font-medium ${
                  activeView === 'menu' ? 'bg-[#283618] text-white' : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                {t('nav_menu')}
              </button>
              <button
                onClick={() => handleNavClick('home', 'about-section')}
                className="text-left rtl:text-right px-3 py-2 rounded-md text-sm font-medium text-stone-800 hover:bg-stone-100"
              >
                {t('nav_about')}
              </button>
              <button
                onClick={() => handleNavClick('home', 'location-section')}
                className="text-left rtl:text-right px-3 py-2 rounded-md text-sm font-medium text-stone-800 hover:bg-stone-100"
              >
                {t('nav_location')}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSupport();
                }}
                className="text-left rtl:text-right px-3 py-2 rounded-md text-sm font-medium text-[#bc6c25] hover:bg-amber-50 flex items-center gap-2"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>{t('nav_support')}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
