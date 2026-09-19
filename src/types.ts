export type Gender = 'female' | 'male' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type DietPreference = 'any' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'low_sodium';
export type PortionSize = 'small' | 'medium' | 'large';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MedicalProfile {
  systolicBP?: number; // e.g. 120
  diastolicBP?: number; // e.g. 80
  bloodSugar?: number; // mg/dL fasting
  cholesterol?: number; // mg/dL total
}

export interface UserTargets {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
  potassium: number; // mg
  iron: number; // mg
  waterMl: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
  medical: MedicalProfile;
  lifestyle: {
    activityLevel: ActivityLevel;
    sleepHours: number;
    dietaryPreference: DietPreference;
    allergies: string[];
    healthGoals: string[];
    regionalPreference?: 'South Indian' | 'North Indian' | 'East Indian' | 'West Indian' | 'Pan-Indian' | 'Global';
  };
  targets: UserTargets;
  unitSystem: 'metric' | 'imperial';
  notifications: {
    mealReminders: boolean;
    waterReminders: boolean;
    weeklyReport: boolean;
  };
  onboardingCompleted: boolean;
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  portion: PortionSize;
  portionMultiplier: number;
  servingDescription: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
  potassium?: number; // mg
  iron?: number; // mg
  box?: BoundingBox;
  confidence?: number; // Internal model score (never shown to user directly)
  confidenceTier?: 'high' | 'medium' | 'low'; // High (>80%), Medium (50-80%), Low (<50%)
  isConfirmed?: boolean; // User has confirmed / approved this item
  originalPrediction?: string; // Original model prediction before user swap
  cuisineRegion?: 'South Indian' | 'North Indian' | 'East Indian' | 'West Indian' | 'Pan-Indian' | 'Global';
  isHighProtein?: boolean;
  similarCandidates?: string[];
  regionalNames?: string[];
  thumbnail?: string;
  healthNote?: string;
}

export interface UserCorrection {
  id: string;
  timestamp: string;
  originalPrediction: string;
  selectedFood: string;
  confidenceTier: 'high' | 'medium' | 'low';
  feedbackType: 'approved_as_is' | 'swapped_candidate' | 'manual_search_override';
  cuisineRegion?: string;
  notes?: string;
}

export interface LoggedMeal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  mealType: MealType;
  title: string;
  imageUrl?: string;
  afterImageUrl?: string;
  servedItems: FoodItem[];
  remainingItems?: FoodItem[];
  actualItems: FoodItem[];
  leftoverPercent: number; // 0 means finished 100%, 25 means 25% left
  notes?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSodium: number;
}

export interface DailySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  waterMl: number;
  mealsCount: number;
}

export interface NutrientGap {
  nutrient: 'protein' | 'fiber' | 'sodium' | 'iron' | 'potassium' | 'calories';
  name: string;
  status: 'deficit' | 'excess' | 'balanced';
  current: number;
  target: number;
  unit: string;
  summary: string;
  actionableTip: string;
  suggestedFoods: RecommendedFood[];
}

export interface RecommendedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  servingSize: string;
  highlightNutrient: string;
  healthBenefit: string;
  dietTags: string[];
  allergens: string[];
  imageUrl: string;
}

export type TabType = 'home' | 'log' | 'insights' | 'recommendations' | 'settings';
export type NavigationTab = TabType;
