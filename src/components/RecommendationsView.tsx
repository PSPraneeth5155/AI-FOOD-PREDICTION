import React, { useState } from 'react';
import { UserProfile, NutrientGap, RecommendedFood } from '../types';
import { Sparkles, AlertCircle, Plus, Check, Filter, HeartHandshake } from 'lucide-react';

interface RecommendationsViewProps {
  user: UserProfile;
  gaps: NutrientGap[];
  recommendations: RecommendedFood[];
  onQuickAdd: (food: RecommendedFood) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  user,
  gaps,
  recommendations,
  onQuickAdd,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [addedFoodIds, setAddedFoodIds] = useState<string[]>([]);

  const handleAdd = (food: RecommendedFood) => {
    onQuickAdd(food);
    setAddedFoodIds((prev) => [...prev, food.id]);
    setTimeout(() => {
      setAddedFoodIds((prev) => prev.filter((id) => id !== food.id));
    }, 2500);
  };

  // Filter recommendations based on active selected filter
  const displayedRecs = recommendations.filter((rec) => {
    if (selectedFilter === 'protein') return rec.protein >= 12;
    if (selectedFilter === 'fiber') return rec.fiber >= 4;
    if (selectedFilter === 'low_sodium') return rec.sodium <= 100;
    if (selectedFilter === 'indian') {
      return (
        rec.dietTags.includes('South Indian') ||
        rec.dietTags.includes('North Indian') ||
        rec.dietTags.includes('Pan-Indian') ||
        rec.name.includes('Dal') ||
        rec.name.includes('Sambar') ||
        rec.name.includes('Paneer') ||
        rec.name.includes('Moong')
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-28 pt-3 px-4 max-w-md mx-auto">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Personalized Nutrition
        </span>
        <h1 className="text-base font-bold text-slate-900">Food Recommendations</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Healthy alternatives tailored to your dietary goals, allergies, and daily gaps.
        </p>
      </div>

      {/* ACTIVE NUTRIENT GAPS LIST */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Today's Nutritional Gaps
        </h2>

        {gaps.map((gap, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-xs space-y-1.5 ${
              gap.status === 'deficit'
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                : gap.status === 'excess'
                ? 'bg-rose-50/70 border-rose-200/80 text-rose-950'
                : 'bg-teal-50/70 border-teal-200/80 text-teal-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{gap.summary}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                {Math.round(gap.current)} / {Math.round(gap.target)} {gap.unit}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{gap.actionableTip}</p>
          </div>
        ))}
      </div>

      {/* FILTER PILLS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Recommendations' },
          { id: 'indian', label: '🇮🇳 Indian Staples' },
          { id: 'protein', label: 'High Protein' },
          { id: 'fiber', label: 'High Fiber' },
          { id: 'low_sodium', label: 'Heart & Low Sodium' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setSelectedFilter(btn.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === btn.id
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* SWIPEABLE / VERTICAL CARDS LIST */}
      <div className="space-y-3">
        {displayedRecs.map((rec) => {
          const isRecentlyAdded = addedFoodIds.includes(rec.id);

          return (
            <div
              key={rec.id}
              className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-xs space-y-3 transition-all hover:shadow-md"
            >
              <div className="flex items-start space-x-3.5">
                <img
                  src={rec.imageUrl}
                  alt={rec.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-xs"
                />

                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{rec.name}</span>
                  </div>

                  <p className="text-[11px] font-bold text-teal-700">{rec.highlightNutrient}</p>

                  <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                    {rec.healthBenefit}
                  </p>
                </div>
              </div>

              {/* Diet Tags & Nutrition Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1 flex-wrap gap-1">
                  {rec.dietTags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[9px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleAdd(rec)}
                  disabled={isRecentlyAdded}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 active:scale-95 transition-all shadow-xs ${
                    isRecentlyAdded
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-teal-700 hover:bg-teal-800 text-white'
                  }`}
                >
                  {isRecentlyAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Today</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
