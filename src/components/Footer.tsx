import React from 'react';
import { MapPin, Phone, Mail, Instagram, Navigation, ShieldCheck, HeartHandshake } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { SiteSettings } from '../types';

interface FooterProps {
  currentLang: SupportedLanguage;
  settings?: SiteSettings;
  onOpenReservation: () => void;
  onOpenSupport: () => void;
  onOpenAdmin: () => void;
  onNavigate: (view: 'home' | 'menu', hash?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentLang,
  settings,
  onOpenReservation,
  onOpenSupport,
  onOpenAdmin,
  onNavigate
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800/80">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white block">
                GIA Restaurant
              </span>
              <span className="text-[10px] tracking-widest uppercase text-stone-400 font-medium block mt-0.5">
                Dubai Mall · Fashion Avenue
              </span>
            </div>
            
            <p className="text-xs text-stone-400 leading-relaxed font-light max-w-sm">
              {t('footer_tagline')}
            </p>

            <div className="text-xs text-stone-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#dda15e]" />
                <span>The Dubai Mall, Fashion Avenue (Dubai Fountain View)</span>
              </div>
            </div>

            {/* Emergency & Support button */}
            <div className="pt-2">
              <button
                onClick={onOpenSupport}
                className="px-3.5 py-2 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-200 hover:bg-amber-900/60 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <HeartHandshake className="w-4 h-4 text-[#bc6c25]" />
                <span>{t('support_title')}</span>
              </button>
            </div>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              {t('footer_quick_links')}
            </span>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav_home')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('menu')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav_menu')}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenReservation}
                  className="hover:text-[#dda15e] transition-colors font-semibold"
                >
                  {t('nav_reserve')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home', 'about-section')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav_about')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home', 'location-section')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav_location')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Hours (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              {t('location_hours_label')}
            </span>
            <div className="text-xs text-stone-400 space-y-2">
              <div>
                <span className="text-stone-300 block font-medium">Sunday – Thursday</span>
                <span>{settings?.openingHoursWeekdays || '10:00 AM – 12:00 AM'}</span>
              </div>
              <div>
                <span className="text-stone-300 block font-medium">Friday & Saturday</span>
                <span>{settings?.openingHoursWeekends || '10:00 AM – 01:00 AM'}</span>
              </div>
              <div className="pt-1 text-[#dda15e] text-[11px]">
                {t('location_fountain_view')}
              </div>
            </div>
          </div>

          {/* Direct Actions & Maps (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Directions & Booking
            </span>
            <p className="text-xs text-stone-400 font-light">
              Walk-ins welcome, reservations recommended for terrace fountain viewing tables.
            </p>
            {settings?.googleMapsUrl && (
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-stone-200 rounded-xl transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-[#dda15e]" />
                <span>{t('location_open_maps')}</span>
              </a>
            )}
            {settings?.phone && (
              <div className="pt-1">
                <a
                  href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                  className="text-xs font-mono font-bold text-stone-300 hover:text-white flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#283618]" />
                  <span className="dir-ltr">{settings.phone}</span>
                </a>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>{t('footer_rights')}</p>
          <div className="text-[11px] text-stone-600">
            The Dubai Mall · Fashion Avenue
          </div>
        </div>

      </div>
    </footer>
  );
};
