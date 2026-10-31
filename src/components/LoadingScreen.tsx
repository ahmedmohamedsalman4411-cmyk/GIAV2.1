import React, { useState, useEffect } from 'react';
import { SupportedLanguage } from '../i18n/translations';

interface LoadingScreenProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  currentLang?: SupportedLanguage;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  error,
  onRetry,
  currentLang = 'ar'
}) => {
  const isRtl = currentLang === 'ar';
  const [showExtendedProgress, setShowExtendedProgress] = useState(false);

  // If loading takes more than 2 seconds, show extended progress info so user knows the app is actively loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && !error) {
      timer = setTimeout(() => {
        setShowExtendedProgress(true);
      }, 2000);
    } else {
      setShowExtendedProgress(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, error]);

  if (!isLoading && !error) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-[#faf8f5] flex flex-col items-center justify-center p-6 transition-opacity duration-300"
    >
      <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Strictly Text-Only Restaurant Name: GIA */}
        <div className="select-none">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-[0.25em] text-[#283618] uppercase">
            GIA
          </h1>
        </div>

        {/* Error State */}
        {error ? (
          <div className="space-y-4 pt-2">
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
              {currentLang === 'ar'
                ? 'تعذر تحميل بيانات المطعم، يُرجى التحقق من اتصال الإنترنت.'
                : 'Unable to connect to restaurant database. Please check your connection.'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-2.5 bg-[#283618] hover:bg-[#1a2410] active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {currentLang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </button>
            )}
          </div>
        ) : (
          /* Elegant Thin Circular Indicator */
          <div className="flex flex-col items-center space-y-4 pt-1">
            <div
              className="w-7 h-7 rounded-full border-[2px] border-stone-200 border-t-[#283618] animate-spin motion-reduce:animate-none"
              style={{ animationDuration: '1.2s' }}
            />

            {/* Extended progress indicator if network takes longer */}
            {showExtendedProgress && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                <span className="text-[11px] text-stone-500 font-medium block">
                  {currentLang === 'ar'
                    ? 'جاري تحضير قائمة الطعام الإيطالية...'
                    : 'Loading menu & dining experience...'}
                </span>
                <div className="w-32 h-1 bg-stone-200 rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-[#dda15e] rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
