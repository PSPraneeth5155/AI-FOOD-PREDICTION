import { evaluateMultiCondition } from '../../src/shared/ruleScoringEngine';
import { formatFoodSuitabilityResponse } from '../../src/shared/blendingEngine';
import { getActiveClinicalRules } from '../../src/db/client';
import { predictMlSuitabilityScore } from '../../src/shared/onnxInferenceEngine';
import { INDIAN_FOOD_DATABASE } from '../../src/data/indianFoodDb';
import { FOOD_DATABASE } from '../../src/data/nutritionDb';
import { ConditionVariant, FoodItem, NutrientVector12 } from '../../src/types';

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const {
      activeConditionVariants = [],
      mealType = 'lunch',
      cuisinePreference = 'any',
      dietaryPreference = 'any',
      dailyRemainingBudget,
      limit = 15,
      targetFoodToSubstitute,
      foodItems,
    } = req.body || {};

    const activeRules = await getActiveClinicalRules();

    // Pool of candidate foods: use passed foodItems or default to catalog
    let candidates = Array.isArray(foodItems) && foodItems.length > 0 ? [...foodItems] : [...FOOD_DATABASE];

    // Filter by dietary preference
    if (dietaryPreference === 'vegetarian') {
      candidates = candidates.filter(
        item => !item.category?.toLowerCase().includes('protein') || !item.name?.toLowerCase().includes('chicken') && !item.name?.toLowerCase().includes('salmon') && !item.name?.toLowerCase().includes('fish')
      );
    }

    // Filter by cuisine if specified
    if (cuisinePreference && cuisinePreference !== 'any') {
      const match = candidates.filter(item => item.cuisineRegion === cuisinePreference);
      if (match.length >= 5) {
        candidates = match;
      }
    }

    // Score candidates with deterministic clinical rules + LightGBM ONNX personalization
    const scoredCandidates = await Promise.all(
      candidates.map(async item => {
        const scoringResult = evaluateMultiCondition(item, activeRules, activeConditionVariants as ConditionVariant[], {
          mealType,
          dailyRemainingBudget,
        });

        const mlResult = await predictMlSuitabilityScore(
          undefined,
          activeConditionVariants as ConditionVariant[],
          item,
          dailyRemainingBudget
        );

        const response = formatFoodSuitabilityResponse(item, scoringResult, mlResult.mlScore, startTime);

        return {
          item,
          score: response.suitabilityScore,
          label: response.recommendationLabel,
          riskLevel: response.riskLevel,
          bindingCondition: response.bindingConditionVariant,
          topDrivers: response.topDrivers,
          recommendedPortionGrams: response.recommendedPortionGrams,
          recommendedHouseholdMeasure: response.recommendedHouseholdMeasure,
        };
      })
    );

    // Sort descending by suitability score
    scoredCandidates.sort((a, b) => b.score - a.score);

    const rankedFoods = scoredCandidates.slice(0, limit);

    // If a low-scoring food was provided for substitution, find smart regional swaps
    let substitutions: any[] = [];
    if (targetFoodToSubstitute) {
      const targetEval = evaluateMultiCondition(targetFoodToSubstitute, activeRules, activeConditionVariants as ConditionVariant[], {
        mealType,
      });

      if (targetEval.ruleEngineScore < 60) {
        // Find culturally matched dishes in same region with higher score
        const region = targetFoodToSubstitute.cuisineRegion || 'South Indian';
        const betterSwaps = scoredCandidates.filter(
          c => c.score >= 70 && (c.item.cuisineRegion === region || !c.item.cuisineRegion)
        );

        substitutions = betterSwaps.slice(0, 3).map(s => ({
          originalFood: targetFoodToSubstitute.name,
          originalScore: targetEval.ruleEngineScore,
          suggestedFood: s.item.name,
          suggestedScore: s.score,
          recommendationLabel: s.label,
          cuisineRegion: s.item.cuisineRegion,
          fiberDelta: Number(((s.item.fiber || 0) - (targetFoodToSubstitute.fiber || 0)).toFixed(1)),
          sodiumDelta: Math.round((s.item.sodium || 0) - (targetFoodToSubstitute.sodium || 0)),
          saturatedFatDelta: Number(((s.item.saturatedFat || 0) - (targetFoodToSubstitute.saturatedFat || 0)).toFixed(1)),
          reason: `Swapping to ${s.item.name} improves clinical suitability for ${s.bindingCondition} from ${targetEval.ruleEngineScore} to ${s.score}.`,
        }));
      }
    }

    res.status(200).json({
      success: true,
      totalCandidatesEvaluated: candidates.length,
      rankedFoods,
      substitutions,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('[/api/v1/rank-foods] Error:', err);
    res.status(500).json({
      error: 'Food ranking engine failure',
      message: err.message,
    });
  }
}
