import { ConditionFamily, ConditionVariant, FoodItem, NutrientVector12, UserProfile } from '../types';

let ortInstance: any = null;
let sessionInstance: any = null;
let isSessionLoading = false;

// Metadata for model
export interface ModelMetadata {
  model_id: string;
  version: string;
  framework: string;
  features_count: number;
  metrics: {
    r2_score: number;
    mae: number;
    macro_f1: number;
  };
}

const DEFAULT_METADATA: ModelMetadata = {
  model_id: 'nutritrack_lgbm_v1',
  version: '1.0.0',
  framework: 'LightGBM-ONNX',
  features_count: 48,
  metrics: {
    r2_score: 0.9833,
    mae: 2.65,
    macro_f1: 0.8951,
  },
};

/**
 * Initializes and caches the ONNX InferenceSession singleton.
 */
async function getOrInitSession(): Promise<any | null> {
  if (sessionInstance) return sessionInstance;
  // Browser safety check
  if (typeof window !== 'undefined') {
    return null;
  }
  if (isSessionLoading) {
    // Wait briefly for in-flight init
    await new Promise(r => setTimeout(r, 80));
    return sessionInstance;
  }

  isSessionLoading = true;
  try {
    if (!ortInstance) {
      try {
        ortInstance = await import('onnxruntime-node');
      } catch (importErr) {
        console.warn('[ONNX] onnxruntime-node native package unavailable in current environment.');
        isSessionLoading = false;
        return null;
      }
    }

    const path = await import('path');
    const fs = await import('fs');

    const modelPath = path.join(process.cwd(), 'data_assets', 'models', 'nutritrack_lgbm_v1.onnx');
    if (!fs.existsSync(modelPath)) {
      console.warn(`[ONNX] Model file not found at ${modelPath}.`);
      isSessionLoading = false;
      return null;
    }

    sessionInstance = await ortInstance.InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });
    console.log('[ONNX] Successfully loaded NutriTrack LightGBM model into memory.');
  } catch (err: any) {
    console.warn('[ONNX] Failed to create ONNX session:', err?.message);
    sessionInstance = null;
  } finally {
    isSessionLoading = false;
  }
  return sessionInstance;
}

/**
 * Maps condition variants to 14 condition family severity levels (0 to 5).
 */
