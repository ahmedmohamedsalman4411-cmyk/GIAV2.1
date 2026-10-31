import React from 'react';
import { Home, Utensils, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface NotFoundPageProps {
  currentLang: SupportedLanguage;
  onGoHome: () => void;
  onGoMenu: () => void;
  onGoReservation: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  currentLang,
  onGoHome,
  onGoMenu,
  onGoReservation
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 px-4 bg-[#faf8f5]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/90 shadow-lg text-center space-y-6">
        
        <div className="w-16 h-16 rounded-full bg-amber-50 text-[#bc6c25] flex items-center justify-center mx-auto border-4 border-amber-100">
          <Utensils className="w-8 h-8" />
        </div>

        <div>
          <span className="font-serif text-5xl font-extrabold text-[#283618] block tracking-tight">
            404
          </span>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mt-2">
            {currentLang === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
          </h1>
          <p className="text-xs text-stone-600 mt-2 leading-relaxed font-light">
            {currentLang === 'ar'
              ? 'عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم تغيير رابطها. ندعوك للاستمتاع بقائمة طعامنا أو حجز طاولتك في جيا دبي.'
              : 'The page you requested could not be found. We invite you to explore our contemporary Italian menu or reserve your table overlooking the Dubai Fountain.'}
          </p>
        </div>

        {/* Logical Internal Navigation Links */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onGoHome}
            className="w-full py-3 bg-[#283618] hover:bg-[#1b2510] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t('nav_home')}</span>
          </button>

          <button
            onClick={onGoMenu}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Utensils className="w-4 h-4 text-stone-600" />
            <span>{t('nav_menu')}</span>
          </button>

          <button
            onClick={onGoReservation}
            className="w-full py-3 bg-[#bc6c25] hover:bg-[#a1581b] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Calendar className="w-4 h-4 text-amber-200" />
            <span>{t('nav_reserve')}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-400">
          GIA Restaurant · Fashion Avenue, The Dubai Mall
        </div>

      </div>
    </div>
  );
};
