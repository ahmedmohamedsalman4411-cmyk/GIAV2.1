import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Utensils, ArrowRight, ArrowLeft } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { MenuItem } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  menuItems: MenuItem[];
  onSelectDish: (dish: MenuItem) => void;
  onNavigateToSecretAdmin: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  menuItems,
  onSelectDish,
  onNavigateToSecretAdmin
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Listen for Escape key to close modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Check for Secret Admin Navigation trigger in search
  // STRICT: Only triggers on the exact secret code "admin2026123456" (case-insensitive) or secret URL
  useEffect(() => {
    const clean = query.trim().toLowerCase();
    if (
      clean === 'admin2026123456' ||
      clean === '/admin/login/2026123456' ||
      clean === 'admin/login/2026123456'
    ) {
      setQuery('');
      onClose();
      onNavigateToSecretAdmin();
    }
  }, [query, onNavigateToSecretAdmin, onClose]);

  // Filter Dishes
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return menuItems.filter(item => {
      const name = (item.names[currentLang] || item.names['en'] || item.names['ar'] || '').toLowerCase();
      const desc = (item.descriptions[currentLang] || item.descriptions['en'] || item.descriptions['ar'] || '').toLowerCase();
      const cat = item.category.toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }, [query, menuItems, currentLang]);

  if (!isOpen) return null;

  const getItemName = (item: MenuItem) => {
    return item.names[currentLang] || item.names['en'] || item.names['ar'] || Object.values(item.names)[0] || '';
  };

  const getItemDesc = (item: MenuItem) => {
    return item.descriptions[currentLang] || item.descriptions['en'] || item.descriptions['ar'] || Object.values(item.descriptions)[0] || '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-start justify-center p-4 pt-20 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={currentLang === 'ar' ? 'ابحث عن أطباق، معكرونة، بيتزا أو مكونات...' : 'Search for dishes, pasta, pizza or ingredients...'}
            className="flex-1 bg-transparent text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {query.trim() === '' ? (
            <div className="py-10 text-center text-stone-400 text-xs">
              <Utensils className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p>
                {currentLang === 'ar' ? 'اكتب اسم الطبق أو نوعه للبحث الفوري' : 'Type a dish name or ingredient to search'}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              <p className="font-semibold text-stone-700">
                {currentLang === 'ar' ? 'لم يتم العثور على أطباق مطابقة' : 'No matching dishes found'}
              </p>
              <p className="text-stone-400 mt-1">
                {currentLang === 'ar' ? 'جرب البحث عن "ترافل" أو "بوراتا" أو "بيتزا"' : 'Try searching for "truffle", "burrata" or "pizza"'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2">
                {results.length} {currentLang === 'ar' ? 'نتائج مطابقة' : 'dishes found'}
              </div>

              {results.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => {
                    onSelectDish(dish);
                    onClose();
                  }}
                  className="p-3 rounded-2xl hover:bg-stone-50 border border-stone-100 hover:border-stone-200 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={dish.image}
                      alt={getItemName(dish)}
                      className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium uppercase text-stone-400 tracking-wider">
                        {t(`cat_${dish.category}`) || dish.category}
                      </div>
                      <h4 className="font-serif text-sm font-bold text-stone-900 group-hover:text-[#283618] transition-colors truncate">
                        {getItemName(dish)}
                      </h4>
                      <p className="text-xs text-stone-500 truncate max-w-sm">
                        {getItemDesc(dish)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left shrink-0">
                    <span className="font-serif text-base font-bold text-stone-900 tabular-nums">
                      {dish.price} <span className="text-[11px] font-sans text-stone-500">{dish.currency}</span>
                    </span>
                    <div className="text-[10px] text-[#283618] font-semibold flex items-center gap-1 justify-end rtl:justify-start mt-0.5">
                      <span>{currentLang === 'ar' ? 'عرض في القائمة' : 'View'}</span>
                      {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
