import { evaluateMultiCondition } from '../../src/shared/ruleScoringEngine';
import { formatFoodSuitabilityResponse } from '../../src/shared/blendingEngine';
import { getActiveClinicalRules, edgeCache } from '../../src/db/client';
import { predictMlSuitabilityScore } from '../../src/shared/onnxInferenceEngine';
import { ConditionVariant, FoodItem, NutrientVector12, UserProfile } from '../../src/types';

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
      userId,
      activeConditionVariants = [],
      mealType = 'lunch',
      foodItem,
      dailyRemainingBudget,
      mealsLoggedToday = 0,
      mlPredictedScore,
    } = req.body || {};

    if (!foodItem || (!foodItem.name && !foodItem.calories)) {
      res.status(400).json({ error: 'Missing required parameter: foodItem with nutrient values.' });
      return;
    }

    // 1. Fetch active 504 rules from Redis edge cache or seed fallback (<5ms)
    const activeRules = await getActiveClinicalRules();

    // 2. Evaluate food against active condition variants via deterministic rule engine
    const scoringResult = evaluateMultiCondition(foodItem, activeRules, activeConditionVariants as ConditionVariant[], {
      mealType,
      dailyRemainingBudget,
      mealsLoggedToday,
    });

    // 3. Compute ML predicted score via LightGBM ONNX model (or fallback) if not explicitly provided
    let effectiveMlScore = mlPredictedScore;
    if (effectiveMlScore === undefined) {
      let cachedProfile: UserProfile | null = null;
      if (userId) {
        cachedProfile = await edgeCache.get<UserProfile>(`profile:${userId}`);
      }
      const mlResult = await predictMlSuitabilityScore(
        cachedProfile || undefined,
        activeConditionVariants as ConditionVariant[],
        foodItem,
        dailyRemainingBudget
      );
      effectiveMlScore = mlResult.mlScore;
    }

    // 4. Blend rule score with ML score applying authoritative safety-floor rule
    const responsePayload = formatFoodSuitabilityResponse(
      foodItem,
      scoringResult,
      effectiveMlScore,
      startTime
    );

    res.status(200).json(responsePayload);
  } catch (err: any) {
    console.error('[/api/v1/score-food] Error:', err);
    res.status(500).json({
      error: 'Clinical scoring engine failure',
      message: err.message,
    });
  }
}
