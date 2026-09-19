import { FoodItem, UserProfile, RecommendedFood, LoggedMeal, NutrientGap } from '../types';
import { INDIAN_FOOD_DATABASE, INDIAN_PLATE_PRESETS, IndianFoodEntry, searchIndianFood, findIndianFoodByName } from './indianFoodDb';

export { INDIAN_FOOD_DATABASE, INDIAN_PLATE_PRESETS, searchIndianFood, findIndianFoodByName };
export type { IndianFoodEntry };

const BASE_WESTERN_DATABASE: Omit<FoodItem, 'id' | 'portion' | 'portionMultiplier'>[] = [
  {
    name: 'Grilled Chicken Breast',
    category: 'Protein',
    servingDescription: '1 breast (150g)',
    calories: 247,
    protein: 46.5,
    carbs: 0,
    fat: 5.3,
    fiber: 0,
    sugar: 0,
    sodium: 110,
    potassium: 380,
    iron: 1.4,
  },
  {
    name: 'Atlantic Salmon Fillet',
    category: 'Protein',
    servingDescription: '1 fillet (160g)',
    calories: 332,
    protein: 34.0,
    carbs: 0,
    fat: 21.0,
    fiber: 0,
    sugar: 0,
    sodium: 95,
    potassium: 590,
    iron: 1.1,
  },
  {
    name: 'Steamed Brown Rice',
    category: 'Grains',
    servingDescription: '1 cup cooked (195g)',
    calories: 218,
    protein: 4.5,
    carbs: 45.8,
    fat: 1.6,
    fiber: 3.5,
    sugar: 0.7,
    sodium: 10,
    potassium: 84,
    iron: 0.8,
  },
  {
    name: 'Organic Quinoa',
    category: 'Grains',
    servingDescription: '1 cup cooked (185g)',
    calories: 222,
    protein: 8.1,
    carbs: 39.4,
    fat: 3.6,
    fiber: 5.2,
    sugar: 1.6,
    sodium: 13,
    potassium: 318,
    iron: 2.8,
  },
  {
    name: 'Steamed Broccoli Florets',
    category: 'Vegetables',
    servingDescription: '1 cup (91g)',
    calories: 31,
    protein: 2.6,
    carbs: 6.0,
    fat: 0.3,
    fiber: 2.4,
    sugar: 1.5,
    sodium: 30,
    potassium: 288,
    iron: 0.7,
  },
  {
    name: 'Hass Avocado',
    category: 'Healthy Fats',
    servingDescription: '1/2 medium (100g)',
    calories: 160,
    protein: 2.0,
    carbs: 8.5,
    fat: 14.7,
    fiber: 6.7,
    sugar: 0.7,
    sodium: 7,
    potassium: 485,
    iron: 0.6,
  },
  {
    name: 'Poached Eggs',
    category: 'Protein',
    servingDescription: '2 large eggs (100g)',
    calories: 144,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.9,
    fiber: 0,
    sugar: 0.4,
    sodium: 142,
    potassium: 138,
    iron: 1.8,
  },
  {
    name: 'Sourdough Bread Toast',
    category: 'Grains',
    servingDescription: '1 medium slice (50g)',
    calories: 130,
    protein: 4.0,
    carbs: 24.0,
    fat: 1.0,
    fiber: 1.2,
    sugar: 1.0,
    sodium: 210,
    potassium: 65,
    iron: 1.2,
  },
  {
    name: 'Greek Yogurt (Plain 0%)',
    category: 'Dairy',
    servingDescription: '3/4 cup (170g)',
    calories: 100,
    protein: 17.0,
    carbs: 6.0,
    fat: 0.7,
    fiber: 0,
    sugar: 6.0,
    sodium: 61,
    potassium: 240,
    iron: 0.1,
  },
  {
    name: 'Fresh Blueberries',
    category: 'Fruits',
    servingDescription: '1/2 cup (74g)',
    calories: 42,
    protein: 0.5,
    carbs: 10.7,
    fat: 0.2,
    fiber: 1.8,
    sugar: 7.3,
    sodium: 1,
    potassium: 57,
    iron: 0.2,
  },
  {
    name: 'Raw Almonds',
    category: 'Nuts',
    servingDescription: '1 oz (28g / ~23 nuts)',
    calories: 164,
    protein: 6.0,
    carbs: 6.1,
    fat: 14.2,
    fiber: 3.5,
    sugar: 1.2,
    sodium: 1,
    potassium: 208,
    iron: 1.1,
  },
  {
    name: 'Firm Tofu (Pan-seared)',
    category: 'Plant Protein',
    servingDescription: '1/2 cup (126g)',
    calories: 183,
    protein: 19.9,
    carbs: 4.3,
    fat: 11.0,
    fiber: 2.9,
    sugar: 0.8,
    sodium: 18,
    potassium: 299,
    iron: 3.4,
  },
  {
    name: 'Baby Spinach Salad',
    category: 'Vegetables',
    servingDescription: '2 cups fresh (60g)',
    calories: 14,
    protein: 1.7,
    carbs: 2.2,
    fat: 0.2,
    fiber: 1.3,
    sugar: 0.3,
    sodium: 48,
    potassium: 335,
    iron: 1.6,
  },
  {
    name: 'Sweet Potato (Roasted)',
    category: 'Vegetables',
    servingDescription: '1 medium (114g)',
    calories: 103,
    protein: 2.3,
    carbs: 23.6,
    fat: 0.2,
    fiber: 3.8,
    sugar: 7.4,
    sodium: 41,
    potassium: 542,
    iron: 0.8,
  },
  {
    name: 'Edamame (Steamed in Pod)',
    category: 'Plant Protein',
    servingDescription: '1 cup prepared (155g)',
    calories: 188,
    protein: 18.5,
    carbs: 13.8,
    fat: 8.1,
    fiber: 8.1,
    sugar: 3.4,
    sodium: 9,
    potassium: 676,
    iron: 3.5,
  },
  {
    name: 'Cooked Lentils',
    category: 'Legumes',
    servingDescription: '1/2 cup cooked (99g)',
    calories: 115,
    protein: 9.0,
    carbs: 20.0,
    fat: 0.4,
    fiber: 7.8,
    sugar: 1.8,
    sodium: 2,
    potassium: 365,
    iron: 3.3,
  },
  {
    name: 'Chia Seed Pudding',
    category: 'Breakfast',
    servingDescription: '1 jar (150g)',
    calories: 175,
    protein: 5.5,
    carbs: 18.0,
    fat: 9.0,
    fiber: 9.5,
    sugar: 4.2,
    sodium: 65,
    potassium: 210,
    iron: 2.1,
  },
  {
    name: 'Fresh Banana',
    category: 'Fruits',
    servingDescription: '1 medium (118g)',
    calories: 105,
    protein: 1.3,
    carbs: 27.0,
    fat: 0.3,
    fiber: 3.1,
    sugar: 14.4,
    sodium: 1,
    potassium: 422,
    iron: 0.3,
  },
  {
    name: 'Extra Virgin Olive Oil',
    category: 'Oils',
    servingDescription: '1 tbsp (14g)',
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    potassium: 0,
    iron: 0.1,
  },
  {
    name: 'Mixed Garden Salad with Olive Oil',
    category: 'Salads',
    servingDescription: '1 medium bowl (180g)',
    calories: 145,
    protein: 3.0,
    carbs: 8.0,
    fat: 11.5,
    fiber: 3.5,
    sugar: 3.0,
    sodium: 120,
    potassium: 320,
    iron: 1.5,
  }
];

