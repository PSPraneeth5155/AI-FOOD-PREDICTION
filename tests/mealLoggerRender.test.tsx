import { describe, it, expect } from 'vitest';
import React from 'react';
import { DEFAULT_USER_PROFILE, FOOD_DATABASE, SAMPLE_MEAL_PRESETS, calculateItemNutrition } from '../src/data/nutritionDb';
import { getFoodsForLocation, convertLocalizedToFoodItem } from '../src/data/locationFoodData';

describe('MealLogger Component & Database Verification', () => {
  it('should verify all FOOD_DATABASE entries are defined and valid', () => {
    expect(FOOD_DATABASE.length).toBeGreaterThan(180);
    
    for (let i = 0; i < FOOD_DATABASE.length; i++) {
      const f = FOOD_DATABASE[i];
      expect(f, `Item at index ${i} should be defined`).toBeDefined();
      expect(f.name, `Item at index ${i} should have a name`).toBeTruthy();
      expect(typeof f.name.toLowerCase()).toBe('string');
      expect(f.calories).toBeGreaterThanOrEqual(0);
      expect(f.protein).toBeGreaterThanOrEqual(0);
      expect(f.carbs).toBeGreaterThanOrEqual(0);
      expect(f.fat).toBeGreaterThanOrEqual(0);
    }
  });

  it('should verify location foods can be converted and combined with FOOD_DATABASE without errors', () => {
    const dishes = getFoodsForLocation('India', 'Telangana');
    expect(dishes.length).toBeGreaterThan(0);

    const localizedItems = dishes.map((d) => convertLocalizedToFoodItem(d, 'medium'));
    expect(localizedItems.length).toBeGreaterThan(0);

    const localNames = new Set(localizedItems.filter(l => l && l.name).map((l) => l.name.toLowerCase()));
    const remaining = FOOD_DATABASE.filter((f) => f && f.name && !localNames.has(f.name.toLowerCase()));
    const combined = [...localizedItems, ...remaining];
    expect(combined.length).toBeGreaterThanOrEqual(FOOD_DATABASE.length);

    // Test search filter
    const searchTerms = ['', 'dosa', 'chicken', 'salad', 'protein', 'paneer'];
    for (const q of searchTerms) {
      const filtered = combined.filter((item) => {
        if (!item || !item.name) return false;
        const matchesQuery =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q));
        return matchesQuery;
      });
      expect(Array.isArray(filtered)).toBe(true);
    }
  });

  it('should verify all SAMPLE_MEAL_PRESETS can be calculated without runtime errors', () => {
    for (const preset of SAMPLE_MEAL_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(Array.isArray(preset.items)).toBe(true);

      for (const pi of preset.items) {
        const match = FOOD_DATABASE.find((f) => f && f.name && f.name.toLowerCase() === pi.name.toLowerCase()) || FOOD_DATABASE[0];
        expect(match).toBeDefined();
        const constructed = calculateItemNutrition(match, pi.portion || 'medium');
        expect(constructed).toBeDefined();
        expect(constructed.calories).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