function extractFamilySeverities(activeVariants: ConditionVariant[]): Record<string, number> {
  const severities: Record<string, number> = {
    fam_DIABETES: 0,
    fam_PREDIABETES: 0,
    fam_HYPERTENSION: 0,
    fam_HIGH_CHOLESTEROL: 0,
    fam_HEART_DISEASE: 0,
    fam_OBESITY: 0,
    fam_UNDERWEIGHT: 0,
    fam_CKD: 0,
    fam_FATTY_LIVER: 0,
    fam_ANEMIA: 0,
    fam_OSTEOPOROSIS: 0,
    fam_ATHLETES: 0,
    fam_ELDERLY: 0,
    fam_PREGNANCY: 0,
  };

  for (const v of activeVariants) {
    if (v.startsWith('DIABETES_T2_UNCONTROLLED')) severities.fam_DIABETES = 4;
    else if (v.startsWith('DIABETES_T1') || v.startsWith('DIABETES_GESTATIONAL')) severities.fam_DIABETES = 3;
    else if (v.startsWith('DIABETES_T2_CONTROLLED')) severities.fam_DIABETES = 2;

    else if (v === 'PREDIABETES_HIGH_RISK') severities.fam_PREDIABETES = 2;
    else if (v === 'PREDIABETES_EARLY') severities.fam_PREDIABETES = 1;

    else if (v === 'HTN_RESISTANT' || v === 'HTN_STAGE_2') severities.fam_HYPERTENSION = 3;
    else if (v === 'HTN_STAGE_1') severities.fam_HYPERTENSION = 2;
    else if (v === 'HTN_ELEVATED') severities.fam_HYPERTENSION = 1;

    else if (v === 'CHOL_HIGH_LDL' || v === 'CHOL_HYPERTRIGLYCERIDEMIA') severities.fam_HIGH_CHOLESTEROL = 3;
    else if (v === 'CHOL_BORDERLINE') severities.fam_HIGH_CHOLESTEROL = 1;

    else if (v === 'HEART_FAILURE_HF') severities.fam_HEART_DISEASE = 4;
    else if (v === 'HEART_POST_MI') severities.fam_HEART_DISEASE = 3;
    else if (v === 'HEART_CAD_STABLE') severities.fam_HEART_DISEASE = 2;

    else if (v === 'OBESITY_CLASS_3') severities.fam_OBESITY = 4;
    else if (v === 'OBESITY_CLASS_2') severities.fam_OBESITY = 3;
    else if (v === 'OBESITY_CLASS_1') severities.fam_OBESITY = 2;

    else if (v === 'UNDERWEIGHT_MODERATE_SEVERE') severities.fam_UNDERWEIGHT = 3;
    else if (v === 'UNDERWEIGHT_MILD') severities.fam_UNDERWEIGHT = 2;

    else if (v === 'CKD_STAGE_5_DIALYSIS') severities.fam_CKD = 5;
    else if (v === 'CKD_STAGE_4') severities.fam_CKD = 4;
    else if (v === 'CKD_STAGE_3B') severities.fam_CKD = 3;
    else if (v === 'CKD_STAGE_3A') severities.fam_CKD = 2;
    else if (v === 'CKD_STAGE_1_2') severities.fam_CKD = 1;

    else if (v === 'NAFLD_FIBROSIS') severities.fam_FATTY_LIVER = 3;
    else if (v === 'NAFLD_NASH_MASH') severities.fam_FATTY_LIVER = 2;
    else if (v === 'NAFLD_SIMPLE_STEATOSIS') severities.fam_FATTY_LIVER = 1;

    else if (v === 'ANEMIA_IRON_DEFICIENCY_SEVERE') severities.fam_ANEMIA = 3;
    else if (v === 'ANEMIA_IRON_DEFICIENCY_MILD' || v === 'ANEMIA_PREGNANCY') severities.fam_ANEMIA = 2;

    else if (v === 'OSTEOPOROSIS_ESTABLISHED') severities.fam_OSTEOPOROSIS = 3;
    else if (v === 'OSTEOPENIA') severities.fam_OSTEOPOROSIS = 1;

    else if (v.startsWith('ATHLETE_')) severities.fam_ATHLETES = 2;
    else if (v === 'ELDERLY_SARCOPENIA_FRAIL') severities.fam_ELDERLY = 3;
    else if (v === 'ELDERLY_HEALTHY_65_PLUS') severities.fam_ELDERLY = 1;

    else if (v === 'PREGNANCY_TRIMESTER_3') severities.fam_PREGNANCY = 3;
    else if (v === 'PREGNANCY_TRIMESTER_2') severities.fam_PREGNANCY = 2;
    else if (v === 'PREGNANCY_TRIMESTER_1') severities.fam_PREGNANCY = 1;
  }

  return severities;
}

/**
 * Builds the 48-feature input array matching the exact schema of model_metadata.json.
 */
