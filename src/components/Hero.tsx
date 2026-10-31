import React from 'react';
import { Calendar, Utensils, MapPin, Sparkles, Navigation } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { SiteSettings } from '../types';
import { getAssetUrl } from '../utils/assetUrl';

interface HeroProps {
  currentLang: SupportedLanguage;
  settings?: SiteSettings;
  onOpenReservation: () => void;
  onExploreMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentLang,
  settings,
  onOpenReservation,
  onExploreMenu
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  // Localized tagline fallback
  const tagline = settings?.tagline?.[currentLang] || settings?.tagline?.['en'] || settings?.tagline?.['ar'] || t('hero_subtitle');
  const restaurantName = currentLang === 'ar' ? (settings?.restaurantNameAr || 'مطعم جيا دبي') : (settings?.restaurantName || 'GIA Restaurant Dubai');

  return (
    <section className="relative min-h-[580px] lg:min-h-[660px] flex items-center justify-center overflow-hidden bg-stone-900 text-stone-100">
      
      {/* Background Image with Measured Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={getAssetUrl(settings?.heroImage) || getAssetUrl('/images/hero_gia_dining_1793363107745.jpg')}
          alt="GIA Italian Restaurant Dubai Mall dining overlooking the Dubai Fountain"
          className="w-full h-full object-cover object-center scale-102 transition-transform duration-1000 ease-out"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const el = e.currentTarget;
            if (!el.src.includes('hero_gia_dining')) {
              el.src = getAssetUrl('/images/hero_gia_dining_1793363107745.jpg');
            }
          }}
        />
        {/* Gradients ensuring 4.5:1 text contrast across all viewports */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-stone-900/40 backdrop-brightness-95" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        
        {/* Unboxed Location trust marker */}
        <div className="inline-flex items-center gap-2 text-xs font-medium text-stone-300 mb-6 tracking-wider uppercase bg-stone-900/60 px-4 py-1.5 rounded-full border border-stone-700/60 backdrop-blur-xs">
          <MapPin className="w-3.5 h-3.5 text-[#dda15e]" />
          <span>The Dubai Mall</span>
          <span aria-hidden="true">·</span>
          <span>Fashion Avenue</span>
          <span aria-hidden="true">·</span>
          <span>Overlooking Dubai Fountain</span>
        </div>

        {/* Brand Display Name */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight" style={{ textWrap: 'balance' }}>
          {currentLang === 'ar' ? (
            <span>{t('hero_title')}</span>
          ) : (
            <span>{restaurantName}</span>
          )}
        </h1>

        {/* Narrative Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-200/90 leading-relaxed font-light mb-10" style={{ textWrap: 'balance' }}>
          {tagline}
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={onOpenReservation}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#bc6c25] hover:bg-[#a35c1f] text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-amber-900/40 transition-all flex items-center justify-center gap-2.5 active:scale-98"
          >
            <Calendar className="w-4 h-4 text-amber-200" />
            <span>{t('hero_cta_reserve')}</span>
          </button>

          <button
            onClick={onExploreMenu}
            className="w-full sm:w-auto px-7 py-3.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold text-sm rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2.5 active:scale-98"
          >
            <Utensils className="w-4 h-4 text-stone-200" />
            <span>{t('hero_cta_menu')}</span>
          </button>
        </div>

        {/* Live Feature Highlights Row */}
        <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="px-2">
            <div className="text-xl font-serif font-bold text-[#dda15e]">100%</div>
            <div className="text-xs text-stone-300 mt-0.5">Handmade Fresh Pasta</div>
          </div>
          <div className="px-2">
            <div className="text-xl font-serif font-bold text-[#dda15e]">48h</div>
            <div className="text-xs text-stone-300 mt-0.5">Fermented Pizza Dough</div>
          </div>
          <div className="px-2">
            <div className="text-xl font-serif font-bold text-[#dda15e]">Direct</div>
            <div className="text-xs text-stone-300 mt-0.5">Italian Artisanal Imports</div>
          </div>
          <div className="px-2">
            <div className="text-xl font-serif font-bold text-[#dda15e]">Panoramic</div>
            <div className="text-xs text-stone-300 mt-0.5">Dubai Fountain Views</div>
          </div>
        </div>

        {/* Google Maps Fast Direction Link */}
        {settings?.googleMapsUrl && (
          <div className="mt-6 flex justify-center">
            <a
              href={settings.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-stone-300 hover:text-white underline decoration-stone-500 hover:decoration-white transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-[#dda15e]" />
              <span>{t('location_open_maps')}</span>
            </a>
          </div>
        )}

      </div>
    </section>
  );
};
