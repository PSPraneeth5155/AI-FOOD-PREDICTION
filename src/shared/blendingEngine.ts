import {
  ConditionVariant,
  FoodItem,
  FoodSuitabilityResponse,
  NutrientVector12,
  RecommendationLabel,
  RiskLevel,
  SourceConfidence,
} from '../types';
import {
  MultiConditionScoringResult,
  mapScoreToRecommendationLabel,
  mapScoreToRiskLevel,
} from './ruleScoringEngine';

export const CURRENT_RULE_SET_VERSION_HASH = 'sha256:504_rules_v1.0.0';
export const CURRENT_ML_MODEL_VERSION = 'lgbm-onnx-v1.0.2';

/**
 * Authoritative Safety-Floor Blending Formula.
 * Enforces that ML model can personalize scores for safe foods (>=50),
 * but can NEVER upgrade an unsafe food (<50) into a higher recommendation band.
 */
export function blendRuleAndMlScore(
  ruleScore: number,
  mlScore?: number,
  hasDangerViolation: boolean = false
): {
  blendedScore: number;
  label: RecommendationLabel;
  riskLevel: RiskLevel;
} {
  // If no ML score provided, rule score is authoritative
  if (mlScore === undefined || isNaN(mlScore)) {
    const label = mapScoreToRecommendationLabel(ruleScore);
    const riskLevel = mapScoreToRiskLevel(ruleScore, hasDangerViolation);
    return { blendedScore: ruleScore, label, riskLevel };
  }

  let finalScore = ruleScore;

  if (hasDangerViolation || ruleScore < 30.0) {
    // Band 5: Avoid (<30). Zero ML override permitted.
    finalScore = ruleScore;
  } else if (ruleScore < 50.0) {
    // Band 4: Limit Intake (30.0 - 49.9).
    // ML can further penalize, but can NEVER promote above 49.9.
    const blended = 0.70 * ruleScore + 0.30 * mlScore;
    finalScore = Math.min(ruleScore, Math.min(49.9, blended));
  } else {
    // Bands 1-3: Moderation / Recommended / Highly Recommended (>= 50.0).
    finalScore = 0.65 * ruleScore + 0.35 * mlScore;
  }

  finalScore = Number(Math.max(0, Math.min(100, finalScore)).toFixed(1));
  const label = mapScoreToRecommendationLabel(finalScore);
  const riskLevel = mapScoreToRiskLevel(finalScore, hasDangerViolation);

  return { blendedScore: finalScore, label, riskLevel };
}

/**
 * Formats a complete production-grade FoodSuitabilityResponse payload
 * conforming to OpenAPI 3.1 and Doc 04 Section 4.2 specs.
 */
export function formatFoodSuitabilityResponse(
  foodItem: Partial<FoodItem> & { nutrients?: Partial<NutrientVector12>; servingGrams?: number },
  scoringResult: MultiConditionScoringResult,
  mlScore?: number,
  startTimeMs: number = Date.now()
): FoodSuitabilityResponse {
  const { blendedScore, label, riskLevel } = blendRuleAndMlScore(
    scoringResult.ruleEngineScore,
    mlScore,
    scoringResult.hasDangerViolation
  );

  const latencyMs = Math.max(1, Date.now() - startTimeMs);

  return {
    foodId: foodItem.id || 'custom-food',
    foodName: foodItem.name || 'Evaluated Dish',
    evaluatedPortionGrams: Number(foodItem.servingGrams || (foodItem as any).defaultServingGrams || 100),
    suitabilityScore: blendedScore,
    ruleEngineScore: scoringResult.ruleEngineScore,
    mlPredictedScore: mlScore !== undefined ? Number(mlScore.toFixed(1)) : undefined,
    recommendationLabel: label,
    riskLevel,
    recommendedPortionGrams: scoringResult.recommendedPortionGrams,
    recommendedHouseholdMeasure: scoringResult.recommendedHouseholdMeasure,
    bindingConditionVariant: scoringResult.bindingConditionVariant,
    sourceConfidence: scoringResult.sourceConfidence,
    topDrivers: scoringResult.topDrivers,
    allNutrientBreakdowns: scoringResult.allNutrientBreakdowns,
    ruleSetVersionHash: CURRENT_RULE_SET_VERSION_HASH,
    mlModelVersion: CURRENT_ML_MODEL_VERSION,
    latencyMs,
  };
}
