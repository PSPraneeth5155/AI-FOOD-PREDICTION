import {
  ClinicalSuitabilityRule,
  ConditionVariant,
  FoodItem,
  NutrientDriverExplanation,
  NutrientVector12,
  RecommendationLabel,
  RiskLevel,
  SourceConfidence,
} from '../types';
import { CLINICAL_RULES_SEED, getClinicalRule, getRulesForVariant } from '../data/clinicalRulesSeed';
import { CONDITION_VARIANT_METADATA } from './conditionStagingResolver';

export interface EvaluationOptions {
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dailyRemainingBudget?: Partial<Record<keyof NutrientVector12, number>>;
  mealsLoggedToday?: number;
}

export interface SingleNutrientEvaluation {
  nutrient: keyof NutrientVector12;
  direction: 'LIMITING' | 'BENEFICIAL';
  foodValue: number;
  unit: 'kcal' | 'g' | 'mg';
  subScore: number; // 0 - 100
  safeOrRequiredThreshold: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'OPTIMAL_BENEFIT' | 'DEFICIT';
  normalizedWeight: number;
  conditionVariant: ConditionVariant;
  sourceBasis: SourceConfidence;
  guidelineOrganization?: string;
  guidelineCitation?: string;
  humanReadableReason: string;
}

export interface MultiConditionScoringResult {
  ruleEngineScore: number; // 0 - 100
  rawRuleScore: number;
  recommendationLabel: RecommendationLabel;
  riskLevel: RiskLevel;
  recommendedPortionGrams: number;
  recommendedHouseholdMeasure: string;
  bindingConditionVariant: ConditionVariant;
  sourceConfidence: SourceConfidence;
  topDrivers: NutrientDriverExplanation[];
  allNutrientBreakdowns: NutrientDriverExplanation[];
  hasDangerViolation: boolean;
  hasWarningViolation: boolean;
}

/**
 * Extracts a normalized 12-nutrient vector from a FoodItem.
 */
export function extractNutrientVector(food: Partial<FoodItem> & { nutrients?: Partial<NutrientVector12> }): NutrientVector12 {
  const n = food.nutrients || {};
  return {
    calories: Number(food.calories ?? n.calories ?? 0),
    protein: Number(food.protein ?? n.protein ?? 0),
    carbs: Number(food.carbs ?? n.carbs ?? 0),
    fiber: Number(food.fiber ?? n.fiber ?? 0),
    sugar: Number(food.sugar ?? n.sugar ?? 0),
    totalFat: Number(food.fat ?? n.totalFat ?? 0),
    saturatedFat: Number(food.saturatedFat ?? n.saturatedFat ?? 0),
    sodium: Number(food.sodium ?? n.sodium ?? 0),
    cholesterol: Number(food.cholesterol ?? n.cholesterol ?? 0),
    potassium: Number(food.potassium ?? n.potassium ?? 0),
    calcium: Number(food.calcium ?? n.calcium ?? 0),
    iron: Number(food.iron ?? n.iron ?? 0),
  };
}

/**
 * Evaluates a single nutrient against a specific clinical rule.
 */