// Convert INDIAN_FOOD_DATABASE into FoodItem compatible entries
const INDIAN_CONVERTED_FOODS: Omit<FoodItem, 'id' | 'portion' | 'portionMultiplier'>[] = INDIAN_FOOD_DATABASE.map(item => ({
  name: item.name,
  category: item.category,
  servingDescription: item.servingDescription,
  calories: item.calories,
  protein: item.protein,
  carbs: item.carbs,
  fat: item.fat,
  fiber: item.fiber,
  sugar: item.sugar,
  sodium: item.sodium,
  potassium: item.potassium,
  iron: item.iron,
  cuisineRegion: item.cuisineRegion,
  isHighProtein: item.isHighProtein,
  similarCandidates: item.visuallySimilarTo,
  regionalNames: item.regionalNames,
  healthNote: item.healthNote,
}));

export const FOOD_DATABASE: Omit<FoodItem, 'id' | 'portion' | 'portionMultiplier'>[] = [
  ...BASE_WESTERN_DATABASE,
  ...INDIAN_CONVERTED_FOODS,
];

export const SAMPLE_MEAL_PRESETS = [
  {
    id: 'sample-indian-1',
    name: 'South Indian Dosa Tiffin Platter',
    mealType: 'breakfast' as const,
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
    description: 'Crispy fermented crepe served with vegetable lentil sambar, fresh coconut chutney, and tomato chutney.',
    isIndianPlate: true,
    cuisineRegion: 'South Indian' as const,
    items: [
      {
        name: 'Plain Dosa',
        portion: 'medium' as const,
        confidenceTier: 'high' as const,
        confidence: 0.88,
        similarCandidates: ['Masala Dosa', 'Rava Dosa'],
        box: { ymin: 150, xmin: 80, ymax: 750, xmax: 550 },
      },
      {
        name: 'Vegetable Sambar',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.68,
        similarCandidates: ['Tomato Pepper Rasam', 'Yellow Dal Tadka'],
        box: { ymin: 120, xmin: 580, ymax: 420, xmax: 900 },
      },
      {
        name: 'Fresh Coconut Chutney',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.72,
        similarCandidates: ['Plain Curd / Dahi', 'Cucumber Raita'],
        box: { ymin: 440, xmin: 580, ymax: 680, xmax: 920 },
      },
      {
        name: 'Spicy Tomato Chutney',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.64,
        similarCandidates: ['Fresh Coconut Chutney', 'Mint-Coriander Chutney'],
        box: { ymin: 690, xmin: 580, ymax: 910, xmax: 920 },
      },
    ]
  },
  {
    id: 'sample-indian-2',
    name: 'North Indian Deluxe Thali',
    mealType: 'lunch' as const,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    description: 'Whole wheat phulkas, paneer butter masala, slow-simmered dal makhani, steamed rice, and cucumber raita.',
    isIndianPlate: true,
    cuisineRegion: 'North Indian' as const,
    items: [
      {
        name: 'Whole Wheat Roti / Phulka',
        portion: 'medium' as const,
        confidenceTier: 'high' as const,
        confidence: 0.88,
        similarCandidates: ['Layered Tawa Paratha', 'Butter Naan'],
        box: { ymin: 460, xmin: 100, ymax: 880, xmax: 450 },
      },
      {
        name: 'Paneer Butter Masala',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.76,
        similarCandidates: ['Palak Paneer', 'Homestyle Chicken Curry'],
        box: { ymin: 100, xmin: 100, ymax: 440, xmax: 420 },
      },
      {
        name: 'Dal Makhani',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.74,
        similarCandidates: ['Yellow Dal Tadka', 'Rajma Masala'],
        box: { ymin: 80, xmin: 450, ymax: 420, xmax: 760 },
      },
      {
        name: 'Steamed Rice',
        portion: 'medium' as const,
        confidenceTier: 'high' as const,
        confidence: 0.89,
        similarCandidates: ['Vegetable Pulao', 'Curd Rice'],
        box: { ymin: 440, xmin: 460, ymax: 850, xmax: 760 },
      },
      {
        name: 'Cucumber Raita',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.62,
        similarCandidates: ['Plain Curd / Dahi'],
        box: { ymin: 220, xmin: 770, ymax: 560, xmax: 950 },
      },
    ]
  },
  {
    id: 'sample-indian-3',
    name: 'South Indian Idli-Vada Combo',
    mealType: 'breakfast' as const,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    description: 'Steamed fermented rice cakes and crispy urad dal medu vada served with hot sambar and fresh coconut chutney.',
    isIndianPlate: true,
    cuisineRegion: 'South Indian' as const,
    items: [
      {
        name: 'Steamed Idli',
        portion: 'medium' as const,
        confidenceTier: 'high' as const,
        confidence: 0.86,
        similarCandidates: ['Crispy Medu Vada'],
        box: { ymin: 180, xmin: 120, ymax: 600, xmax: 500 },
      },
      {
        name: 'Crispy Medu Vada',
        portion: 'small' as const,
        confidenceTier: 'high' as const,
        confidence: 0.85,
        similarCandidates: ['Steamed Idli'],
        box: { ymin: 520, xmin: 200, ymax: 880, xmax: 560 },
      },
      {
        name: 'Vegetable Sambar',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.68,
        similarCandidates: ['Tomato Pepper Rasam', 'Yellow Dal Tadka'],
        box: { ymin: 120, xmin: 560, ymax: 450, xmax: 900 },
      },
      {
        name: 'Fresh Coconut Chutney',
        portion: 'medium' as const,
        confidenceTier: 'medium' as const,
        confidence: 0.72,
        similarCandidates: ['Plain Curd / Dahi', 'Cucumber Raita'],
        box: { ymin: 480, xmin: 580, ymax: 780, xmax: 920 },
      },
    ]
  },
  {
    id: 'sample-1',
    name: 'Mediterranean Salmon & Quinoa Bowl',
    mealType: 'dinner' as const,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    description: 'Fresh grilled salmon over fluffy quinoa, avocado slices, and crisp greens.',
    items: [
      {
        name: 'Atlantic Salmon Fillet',
        portion: 'medium' as const,
        box: { ymin: 220, xmin: 240, ymax: 680, xmax: 650 },
      },
      {
        name: 'Organic Quinoa',
        portion: 'medium' as const,
        box: { ymin: 450, xmin: 120, ymax: 820, xmax: 480 },
      },
      {
        name: 'Hass Avocado',
        portion: 'small' as const,
        box: { ymin: 150, xmin: 520, ymax: 480, xmax: 850 },
      },
      {
        name: 'Baby Spinach Salad',
        portion: 'medium' as const,
        box: { ymin: 480, xmin: 460, ymax: 860, xmax: 880 },
      },
    ]
  },
  {
    id: 'sample-2',
    name: 'Poached Eggs & Avocado Toast',
    mealType: 'breakfast' as const,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    description: 'Two organic poached eggs over mashed avocado on artisan sourdough toast.',
    items: [
      {
        name: 'Poached Eggs',
        portion: 'medium' as const,
        box: { ymin: 280, xmin: 310, ymax: 640, xmax: 690 },
      },
      {
        name: 'Hass Avocado',
        portion: 'small' as const,
        box: { ymin: 200, xmin: 200, ymax: 750, xmax: 790 },
      },
      {
        name: 'Sourdough Bread Toast',
        portion: 'medium' as const,
        box: { ymin: 150, xmin: 150, ymax: 850, xmax: 850 },
      },
    ]
  },
  {
    id: 'sample-3',
    name: 'Grilled Chicken & Steamed Broccoli',
    mealType: 'lunch' as const,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    description: 'Herb-seasoned grilled chicken breast with steamed broccoli florets and brown rice.',
    items: [
      {
        name: 'Grilled Chicken Breast',
        portion: 'medium' as const,
        box: { ymin: 180, xmin: 150, ymax: 620, xmax: 560 },
      },
      {
        name: 'Steamed Broccoli Florets',
        portion: 'large' as const,
        box: { ymin: 160, xmin: 520, ymax: 650, xmax: 880 },
      },
      {
        name: 'Steamed Brown Rice',
        portion: 'medium' as const,
        box: { ymin: 520, xmin: 280, ymax: 880, xmax: 720 },
      },
    ]
  },
  {
    id: 'sample-4',
    name: 'Greek Yogurt & Wild Berry Parfait',
    mealType: 'snack' as const,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    description: 'High-protein Greek yogurt topped with fresh blueberries and raw almonds.',
    items: [
      {
        name: 'Greek Yogurt (Plain 0%)',
        portion: 'medium' as const,
        box: { ymin: 200, xmin: 220, ymax: 800, xmax: 780 },
      },
      {
        name: 'Fresh Blueberries',
        portion: 'medium' as const,
        box: { ymin: 180, xmin: 280, ymax: 500, xmax: 680 },
      },
      {
        name: 'Raw Almonds',
        portion: 'small' as const,
        box: { ymin: 360, xmin: 480, ymax: 620, xmax: 740 },
      },
    ]
  }
];

