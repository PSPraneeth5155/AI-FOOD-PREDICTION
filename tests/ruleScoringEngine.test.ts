import { describe, it, expect } from 'vitest';
import {
  evaluateMultiCondition,
  evaluateSingleNutrient,
  extractNutrientVector,
  mapScoreToRecommendationLabel,
  mapScoreToRiskLevel,
} from '../src/shared/ruleScoringEngine';
import { resolveConditionVariants } from '../src/shared/conditionStagingResolver';
import { blendRuleAndMlScore } from '../src/shared/blendingEngine';
import { getClinicalRule, getRulesForVariant, CLINICAL_RULES_SEED } from '../src/data/clinicalRulesSeed';

describe('Condition Staging Resolver', () => {
  it('correctly maps biometric vitals to 42 canonical condition variants', () => {
    const profile = {
      age: 54,
      gender: 'male' as const,
      heightCm: 172,
      weightKg: 92, // BMI 31.1 -> Obesity Class 1 (30.0 - 34.9)
      medical: {
        systolicBP: 146,
        diastolicBP: 94,
        hba1c: 7.8,
        fastingGlucose: 165,
        egfr: 42,
      },
    };

    const variants = resolveConditionVariants(profile);
    expect(variants).toContain('HTN_STAGE_2');
    expect(variants).toContain('DIABETES_T2_UNCONTROLLED');
    expect(variants).toContain('CKD_STAGE_3B');
    expect(variants).toContain('OBESITY_CLASS_1'); // BMI 27.7 -> overweight / borderline or check exact BMI
  });

  it('correctly identifies pregnancy trimester and pregnancy anemia', () => {
    const profile = {
      age: 29,
      gender: 'female' as const,
      medical: {
        trimester: 3 as const,
        hemoglobin: 10.2, // < 11.0 in pregnancy
      },
    };

    const variants = resolveConditionVariants(profile);
    expect(variants).toContain('PREGNANCY_TRIMESTER_3');
    expect(variants).toContain('ANEMIA_PREGNANCY');
  });

  it('correctly auto-stages sarcopenic elderly adult (65+ with low BMI)', () => {
    const profile = {
      age: 72,
      gender: 'female' as const,
      heightCm: 160,
      weightKg: 46, // BMI 18.0
    };

    const variants = resolveConditionVariants(profile);
    expect(variants).toContain('ELDERLY_SARCOPENIA_FRAIL');
    expect(variants).toContain('UNDERWEIGHT_MILD');
  });
});

describe('504 Clinical Rules Seed Integrity', () => {
  it('contains exactly 504 rules spanning 42 variants and 12 nutrients', () => {
    expect(CLINICAL_RULES_SEED.length).toBe(504);
  });

  it('verifies every condition variant has weights strictly summing to 1.0000', () => {
    const variantSet = new Set(CLINICAL_RULES_SEED.map(r => r.conditionVariant));
    expect(variantSet.size).toBe(42);

    for (const v of variantSet) {
      const rules = getRulesForVariant(v);
      expect(rules.length).toBe(12);

      const sumWeight = rules.reduce((acc, r) => acc + r.normalizedWeight, 0);
      expect(sumWeight).toBeCloseTo(1.0, 3);
    }
  });

  it('retrieves specific clinical rules with valid citations', () => {
    const htnNaRule = getClinicalRule('HTN_STAGE_2', 'sodium');
    expect(htnNaRule).toBeDefined();
    expect(htnNaRule?.ruleDirection).toBe('LIMITING');
    expect(htnNaRule?.safeThreshold).toBe(500);
    expect(htnNaRule?.dangerThreshold).toBe(850);
    expect(htnNaRule?.guidelineOrganization).toBe('AHA');

    const ckdPotassiumRule = getClinicalRule('CKD_STAGE_3B', 'potassium');
    expect(ckdPotassiumRule).toBeDefined();
    expect(ckdPotassiumRule?.safeThreshold).toBe(550);
    expect(ckdPotassiumRule?.guidelineOrganization).toBe('KDOQI');
  });
});

