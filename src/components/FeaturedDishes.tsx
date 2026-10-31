import React from 'react';
import { ArrowRight, ArrowLeft, Star, Leaf, Flame, Sparkles } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { MenuItem } from '../types';
import { DishSkeleton } from './DishSkeleton';

interface FeaturedDishesProps {
  currentLang: SupportedLanguage;
  menuItems: MenuItem[];
  onViewAllMenu: () => void;
  onOpenReservation: () => void;
}

export const FeaturedDishes: React.FC<FeaturedDishesProps> = ({
  currentLang,
  menuItems,
  onViewAllMenu,
  onOpenReservation
}) => {
  const t = (key: string) => TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  const isRtl = currentLang === 'ar';

  // Filter featured items or fallback to top 4 available
  const featured = menuItems.filter(item => item.isFeatured && item.isAvailable);
  const displayItems = featured.length > 0 ? featured : menuItems.filter(i => i.isAvailable).slice(0, 4);

  const getItemName = (item: MenuItem) => {
    return item.names[currentLang] || item.names['en'] || item.names['ar'] || Object.values(item.names)[0] || '';
  };

  const getItemDesc = (item: MenuItem) => {
    return item.descriptions[currentLang] || item.descriptions['en'] || item.descriptions['ar'] || Object.values(item.descriptions)[0] || '';
  };

  return (
    <section className="py-20 bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-stone-200">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#bc6c25] mb-2">
              {t('featured_kicker')}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              {t('featured_title')}
            </h2>
            <p className="mt-2 text-stone-600 text-sm max-w-xl">
              {t('featured_subtitle')}
            </p>
          </div>

          <button
            onClick={onViewAllMenu}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-[#283618] hover:text-[#1b2610] focus-visible:ring-2 focus-visible:ring-[#283618] focus-visible:outline-none rounded-lg px-2 py-1 transition-colors group cursor-pointer"
          >
            <span>{t('featured_view_all')}</span>
            {isRtl ? (
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </div>

        {/* Dishes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayItems.length === 0 ? (
            <>
              <DishSkeleton />
              <DishSkeleton />
              <DishSkeleton />
              <DishSkeleton />
            </>
          ) : displayItems.map((dish) => (
            <div
              key={dish.id}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Dish Image */}
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <img
                  src={dish.image}
                  alt={getItemName(dish)}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.src.includes('dish_burrata_pugliese')) {
                      el.src = '/images/dish_burrata_pugliese_1793363108448.jpg';
                    }
                  }}
                />

                {/* Unboxed Dietary Indicators */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  {dish.dietaryTags.includes('chef-special') && (
                    <span className="bg-stone-900/80 backdrop-blur-xs text-[#dda15e] text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-[#dda15e]" />
                      <span>{t('tag_chef_special')}</span>
                    </span>
                  )}
                  {dish.dietaryTags.includes('vegetarian') && (
                    <span className="bg-emerald-900/80 backdrop-blur-xs text-emerald-200 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs ml-auto">
                      <Leaf className="w-3 h-3" />
                      <span>{t('tag_vegetarian')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Category breadcrumb */}
                  <div className="text-[11px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">
                    {t(`cat_${dish.category}`) || dish.category}
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-[#283618] transition-colors line-clamp-1 mb-2">
                    {getItemName(dish)}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {getItemDesc(dish)}
                  </p>
                </div>

                {/* Price and CTA */}
                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-400 block -mb-0.5">{t('price_currency')}</span>
                    <span className="font-serif text-xl font-bold text-stone-900 tabular-nums">
                      {dish.price} <span className="text-xs font-sans text-stone-500">{dish.currency}</span>
                    </span>
                  </div>

                  <button
                    onClick={onOpenReservation}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#283618] hover:bg-stone-100 transition-colors"
                  >
                    {t('nav_reserve')}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
