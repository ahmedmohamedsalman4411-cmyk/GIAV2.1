import React, { useState, useMemo } from 'react';
import { Search, Filter, Leaf, Flame, Star, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { MenuItem } from '../types';
import { DishSkeletonGrid } from './DishSkeleton';
import { getAssetUrl } from '../utils/assetUrl';

interface MenuPageProps {
  currentLang: SupportedLanguage;
  menuItems: MenuItem[];
  isLoading?: boolean;
  onOpenReservation: () => void;
  onTriggerAdmin?: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({
  currentLang,
  menuItems,
  isLoading = false,
  onOpenReservation,
  onTriggerAdmin
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');

  // Secret admin access trigger via menu search
  // STRICT: Only triggers on the exact secret code "admin2026123456" (case-insensitive) or secret URL
  React.useEffect(() => {
    const clean = searchQuery.trim().toLowerCase();
    if (
      clean === 'admin2026123456' ||
      clean === '/admin/login/2026123456' ||
      clean === 'admin/login/2026123456'
    ) {
      setSearchQuery('');
      onTriggerAdmin?.();
    }
  }, [searchQuery, onTriggerAdmin]);

  const categories = [
    { id: 'all', labelKey: 'cat_all' },
    { id: 'antipasti', labelKey: 'cat_antipasti' },
    { id: 'insalate', labelKey: 'cat_insalate' },
    { id: 'pasta', labelKey: 'cat_pasta' },
    { id: 'pizza', labelKey: 'cat_pizza' },
    { id: 'secondi', labelKey: 'cat_secondi' },
    { id: 'dolci', labelKey: 'cat_dolci' },
    { id: 'bevande', labelKey: 'cat_bevande' },
  ];

  const getItemName = (item: MenuItem) => {
    return item.names[currentLang] || item.names['en'] || item.names['ar'] || Object.values(item.names)[0] || '';
  };

  const getItemDesc = (item: MenuItem) => {
    return item.descriptions[currentLang] || item.descriptions['en'] || item.descriptions['ar'] || Object.values(item.descriptions)[0] || '';
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Dietary filter
      if (selectedDietary !== 'all' && !item.dietaryTags.includes(selectedDietary)) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = getItemName(item).toLowerCase().includes(query);
        const descMatch = getItemDesc(item).toLowerCase().includes(query);
        const tagMatch = item.dietaryTags.some(t => t.toLowerCase().includes(query));
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }
      return true;
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [menuItems, selectedCategory, selectedDietary, searchQuery, currentLang]);

  return (
    <div className="py-12 bg-[#faf8f5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#bc6c25] block mb-2">
            La Cucina Italiana
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight">
            {t('nav_menu')}
          </h1>
          <p className="mt-3 text-stone-600 text-sm max-w-xl mx-auto leading-relaxed">
            {currentLang === 'ar' 
              ? 'أطباق طازجة محضرة بأجود المكونات الإيطالية الأصلية، مع الحفاظ على أعلى معايير الجودة والطهي الإيطالي المعاصر.'
              : 'Freshly crafted Italian specialties prepared with DOP certified ingredients, celebrating contemporary Italian culinary excellence.'}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs mb-10 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#283618] focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 font-semibold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dietary Tags Segmented Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedDietary('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDietary === 'all'
                    ? 'bg-[#283618] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Dietary
              </button>
              <button
                onClick={() => setSelectedDietary('vegetarian')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDietary === 'vegetarian'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Leaf className="w-3 h-3" />
                <span>{t('tag_vegetarian')}</span>
              </button>
              <button
                onClick={() => setSelectedDietary('gluten-free')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDietary === 'gluten-free'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>{t('tag_gluten_free')}</span>
              </button>
              <button
                onClick={() => setSelectedDietary('chef-special')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDietary === 'chef-special'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                }`}
              >
                <Star className="w-3 h-3 text-[#dda15e]" />
                <span>{t('tag_chef_special')}</span>
              </button>
            </div>

          </div>

          {/* Category Tabs (Interactive Filter Controls) */}
          <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-stone-100 no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#283618] text-[#faf8f5] shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {t(cat.labelKey)}
                </button>
              );
            })}
          </div>

        </div>

        {/* Loading Skeleton State */}
        {(isLoading || (menuItems.length === 0 && !searchQuery)) ? (
          <DishSkeletonGrid count={6} />
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 p-8 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">
              {currentLang === 'ar' ? 'لم يتم العثور على أطباق مطابقة' : 'No dishes found'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {currentLang === 'ar'
                ? 'جرب تغيير كلمة البحث أو فلاتر المكونات.'
                : 'Try adjusting your search query or selected dietary filters.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDietary('all');
              }}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 rounded-lg cursor-pointer"
            >
              {currentLang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          /* Menu Items Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((dish) => (
            <div
              key={dish.id}
              className={`bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                !dish.isAvailable ? 'opacity-70 grayscale-20' : ''
              }`}
            >
              <div>
                {/* Image */}
                <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                  <img
                    src={getAssetUrl(dish.image)}
                    alt={getItemName(dish)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (!el.src.includes('dish_burrata_pugliese')) {
                        el.src = getAssetUrl('/images/dish_burrata_pugliese_1793363108448.jpg');
                      }
                    }}
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {dish.dietaryTags.includes('chef-special') && (
                        <span className="bg-stone-950/80 backdrop-blur-xs text-[#dda15e] text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-[#dda15e]" />
                          <span>{t('tag_chef_special')}</span>
                        </span>
                      )}
                      {dish.dietaryTags.includes('vegetarian') && (
                        <span className="bg-emerald-950/80 backdrop-blur-xs text-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <Leaf className="w-2.5 h-2.5" />
                          <span>{t('tag_vegetarian')}</span>
                        </span>
                      )}
                    </div>

                    {!dish.isAvailable && (
                      <span className="bg-rose-900/90 text-rose-100 text-[10px] font-bold px-2 py-0.5 rounded ml-auto">
                        {t('badge_unavailable')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">
                    {t(`cat_${dish.category}`) || dish.category}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 mb-2 leading-snug">
                    {getItemName(dish)}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    {getItemDesc(dish) || 'Hand-crafted with premium Italian ingredients.'}
                  </p>
                </div>
              </div>

              {/* Price Row */}
              <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block tracking-wider">
                    {t('price_currency')}
                  </span>
                  <span className="font-serif text-xl font-bold text-stone-900 tabular-nums">
                    {dish.price} <span className="text-xs font-sans font-medium text-stone-500">{dish.currency}</span>
                  </span>
                </div>

                <button
                  onClick={onOpenReservation}
                  className="px-3.5 py-1.5 bg-[#283618] hover:bg-[#1a2410] text-[#faf8f5] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Calendar className="w-3 h-3" />
                  <span>{t('nav_reserve')}</span>
                </button>
              </div>

            </div>
          ))}
        </div>
        )}

      </div>
    </div>
  );
};