export function evaluateSingleNutrient(
  foodValue: number,
  rule: ClinicalSuitabilityRule,
  options?: EvaluationOptions
): SingleNutrientEvaluation {
  const nutrient = rule.nutrientName;
  const unit = rule.nutrientUnit;
  const isSnack = options?.mealType === 'snack';
  const snackFactor = isSnack ? 0.45 : 1.0;

  if (rule.ruleDirection === 'LIMITING') {
    let safeThresh = (rule.safeThreshold ?? 100) * snackFactor;
    let warnThresh = (rule.warningThreshold ?? safeThresh * 1.3) * snackFactor;
    let dangerThresh = (rule.dangerThreshold ?? safeThresh * 1.7) * snackFactor;

    // Adjust for live daily remaining budget if provided
    if (options?.dailyRemainingBudget && options.dailyRemainingBudget[nutrient] !== undefined) {
      const remainingMeals = Math.max(1, 3 - (options.mealsLoggedToday ?? 0));
      const budgetSafe = Math.max(0, (options.dailyRemainingBudget[nutrient] ?? safeThresh) / remainingMeals);
      if (budgetSafe > 0) {
        safeThresh = Math.min(safeThresh, budgetSafe);
        warnThresh = safeThresh * 1.25;
        dangerThresh = safeThresh * 1.6;
      }
    }

    let subScore = 100.0;
    let status: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';

    if (foodValue <= safeThresh) {
      subScore = 100.0;
      status = 'SAFE';
    } else {
      subScore = Math.min(100.0, (safeThresh / Math.max(0.01, foodValue)) * 100.0);
      status = 'WARNING';
    }

    if (dangerThresh && foodValue >= dangerThresh) {
      subScore = Math.min(subScore, 25.0);
      status = 'DANGER';
    } else if (warnThresh && foodValue >= warnThresh) {
      status = 'WARNING';
    }

    // Explanatory reasoning
    let reason = '';
    const diffPct = safeThresh > 0 ? Math.round(((foodValue - safeThresh) / safeThresh) * 100) : 0;
    if (status === 'DANGER') {
      reason = `${foodValue} ${unit} ${nutrient} severely exceeds your ${Math.round(safeThresh)} ${unit} safe ceiling by ${diffPct}%.`;
    } else if (status === 'WARNING') {
      reason = `${foodValue} ${unit} ${nutrient} exceeds your ${Math.round(safeThresh)} ${unit} per-meal limit by ${diffPct}%.`;
    } else {
      reason = `${foodValue} ${unit} ${nutrient} is within your clinically safe limit of ${Math.round(safeThresh)} ${unit}.`;
    }

    return {
      nutrient,
      direction: 'LIMITING',
      foodValue,
      unit,
      subScore: Number(subScore.toFixed(1)),
      safeOrRequiredThreshold: Number(safeThresh.toFixed(1)),
      warningThreshold: warnThresh ? Number(warnThresh.toFixed(1)) : undefined,
      dangerThreshold: dangerThresh ? Number(dangerThresh.toFixed(1)) : undefined,
      status,
      normalizedWeight: rule.normalizedWeight,
      conditionVariant: rule.conditionVariant,
      sourceBasis: rule.sourceBasis,
      guidelineOrganization: rule.guidelineOrganization,
      guidelineCitation: rule.guidelineCitationText,
      humanReadableReason: reason,
    };
  } else {
    // BENEFICIAL
    const reqTarget = (rule.requiredTarget ?? 10) * snackFactor;
    const subScore = Math.min(100.0, (foodValue / Math.max(0.01, reqTarget)) * 100.0);
    const status: 'OPTIMAL_BENEFIT' | 'SAFE' | 'DEFICIT' =
      subScore >= 100.0 ? 'OPTIMAL_BENEFIT' : subScore >= 70.0 ? 'SAFE' : 'DEFICIT';

    const pctOfTarget = Math.round((foodValue / Math.max(0.01, reqTarget)) * 100);
    const reason = `${foodValue} ${unit} ${nutrient} provides ${pctOfTarget}% of your ${Math.round(reqTarget)} ${unit} beneficial target.`;

    return {
      nutrient,
      direction: 'BENEFICIAL',
      foodValue,
      unit,
      subScore: Number(subScore.toFixed(1)),
      safeOrRequiredThreshold: Number(reqTarget.toFixed(1)),
      status,
      normalizedWeight: rule.normalizedWeight,
      conditionVariant: rule.conditionVariant,
      sourceBasis: rule.sourceBasis,
      guidelineOrganization: rule.guidelineOrganization,
      guidelineCitation: rule.guidelineCitationText,
      humanReadableReason: reason,
    };
  }
}

/**
 * Calculates clinically safe recommended portion size (in grams)
 * using the Limiting Ceiling / Beneficial Floor optimization formula.
 */
