export type Gender = 'female' | 'male' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type DietPreference = 'any' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'low_sodium';
export type PortionSize = 'small' | 'medium' | 'large';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ================= 14 CONDITION FAMILIES & 42 CLINICAL VARIANTS =================
export type ConditionFamily =
  | 'DIABETES'
  | 'PREDIABETES'
  | 'HYPERTENSION'
  | 'HIGH_CHOLESTEROL'
  | 'HEART_DISEASE'
  | 'OBESITY'
  | 'UNDERWEIGHT'
  | 'CKD'
  | 'FATTY_LIVER'
  | 'ANEMIA'
  | 'OSTEOPOROSIS'
  | 'ATHLETES'
  | 'ELDERLY'
  | 'PREGNANCY';

export type ConditionVariant =
  // 1. Diabetes (4)
  | 'DIABETES_T1'
  | 'DIABETES_T2_CONTROLLED'
  | 'DIABETES_T2_UNCONTROLLED'
  | 'DIABETES_GESTATIONAL'
  // 2. Prediabetes (2)
  | 'PREDIABETES_EARLY'
  | 'PREDIABETES_HIGH_RISK'
  // 3. Hypertension (4)
  | 'HTN_ELEVATED'
  | 'HTN_STAGE_1'
  | 'HTN_STAGE_2'
  | 'HTN_RESISTANT'
  // 4. High Cholesterol (3)
  | 'CHOL_BORDERLINE'
  | 'CHOL_HIGH_LDL'
  | 'CHOL_HYPERTRIGLYCERIDEMIA'
  // 5. Heart Disease (3)
  | 'HEART_CAD_STABLE'
  | 'HEART_POST_MI'
  | 'HEART_FAILURE_HF'
  // 6. Obesity (3)
  | 'OBESITY_CLASS_1'
  | 'OBESITY_CLASS_2'
  | 'OBESITY_CLASS_3'
  // 7. Underweight (2)
  | 'UNDERWEIGHT_MILD'
  | 'UNDERWEIGHT_MODERATE_SEVERE'
  // 8. Chronic Kidney Disease (5)
  | 'CKD_STAGE_1_2'
  | 'CKD_STAGE_3A'
  | 'CKD_STAGE_3B'
  | 'CKD_STAGE_4'
  | 'CKD_STAGE_5_DIALYSIS'
  // 9. Fatty Liver (3)
  | 'NAFLD_SIMPLE_STEATOSIS'
  | 'NAFLD_NASH_MASH'
  | 'NAFLD_FIBROSIS'
  // 10. Anemia (3)
  | 'ANEMIA_IRON_DEFICIENCY_MILD'
  | 'ANEMIA_IRON_DEFICIENCY_SEVERE'
  | 'ANEMIA_PREGNANCY'
  // 11. Osteoporosis (2)
  | 'OSTEOPENIA'
  | 'OSTEOPOROSIS_ESTABLISHED'
  // 12. Athletes (3)
  | 'ATHLETE_ENDURANCE'
  | 'ATHLETE_STRENGTH_HYPERTROPHY'
  | 'ATHLETE_MIXED_SPORT'
  // 13. Elderly (2)
  | 'ELDERLY_HEALTHY_65_PLUS'
  | 'ELDERLY_SARCOPENIA_FRAIL'
  // 14. Pregnancy (3)
  | 'PREGNANCY_TRIMESTER_1'
  | 'PREGNANCY_TRIMESTER_2'
  | 'PREGNANCY_TRIMESTER_3';

export type RecommendationLabel =
  | 'Highly Recommended'
  | 'Recommended'
  | 'Consume in Moderation'
  | 'Limit Intake'
  | 'Avoid';

export type RiskLevel = 'SAFE' | 'MODERATE' | 'WARNING' | 'DANGER';
export type SourceConfidence = 'CLINICALLY_CITED' | 'CLINICAL_ESTIMATE';
export type RuleDirection = 'LIMITING' | 'BENEFICIAL';
export type RuleApprovalStatus =
  | 'APPROVED_CITED'
  | 'APPROVED_CLINICAL_CONSENSUS'
  | 'ESTIMATE_PENDING_REVIEW'
  | 'REJECTED';

