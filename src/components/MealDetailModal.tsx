import React from 'react';
import { LoggedMeal } from '../types';
import { X, Clock, Trash2, Scale, Flame, Check, Dumbbell } from 'lucide-react';
import { calculateProteinBreakdown } from '../data/nutritionDb';

interface MealDetailModalProps {
  meal: LoggedMeal;
  onClose: () => void;
  onDeleteMeal: (id: string) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  onClose,
  onDeleteMeal,
}) => {
  const proteinData = calculateProteinBreakdown(meal.actualItems);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header with image */}
        <div className="relative aspect-[16/10] w-full bg-slate-900">
          {meal.imageUrl ? (
            <img
              src={meal.imageUrl}
              alt={meal.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-teal-300 font-bold text-lg bg-slate-800">
              {meal.title}
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {meal.date} • {meal.time}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">{meal.title}</h3>
              <span className="text-xs text-slate-400 capitalize">{meal.mealType}</span>
            </div>

            <div className="text-right">
              <span className="text-base font-extrabold text-teal-700">
                {meal.totalCalories} kcal
              </span>
              {meal.leftoverPercent > 0 && (
                <p className="text-[10px] text-amber-700 font-semibold">
                  {100 - meal.leftoverPercent}% consumed
                </p>
              )}
            </div>
          </div>

          {/* Macro grid */}
          <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Protein</span>
              <p className="text-xs font-bold text-slate-900">{meal.totalProtein}g</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">Carbs</span>
              <p className="text-xs font-bold text-slate-900">{meal.totalCarbs}g</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">Fat</span>
              <p className="text-xs font-bold text-slate-900">{meal.totalFat}g</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">Fiber</span>
              <p className="text-xs font-bold text-slate-900">{meal.totalFiber}g</p>
            </div>
          </div>

          {/* Protein Breakdown Formula */}
          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-[11px] uppercase tracking-wider">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-700" />
              <span>Protein Calculation</span>
            </div>
            <p className="text-emerald-950 font-medium text-[11px] leading-relaxed">
              {proteinData.summarySentence}
            </p>
          </div>

          {/* Individual items list */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Consumed Food Items ({meal.actualItems.length})
            </span>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-white">
              {meal.actualItems.map((item, idx) => {
                const isHighProt = item.isHighProtein ?? (item.protein >= 8);
                return (
                  <div key={idx} className="py-2 px-1 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-slate-800">{item.name}</span>
                        {isHighProt && (
                          <span className="text-[8px] font-extrabold px-1 rounded-sm bg-emerald-100 text-emerald-800">
                            ⚡ High Protein
                          </span>
                        )}
                        {item.cuisineRegion && (
                          <span className="text-[8px] font-bold px-1 rounded-sm bg-amber-50 text-amber-800">
                            {item.cuisineRegion}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {item.portion} portion • {item.servingDescription}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{item.calories} kcal</span>
                      <div className="text-[10px] font-bold text-emerald-700">{item.protein}g P</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional: After-meal photo thumbnail if exists */}
          {meal.afterImageUrl && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-teal-50/70 border border-teal-100">
              <span className="text-xs font-bold text-teal-900 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-teal-700" />
                <span>Plate Finish Comparison</span>
              </span>
              <p className="text-[11px] text-teal-800">
                Leftover was estimated at {meal.leftoverPercent}%. Nutrition totals reflect actual
                consumption.
              </p>
            </div>
          )}

          {/* Delete Action */}
          <div className="pt-2">
            <button
              onClick={() => onDeleteMeal(meal.id)}
              className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border border-rose-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This Meal Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