export const RECOMMENDED_FOODS: RecommendedFood[] = [
  {
    id: 'rec-1',
    name: 'Greek Yogurt with Crushed Almonds',
    calories: 170,
    protein: 19.0,
    carbs: 7.0,
    fat: 6.5,
    fiber: 1.5,
    sodium: 65,
    servingSize: '1 bowl (190g)',
    highlightNutrient: '+19g Clean Protein',
    healthBenefit: 'High casein protein for steady muscle preservation with probiotic gut benefits.',
    dietTags: ['Vegetarian', 'Gluten-Free', 'High Protein'],
    allergens: ['Dairy', 'Tree nuts'],
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-2',
    name: 'Steamed Edamame Pods',
    calories: 188,
    protein: 18.5,
    carbs: 13.8,
    fat: 8.1,
    fiber: 8.1,
    sodium: 12,
    servingSize: '1 bowl (150g)',
    highlightNutrient: '+8g Fiber & +18g Protein',
    healthBenefit: 'Plant-based complete amino acids and soluble prebiotic fiber that stabilizes blood sugar.',
    dietTags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'High Fiber'],
    allergens: ['Soy'],
    imageUrl: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-3',
    name: 'Chia Seed Berry Pudding',
    calories: 165,
    protein: 5.5,
    carbs: 16.0,
    fat: 8.5,
    fiber: 9.8,
    sodium: 40,
    servingSize: '1 cup (150g)',
    highlightNutrient: '+9.8g Prebiotic Fiber',
    healthBenefit: 'Omega-3 fatty acids and soluble mucilage fiber that aids gut motility and cholesterol reduction.',
    dietTags: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Gluten-Free'],
    allergens: [],
    imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-4',
    name: 'Roasted Sweet Potato Wedges',
    calories: 110,
    protein: 2.2,
    carbs: 25.0,
    fat: 0.3,
    fiber: 4.0,
    sodium: 45,
    servingSize: '1 medium (120g)',
    highlightNutrient: '+540mg Potassium & Low Sodium',
    healthBenefit: 'Potassium counterbalances sodium in the body, promoting healthy arterial pressure.',
    dietTags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Low Sodium'],
    allergens: [],
    imageUrl: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-5',
    name: 'Organic Pan-seared Tofu Bites',
    calories: 175,
    protein: 19.0,
    carbs: 4.0,
    fat: 10.0,
    fiber: 2.8,
    sodium: 25,
    servingSize: '1 serving (120g)',
    highlightNutrient: '+19g Plant Protein',
    healthBenefit: 'Naturally cholesterol-free protein with calcium and iron for vascular vitality.',
    dietTags: ['Vegan', 'Vegetarian', 'Gluten-Free'],
    allergens: ['Soy'],
    imageUrl: 'https://images.unsplash.com/photo-1546069901-5ec6a79120b0?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-6',
    name: 'Wild Atlantic Salmon & Spinach Salad',
    calories: 285,
    protein: 31.0,
    carbs: 4.0,
    fat: 16.0,
    fiber: 2.5,
    sodium: 110,
    servingSize: '1 plate (200g)',
    highlightNutrient: '+31g Lean Protein & Omega-3s',
    healthBenefit: 'EPA & DHA omega-3 fatty acids that support heart rhythm and reduce systemic inflammation.',
    dietTags: ['Pescatarian', 'Gluten-Free', 'Low Carb'],
    allergens: ['Fish'],
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-7',
    name: 'Golden Lentil Soup Bowl',
    calories: 160,
    protein: 11.0,
    carbs: 27.0,
    fat: 1.2,
    fiber: 8.5,
    sodium: 180,
    servingSize: '1 bowl (240ml)',
    highlightNutrient: '+8.5g Fiber & +3.2mg Iron',
    healthBenefit: 'Iron-rich legumes promote oxygen transport in hemoglobin without saturated animal fats.',
    dietTags: ['Vegan', 'Vegetarian', 'Gluten-Free'],
    allergens: [],
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-ind-1',
    name: 'Sprouted Moong & Chana Sundal',
    calories: 165,
    protein: 12.5,
    carbs: 22.0,
    fat: 3.5,
    fiber: 7.2,
    sodium: 140,
    servingSize: '1 bowl (160g)',
    highlightNutrient: '+12.5g Plant Protein & 7g Fiber',
    healthBenefit: 'South Indian tempered sprouted lentils with mustard seeds and curry leaves. Exceptional for gut microbiome and steady glucose.',
    dietTags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'South Indian', 'High Protein'],
    allergens: [],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-ind-2',
    name: 'Grilled Paneer Tikka / Bhurji',
    calories: 220,
    protein: 18.2,
    carbs: 6.0,
    fat: 14.5,
    fiber: 1.8,
    sodium: 190,
    servingSize: '1 bowl (150g)',
    highlightNutrient: '+18g Complete Dairy Protein',
    healthBenefit: 'Slow-digesting casein protein rich in calcium and phosphorus, perfect for maintaining satiety and muscle preservation.',
    dietTags: ['Vegetarian', 'Gluten-Free', 'North Indian', 'High Protein'],
    allergens: ['Dairy'],
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-ind-3',
    name: 'High-Protein Soya Chunks Curry',
    calories: 195,
    protein: 24.0,
    carbs: 12.0,
    fat: 4.5,
    fiber: 6.5,
    sodium: 220,
    servingSize: '1 cup (180g)',
    highlightNutrient: '+24g Ultra-Dense Plant Protein',
    healthBenefit: 'Over 50% protein by dry weight with complete amino acid profile, low saturated fat, and zero cholesterol.',
    dietTags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Pan-Indian', 'High Protein'],
    allergens: ['Soy'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-ind-4',
    name: 'Spiced Egg Podimas / Scramble',
    calories: 175,
    protein: 14.0,
    carbs: 2.5,
    fat: 12.0,
    fiber: 0.8,
    sodium: 210,
    servingSize: '2 eggs with onions (~130g)',
    highlightNutrient: '+14g High Bioavailability Protein',
    healthBenefit: 'Complete protein with choline for neurological health and lutein for vision protection.',
    dietTags: ['Non-Vegetarian', 'Gluten-Free', 'South Indian', 'High Protein'],
    allergens: ['Egg'],
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
  }
];