// ================= CORE 12-NUTRIENT VECTOR =================
export interface NutrientVector12 {
  calories: number;     // kcal
  protein: number;      // g
  carbs: number;        // g
  fiber: number;        // g
  sugar: number;        // g
  totalFat: number;     // g
  saturatedFat: number; // g
  sodium: number;       // mg
  cholesterol: number;  // mg
  potassium: number;    // mg
  calcium: number;      // mg
  iron: number;         // mg
}

// ================= EXPLAINABLE AI (XAI) CONTRACTS =================
export interface NutrientDriverExplanation {
  nutrient: keyof NutrientVector12;
  direction: RuleDirection;
  foodValue: number;
  unit: 'kcal' | 'g' | 'mg';
  safeOrRequiredThreshold: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  subScore: number;          // 0-100
  normalizedWeight: number;  // 0-1
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'OPTIMAL_BENEFIT' | 'DEFICIT';
  conditionVariant: ConditionVariant | string;
  sourceBasis: SourceConfidence;
  guidelineOrganization?: string; // e.g. 'KDOQI 2020', 'ADA', 'AHA'
  guidelineCitation?: string;
  humanReadableReason: string;
}

export interface FoodSuitabilityResponse {
  foodId: string;
  foodName: string;
  evaluatedPortionGrams: number;
  suitabilityScore: number;             // 0 - 100
  ruleEngineScore: number;              // 0 - 100
  mlPredictedScore?: number;            // 0 - 100
  recommendationLabel: RecommendationLabel;
  riskLevel: RiskLevel;
  recommendedPortionGrams: number;
  recommendedHouseholdMeasure: string;
  bindingConditionVariant: ConditionVariant | string;
  sourceConfidence: SourceConfidence;
  topDrivers: NutrientDriverExplanation[]; // Top 2-3 weighted drivers
  allNutrientBreakdowns: NutrientDriverExplanation[];
  ruleSetVersionHash: string;
  mlModelVersion: string;
  latencyMs: number;
}

export interface ClinicalSuitabilityRule {
  ruleId: string;
  conditionFamily: ConditionFamily;
  conditionVariant: ConditionVariant;
  severityMultiplier: number;
  nutrientName: keyof NutrientVector12;
  nutrientUnit: 'kcal' | 'g' | 'mg';
  ruleDirection: RuleDirection;
  normalizedWeight: number;
  safeThreshold?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  requiredTarget?: number;
  dailyGuidelineReference?: number;
  sourceBasis: SourceConfidence;
  guidelineOrganization?: string;
  guidelineCitationText?: string;
  approvalStatus: RuleApprovalStatus;
  ruleVersion: number;
  reviewedAt?: string;
  reviewedByClinicianId?: string;
}

export interface MedicalProfile {
  systolicBP?: number; // e.g. 120 mmHg
  diastolicBP?: number; // e.g. 80 mmHg
  bloodSugar?: number; // mg/dL fasting
  fastingGlucose?: number; // mg/dL
  hba1c?: number; // % e.g. 6.5
  cholesterol?: number; // mg/dL total
  ldlCholesterol?: number; // mg/dL LDL
  egfr?: number; // mL/min/1.73m2
  hemoglobin?: number; // g/dL
  trimester?: 1 | 2 | 3;
  restingHeartRate?: number; // bpm
  bodyFatPercent?: number; // %
}

export type FitnessSyncSource = 'google_fit' | 'samsung_health' | 'apple_health' | 'fitbit' | 'manual';

export interface FitnessActivityData {
  steps: number;
  stepGoal: number;
  activeCaloriesBurned: number;
  activeMinutes: number;
  distanceKm: number;
  restingHeartRate?: number;
  avgHeartRate?: number;
  sleepHours?: number;
  sleepScore?: number; // 0-100
  bloodOxygenSpO2?: number; // %
  source: FitnessSyncSource;
  lastSyncedAt: string; // ISO string
}