export function build48FeatureVector(
  profile: Partial<UserProfile> | undefined,
  activeVariants: ConditionVariant[],
  food: FoodItem,
  remainingBudget?: Partial<NutrientVector12>
): Float32Array {
  const vec = new Float32Array(48);

  // 1. User Biometrics (10 features: 0..9)
  vec[0] = profile?.age || 35;
  vec[1] = profile?.gender === 'male' ? 1.0 : 0.0;
  vec[2] = profile?.bmi || 24.5;
  vec[3] = profile?.medical?.systolicBP || 120;
  vec[4] = profile?.medical?.diastolicBP || 80;
  vec[5] = profile?.medical?.fastingGlucose || profile?.medical?.bloodSugar || 95;
  vec[6] = profile?.medical?.hba1c || 5.4;
  vec[7] = profile?.medical?.egfr || 95.0;

  const actMap: Record<string, number> = { sedentary: 1, light: 2, moderate: 3, very_active: 4 };
  vec[8] = actMap[profile?.lifestyle?.activityLevel || 'moderate'] || 3.0;
  vec[9] = profile?.lifestyle?.sleepHours || 7.0;

  // 2. 14 Condition Family Severities (features: 10..23)
  const famSeverities = extractFamilySeverities(activeVariants);
  const famKeys = [
    'fam_DIABETES', 'fam_PREDIABETES', 'fam_HYPERTENSION', 'fam_HIGH_CHOLESTEROL',
    'fam_HEART_DISEASE', 'fam_OBESITY', 'fam_UNDERWEIGHT', 'fam_CKD',
    'fam_FATTY_LIVER', 'fam_ANEMIA', 'fam_OSTEOPOROSIS', 'fam_ATHLETES',
    'fam_ELDERLY', 'fam_PREGNANCY'
  ];
  famKeys.forEach((key, idx) => {
    vec[10 + idx] = famSeverities[key] || 0.0;
  });

  // 3. Food Nutrients + Glycemic Index (13 features: 24..36)
  vec[24] = food.calories || 0;
  vec[25] = food.protein || 0;
  vec[26] = food.carbs || 0;
  vec[27] = food.fiber || 0;
  vec[28] = food.sugar || 0;
  vec[29] = food.fat || 0;
  vec[30] = food.saturatedFat || 0;
  vec[31] = food.sodium || 0;
  vec[32] = food.cholesterol || 0;
  vec[33] = food.potassium || 0;
  vec[34] = food.calcium || 0;
  vec[35] = food.iron || 0;
  vec[36] = food.glycemicIndexBand === 'Low' ? 1.0 : food.glycemicIndexBand === 'High' ? 3.0 : 2.0;

  // 4. Real-Time Nutrient Gaps & Remaining (11 features: 37..47)
  const rem = remainingBudget || {};
  vec[37] = rem.calories !== undefined ? rem.calories : 1200;
  vec[38] = rem.protein !== undefined ? rem.protein : 40;
  vec[39] = rem.carbs !== undefined ? rem.carbs : 140;
  vec[40] = rem.fiber !== undefined ? rem.fiber : 18;
  vec[41] = rem.sugar !== undefined ? rem.sugar : 25;
  vec[42] = rem.saturatedFat !== undefined ? rem.saturatedFat : 10;
  vec[43] = rem.sodium !== undefined ? rem.sodium : 1200;
  vec[44] = rem.cholesterol !== undefined ? rem.cholesterol : 180;
  vec[45] = rem.potassium !== undefined ? rem.potassium : 2200;
  vec[46] = rem.calcium !== undefined ? rem.calcium : 600;
  vec[47] = rem.iron !== undefined ? rem.iron : 10;

  return vec;
}

/**
 * Predicts the personalized ML suitability score (0 to 100) using the LightGBM ONNX model.
 * Latency is typically < 2ms once loaded.
 */
export async function predictMlSuitabilityScore(
  profile: Partial<UserProfile> | undefined,
  activeVariants: ConditionVariant[],
  food: FoodItem,
  remainingBudget?: Partial<NutrientVector12>
): Promise<{ mlScore: number; latencyMs: number; modelVersion: string; source: 'ONNX_MODEL' | 'DETERMINISTIC_FALLBACK' }> {
  const startTime = Date.now();

  try {
    const session = await getOrInitSession();

    if (session && ortInstance) {
      const featureArray = build48FeatureVector(profile, activeVariants, food, remainingBudget);
      const tensor = new ortInstance.Tensor('float32', featureArray, [1, 48]);
      const feeds = { float_input: tensor };

      const results = await session.run(feeds);
      const outputKey = Object.keys(results)[0];
      const rawScore = Number(results[outputKey].data[0]);
      const clampedScore = Math.max(0.0, Math.min(100.0, Number(rawScore.toFixed(1))));

      return {
        mlScore: clampedScore,
        latencyMs: Date.now() - startTime,
        modelVersion: 'nutritrack_lgbm_v1.onnx',
        source: 'ONNX_MODEL',
      };
    }
  } catch (err: any) {
    console.warn('[ONNX] Runtime error during inference, falling back:', err?.message);
  }

  // Graceful deterministic fallback if native ONNX binary is unavailable
  let fallbackScore = 70.0;
  const rem = remainingBudget || {};
  if (food.protein && food.protein >= 12 && (rem.protein || 40) > 20) fallbackScore += 6.0;
  if (food.fiber && food.fiber >= 4 && (rem.fiber || 15) > 10) fallbackScore += 4.0;
  if (food.sodium && food.sodium > 450 && (rem.sodium || 1000) < 500) fallbackScore -= 15.0;
  if (food.saturatedFat && food.saturatedFat > 4.5) fallbackScore -= 8.0;

  return {
    mlScore: Math.max(0, Math.min(100, Math.round(fallbackScore))),
    latencyMs: Date.now() - startTime,
    modelVersion: 'deterministic_gap_fallback_v1',
    source: 'DETERMINISTIC_FALLBACK',
  };
}

export function getOnnxModelMetadata(): ModelMetadata {
  return DEFAULT_METADATA;
}