export function calculatePortionOptimization(
  foodItem: Partial<FoodItem> & { nutrients?: Partial<NutrientVector12>; servingGrams?: number },
  rules: ClinicalSuitabilityRule[],
  activeVariants: ConditionVariant[],
  options?: EvaluationOptions
): {
  recommendedPortionGrams: number;
  recommendedHouseholdMeasure: string;
} {
  const nutrients = extractNutrientVector(foodItem);
  const defaultServing = Number(foodItem.servingGrams || (foodItem as any).defaultServingGrams || 100);

  let gMaxSafe = Infinity;
  let gMinBeneficial = 0;

  for (const variant of activeVariants) {
    const variantRules = getRulesForVariant(variant);
    for (const rule of variantRules) {
      const val = nutrients[rule.nutrientName];
      if (val <= 0) continue;

      if (rule.ruleDirection === 'LIMITING' && rule.safeThreshold) {
        const allowed = defaultServing * (rule.safeThreshold / val);
        if (allowed < gMaxSafe) {
          gMaxSafe = allowed;
        }
      } else if (rule.ruleDirection === 'BENEFICIAL' && rule.requiredTarget && rule.normalizedWeight >= 0.15) {
        const desired = defaultServing * (rule.requiredTarget / val);
        if (desired > gMinBeneficial) {
          gMinBeneficial = desired;
        }
      }
    }
  }

  if (gMaxSafe === Infinity) gMaxSafe = defaultServing;
  gMinBeneficial = Math.min(2.0 * defaultServing, gMinBeneficial);

  // If even a 25g bite breaches danger threshold, avoid entirely
  if (gMaxSafe < 25) {
    return {
      recommendedPortionGrams: 0,
      recommendedHouseholdMeasure: 'Avoid (portion exceeds safety ceiling)',
    };
  }

  // Clinical safety ceilings can never be breached to chase a beneficial floor
  const targetGrams = Math.min(gMaxSafe, Math.max(defaultServing, gMinBeneficial));
  const finalGrams = Math.round(Math.max(15, Math.min(450, targetGrams)));

  // Generate household description
  const ratio = finalGrams / defaultServing;
  let household = `${finalGrams}g`;
  if (foodItem.servingDescription) {
    if (Math.abs(ratio - 1.0) < 0.1) {
      household = `${foodItem.servingDescription} (${finalGrams}g)`;
    } else if (ratio < 0.75) {
      household = `~${Number(ratio.toFixed(1))}x serving (${finalGrams}g)`;
    } else {
      household = `${Number(ratio.toFixed(1))}x serving (${finalGrams}g)`;
    }
  }

  return {
    recommendedPortionGrams: finalGrams,
    recommendedHouseholdMeasure: household,
  };
}

/**
 * Maps a numeric score (0-100) to its 5-band clinical recommendation label.
 */
export function mapScoreToRecommendationLabel(score: number): RecommendationLabel {
  if (score >= 85.0) return 'Highly Recommended';
  if (score >= 70.0) return 'Recommended';
  if (score >= 50.0) return 'Consume in Moderation';
  if (score >= 30.0) return 'Limit Intake';
  return 'Avoid';
}

/**
 * Maps a numeric score to its risk level.
 */
export function mapScoreToRiskLevel(score: number, hasDangerViolation: boolean = false): RiskLevel {
  if (hasDangerViolation || score < 30.0) return 'DANGER';
  if (score < 50.0) return 'WARNING';
  if (score < 70.0) return 'MODERATE';
  return 'SAFE';
}

/**
 * Primary Multi-Condition Deterministic Clinical Scoring Engine.
 * Evaluates any food against 1..N active condition variants.
 */