export interface ProteinBreakdownItem {
  name: string;
  protein: number;
  portion: string;
  isHighProtein: boolean;
  percentage: number;
}

export function calculateProteinBreakdown(items: FoodItem[]): {
  items: ProteinBreakdownItem[];
  totalProtein: number;
  highProteinItems: ProteinBreakdownItem[];
  lowProteinItems: ProteinBreakdownItem[];
  summarySentence: string;
} {
  const totalProtein = Number(items.reduce((acc, i) => acc + (i.protein || 0), 0).toFixed(1));
  const breakdownItems: ProteinBreakdownItem[] = items.map(item => {
    const proteinVal = Number((item.protein || 0).toFixed(1));
    const isHigh = item.isHighProtein ?? (proteinVal >= 8);
    return {
      name: item.name,
      protein: proteinVal,
      portion: item.servingDescription || item.portion,
      isHighProtein: isHigh,
      percentage: totalProtein > 0 ? Math.round((proteinVal / totalProtein) * 100) : 0,
    };
  });

  const highProteinItems = breakdownItems.filter(i => i.isHighProtein);
  const lowProteinItems = breakdownItems.filter(i => !i.isHighProtein);

  const parts = items
    .filter(i => (i.protein || 0) > 0)
    .map(i => `${i.name} (${Number(i.protein.toFixed(1))}g protein)`);

  const summarySentence = parts.length > 0
    ? `${parts.join(' + ')} = ${totalProtein}g protein total`
    : `${totalProtein}g protein total`;

  return {
    items: breakdownItems,
    totalProtein,
    highProteinItems,
    lowProteinItems,
    summarySentence,
  };
}

