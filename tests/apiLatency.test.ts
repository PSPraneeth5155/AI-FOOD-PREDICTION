import { describe, it, expect, beforeAll } from 'vitest';
import scoreFoodHandler from '../api/v1/score-food';
import rankFoodsHandler from '../api/v1/rank-foods';
import { evaluateMultiCondition } from '../src/shared/ruleScoringEngine';
import { CLINICAL_RULES_SEED } from '../src/data/clinicalRulesSeed';
import { FoodItem } from '../src/types';

function createMockReqRes(method: string, body?: any) {
  let statusCode = 200;
  let responseData: any = null;

  const req: any = {
    method,
    body: body || {},
    headers: {},
  };

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader() {
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

function calculatePercentile(latencies: number[], p: number): number {
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

describe('Phase 6: API & Engine Latency Verification (Doc 05 Targets)', () => {
  const sampleFood: FoodItem = {
    id: 'food_dal_01',
    name: 'Yellow Tadka Dal',
    category: 'Lentils',
    portion: 'medium',
    portionMultiplier: 1.0,
    servingDescription: '1 cup (180g)',
    calories: 180,
    protein: 9,
    carbs: 24,
    fat: 5,
    saturatedFat: 1.2,
    fiber: 6,
    sugar: 1.5,
    sodium: 320,
    potassium: 350,
    cholesterol: 0,
    calcium: 45,
    iron: 2.1,
  };

  beforeAll(async () => {
    // Warm up the ONNX runtime singleton session
    const { req, res } = createMockReqRes('POST', {
      foodItem: sampleFood,
      activeConditionVariants: ['DIABETES_T2_CONTROLLED'],
    });
    await scoreFoodHandler(req, res);
  });

  it('Isomorphic 504-Rule Engine p95 latency should be <= 5ms', () => {
    const latencies: number[] = [];
    const activeVariants = ['DIABETES_T2_UNCONTROLLED', 'HYPERTENSION_STAGE_2', 'CKD_STAGE_3A'] as any;

    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      evaluateMultiCondition(sampleFood, CLINICAL_RULES_SEED, activeVariants, {
        mealType: 'lunch',
        dailyRemainingBudget: { calories: 1200, sodium: 800, protein: 40 },
      });
      latencies.push(performance.now() - start);
    }

    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);

    console.log(`[Rule Engine Bench] p50: ${p50.toFixed(2)}ms, p95: ${p95.toFixed(2)}ms`);
    expect(p95).toBeLessThanOrEqual(5.0);
  });

  it('/api/v1/score-food p95 latency should be <= 50ms (warmed)', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 30; i++) {
      const { req, res } = createMockReqRes('POST', {
        foodItem: sampleFood,
        activeConditionVariants: ['DIABETES_T2_CONTROLLED', 'HYPERTENSION_STAGE_1'],
        dailyRemainingBudget: { calories: 1500, sodium: 1200 },
      });

      const start = performance.now();
      await scoreFoodHandler(req, res);
      latencies.push(performance.now() - start);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getData().suitabilityScore).toBeDefined();
    }

    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);

    console.log(`[/api/v1/score-food Bench] p50: ${p50.toFixed(2)}ms, p95: ${p95.toFixed(2)}ms`);
    expect(p95).toBeLessThanOrEqual(50.0);
  });

  it('/api/v1/rank-foods p95 latency should be <= 450ms for batch candidates', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 10; i++) {
      const { req, res } = createMockReqRes('POST', {
        activeConditionVariants: ['DIABETES_T2_CONTROLLED', 'HYPERTENSION_STAGE_2'],
        mealType: 'lunch',
        limit: 10,
      });

      const start = performance.now();
      await rankFoodsHandler(req, res);
      latencies.push(performance.now() - start);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getData().rankedFoods.length).toBeGreaterThan(0);
    }

    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);

    console.log(`[/api/v1/rank-foods Bench] p50: ${p50.toFixed(2)}ms, p95: ${p95.toFixed(2)}ms`);
    expect(p95).toBeLessThanOrEqual(450.0);
  });
});
