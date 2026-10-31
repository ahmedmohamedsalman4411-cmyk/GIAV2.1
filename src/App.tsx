/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedDishes } from './components/FeaturedDishes';
import { AboutSection } from './components/AboutSection';
import { LocationSection } from './components/LocationSection';
import { MenuPage } from './components/MenuPage';
import { SupportModal } from './components/SupportModal';
import { SearchModal } from './components/SearchModal';
import { ReservationModal } from './components/ReservationModal';
import { LoadingScreen } from './components/LoadingScreen';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { NotFoundPage } from './components/NotFoundPage';
import { SupportedLanguage } from './i18n/translations';
import { MenuItem, SiteSettings, ReservationSettings } from './types';
import { api, PublicDataResponse } from './services/api';
import { updatePageSeo } from './utils/seo';

export default function App() {
  // Language State with persistence and URL query support (?lang=ar, ?lang=en, etc.)
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang') as SupportedLanguage;
    const validLangs: SupportedLanguage[] = ['ar', 'en', 'it', 'fr', 'es', 'de', 'nl', 'pt', 'zh', 'hi', 'tl'];
    if (langParam && validLangs.includes(langParam)) {
      return langParam;
    }
    const saved = localStorage.getItem('gia_language') as SupportedLanguage;
    return saved || 'ar'; // Default to Arabic
  });

  // Current view: 'home' | 'menu' | 'admin' | 'not-found'
  const [activeView, setActiveView] = useState<'home' | 'menu' | 'admin' | 'not-found'>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin/login/2026123456' || hash === '#admin/login/2026123456') {
      return 'admin';
    }
    if (hash === '#menu') return 'menu';
    return 'home';
  });

  // Modals
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  // Server Data & Loading State
  const [data, setData] = useState<PublicDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-site Native Table Reservation Modal
  const handleOpenReservation = () => {
    setIsReservationOpen(true);
  };

  // Secret Admin Portal Navigation (accessed only via secret URL or typing 'admin2026123456' in search)
  const handleNavigateToSecretAdmin = () => {
    localStorage.removeItem('gia_admin_token');
    localStorage.removeItem('gia_admin_user');
    window.history.pushState({}, '', '/admin/login/2026123456');
    setActiveView('admin');
  };

  const handleCloseAdmin = () => {
    // Clear any hash if present
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // Update path back to home with current language
    const cleanUrl = `/?lang=${currentLang}`;
    window.history.pushState({}, '', cleanUrl);
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync RTL / LTR, HTML lang attribute, and SEO metadata
  useEffect(() => {
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('gia_language', currentLang);

    // Update URL query param cleanly without reloading if not on secret admin URL
    if (window.location.pathname !== '/admin/login/2026123456') {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', currentLang);
      window.history.replaceState({}, '', url.toString());
    }

    // Update comprehensive SEO title, descriptions, open graph, canonical, and Schema.org
    if (activeView !== 'not-found' && activeView !== 'admin') {
      updatePageSeo(currentLang, activeView);
    }
  }, [currentLang, activeView]);

  // Load public data from backend with retry capability
  const loadPublicData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPublicData();
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching restaurant data:', err);
      setError('تعذر الاتصال بقاعدة بيانات المطعم.');
    } finally {
      // Hides immediately once data is ready without artificial delay
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  // Listen to window location hash & popstate
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin/login/2026123456' || hash === '#admin/login/2026123456') {
        setActiveView('admin');
      } else if (hash === '#menu') {
        setActiveView('menu');
      } else if (hash === '#reserve') {
        setIsReservationOpen(true);
      } else if (hash.startsWith('#') && hash !== '' && !['#about-section', '#location-section'].includes(hash)) {
        setActiveView('not-found');
      } else if (path !== '/admin/login/2026123456' && !hash.includes('admin')) {
        // Return to home view
        setActiveView('home');
      }
    };

    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // Elegant Ivory/Cream Text-Only GIA Loading Screen on initial load or failure
  if (loading || (error && !data)) {
    return (
      <LoadingScreen
        isLoading={loading}
        error={error}
        onRetry={loadPublicData}
        currentLang={currentLang}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#faf8f5] text-stone-900 ${currentLang === 'ar' ? 'font-arabic' : ''}`}>
      
      {/* Top Navigation */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenReservation={handleOpenReservation}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        settings={data?.settings}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeView === 'home' && (
          <>
            {/* Hero Section */}
            <Hero
              currentLang={currentLang}
              settings={data?.settings}
              onOpenReservation={handleOpenReservation}
              onExploreMenu={() => {
                setActiveView('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Featured Dishes Section with Skeleton Support */}
            <FeaturedDishes
              currentLang={currentLang}
              menuItems={data?.menuItems || []}
              onViewAllMenu={() => {
                setActiveView('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenReservation={handleOpenReservation}
            />

            {/* About & Craftsmanship Section */}
            <AboutSection
              currentLang={currentLang}
              settings={data?.settings}
              onOpenReservation={handleOpenReservation}
            />

            {/* Location & Operating Hours Section with Google Maps (No Email) */}
            <LocationSection
              currentLang={currentLang}
              settings={data?.settings}
            />
          </>
        )}

        {activeView === 'menu' && (
          <MenuPage
            currentLang={currentLang}
            menuItems={data?.menuItems || []}
            isLoading={loading}
            onOpenReservation={handleOpenReservation}
            onTriggerAdmin={handleNavigateToSecretAdmin}
          />
        )}

        {activeView === 'not-found' && (
          <NotFoundPage
            currentLang={currentLang}
            onGoHome={() => {
              setActiveView('home');
              window.location.hash = '';
            }}
            onGoMenu={() => {
              setActiveView('menu');
              window.location.hash = '#menu';
            }}
            onGoReservation={handleOpenReservation}
          />
        )}
      </main>

      {/* Footer (No Public Admin link, No Email) */}
      <Footer
        currentLang={currentLang}
        settings={data?.settings}
        onOpenReservation={handleOpenReservation}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenAdmin={handleNavigateToSecretAdmin}
        onNavigate={(view, hash) => {
          setActiveView(view);
          if (hash) {
            setTimeout(() => {
              const el = document.getElementById(hash);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Product Search & Secret Admin Trigger Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentLang={currentLang}
        menuItems={data?.menuItems || []}
        onSelectDish={(dish) => {
          setActiveView('menu');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToSecretAdmin={handleNavigateToSecretAdmin}
      />

      {/* Native In-Site Table Reservation Modal */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        currentLang={currentLang}
        reservationSettings={data?.reservationSettings}
      />

      {/* Emergency & Customer Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        currentLang={currentLang}
        settings={data?.settings}
      />

      {/* Secret Admin Portal (rendered at /admin/login/2026123456) */}
      {activeView === 'admin' && (
        <AdminPanel
          currentLang={currentLang}
          onClose={handleCloseAdmin}
          onRefreshPublicData={loadPublicData}
        />
      )}

    </div>
  );
}