// Calculation Helpers
export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: UserProfile['bmiCategory'] } {
  if (heightCm <= 0 || weightKg <= 0) return { bmi: 22.0, category: 'Normal weight' };
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  let category: UserProfile['bmiCategory'] = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25.0) category = 'Normal weight';
  else if (bmi < 30.0) category = 'Overweight';
  else category = 'Obesity';
  return { bmi, category };
}

export function calculateTargets(profile: Partial<UserProfile>): UserProfile['targets'] {
  const weight = profile.weightKg || 70;
  const height = profile.heightCm || 172;
  const age = profile.age || 29;
  const gender = profile.gender || 'female';
  const activity = profile.lifestyle?.activityLevel || 'moderate';

  // Mifflin-St Jeor Formula
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };

  const tdee = Math.round(bmr * multipliers[activity]);
  const calories = Math.max(1400, Math.min(3400, tdee));

  // Protein targets: 1.6g - 2.0g per kg for active, 1.2g baseline
  let proteinFactor = 1.3;
  if (activity === 'very_active') proteinFactor = 1.8;
  else if (activity === 'moderate') proteinFactor = 1.5;
  const protein = Math.round(weight * proteinFactor);

  // Fat targets: 25-30% of calories
  const fatCalories = calories * 0.28;
  const fat = Math.round(fatCalories / 9);

  // Carbs: remainder
  const carbCalories = calories - (protein * 4 + fat * 9);
  const carbs = Math.max(120, Math.round(carbCalories / 4));

  // Medical conditions adjustments:
  const isHighBP = (profile.medical?.systolicBP && profile.medical.systolicBP > 130) || false;
  const sodiumTarget = isHighBP ? 1800 : 2300;

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber: 30, // standard clinical target (28-35g)
    sugar: 40,
    sodium: sodiumTarget,
    potassium: 3500,
    iron: gender === 'female' ? 18 : 10,
    waterMl: 2500,
  };
}

