import React from 'react';
import { MapPin, Navigation, Phone, Clock, Mail, ExternalLink, Instagram } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { SiteSettings } from '../types';

interface LocationSectionProps {
  currentLang: SupportedLanguage;
  settings?: SiteSettings;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  currentLang,
  settings
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const defaultMapsUrl = "https://www.google.com/maps/place/%D9%85%D8%B7%D8%B9%D9%85+%D8%AC%D9%8A%D8%A7%E2%80%AD/@25.1471314,55.2945414,12z/data=!4m10!1m2!2m1!1srestaurants+in+Dubai!3m6!1s0x3e5f6829dc6e8a3f:0x91a7a6821d362108!8m2!3d25.1971421!4d55.2759743!15sChRyZXN0YXVyYW50cyBpbiBEdWJhaVoWIhRyZXN0YXVyYW50cyBpbiBkdWJhaZIBEml0YWxpYW5fcmVzdGF1cmFudJoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQydE9TRmRzV2tWUFZtZDBUMWRHYUUweVpHaGlNalZhVkd0YVVHRnVZeEFC4AEA-gEECCwQRg!16s%2Fg%2F11gf0zxkng?entry=ttu&g_ep=EgoyMDI2MTAyNy4wIKXMDSoASAFQAw%3D%3D";
  const mapsUrl = settings?.googleMapsUrl || defaultMapsUrl;
  const address = currentLang === 'ar' ? (settings?.addressAr || settings?.address) : (settings?.address || 'The Dubai Mall, Fashion Avenue, Downtown Dubai');
  const weekdayHours = currentLang === 'ar' ? (settings?.openingHoursWeekdaysAr || settings?.openingHoursWeekdays) : settings?.openingHoursWeekdays;
  const weekendHours = currentLang === 'ar' ? (settings?.openingHoursWeekendsAr || settings?.openingHoursWeekends) : settings?.openingHoursWeekends;

  return (
    <section id="location-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#bc6c25] mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>The Dubai Mall</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            {t('location_title')}
          </h2>
          <p className="mt-2 text-stone-600 text-sm">
            {t('location_fountain_view')}
          </p>
        </div>

        {/* Content Layout: Contact/Hours Cards + Map Portal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Information Side (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Address Card */}
            <div className="bg-[#faf8f5] p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#283618] text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    {t('location_address_label')}
                  </h3>
                  <p className="font-serif text-base font-bold text-stone-900 mt-1 leading-snug">
                    {address}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Fashion Avenue, Ground / First Level Promenade, overlooking the Dubai Fountain.
                  </p>
                  
                  {/* Direct Google Maps Action */}
                  <div className="mt-4">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#bc6c25] hover:bg-[#9c571c] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{t('location_open_maps')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="bg-[#faf8f5] p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#bc6c25] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    {t('location_hours_label')}
                  </h3>
                  
                  <div className="mt-3 space-y-2 text-xs">
                    {weekdayHours && (
                      <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                        <span className="font-medium text-stone-700">Weekdays (Sun – Thu)</span>
                        <span className="font-bold text-stone-900 tabular-nums">{weekdayHours}</span>
                      </div>
                    )}
                    {weekendHours && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-medium text-stone-700">Weekends (Fri & Sat)</span>
                        <span className="font-bold text-stone-900 tabular-nums">{weekendHours}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Phone & Direct Contact */}
            <div className="bg-[#faf8f5] p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              {settings?.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#283618]" />
                    <span className="text-xs text-stone-600">Telephone:</span>
                  </div>
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="text-xs font-bold text-[#283618] hover:underline dir-ltr"
                  >
                    {settings.phone}
                  </a>
                </div>
              )}

              {settings?.whatsapp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-600">WhatsApp:</span>
                  </div>
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-800 hover:underline dir-ltr"
                  >
                    {settings.whatsapp}
                  </a>
                </div>
              )}

              {settings?.instagramUrl && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Instagram className="w-4 h-4 text-[#bc6c25]" />
                    <span className="text-xs text-stone-600">Instagram:</span>
                  </div>
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#bc6c25] hover:underline flex items-center gap-1"
                  >
                    <span>@gia.dubai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

          </div>

          {/* Interactive Map Showcase Card (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 flex flex-col relative min-h-[380px] shadow-sm">
            
            {/* Embedded Interactive Map Frame (centered at GIA Dubai Mall) */}
            <iframe
              title="GIA Restaurant Dubai Mall Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.1788730419293!2d55.2759743!3d25.1971421!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6829dc6e8a3f%3A0x91a7a6821d362108!2z2YXYt9i52YUg2KzZitin!5e0!3m2!1sen!2sae!4v1700000000000!5m2!1sen!2sae"
              className="w-full h-full min-h-[400px] border-0"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Floating Quick Action Overlay */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-stone-200 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-stone-900">GIA Restaurant Dubai</div>
                <div className="text-[11px] text-stone-500">Fashion Avenue, The Dubai Mall</div>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#283618] hover:bg-[#1b2610] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
