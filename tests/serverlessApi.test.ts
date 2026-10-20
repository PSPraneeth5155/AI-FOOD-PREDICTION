import { describe, it, expect, beforeEach } from 'vitest';
import scoreFoodHandler from '../api/v1/score-food';
import rankFoodsHandler from '../api/v1/rank-foods';
import calculateConsumptionHandler from '../api/v1/calculate-consumption';
import profileLedgerHandler from '../api/v1/profile-ledger';
import clinicalRulesHandler from '../api/v1/clinical-rules';
import { FoodItem } from '../src/types';

// Helper to mock express / vercel req & res
function createMockReqRes(method: string, body?: any, query?: any) {
  let statusCode = 200;
  let headers: Record<string, string> = {};
  let responseData: any = null;

  const req: any = {
    method,
    body: body || {},
    query: query || {},
    headers: {},
  };

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    end() {
      return res;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };

  return { req, res };
}

describe('Phase 3 Serverless API Endpoints', () => {
  const sampleBiryani: FoodItem = {
    id: 'food_biryani_01',
    name: 'Hyderabadi Chicken Biryani',
    category: 'Rice Dishes',
    portion: 'medium',
    portionMultiplier: 1.0,
    servingDescription: '1 plate (320g)',
    calories: 520,
    protein: 28,
    carbs: 62,
    fat: 18,
    saturatedFat: 5.5,
    fiber: 3.2,
    sugar: 2.1,
    sodium: 680,
    cholesterol: 75,
    potassium: 380,
    calcium: 55,
    iron: 2.8,
    isHighProtein: true,
  };

  describe('/api/v1/score-food', () => {
    it('should evaluate food and return suitability response with topDrivers and XAI breakdown', async () => {
      const { req, res } = createMockReqRes('POST', {
        userId: 'test_user_01',
        activeConditionVariants: ['HTN_STAGE_2', 'CHOL_HIGH_LDL'],
        mealType: 'lunch',
        foodItem: sampleBiryani,
      });

      await scoreFoodHandler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data).toHaveProperty('recommendationLabel');
      expect(data).toHaveProperty('suitabilityScore');
      expect(data.suitabilityScore).toBeGreaterThanOrEqual(0);
      expect(data.suitabilityScore).toBeLessThanOrEqual(100);
      expect(data.topDrivers.length).toBeGreaterThan(0);
      expect(data.allNutrientBreakdowns.length).toBe(12);
      expect(data.bindingConditionVariant).toBeDefined();
    });

    it('should reject requests without foodItem', async () => {
      const { req, res } = createMockReqRes('POST', { userId: 'u1' });
      await scoreFoodHandler(req, res);
      expect(res.getStatusCode()).toBe(400);
    });
  });

  describe('/api/v1/rank-foods', () => {
    it('should batch rank foods and provide healthier substitutions', async () => {
      const healthySalad: FoodItem = {
        id: 'food_salad_01',
        name: 'Cucumber Tomato Sprout Salad',
        category: 'Accompaniments',
        portion: 'medium',
        portionMultiplier: 1.0,
        servingDescription: '1 bowl (180g)',
        calories: 85,
        protein: 5.2,
        carbs: 12,
        fat: 1.2,
        saturatedFat: 0.2,
        fiber: 4.8,
        sugar: 2.5,
        sodium: 95,
        cholesterol: 0,
        potassium: 360,
        calcium: 45,
        iron: 1.8,
        isHighProtein: false,
      };

      const { req, res } = createMockReqRes('POST', {
        activeConditionVariants: ['HTN_STAGE_2'],
        mealType: 'lunch',
        foodItems: [sampleBiryani, healthySalad],
      });

      await rankFoodsHandler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.rankedFoods.length).toBe(2);
      // Healthier low-sodium salad should outrank high-sodium biryani for HTN_STAGE_2
      expect(data.rankedFoods[0].item.name).toBe('Cucumber Tomato Sprout Salad');
    });
  });

  describe('/api/v1/calculate-consumption', () => {
    it('should compute consumed delta subtracting leftovers and update ledger', async () => {
      const { req, res } = createMockReqRes('POST', {
        userId: 'test_consumer_42',
        servedItems: [sampleBiryani],
        overallLeftoverPercent: 25, // 75% consumed
      });

      await calculateConsumptionHandler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.overallLeftoverPercent).toBe(25);
      expect(data.consumptionRatio).toBe(0.75);

      // 75% of 520 calories = 390
      expect(data.totalNetConsumed.calories).toBe(390);
      // 75% of 28g protein = 21g
      expect(data.totalNetConsumed.protein).toBe(21);
      expect(data.ledger).toBeDefined();
    });
  });

  describe('/api/v1/profile-ledger', () => {
    it('should return profile, auto-staged conditions, 12-nutrient targets, and remaining ledger', async () => {
      const { req, res } = createMockReqRes('GET', {}, { userId: 'usr_demo_patient_01' });

      await profileLedgerHandler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.profile).toBeDefined();
      expect(data.activeConditionVariants).toBeDefined();
      expect(Array.isArray(data.activeConditionVariants)).toBe(true);
      expect(data.targets.calories).toBeGreaterThan(1200);
      expect(data.ledger).toBeDefined();
      expect(data.adherenceScore).toBeGreaterThanOrEqual(0);
    });

    it('should update profile, auto-stage conditions, and recompute targets on PUT', async () => {
      const { req, res } = createMockReqRes('PUT', {
        userId: 'usr_demo_patient_01',
        weightKg: 85,
        heightCm: 170, // BMI = 85 / (1.7^2) = 29.4 (Overweight)
        medical: {
          systolicBP: 145, // HTN Stage 2
          hba1c: 8.2, // Diabetes Uncontrolled
        },
      });

      await profileLedgerHandler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.profile.bmi).toBe(29.4);
      expect(data.activeConditionVariants).toContain('HTN_STAGE_2');
      expect(data.activeConditionVariants).toContain('DIABETES_T2_UNCONTROLLED');
    });
  });

  describe('/api/v1/clinical-rules', () => {
    it('should filter rules by variant, nutrient, or direction', async () => {
      const { req, res } = createMockReqRes('GET', {}, { variant: 'CKD_STAGE_3B' });

      await clinicalRulesHandler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.totalRulesCount).toBe(504);
      expect(data.matchedRulesCount).toBe(12); // Exactly 12 nutrients for that variant
      expect(data.rules.every((r: any) => r.conditionVariant === 'CKD_STAGE_3B')).toBe(true);
    });

    it('should enforce invariant sum W = 1.0000 on rule PATCH', async () => {
      // Propose invalid weight that violates sum of 1.0
      const { req, res } = createMockReqRes('PATCH', {
        ruleId: 'CKD_STAGE_3B__POTASSIUM',
        normalizedWeight: 0.95, // Will blow up the sum far beyond 1.0
        changedBy: 'clinician_dr_rao',
        changeReason: 'Testing weight invariant validation',
      });

      await clinicalRulesHandler(req, res);

      expect(res.getStatusCode()).toBe(400);
      const data = res.getData();
      expect(data.error).toContain('Invariant violation');
    });

    it('should update rule threshold and record audit log on valid PATCH', async () => {
      // Update safe threshold without changing weight
      const { req, res } = createMockReqRes('PATCH', {
        ruleId: 'HTN_STAGE_1__SODIUM',
        safeThreshold: 450,
        changedBy: 'clinician_dr_sharma',
        changeReason: 'Stricter clinical boundary for stage 1 HTN',
      });

      await clinicalRulesHandler(req, res);

      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.updatedRule.safeThreshold).toBe(450);
      expect(data.updatedRule.ruleVersion).toBeGreaterThan(1);
      expect(data.audit).toBeDefined();
      expect(data.audit.changedBy).toBe('clinician_dr_sharma');
    });
  });
});