export function getPortionMultiplier(portion: FoodItem['portion']): number {
  switch (portion) {
    case 'small':
      return 0.7;
    case 'large':
      return 1.4;
    case 'medium':
    default:
      return 1.0;
  }
}

export function calculateItemNutrition(base: Omit<FoodItem, 'id' | 'portion' | 'portionMultiplier'>, portion: FoodItem['portion']): FoodItem {
  const mult = getPortionMultiplier(portion);
  return {
    id: 'food-' + Math.random().toString(36).substring(2, 9),
    name: base.name,
    category: base.category,
    portion,
    portionMultiplier: mult,
    servingDescription: base.servingDescription,
    calories: Math.round(base.calories * mult),
    protein: Number((base.protein * mult).toFixed(1)),
    carbs: Number((base.carbs * mult).toFixed(1)),
    fat: Number((base.fat * mult).toFixed(1)),
    fiber: Number((base.fiber * mult).toFixed(1)),
    sugar: Number((base.sugar * mult).toFixed(1)),
    sodium: Math.round(base.sodium * mult),
    potassium: base.potassium ? Math.round(base.potassium * mult) : undefined,
    iron: base.iron ? Number((base.iron * mult).toFixed(1)) : undefined,
  };
}

// Compute Nutrient Gaps
export function computeNutrientGaps(
  input: { calories: number; protein: number; fiber: number; sodium: number; carbs: number; fat: number } | LoggedMeal[],
  targets: UserProfile['targets'],
  dietPref: string = 'any',
  allergies: string[] = [],
  regionalPref?: string
): NutrientGap[] {
  let totals: { calories: number; protein: number; fiber: number; sodium: number; carbs: number; fat: number };

  if (Array.isArray(input)) {
    totals = {
      calories: input.reduce((acc, m) => acc + m.totalCalories, 0),
      protein: input.reduce((acc, m) => acc + m.totalProtein, 0),
      fiber: input.reduce((acc, m) => acc + m.totalFiber, 0),
      sodium: input.reduce((acc, m) => acc + m.totalSodium, 0),
      carbs: input.reduce((acc, m) => acc + m.totalCarbs, 0),
      fat: input.reduce((acc, m) => acc + m.totalFat, 0),
    };
  } else {
    totals = input;
  }

  const gaps: NutrientGap[] = [];

  // Filter recommendations matching user's diet and allergies
  const filterRecs = (nutrientFocus: 'protein' | 'fiber' | 'sodium' | 'potassium') => {
    return RECOMMENDED_FOODS.filter(item => {
      // Check allergy collision
      const hasAllergen = item.allergens.some(a => allergies.includes(a));
      if (hasAllergen) return false;

      // Check diet preference
      if (dietPref === 'vegetarian' && !item.dietTags.includes('Vegetarian') && !item.dietTags.includes('Vegan')) return false;
      if (dietPref === 'vegan' && !item.dietTags.includes('Vegan')) return false;
      if (dietPref === 'pescatarian' && !item.dietTags.includes('Pescatarian') && !item.dietTags.includes('Vegetarian') && !item.dietTags.includes('Vegan')) return false;

      if (nutrientFocus === 'protein') return item.protein >= 12;
      if (nutrientFocus === 'fiber') return item.fiber >= 4;
      if (nutrientFocus === 'sodium') return item.sodium <= 100;
      return true;
    }).sort((a, b) => {
      if (regionalPref && regionalPref !== 'Global') {
        const aHasRegion = a.dietTags.includes(regionalPref) || a.dietTags.includes('Pan-Indian');
        const bHasRegion = b.dietTags.includes(regionalPref) || b.dietTags.includes('Pan-Indian');
        if (aHasRegion && !bHasRegion) return -1;
        if (!aHasRegion && bHasRegion) return 1;
      }
      return 0;
    }).slice(0, 4);
  };

  // 1. Protein Gap
  const proteinDeficit = targets.protein - totals.protein;
  if (proteinDeficit > 15) {
    let actionableTip = 'Adding lean poultry, edamame, or Greek yogurt to your next meal will help maintain muscle tone and satiety.';
    if (regionalPref === 'South Indian') {
      actionableTip = 'Adding Sprouted Moong Sundal, Toor Dal Sambar, or Egg Podimas to your next meal will quickly hit your target with familiar local staples.';
    } else if (regionalPref === 'North Indian') {
      actionableTip = 'Adding Grilled Paneer Tikka, Soya Chunks Curry, or Dal Makhani to your next meal will provide dense protein with authentic North Indian staples.';
    } else if (regionalPref === 'Pan-Indian') {
      actionableTip = 'Adding Moong Dal, Soya Chunks, fresh Paneer, or double Curd/Raita to your plate will effectively close your protein deficit.';
    }

    gaps.push({
      nutrient: 'protein',
      name: 'Protein',
      status: 'deficit',
      current: totals.protein,
      target: targets.protein,
      unit: 'g',
      summary: `You're ${Math.round(proteinDeficit)}g low on protein today`,
      actionableTip,
      suggestedFoods: filterRecs('protein'),
    });
  }

  // 2. Fiber Gap
  const fiberDeficit = targets.fiber - totals.fiber;
  if (fiberDeficit > 10) {
    gaps.push({
      nutrient: 'fiber',
      name: 'Dietary Fiber',
      status: 'deficit',
      current: totals.fiber,
      target: targets.fiber,
      unit: 'g',
      summary: `You're ${Math.round(fiberDeficit)}g under your daily fiber target`,
      actionableTip: 'Whole chia seeds, steamed edamame, and broccoli boost gut motility and steady glucose release.',
      suggestedFoods: filterRecs('fiber'),
    });
  }

  // 3. Sodium Excess
  if (totals.sodium > targets.sodium) {
    const sodiumExcess = totals.sodium - targets.sodium;
    gaps.push({
      nutrient: 'sodium',
      name: 'Sodium',
      status: 'excess',
      current: totals.sodium,
      target: targets.sodium,
      unit: 'mg',
      summary: `Sodium is ${Math.round(sodiumExcess)}mg above your recommended limit`,
      actionableTip: 'Balance sodium by drinking fresh water and enjoying potassium-rich foods like roasted sweet potatoes or avocados.',
      suggestedFoods: filterRecs('sodium'),
    });
  }

  // If no critical gaps, provide positive balance suggestion
  if (gaps.length === 0) {
    gaps.push({
      nutrient: 'protein',
      name: 'Nutrient Balance',
      status: 'balanced',
      current: totals.protein,
      target: targets.protein,
      unit: 'g',
      summary: "Your daily nutrients are well on target!",
      actionableTip: 'Keep up this consistent rhythm with fresh whole foods and plenty of hydration.',
      suggestedFoods: filterRecs('protein').slice(0, 3),
    });
  }

  return gaps;
}

