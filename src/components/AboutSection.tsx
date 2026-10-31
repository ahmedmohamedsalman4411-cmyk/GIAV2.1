import React from 'react';
import { Sparkles, UtensilsCrossed, Award, Wine } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { SiteSettings } from '../types';

interface AboutSectionProps {
  currentLang: SupportedLanguage;
  settings?: SiteSettings;
  onOpenReservation: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  currentLang,
  settings,
  onOpenReservation
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const aboutText = settings?.aboutText?.[currentLang] || settings?.aboutText?.['en'] || settings?.aboutText?.['ar'] || t('about_p1');

  return (
    <section id="about-section" className="py-24 bg-stone-100/70 border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Story Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#bc6c25]">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>{t('about_kicker')}</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
              {t('about_title')}
            </h2>

            <div className="space-y-4 text-stone-700 text-base sm:text-lg leading-relaxed font-light">
              <p>{aboutText}</p>
              <p>{t('about_p2')}</p>
            </div>

            {/* Quality Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-stone-200">
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold text-[#283618]">D.O.P</span>
                <span className="text-xs font-medium text-stone-500 uppercase mt-1">Italian Ingredients</span>
                <span className="text-xs text-stone-600 mt-1">Directly sourced San Marzano tomatoes, olive oils & cheeses.</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold text-[#283618]">Fatto a Mano</span>
                <span className="text-xs font-medium text-stone-500 uppercase mt-1">Daily Fresh Pasta</span>
                <span className="text-xs text-stone-600 mt-1">Extruded and rolled fresh every morning by pasta artisans.</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold text-[#283618]">Terrazza</span>
                <span className="text-xs font-medium text-stone-500 uppercase mt-1">Fountain Vistas</span>
                <span className="text-xs text-stone-600 mt-1">Unrivalled front-row seats to the world-famous fountain show.</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={onOpenReservation}
                className="px-6 py-3 bg-[#283618] hover:bg-[#1b2610] text-[#faf8f5] text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>{t('nav_reserve')}</span>
              </button>
            </div>

          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-stone-200">
              <img
                src="/images/dish_burrata_pugliese_1793363108448.jpg"
                alt="Artisanal Burrata Pugliese at GIA Dubai"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (!el.src.includes('dish_burrata_pugliese')) {
                    el.src = '/images/dish_burrata_pugliese_1793363108448.jpg';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-xs tracking-widest uppercase text-[#dda15e] font-semibold">Artigianato Italiano</span>
                <h4 className="font-serif text-xl font-bold mt-1">Freshness in Every Single Bite</h4>
                <p className="text-xs text-stone-300 mt-1">Experience true modern Italian flair in Downtown Dubai.</p>
              </div>
            </div>

            {/* Overlapping floating badge */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#bc6c25]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">Contemporary Italian</div>
                <div className="text-[11px] text-stone-500">Dubai Mall, Fashion Ave</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
