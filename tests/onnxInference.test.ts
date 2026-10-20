import { describe, it, expect, beforeAll } from 'vitest';
import { build48FeatureVector, predictMlSuitabilityScore, getOnnxModelMetadata } from '../src/shared/onnxInferenceEngine';
import { blendRuleAndMlScore } from '../src/shared/blendingEngine';
import { FoodItem, UserProfile } from '../src/types';

describe('Phase 4: LightGBM / ONNX ML Pipeline & Safety-Floor Blending', () => {
  beforeAll(async () => {
    // Warm up the ONNX session
    await predictMlSuitabilityScore(undefined, [], {
      id: 'warmup',
      name: 'Warmup',
      category: 'Grains',
      portion: 'medium',
      portionMultiplier: 1.0,
      servingDescription: '1 serving',
      calories: 100,
      protein: 2,
      carbs: 20,
      fat: 1,
      fiber: 1,
      sugar: 1,
      sodium: 50,
      isHighProtein: false,
    });
  });

  const sampleUser: Partial<UserProfile> = {
    age: 42,
    gender: 'female',
    bmi: 27.4,
    medical: {
      systolicBP: 142,
      diastolicBP: 92,
      fastingGlucose: 128,
      hba1c: 7.6,
      egfr: 52,
    },
    lifestyle: {
      activityLevel: 'moderate',
      sleepHours: 7.0,
      dietaryPreference: 'vegetarian',
      allergies: [],
      healthGoals: [],
    },
  };

  const sampleHealthySalad: FoodItem = {
    id: 'food_sprout_salad',
    name: 'Moong Sprout Salad with Lemon',
    category: 'Accompaniments',
    portion: 'medium',
    portionMultiplier: 1.0,
    servingDescription: '1 bowl (160g)',
    calories: 120,
    protein: 14,
    carbs: 18,
    fat: 1.5,
    saturatedFat: 0.2,
    fiber: 6.5,
    sugar: 2.0,
    sodium: 90,
    cholesterol: 0,
    potassium: 420,
    calcium: 60,
    iron: 3.2,
    glycemicIndexBand: 'Low',
    isHighProtein: true,
  };

  it('build48FeatureVector should construct exactly 48 float features matching metadata schema', () => {
    const vector = build48FeatureVector(
      sampleUser,
      ['HTN_STAGE_2', 'DIABETES_T2_UNCONTROLLED', 'CKD_STAGE_3A'],
      sampleHealthySalad,
      { calories: 1400, sodium: 1200, protein: 45 }
    );

    expect(vector).toBeInstanceOf(Float32Array);
    expect(vector.length).toBe(48);

    // Biometrics: Age, Gender (female = 0), BMI, Systolic, Diastolic, Glucose, HbA1c, eGFR
    expect(vector[0]).toBe(42);
    expect(vector[1]).toBe(0);
    expect(vector[2]).toBeCloseTo(27.4, 1);
    expect(vector[3]).toBe(142);
    expect(vector[4]).toBe(92);
    expect(vector[5]).toBe(128);
    expect(vector[6]).toBeCloseTo(7.6, 1);
    expect(vector[7]).toBe(52);

    // Condition Severities: fam_DIABETES (idx 10), fam_HYPERTENSION (idx 12), fam_CKD (idx 17)
    expect(vector[10]).toBe(4); // T2 Uncontrolled severity = 4
    expect(vector[12]).toBe(3); // Stage 2 HTN severity = 3
    expect(vector[17]).toBe(2); // CKD 3A severity = 2

    // Food Nutrients: calories, protein, carbs, fiber, sodium
    expect(vector[24]).toBe(120);
    expect(vector[25]).toBe(14);
    expect(vector[31]).toBe(90);
  });

  it('predictMlSuitabilityScore should run ONNX inference and return bounded score in < 30ms once warmed', async () => {
    const result = await predictMlSuitabilityScore(
      sampleUser,
      ['HTN_STAGE_2', 'DIABETES_T2_UNCONTROLLED'],
      sampleHealthySalad,
      { calories: 1500, sodium: 1400, protein: 50, fiber: 20 }
    );

    expect(result).toHaveProperty('mlScore');
    expect(result.mlScore).toBeGreaterThanOrEqual(0);
    expect(result.mlScore).toBeLessThanOrEqual(100);
    expect(result.latencyMs).toBeLessThan(30); // Fast warmed execution (< 30ms)
    expect(result.modelVersion).toBeDefined();

    // Healthy sprout salad should receive high ML gap-fulfillment score
    expect(result.mlScore).toBeGreaterThanOrEqual(65);
  });

  it('blendRuleAndMlScore enforces Authoritative Safety Floor: ML cannot promote a Limit Intake food above 49.9', () => {
    const dangerousRuleScore = 38.0; // Rule Engine says Limit Intake (< 50)
    const overlyOptimisticMlScore = 95.0; // ML model suggests high score

    const blended = blendRuleAndMlScore(dangerousRuleScore, overlyOptimisticMlScore);

    // Formula: Min(Rule_Score, 0.70 * Rule + 0.30 * ML), capped <= 49.9
    // Min(38.0, 0.70*38 + 0.30*95) = Min(38.0, 55.1) = 38.0
    expect(blended.blendedScore).toBeLessThanOrEqual(49.9);
    expect(blended.blendedScore).toBe(38.0);
    expect(blended.label).toBe('Limit Intake');
  });

  it('blendRuleAndMlScore enforces Hard Lock: Avoid (< 30.0) permits ZERO ML override', () => {
    const avoidRuleScore = 18.5; // Rule Engine detected Danger breach
    const mlScore = 90.0;

    const blended = blendRuleAndMlScore(avoidRuleScore, mlScore);

    // Hard locked to Rule Score: zero ML override allowed
    expect(blended.blendedScore).toBe(18.5);
    expect(blended.label).toBe('Avoid');
    expect(blended.riskLevel).toBe('DANGER');
  });

  it('getOnnxModelMetadata exposes model benchmarks satisfying >= 0.88 requirements', () => {
    const meta = getOnnxModelMetadata();
    expect(meta.model_id).toBe('nutritrack_lgbm_v1');
    expect(meta.features_count).toBe(48);
    expect(meta.metrics.r2_score).toBeGreaterThanOrEqual(0.88);
    expect(meta.metrics.macro_f1).toBeGreaterThanOrEqual(0.88);
  });
});