// Initial default user profile
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user-default-1',
  name: 'Alex Morgan',
  email: 'alex.morgan@health.me',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  heightCm: 175,
  weightKg: 68,
  age: 28,
  gender: 'female',
  bmi: 22.2,
  bmiCategory: 'Normal weight',
  medical: {
    systolicBP: 118,
    diastolicBP: 78,
    bloodSugar: 92,
    cholesterol: 184,
  },
  lifestyle: {
    activityLevel: 'moderate',
    sleepHours: 7.5,
    dietaryPreference: 'any',
    allergies: [],
    healthGoals: ['Sustain High Energy', 'Hit Daily Protein', 'Keep Sodium Balanced'],
  },
  targets: {
    calories: 2150,
    protein: 110,
    carbs: 235,
    fat: 65,
    fiber: 30,
    sugar: 40,
    sodium: 2100,
    potassium: 3500,
    iron: 18,
    waterMl: 2500,
  },
  unitSystem: 'metric',
  notifications: {
    mealReminders: true,
    waterReminders: true,
    weeklyReport: true,
  },
  onboardingCompleted: true,
};

// Seed realistic meals for the past 7 days to empower rich charts and doctor health reports right away
export function generateSeedMeals(): LoggedMeal[] {
  const today = new Date().toISOString().split('T')[0];
  
  // Sample meals for today
  const m1 = calculateItemNutrition(FOOD_DATABASE[6], 'medium'); // Poached eggs
  const m2 = calculateItemNutrition(FOOD_DATABASE[7], 'medium'); // Sourdough
  const m3 = calculateItemNutrition(FOOD_DATABASE[5], 'small'); // Avocado
  const breakfastItems = [m1, m2, m3];

  const l1 = calculateItemNutrition(FOOD_DATABASE[0], 'medium'); // Grilled Chicken
  const l2 = calculateItemNutrition(FOOD_DATABASE[4], 'large'); // Steamed broccoli
  const l3 = calculateItemNutrition(FOOD_DATABASE[2], 'medium'); // Brown rice
  const lunchItems = [l1, l2, l3];

  const s1 = calculateItemNutrition(FOOD_DATABASE[8], 'medium'); // Greek yogurt
  const s2 = calculateItemNutrition(FOOD_DATABASE[9], 'medium'); // Blueberries
  const snackItems = [s1, s2];

  const d1 = calculateItemNutrition(FOOD_DATABASE[1], 'medium'); // Salmon
  const d2 = calculateItemNutrition(FOOD_DATABASE[3], 'medium'); // Quinoa
  const d3 = calculateItemNutrition(FOOD_DATABASE[12], 'medium'); // Spinach salad
  const dinnerItems = [d1, d2, d3];

  const createMeal = (id: string, date: string, time: string, type: LoggedMeal['mealType'], title: string, items: FoodItem[], leftoverPct: number = 0, img?: string): LoggedMeal => {
    // If leftovers, actual is scaled
    const multiplier = (100 - leftoverPct) / 100;
    const actualItems = items.map(item => ({
      ...item,
      calories: Math.round(item.calories * multiplier),
      protein: Number((item.protein * multiplier).toFixed(1)),
      carbs: Number((item.carbs * multiplier).toFixed(1)),
      fat: Number((item.fat * multiplier).toFixed(1)),
      fiber: Number((item.fiber * multiplier).toFixed(1)),
      sodium: Math.round(item.sodium * multiplier),
    }));

    return {
      id,
      date,
      time,
      mealType: type,
      title,
      imageUrl: img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      servedItems: items,
      actualItems,
      leftoverPercent: leftoverPct,
      totalCalories: actualItems.reduce((acc, i) => acc + i.calories, 0),
      totalProtein: Number(actualItems.reduce((acc, i) => acc + i.protein, 0).toFixed(1)),
      totalCarbs: Number(actualItems.reduce((acc, i) => acc + i.carbs, 0).toFixed(1)),
      totalFat: Number(actualItems.reduce((acc, i) => acc + i.fat, 0).toFixed(1)),
      totalFiber: Number(actualItems.reduce((acc, i) => acc + i.fiber, 0).toFixed(1)),
      totalSodium: actualItems.reduce((acc, i) => acc + i.sodium, 0),
    };
  };

  const meals: LoggedMeal[] = [];
  
  // Today's meals: breakfast + lunch logged, dinner pending or logged
  meals.push(createMeal('meal-today-1', today, '08:15', 'breakfast', 'Poached Eggs & Avocado Toast', breakfastItems, 0, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'));
  meals.push(createMeal('meal-today-2', today, '13:00', 'lunch', 'Grilled Chicken & Steamed Broccoli', lunchItems, 10, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80'));
  meals.push(createMeal('meal-today-3', today, '16:30', 'snack', 'Wild Blueberry Greek Yogurt', snackItems, 0, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80'));

  // Historical meals for the past 6 days
  for (let i = 1; i <= 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    meals.push(createMeal(`meal-hist-${i}-1`, dateStr, '08:30', 'breakfast', 'Poached Eggs & Sourdough Toast', breakfastItems, 0, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'));
    meals.push(createMeal(`meal-hist-${i}-2`, dateStr, '12:45', 'lunch', 'Brown Rice & Chicken Bowl', lunchItems, i % 2 === 0 ? 15 : 0, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80'));
    meals.push(createMeal(`meal-hist-${i}-3`, dateStr, '19:15', 'dinner', 'Atlantic Salmon & Quinoa Bowl', dinnerItems, 0, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'));
  }

  return meals;
}

export const SEED_MEALS = generateSeedMeals();
