import React, { useState, useEffect } from 'react';
import { UserProfile, NutrientGap, RecommendedFood, FoodItem, FoodSuitabilityResponse } from '../types';
import { INDIAN_FOOD_DATABASE } from '../data/indianFoodDb';
import { FOOD_DATABASE } from '../data/nutritionDb';
import { evaluateMultiCondition } from '../shared/ruleScoringEngine';
import { formatFoodSuitabilityResponse } from '../shared/blendingEngine';
import { predictMlSuitabilityScore } from '../shared/onnxInferenceEngine';
import { CLINICAL_RULES_SEED } from '../data/clinicalRulesSeed';
import { SuitabilityExplanationModal } from './SuitabilityExplanationModal';
import {
  Sparkles,
  AlertCircle,
  Plus,
  Check,
  Filter,
  HeartHandshake,
  ShieldCheck,
  Scale,
  RefreshCw,
  ArrowRight,
  Sliders,
} from 'lucide-react';

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
  const [rankedCatalog, setRankedCatalog] = useState<Array<{ item: FoodItem; suitability: FoodSuitabilityResponse }>>([]);
  const [selectedItemForXai, setSelectedItemForXai] = useState<{ item: FoodItem; suitability: FoodSuitabilityResponse } | null>(null);
  const [fillGapsMode, setFillGapsMode] = useState<boolean>(true);

  // Combine Indian and Western dishes
  const allFoods: FoodItem[] = [
    ...INDIAN_FOOD_DATABASE.map(f => ({
      id: f.id,
      name: f.name,
      category: f.category,
      cuisineRegion: f.cuisineRegion,
      portion: 'medium' as const,
      portionMultiplier: 1.0,
      servingDescription: f.servingDescription,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      saturatedFat: f.saturatedFat,
      fiber: f.fiber,
      sugar: f.sugar,
      sodium: f.sodium,
      cholesterol: f.cholesterol,
      potassium: f.potassium,
      calcium: f.calcium,
      iron: f.iron,
      isHighProtein: f.isHighProtein,
      glycemicIndexBand: f.glycemicIndexBand,
    })),
    ...FOOD_DATABASE.map((f, idx) => ({
      id: `usda-${idx + 1}`,
      name: f.name,
      category: f.category,
      cuisineRegion: 'Global' as const,
      portion: 'medium' as const,
      portionMultiplier: 1.0,
      servingDescription: f.servingDescription || '1 serving',
      calories: f.calories || 150,
      protein: f.protein || 5,
      carbs: f.carbs || 20,
      fat: f.fat || 5,
      saturatedFat: f.saturatedFat || 1.5,
      fiber: f.fiber || 2,
      sugar: f.sugar || 2,
      sodium: f.sodium || 150,
      cholesterol: f.cholesterol || 0,
      potassium: f.potassium || 200,
      calcium: f.calcium || 40,
      iron: f.iron || 1.2,
      isHighProtein: Boolean(f.isHighProtein),
      glycemicIndexBand: f.glycemicIndexBand || 'Medium',
    })),
  ];

  // Evaluate candidate foods with 504 rules and LightGBM ONNX model
  useEffect(() => {
    async function rankFoods() {
      const activeVariants = user.activeConditionVariants || [];
      const remainingBudget = user.targets;

      const scored = await Promise.all(
        allFoods.map(async food => {
          const evalResult = evaluateMultiCondition(food, CLINICAL_RULES_SEED, activeVariants, {
            mealType: 'lunch',
            dailyRemainingBudget: remainingBudget,
          });

          const mlResult = await predictMlSuitabilityScore(user, activeVariants, food, remainingBudget);
          const suitability = formatFoodSuitabilityResponse(food, evalResult, mlResult.mlScore);

          return { item: food, suitability };
        })
      );

      // Sort descending by blended clinical suitability score
      scored.sort((a, b) => b.suitability.suitabilityScore - a.suitability.suitabilityScore);
      setRankedCatalog(scored);
    }

    rankFoods();
  }, [user]);

  const handleAdd = (food: FoodItem) => {
    const recItem: RecommendedFood = {
      id: food.id,
      name: food.name,
      servingSize: food.servingDescription || '1 serving',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sodium: food.sodium,
      highlightNutrient: `${food.protein}g Protein &bull; ${food.fiber}g Fiber`,
      healthBenefit: 'Clinically balanced for your active conditions and daily targets.',
      dietTags: [food.cuisineRegion || 'Indian', food.category],
      allergens: [],
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    };
    onQuickAdd(recItem);
    setAddedFoodIds(prev => [...prev, food.id]);
    setTimeout(() => {
      setAddedFoodIds(prev => prev.filter(id => id !== food.id));
    }, 2500);
  };

  // Filter items
  const filteredRanked = rankedCatalog.filter(({ item, suitability }) => {
    if (fillGapsMode && suitability.suitabilityScore < 60) return false;
    if (selectedFilter === 'safe') return suitability.riskLevel === 'SAFE';
    if (selectedFilter === 'protein') return item.protein >= 12;
    if (selectedFilter === 'fiber') return item.fiber >= 4;
    if (selectedFilter === 'low_sodium') return item.sodium <= 180;
    if (selectedFilter === 'south_indian') return item.cuisineRegion === 'South Indian';
    if (selectedFilter === 'north_indian') return item.cuisineRegion === 'North Indian';
    return true;
  });

  return (
    <div className="space-y-5 pb-28 pt-3 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 504-Rule & LightGBM Personalized
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Clinical Food Recommendations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked specifically for your {user.activeConditionVariants?.length || 0} active clinical conditions.
          </p>
        </div>

        {/* Fill Gaps Toggle */}
        <button
          onClick={() => setFillGapsMode(!fillGapsMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            fillGapsMode
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {fillGapsMode ? '✓ Fills Gaps' : 'All Foods'}
        </button>
      </div>

      {/* TODAY'S NUTRITIONAL GAPS ACCORDION */}
      {gaps.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            Today's Clinical Gaps
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {gaps.slice(0, 2).map((gap, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all text-xs flex items-center justify-between ${
                  gap.status === 'deficit'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <div>
                  <span className="font-bold block">{gap.summary}</span>
                  <span className="text-[11px] text-slate-600">{gap.actionableTip}</span>
                </div>
                <span className="font-extrabold text-xs px-2 py-1 rounded-lg bg-white/80 border border-current shrink-0 ml-2">
                  {Math.round(gap.current)} / {Math.round(gap.target)} {gap.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REGIONAL HEALTHIER SUBSTITUTION CARD */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
            Smart Regional Substitution
          </span>
        </div>
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 text-xs">
          <div>
            <span className="text-slate-400 block line-through">Plain White Rice (160g)</span>
            <span className="font-bold text-slate-800">Swap to Moong Dal Sundal (180g)</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              +12g Protein &bull; +6g Fiber &bull; Lower Glycemic Load
            </span>
          </div>
          <span className="px-2 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800">
            Score: 88
          </span>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Ranked' },
          { id: 'safe', label: '🟢 Safe (Score 70+)' },
          { id: 'south_indian', label: 'South Indian' },
          { id: 'north_indian', label: 'North Indian' },
          { id: 'protein', label: 'High Protein (12g+)' },
          { id: 'fiber', label: 'High Fiber (4g+)' },
          { id: 'low_sodium', label: 'Heart & Low Sodium' },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setSelectedFilter(btn.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === btn.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* RANKED FOOD CARDS */}
      <div className="space-y-3">
        {filteredRanked.slice(0, 15).map(({ item, suitability }) => {
          const isRecentlyAdded = addedFoodIds.includes(item.id);
          const score = suitability.suitabilityScore;

          return (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3 transition-all hover:shadow-md"
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setSelectedItemForXai({ item, suitability })}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-extrabold text-slate-900">{item.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {item.cuisineRegion || 'Indian'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{item.servingDescription}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                    {item.calories} kcal &bull; {item.protein}g Protein &bull; {item.fiber}g Fiber &bull; {item.sodium}mg Sodium
                  </p>
                </div>

                {/* Score Pill */}
                <div className="text-right shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black inline-block ${
                      score >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : score >= 70
                        ? 'bg-teal-100 text-teal-800'
                        : score >= 50
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {Math.round(score)} / 100
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {suitability.recommendationLabel}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedItemForXai({ item, suitability })}
                  className="text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Sliders className="w-3.5 h-3.5" /> Why this score?
                </button>

                <button
                  onClick={() => handleAdd(item)}
                  disabled={isRecentlyAdded}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                    isRecentlyAdded
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {isRecentlyAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Added!
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Log Food
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* XAI Explanation Modal */}
      {selectedItemForXai && (
        <SuitabilityExplanationModal
          isOpen={Boolean(selectedItemForXai)}
          onClose={() => setSelectedItemForXai(null)}
          foodItem={selectedItemForXai.item}
          suitability={selectedItemForXai.suitability}
        />
      )}
    </div>
  );
};