export function evaluateMultiCondition(
  foodItem: Partial<FoodItem> & { nutrients?: Partial<NutrientVector12>; servingGrams?: number },
  rulesSeed: ClinicalSuitabilityRule[] = CLINICAL_RULES_SEED,
  activeVariants: ConditionVariant[] = [],
  options?: EvaluationOptions
): MultiConditionScoringResult {
  const nutrients = extractNutrientVector(foodItem);

  // If user has zero active clinical variants, use general wellness baseline (Controlled T2D or HTN Stage 1 with 0.8 weight)
  const variantsToEvaluate: ConditionVariant[] =
    activeVariants.length > 0 ? activeVariants : ['HTN_ELEVATED'];

  // Collect evaluations per nutrient across all conditions
  const nutrientEvalMap: Record<keyof NutrientVector12, SingleNutrientEvaluation[]> = {
    calories: [],
    protein: [],
    carbs: [],
    fiber: [],
    sugar: [],
    totalFat: [],
    saturatedFat: [],
    sodium: [],
    cholesterol: [],
    potassium: [],
    calcium: [],
    iron: [],
  };

  let hasDangerViolation = false;
  let hasWarningViolation = false;
  let lowestWeightedSubScore = Infinity;
  let bindingCondition: ConditionVariant = variantsToEvaluate[0];

  for (const variant of variantsToEvaluate) {
    const rules = getRulesForVariant(variant);
    for (const rule of rules) {
      const foodVal = nutrients[rule.nutrientName];
      const evaluation = evaluateSingleNutrient(foodVal, rule, options);

      nutrientEvalMap[rule.nutrientName].push(evaluation);

      if (evaluation.status === 'DANGER') {
        hasDangerViolation = true;
      }
      if (evaluation.status === 'WARNING') {
        hasWarningViolation = true;
      }

      // Check binding condition driver
      if (evaluation.direction === 'LIMITING') {
        const weightedScore = evaluation.subScore * rule.normalizedWeight;
        if (weightedScore < lowestWeightedSubScore || evaluation.status === 'DANGER') {
          lowestWeightedSubScore = weightedScore;
          bindingCondition = variant;
        }
      }
    }
  }

  // Multi-condition combination:
  // 1. Safety Precedence Rule: If any condition marks a nutrient LIMITING with DANGER/WARNING, limiting dominates.
  // 2. Strictest-Nutrient-Wins for limiting subscores.
  // 3. Severity-weighted normalized blend for weight vector W_comb.

  const effectiveScores: Record<keyof NutrientVector12, number> = {} as any;
  const combinedWeights: Record<keyof NutrientVector12, number> = {} as any;
  const bestDrivers: SingleNutrientEvaluation[] = [];

  let totalWeightedNumeratorSum = 0;
  const NUTRIENT_KEYS = Object.keys(nutrientEvalMap) as (keyof NutrientVector12)[];

  for (const n of NUTRIENT_KEYS) {
    const evals = nutrientEvalMap[n];
    if (evals.length === 0) {
      effectiveScores[n] = 100.0;
      combinedWeights[n] = 0;
      continue;
    }

    const hasLimiting = evals.some(e => e.direction === 'LIMITING');
    if (hasLimiting) {
      const limitingEvals = evals.filter(e => e.direction === 'LIMITING');
      let minScore = 100.0;
      let worstEval = limitingEvals[0];

      for (const e of limitingEvals) {
        if (e.subScore < minScore) {
          minScore = e.subScore;
          worstEval = e;
        }
      }
      effectiveScores[n] = minScore;
      bestDrivers.push(worstEval);
    } else {
      // Purely beneficial
      let maxScore = 0;
      let bestBeneficialEval = evals[0];
      for (const e of evals) {
        if (e.subScore > maxScore) {
          maxScore = e.subScore;
          bestBeneficialEval = e;
        }
      }
      effectiveScores[n] = maxScore;
      bestDrivers.push(bestBeneficialEval);
    }

    // Calculate numerator for combined weight
    let nWeightedSum = 0;
    for (const e of evals) {
      const meta = CONDITION_VARIANT_METADATA[e.conditionVariant];
      const severity = meta?.severityStage ? meta.severityStage * 0.4 + 0.6 : 1.0;
      nWeightedSum += severity * e.normalizedWeight;
    }
    combinedWeights[n] = nWeightedSum;
    totalWeightedNumeratorSum += nWeightedSum;
  }

  // Normalize combined weights so sum = 1.0000
  for (const n of NUTRIENT_KEYS) {
    combinedWeights[n] =
      totalWeightedNumeratorSum > 0 ? combinedWeights[n] / totalWeightedNumeratorSum : 1 / 12;
  }

  // Compute Raw Rule Score
  let rawRuleScore = 0;
  for (const n of NUTRIENT_KEYS) {
    rawRuleScore += combinedWeights[n] * effectiveScores[n];
  }
  rawRuleScore = Number(rawRuleScore.toFixed(1));

  // Safety-Floor Clamping
  let clampedScore = rawRuleScore;
  let hasCriticalDanger = false;
  let hasCriticalWarning = false;

  for (const n of NUTRIENT_KEYS) {
    const evals = nutrientEvalMap[n];
    for (const e of evals) {
      if (e.direction === 'LIMITING') {
        if (e.status === 'DANGER' && combinedWeights[n] >= 0.08) {
          hasCriticalDanger = true;
          bindingCondition = e.conditionVariant;
        } else if (e.status === 'WARNING' && combinedWeights[n] >= 0.10) {
          hasCriticalWarning = true;
        }
      }
    }
  }

  if (hasCriticalDanger) {
    clampedScore = Math.min(clampedScore, 29.0);
  } else if (hasCriticalWarning) {
    clampedScore = Math.min(clampedScore, 49.0);
  }

  clampedScore = Number(Math.max(0, Math.min(100, clampedScore)).toFixed(1));

  const recommendationLabel = mapScoreToRecommendationLabel(clampedScore);
  const riskLevel = mapScoreToRiskLevel(clampedScore, hasCriticalDanger);

  // Portion optimization
  const portionResult = calculatePortionOptimization(foodItem, rulesSeed, variantsToEvaluate, options);

  // Determine top 2-3 driving nutrients
  // Sort priority: DANGER first, then WARNING, then highest combined weight
  bestDrivers.sort((a, b) => {
    const priority = (st: string) => (st === 'DANGER' ? 3 : st === 'WARNING' ? 2 : st === 'DEFICIT' ? 1 : 0);
    const pDiff = priority(b.status) - priority(a.status);
    if (pDiff !== 0) return pDiff;
    const wDiff = (combinedWeights[b.nutrient] || 0) - (combinedWeights[a.nutrient] || 0);
    return wDiff;
  });

  const topDrivers: NutrientDriverExplanation[] = bestDrivers.slice(0, 3).map(d => ({
    nutrient: d.nutrient,
    direction: d.direction,
    foodValue: d.foodValue,
    unit: d.unit,
    safeOrRequiredThreshold: d.safeOrRequiredThreshold,
    warningThreshold: d.warningThreshold,
    dangerThreshold: d.dangerThreshold,
    subScore: d.subScore,
    normalizedWeight: Number((combinedWeights[d.nutrient] || d.normalizedWeight).toFixed(3)),
    status: d.status,
    conditionVariant: d.conditionVariant,
    sourceBasis: d.sourceBasis,
    guidelineOrganization: d.guidelineOrganization,
    guidelineCitation: d.guidelineCitation,
    humanReadableReason: d.humanReadableReason,
  }));

  const allNutrientBreakdowns: NutrientDriverExplanation[] = bestDrivers.map(d => ({
    nutrient: d.nutrient,
    direction: d.direction,
    foodValue: d.foodValue,
    unit: d.unit,
    safeOrRequiredThreshold: d.safeOrRequiredThreshold,
    warningThreshold: d.warningThreshold,
    dangerThreshold: d.dangerThreshold,
    subScore: d.subScore,
    normalizedWeight: Number((combinedWeights[d.nutrient] || d.normalizedWeight).toFixed(3)),
    status: d.status,
    conditionVariant: d.conditionVariant,
    sourceBasis: d.sourceBasis,
    guidelineOrganization: d.guidelineOrganization,
    guidelineCitation: d.guidelineCitation,
    humanReadableReason: d.humanReadableReason,
  }));

  // Source confidence
  const isAllCited = topDrivers.every(d => d.sourceBasis === 'CLINICALLY_CITED');
  const sourceConfidence: SourceConfidence = isAllCited ? 'CLINICALLY_CITED' : 'CLINICAL_ESTIMATE';

  return {
    ruleEngineScore: clampedScore,
    rawRuleScore,
    recommendationLabel,
    riskLevel,
    recommendedPortionGrams: portionResult.recommendedPortionGrams,
    recommendedHouseholdMeasure: portionResult.recommendedHouseholdMeasure,
    bindingConditionVariant: bindingCondition,
    sourceConfidence,
    topDrivers,
    allNutrientBreakdowns,
    hasDangerViolation: hasCriticalDanger,
    hasWarningViolation: hasCriticalWarning,
  };
}
