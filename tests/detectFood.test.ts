import { describe, it, expect } from 'vitest';
import detectFoodHandler from '../api/v1/detect-food';
import feedbackHandler from '../api/v1/feedback';
import { SAMPLE_MEAL_PRESETS } from '../src/data/nutritionDb';
import { getFallbackPresetForContext } from '../src/data/fallbackPlatters';

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

describe('Food Detection & Suggested Presets Calibration', () => {
  it('should respond to OPTIONS request with 200 and CORS headers', async () => {
    const { req, res } = createMockReqRes('OPTIONS');
    await detectFoodHandler(req, res);
    expect(res.getStatusCode()).toBe(200);
  });

  it('should return contextual fallback dishes when no image provided', async () => {
    const { req, res } = createMockReqRes('POST', {
      mealType: 'breakfast',
      isIndianMode: true,
    });
    await detectFoodHandler(req, res);
    expect(res.getStatusCode()).toBe(200);

    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.isFoodDetected).toBe(true);
    expect(Array.isArray(data.detectedItems)).toBe(true);
    expect(data.detectedItems.length).toBeGreaterThan(0);

    // Verify Dosa and Sambar are present
    const names = data.detectedItems.map((i: any) => i.name);
    expect(names).toContain('Plain Dosa');
    expect(names).toContain('Vegetable Sambar');
  });

  it('should verify South Indian Dosa Tiffin Platter has correctly separated bounding boxes', () => {
    const dosaPreset = SAMPLE_MEAL_PRESETS.find((p) => p.id === 'sample-indian-1');
    expect(dosaPreset).toBeDefined();

    const dosaItem = dosaPreset!.items.find((i) => i.name === 'Plain Dosa');
    const sambarItem = dosaPreset!.items.find((i) => i.name === 'Vegetable Sambar');
    const potatoItem = dosaPreset!.items.find((i) => i.name.includes('Potato') || i.name.includes('Aloo'));

    expect(dosaItem).toBeDefined();
    expect(sambarItem).toBeDefined();
    expect(potatoItem).toBeDefined();

    // Dosa spans across the upper horizontal section (xmin: 40 to xmax: 960)
    expect(dosaItem!.box.xmin).toBeLessThanOrEqual(100);
    expect(dosaItem!.box.xmax).toBeGreaterThanOrEqual(900);
    expect(dosaItem!.box.ymin).toBeGreaterThanOrEqual(150);
    expect(dosaItem!.box.ymax).toBeLessThanOrEqual(500);

    // Sambar is inside the top-middle bowl, NOT covering the right half of the dosa
    expect(sambarItem!.box.ymin).toBeGreaterThanOrEqual(250);
    expect(sambarItem!.box.xmin).toBeGreaterThanOrEqual(500);
    expect(sambarItem!.box.xmax).toBeLessThanOrEqual(750);

    // Potato masala is on the left bowl
    expect(potatoItem!.box.xmin).toBeGreaterThanOrEqual(200);
    expect(potatoItem!.box.xmax).toBeLessThanOrEqual(520);
  });

  it('should provide fallback preset for all meal types and cuisines without crashing', () => {
    const breakfast = getFallbackPresetForContext('breakfast', true);
    expect(breakfast.items.length).toBeGreaterThanOrEqual(3);

    const lunch = getFallbackPresetForContext('lunch', true);
    expect(lunch.items.length).toBeGreaterThanOrEqual(3);

    const westernDinner = getFallbackPresetForContext('dinner', false);
    expect(westernDinner.items.length).toBeGreaterThanOrEqual(2);

    const indianStreet = getFallbackPresetForContext('snack', true);
    expect(indianStreet.items.length).toBeGreaterThanOrEqual(2);
    expect(indianStreet.name).toContain('Pav Bhaji');
  });

  it('should verify expanded food database contains newly added regional and fitness foods with complete nutrition', async () => {
    const { FOOD_DATABASE } = await import('../src/data/nutritionDb');
    expect(FOOD_DATABASE.length).toBeGreaterThan(180);

    const checkDishes = [
      'Rava Dosa',
      'Pesarattu (Moong Dal Dosa)',
      'Butter Chicken / Murgh Makhani',
      'Paneer Tikka',
      'Pav Bhaji',
      'High-Protein Roasted Sattu Drink',
      'Classic Greek Salad with Feta',
      'Grilled Chicken Caesar Salad',
    ];

    for (const name of checkDishes) {
      const match = FOOD_DATABASE.find(f => f.name.toLowerCase() === name.toLowerCase());
      expect(match, `Dish ${name} should exist in FOOD_DATABASE`).toBeDefined();
      expect(match!.calories).toBeGreaterThan(0);
      expect(match!.protein).toBeGreaterThanOrEqual(0);
      expect(match!.carbs).toBeGreaterThanOrEqual(0);
      expect(match!.fat).toBeGreaterThanOrEqual(0);
      expect(match!.sodium).toBeGreaterThanOrEqual(0);
      expect(match!.servingDescription).toBeTruthy();
    }
  });

  it('should return biryani platter on dinner mealType with isIndianMode', async () => {
    const { req, res } = createMockReqRes('POST', {
      mealType: 'dinner',
      isIndianMode: true,
    });
    await detectFoodHandler(req, res);
    expect(res.getStatusCode()).toBe(200);

    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.isFoodDetected).toBe(true);
    const names = data.detectedItems.map((i: any) => i.name);
    expect(names.some((n: string) => n.toLowerCase().includes('biryani'))).toBe(true);
  });

  it('should record user feedback corrections', async () => {
    const { req, res } = createMockReqRes('POST', {
      originalPrediction: 'Vegetable Sambar',
      selectedFood: 'Tomato Pepper Rasam',
      confidenceTier: 'medium',
      feedbackType: 'swapped_candidate',
      cuisineRegion: 'South Indian',
    });
    await feedbackHandler(req, res);
    expect(res.getStatusCode()).toBe(200);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.loggedCorrection.selectedFood).toBe('Tomato Pepper Rasam');
  });
});
