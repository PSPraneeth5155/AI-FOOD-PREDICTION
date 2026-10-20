import { describe, it, expect } from 'vitest';
import { calculatePortionOptimization } from '../src/shared/ruleScoringEngine';
import { CLINICAL_RULES_SEED } from '../src/data/clinicalRulesSeed';

describe('Clinical Portion Calculator', () => {
  it('caps portion size to limiting ceiling for Stage 2 Hypertension user', () => {
    // High sodium dish: 1200mg sodium in 300g serving (400mg per 100g)
    // Stage 2 HTN safe threshold is 500mg
    // Max safe portion should be 300g * (500 / 1200) = 125g
    const saltyDish = {
      name: 'Commercial Salted Curry',
      servingGrams: 300,
      calories: 450,
      protein: 12,
      carbs: 40,
      fat: 20,
      saturatedFat: 6,
      fiber: 4,
      sugar: 5,
      sodium: 1200,
      cholesterol: 30,
      potassium: 300,
      calcium: 50,
      iron: 2,
    };

    const result = calculatePortionOptimization(saltyDish, CLINICAL_RULES_SEED, ['HTN_STAGE_2']);
    expect(result.recommendedPortionGrams).toBeLessThanOrEqual(130);
    expect(result.recommendedPortionGrams).toBeGreaterThanOrEqual(120);
    expect(result.recommendedHouseholdMeasure).toContain('125g');
  });

  it('clamps recommended portion between 15g and 450g', () => {
    // Ultra light water-rich salad that mathematically could be 1200g
    const hugeSalad = {
      name: 'Cucumber Lettuce Salad',
      servingGrams: 200,
      calories: 30,
      protein: 1,
      carbs: 4,
      fat: 0.2,
      saturatedFat: 0,
      fiber: 2,
      sugar: 1,
      sodium: 10,
      cholesterol: 0,
      potassium: 200,
      calcium: 30,
      iron: 0.5,
    };

    const result = calculatePortionOptimization(hugeSalad, CLINICAL_RULES_SEED, ['OBESITY_CLASS_2']);
    expect(result.recommendedPortionGrams).toBeLessThanOrEqual(450);
    expect(result.recommendedPortionGrams).toBeGreaterThanOrEqual(15);
  });

  it('recommends 0g portion (Avoid) if safe portion is under 25g', () => {
    // Extremely toxic sodium level (e.g. concentrated pickle or pure sodium bomb: 3000mg in 50g)
    const dangerousPickle = {
      name: 'Concentrated Salt Pickle',
      servingGrams: 100,
      calories: 120,
      protein: 1,
      carbs: 8,
      fat: 8,
      saturatedFat: 1,
      fiber: 1,
      sugar: 2,
      sodium: 4000, // 500 / 4000 * 100 = 12.5g < 25g
      cholesterol: 0,
      potassium: 50,
      calcium: 10,
      iron: 0.5,
    };

    const result = calculatePortionOptimization(dangerousPickle, CLINICAL_RULES_SEED, ['HTN_STAGE_2']);
    expect(result.recommendedPortionGrams).toBe(0);
    expect(result.recommendedHouseholdMeasure).toContain('Avoid');
  });
});