describe('Deterministic Rule Scoring Engine', () => {
  it('evaluates Masala Dosa with Sambar for Ramesh (CKD 3b + HTN 2 + T2D Uncontrolled) per Doc 04 Spec', () => {
    const food = {
      id: 'ind_masala_dosa_sambar',
      name: 'Masala Dosa with Sambar & Coconut Chutney',
      servingGrams: 250,
      calories: 480,
      protein: 11.5,
      carbs: 68.0,
      fat: 16.5,
      saturatedFat: 5.8,
      fiber: 5.2,
      sugar: 4.8,
      sodium: 790,
      cholesterol: 0,
      potassium: 640,
      calcium: 85,
      iron: 2.4,
    };

    const variants = ['CKD_STAGE_3B', 'HTN_STAGE_2', 'DIABETES_T2_UNCONTROLLED'] as const;
    const result = evaluateMultiCondition(food, CLINICAL_RULES_SEED, [...variants]);

    // According to Doc 04 Section 4.2 sample:
    // Should be in "Limit Intake" band (30.0 - 49.9) with WARNING risk level
    expect(result.ruleEngineScore).toBeGreaterThanOrEqual(30.0);
    expect(result.ruleEngineScore).toBeLessThan(50.0);
    expect(result.recommendationLabel).toBe('Limit Intake');
    expect(result.riskLevel).toBe('WARNING');

    // Binding condition should be HTN_STAGE_2 or CKD_STAGE_3B due to sodium / potassium
    expect(['HTN_STAGE_2', 'CKD_STAGE_3B']).toContain(result.bindingConditionVariant);

    // Top drivers should identify sodium and potassium
    const driverNutrients = result.topDrivers.map(d => d.nutrient);
    expect(driverNutrients).toContain('sodium');
    expect(driverNutrients).toContain('potassium');

    // Recommended portion should be reduced from 250g
    expect(result.recommendedPortionGrams).toBeLessThan(250);
    expect(result.recommendedPortionGrams).toBeGreaterThanOrEqual(100);
  });

  it('enforces Safety Precedence Rule: Limiting CKD Stage 4 protein ceiling dominates beneficial elderly protein target', () => {
    const highProteinFood = {
      id: 'high_pro_shake',
      name: 'High Protein Whey Shake',
      servingGrams: 300,
      calories: 320,
      protein: 42.0, // severely high for CKD 4 (safe limit <= 18g)
      carbs: 12,
      fat: 3,
      saturatedFat: 1,
      fiber: 1,
      sugar: 2,
      sodium: 180,
      cholesterol: 15,
      potassium: 350,
      calcium: 200,
      iron: 1,
    };

    // Patient is elderly frail (needs protein) BUT has CKD Stage 4 (kidney failure risk)
    const variants = ['CKD_STAGE_4', 'ELDERLY_SARCOPENIA_FRAIL'] as const;
    const result = evaluateMultiCondition(highProteinFood, CLINICAL_RULES_SEED, [...variants]);

    // Protein limiting rule must take precedence
    const proDriver = result.allNutrientBreakdowns.find(d => d.nutrient === 'protein');
    expect(proDriver?.direction).toBe('LIMITING');
    expect(proDriver?.status).toBe('DANGER');
    expect(result.hasDangerViolation).toBe(true);
    expect(result.ruleEngineScore).toBeLessThan(30.0);
    expect(result.recommendationLabel).toBe('Avoid');
  });

  it('evaluates safe, highly recommended dish for healthy pregnant user', () => {
    const spinachMoongSundal = {
      id: 'moong_spinach',
      name: 'Steamed Sprouted Moong & Spinach Sundal',
      servingGrams: 180,
      calories: 195,
      protein: 15.2,
      carbs: 26.0,
      fat: 2.2,
      saturatedFat: 0.3,
      fiber: 7.8,
      sugar: 1.5,
      sodium: 140, // very low sodium
      cholesterol: 0,
      potassium: 480,
      calcium: 160,
      iron: 5.6, // rich in iron & folate
    };

    const variants = ['PREGNANCY_TRIMESTER_3'] as const;
    const result = evaluateMultiCondition(spinachMoongSundal, CLINICAL_RULES_SEED, [...variants], { mealType: 'snack' });

    expect(result.ruleEngineScore).toBeGreaterThanOrEqual(70.0);
    expect(['Recommended', 'Highly Recommended']).toContain(result.recommendationLabel);
    expect(result.riskLevel).toBe('SAFE');
  });
});

describe('Authoritative Safety-Floor Blending Engine', () => {
  it('blends rule score and ML score when food is safe (>= 50)', () => {
    const ruleScore = 80.0;
    const mlScore = 90.0;
    const { blendedScore, label } = blendRuleAndMlScore(ruleScore, mlScore);

    // 0.65 * 80 + 0.35 * 90 = 52 + 31.5 = 83.5
    expect(blendedScore).toBe(83.5);
    expect(label).toBe('Recommended');
  });

  it('NEVER allows ML to upgrade an unsafe food with rule score in Limit Intake (< 50)', () => {
    const ruleScore = 44.0; // Limit Intake
    const mlScore = 98.0;   // Over-optimistic ML prediction
    const { blendedScore, label } = blendRuleAndMlScore(ruleScore, mlScore);

    // Capped at ruleScore or 49.9 max
    expect(blendedScore).toBeLessThanOrEqual(44.0);
    expect(label).toBe('Limit Intake');
  });

  it('HARD LOCKS score to rule score when danger threshold is breached (< 30)', () => {
    const ruleScore = 24.0; // Danger / Avoid
    const mlScore = 85.0;
    const { blendedScore, label, riskLevel } = blendRuleAndMlScore(ruleScore, mlScore, true);

    expect(blendedScore).toBe(24.0);
    expect(label).toBe('Avoid');
    expect(riskLevel).toBe('DANGER');
  });
});