export interface WeeklyReminderConfig {
  enabled: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // "09:00"
  lastUpdatedDate: string; // YYYY-MM-DD
  notifyBrowser: boolean;
}

export interface FitnessConnections {
  googleFit: boolean;
  samsungHealth: boolean;
  appleHealth: boolean;
  fitbit: boolean;
  autoSync: boolean;
  activeSource: FitnessSyncSource;
  lastSyncedAt?: string;
}

export interface HealthSuitabilityAssessment {
  status: 'suitable' | 'moderate' | 'caution';
  badgeLabel: string;
  summary: string;
  vitalChecks: {
    vital: string;
    userValue: string;
    plateImpact: string;
    status: 'good' | 'warning' | 'neutral';
  }[];
  clinicalTips: string[];
}

export interface UserTargets {
  calories: number;
  protein: number;       // g
  carbs: number;         // g
  fat: number;           // g (totalFat)
  saturatedFat?: number; // g
  fiber: number;         // g
  sugar: number;         // g
  sodium: number;        // mg
  cholesterol?: number;  // mg
  potassium: number;     // mg
  calcium?: number;      // mg
  iron: number;          // mg
  waterMl: number;
  stepsGoal?: number;
  activeCaloriesBurnGoal?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: 'CONSUMER' | 'CLINICIAN' | 'ADMIN';
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
  medical: MedicalProfile;
  activeConditionVariants?: ConditionVariant[];
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
  weeklyReminder?: WeeklyReminderConfig;
  fitnessConnections?: FitnessConnections;
  fitnessData?: FitnessActivityData;
  lastHealthDataUpdate?: string; // YYYY-MM-DD
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
  protein: number;        // grams
  carbs: number;          // grams
  fat: number;            // grams (totalFat)
  saturatedFat?: number;  // grams
  fiber: number;          // grams
  sugar: number;          // grams
  sodium: number;         // mg
  cholesterol?: number;   // mg
  potassium?: number;     // mg
  calcium?: number;       // mg
  iron?: number;          // mg
  glycemicIndexBand?: 'Low' | 'Medium' | 'High';
  glycemicIndexValue?: number;
  dataSource?: 'USDA_FDC' | 'IFCT_2017' | 'PROTOTYPE_SYNTHETIC';
  sourceCitationId?: string;
  box?: BoundingBox;
  confidence?: number; // Internal model score
  confidenceTier?: 'high' | 'medium' | 'low';
  isConfirmed?: boolean;
  originalPrediction?: string;
  cuisineRegion?: 'South Indian' | 'North Indian' | 'East Indian' | 'West Indian' | 'Pan-Indian' | 'Global';
  isHighProtein?: boolean;
  similarCandidates?: string[];
  regionalNames?: string[];
  thumbnail?: string;
  healthNote?: string;
  suitability?: FoodSuitabilityResponse;
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
  totalSaturatedFat?: number;
  totalFiber: number;
  totalSugar?: number;
  totalSodium: number;
  totalCholesterol?: number;
  totalPotassium?: number;
  totalCalcium?: number;
  totalIron?: number;
  suitabilityScore?: number;
  bindingConditionVariant?: string;
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

export interface DailyNutrientLedger {
  userId: string;
  date: string; // YYYY-MM-DD
  activeCaloriesBurned: number;
  consumed: NutrientVector12;
  remaining: Partial<NutrientVector12>;
  gap: Partial<NutrientVector12>;
}

export interface NutrientGap {
  nutrient: 'protein' | 'fiber' | 'sodium' | 'iron' | 'potassium' | 'calories' | 'calcium' | 'sugar' | 'saturatedFat';
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
  saturatedFat?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  servingSize: string;
  highlightNutrient: string;
  healthBenefit: string;
  dietTags: string[];
  allergens: string[];
  imageUrl: string;
  suitabilityScore?: number;
  recommendationLabel?: RecommendationLabel;
}

export type TabType = 'home' | 'log' | 'insights' | 'recommendations' | 'settings' | 'clinician-portal';
export type NavigationTab = TabType;
