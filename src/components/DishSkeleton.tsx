import React from 'react';

export const DishSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs flex flex-col justify-between animate-pulse motion-reduce:animate-none">
      <div>
        {/* Image skeleton */}
        <div className="h-48 sm:h-52 bg-stone-200/70 relative">
          <div className="absolute top-3 right-3 w-16 h-5 rounded-full bg-stone-300/60" />
        </div>

        {/* Content skeleton */}
        <div className="p-5 space-y-3">
          <div className="w-20 h-3 bg-stone-200 rounded-md" />
          <div className="w-3/4 h-5 bg-stone-200 rounded-md" />
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-3 bg-stone-200/80 rounded" />
            <div className="w-2/3 h-3 bg-stone-200/80 rounded" />
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-between mt-2">
        <div className="w-16 h-6 bg-stone-200 rounded-md" />
        <div className="w-24 h-8 bg-stone-200 rounded-xl" />
      </div>
    </div>
  );
};

export const DishSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <DishSkeleton key={i} />
      ))}
    </div>
  );
};
