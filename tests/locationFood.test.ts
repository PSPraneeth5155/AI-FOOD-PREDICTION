import { describe, it, expect } from 'vitest';
import {
  getAvailableCountries,
  getStatesForCountry,
  getFoodsForLocation,
  searchLocationFoods,
  convertLocalizedToFoodItem,
} from '../src/data/locationFoodData';

describe('Location-Based Food Selection Service', () => {
  it('should list global countries with flags and states', () => {
    const countries = getAvailableCountries();
    expect(countries.length).toBeGreaterThanOrEqual(10);

    const india = countries.find((c) => c.name === 'India');
    expect(india).toBeDefined();
    expect(india?.flag).toBe('🇮🇳');
    expect(india?.states.length).toBeGreaterThanOrEqual(10);

    const usa = countries.find((c) => c.name === 'United States');
    expect(usa).toBeDefined();
    expect(usa?.flag).toBe('🇺🇸');

    const italy = countries.find((c) => c.name === 'Italy');
    expect(italy).toBeDefined();
    expect(italy?.flag).toBe('🇮🇹');

    const japan = countries.find((c) => c.name === 'Japan');
    expect(japan).toBeDefined();
    expect(japan?.flag).toBe('🇯🇵');
  });

  it('should resolve states for a selected country', () => {
    const indiaStates = getStatesForCountry('India');
    const stateNames = indiaStates.map((s) => s.name);
    expect(stateNames).toContain('Telangana');
    expect(stateNames).toContain('Tamil Nadu');
    expect(stateNames).toContain('Punjab');
    expect(stateNames).toContain('Maharashtra');

    const usStates = getStatesForCountry('United States');
    const usNames = usStates.map((s) => s.name);
    expect(usNames).toContain('California');
    expect(usNames).toContain('Texas');
  });

  it('should filter dishes strictly by Country and State', () => {
    const telanganaFoods = getFoodsForLocation('India', 'Telangana');
    expect(telanganaFoods.length).toBeGreaterThan(0);
    expect(telanganaFoods.every((d) => d.state === 'Telangana')).toBe(true);
    expect(telanganaFoods.some((d) => d.name.includes('Biryani'))).toBe(true);

    const punjabFoods = getFoodsForLocation('India', 'Punjab');
    expect(punjabFoods.length).toBeGreaterThan(0);
    expect(punjabFoods.some((d) => d.name.includes('Saag') || d.name.includes('Chole'))).toBe(true);

    const calFoods = getFoodsForLocation('United States', 'California');
    expect(calFoods.length).toBeGreaterThan(0);
    expect(calFoods.some((d) => d.name.includes('Avocado') || d.name.includes('Salmon'))).toBe(true);

    const naplesFoods = getFoodsForLocation('Italy', 'Campania');
    expect(naplesFoods.length).toBeGreaterThan(0);
    expect(naplesFoods.some((d) => d.name.includes('Margherita'))).toBe(true);
  });

  it('should support regional search within a state or across country', () => {
    const results = searchLocationFoods('dosa', 'India', 'Tamil Nadu');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain('dosa');

    const sushi = searchLocationFoods('sushi', 'Japan', 'Tokyo');
    expect(sushi.length).toBeGreaterThan(0);
    expect(sushi[0].name.toLowerCase()).toContain('sushi');
  });

  it('should convert localized dish to FoodItem with accurate portion scaling', () => {
    const dishes = getFoodsForLocation('India', 'Telangana');
    const biryani = dishes[0];

    const standardPortion = convertLocalizedToFoodItem(biryani, 'medium');
    expect(standardPortion.calories).toBe(biryani.calories);
    expect(standardPortion.protein).toBe(biryani.protein);
    expect(standardPortion.state).toBe('Telangana');

    const smallPortion = convertLocalizedToFoodItem(biryani, 'small');
    expect(smallPortion.calories).toBeLessThan(standardPortion.calories);

    const largePortion = convertLocalizedToFoodItem(biryani, 'large');
    expect(largePortion.calories).toBeGreaterThan(standardPortion.calories);
  });
});
