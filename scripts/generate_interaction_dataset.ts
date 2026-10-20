import * as fs from 'fs';
import * as path from 'path';
import { CLINICAL_RULES_SEED } from '../src/data/clinicalRulesSeed';
import { INDIAN_FOOD_DATABASE } from '../src/data/indianFoodDb';
import { FOOD_DATABASE } from '../src/data/nutritionDb';
import { evaluateMultiCondition } from '../src/shared/ruleScoringEngine';
import { ConditionVariant, FoodItem, MealType } from '../src/types';

const ALL_42_VARIANTS: ConditionVariant[] = [
  'DIABETES_T1', 'DIABETES_T2_CONTROLLED', 'DIABETES_T2_UNCONTROLLED', 'DIABETES_GESTATIONAL',
  'PREDIABETES_EARLY', 'PREDIABETES_HIGH_RISK',
  'HTN_ELEVATED', 'HTN_STAGE_1', 'HTN_STAGE_2', 'HTN_RESISTANT',
  'CHOL_BORDERLINE', 'CHOL_HIGH_LDL', 'CHOL_HYPERTRIGLYCERIDEMIA',
  'HEART_CAD_STABLE', 'HEART_POST_MI', 'HEART_FAILURE_HF',
  'OBESITY_CLASS_1', 'OBESITY_CLASS_2', 'OBESITY_CLASS_3',
  'UNDERWEIGHT_MILD', 'UNDERWEIGHT_MODERATE_SEVERE',
  'CKD_STAGE_1_2', 'CKD_STAGE_3A', 'CKD_STAGE_3B', 'CKD_STAGE_4', 'CKD_STAGE_5_DIALYSIS',
  'NAFLD_SIMPLE_STEATOSIS', 'NAFLD_NASH_MASH', 'NAFLD_FIBROSIS',
  'ANEMIA_IRON_DEFICIENCY_MILD', 'ANEMIA_IRON_DEFICIENCY_SEVERE', 'ANEMIA_PREGNANCY',
  'OSTEOPENIA', 'OSTEOPOROSIS_ESTABLISHED',
  'ATHLETE_ENDURANCE', 'ATHLETE_STRENGTH_HYPERTROPHY', 'ATHLETE_MIXED_SPORT',
  'ELDERLY_HEALTHY_65_PLUS', 'ELDERLY_SARCOPENIA_FRAIL',
  'PREGNANCY_TRIMESTER_1', 'PREGNANCY_TRIMESTER_2', 'PREGNANCY_TRIMESTER_3',
];

const ALL_CATALOG_FOODS: FoodItem[] = [
  ...INDIAN_FOOD_DATABASE.map(f => ({
    id: f.id,
    name: f.name,
    category: f.category,
    cuisineRegion: f.cuisineRegion,
    portion: 'medium' as const,
    portionMultiplier: 1.0,
    servingDescription: f.servingDescription,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    saturatedFat: f.saturatedFat,
    fiber: f.fiber,
    sugar: f.sugar,
    sodium: f.sodium,
    cholesterol: f.cholesterol,
    potassium: f.potassium,
    calcium: f.calcium,
    iron: f.iron,
    isHighProtein: f.isHighProtein,
  })),
  ...FOOD_DATABASE.map((f, idx) => ({
    id: `usda-${idx + 1}`,
    name: f.name,
    category: f.category,
    cuisineRegion: 'Global' as const,
    portion: 'medium' as const,
    portionMultiplier: 1.0,
    servingDescription: f.servingDescription || '1 serving',
    calories: f.calories || 150,
    protein: f.protein || 5,
    carbs: f.carbs || 20,
    fat: f.fat || 5,
    saturatedFat: f.saturatedFat || 1.5,
    fiber: f.fiber || 2,
    sugar: f.sugar || 2,
    sodium: f.sodium || 150,
    cholesterol: f.cholesterol || 0,
    potassium: f.potassium || 200,
    calcium: f.calcium || 40,
    iron: f.iron || 1.2,
    isHighProtein: Boolean(f.isHighProtein),
  })),
];

function generateRandomProfile(id: number) {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const age = Math.floor(Math.random() * (78 - 20) + 20);
  const gender = Math.random() > 0.5 ? 'female' : 'male';
  const bmi = Number((Math.random() * (40 - 17) + 17).toFixed(1));
  const activityLevelNum = Math.floor(Math.random() * 4) + 1;

  const conditionCount = Math.floor(Math.random() * 4);
  const conditions: ConditionVariant[] = [];
  while (conditions.length < conditionCount) {
    const picked = ALL_42_VARIANTS[Math.floor(Math.random() * ALL_42_VARIANTS.length)];
    if (!conditions.includes(picked)) {
      conditions.push(picked);
    }
  }

  const multiplier = Math.random() * 0.9 + 0.1;
  const remainingBudget = {
    calories: Math.round(2000 * multiplier),
    protein: Math.round(75 * multiplier),
    carbs: Math.round(240 * multiplier),
    fiber: Math.round(30 * multiplier),
    sugar: Math.round(35 * multiplier),
    totalFat: Math.round(60 * multiplier),
    saturatedFat: Math.round(16 * multiplier),
    sodium: Math.round(2000 * multiplier),
    cholesterol: Math.round(250 * multiplier),
    potassium: Math.round(3500 * multiplier),
    calcium: Math.round(1000 * multiplier),
    iron: Math.round(18 * multiplier),
  };

  const mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
  const mealsLoggedToday = Math.floor(Math.random() * 4);

  return {
    userId: `syn_usr_${id}`,
    age,
    gender_female: gender === 'female' ? 1 : 0,
    gender_male: gender === 'male' ? 1 : 0,
    bmi,
    activityLevelNum,
    conditions,
    mealType,
    mealsLoggedToday,
    remainingBudget,
  };
}

async function generateBalancedDataset() {
  console.log('Generating 11,000 synthetic interaction rows stratified across all 5 clinical tiers (~2,200 per tier)...');

  const nutrientsList = [
    'calories', 'protein', 'carbs', 'fiber', 'sugar',
    'total_fat', 'sat_fat', 'sodium', 'cholesterol',
    'potassium', 'calcium', 'iron'
  ];

  const headerParts = [
    'user_id',
    'age',
    'gender_female',
    'gender_male',
    'bmi',
    'activity_level_num',
    ...ALL_42_VARIANTS.map(v => `cond_${v}`),
    'meal_is_breakfast',
    'meal_is_lunch',
    'meal_is_dinner',
    'meal_is_snack',
    'meals_logged_today',
    ...nutrientsList.map(n => `rem_${n}`),
    'food_id',
    'food_name',
    ...nutrientsList.map(n => `food_${n}`),
    ...nutrientsList.map(n => `ratio_${n}`),
    'rule_engine_score',
    'suitability_score',
    'recommendation_label',
    'recommendation_label_idx',
  ];

  const targetPerClass = 2200; // 5 x 2200 = 11,000
  const classRows: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  let profileId = 1;

  while (
    classRows[0].length < targetPerClass ||
    classRows[1].length < targetPerClass ||
    classRows[2].length < targetPerClass ||
    classRows[3].length < targetPerClass ||
    classRows[4].length < targetPerClass
  ) {
    const profile = generateRandomProfile(profileId++);
    const food = ALL_CATALOG_FOODS[Math.floor(Math.random() * ALL_CATALOG_FOODS.length)];

    const scoringResult = evaluateMultiCondition(food, CLINICAL_RULES_SEED, profile.conditions, {
      mealType: profile.mealType,
      dailyRemainingBudget: profile.remainingBudget,
      mealsLoggedToday: profile.mealsLoggedToday,
    });

    const ruleScore = scoringResult.ruleEngineScore;

    // Determine label and suitability with safety floor constraint
    let labelIdx: number;
    let suitability: number;
    let label: string;

    if (ruleScore < 30) {
      labelIdx = 0;
      label = 'Avoid';
      suitability = ruleScore;
    } else if (ruleScore < 50) {
      labelIdx = 1;
      label = 'Limit Intake';
      suitability = ruleScore;
    } else if (ruleScore < 65) {
      labelIdx = 2;
      label = 'Consume in Moderation';
      suitability = ruleScore;
    } else if (ruleScore < 80) {
      labelIdx = 3;
      label = 'Recommended';
      suitability = ruleScore;
    } else {
      labelIdx = 4;
      label = 'Highly Recommended';
      suitability = ruleScore;
    }

    if (classRows[labelIdx].length >= targetPerClass) {
      continue;
    }

    const foodNutrients: Record<string, number> = {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fiber: food.fiber,
      sugar: food.sugar,
      total_fat: food.fat,
      sat_fat: food.saturatedFat || 0,
      sodium: food.sodium,
      cholesterol: food.cholesterol || 0,
      potassium: food.potassium,
      calcium: food.calcium,
      iron: food.iron,
    };

    const remNutrients: Record<string, number> = {
      calories: profile.remainingBudget.calories,
      protein: profile.remainingBudget.protein,
      carbs: profile.remainingBudget.carbs,
      fiber: profile.remainingBudget.fiber,
      sugar: profile.remainingBudget.sugar,
      total_fat: profile.remainingBudget.totalFat,
      sat_fat: profile.remainingBudget.saturatedFat,
      sodium: profile.remainingBudget.sodium,
      cholesterol: profile.remainingBudget.cholesterol,
      potassium: profile.remainingBudget.potassium,
      calcium: profile.remainingBudget.calcium,
      iron: profile.remainingBudget.iron,
    };

    const ratioValues = nutrientsList.map(n => {
      const foodVal = foodNutrients[n] || 0;
      const remVal = Math.max(1, remNutrients[n] || 1);
      return Number((foodVal / remVal).toFixed(4));
    });

    const rowData = [
      profile.userId,
      profile.age,
      profile.gender_female,
      profile.gender_male,
      profile.bmi,
      profile.activityLevelNum,
      ...ALL_42_VARIANTS.map(v => (profile.conditions.includes(v) ? 1 : 0)),
      profile.mealType === 'breakfast' ? 1 : 0,
      profile.mealType === 'lunch' ? 1 : 0,
      profile.mealType === 'dinner' ? 1 : 0,
      profile.mealType === 'snack' ? 1 : 0,
      profile.mealsLoggedToday,
      ...nutrientsList.map(n => remNutrients[n]),
      `"${food.id}"`,
      `"${food.name.replace(/"/g, '""')}"`,
      ...nutrientsList.map(n => foodNutrients[n]),
      ...ratioValues,
      ruleScore,
      suitability,
      `"${label}"`,
      labelIdx,
    ];

    classRows[labelIdx].push(rowData.join(','));
  }

  const allRows = [
    headerParts.join(','),
    ...classRows[0],
    ...classRows[1],
    ...classRows[2],
    ...classRows[3],
    ...classRows[4],
  ];

  const outDir = path.join(process.cwd(), 'data_assets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'health_food_recommendation_dataset.csv');
  fs.writeFileSync(outPath, allRows.join('\n'), 'utf8');

  console.log(`[Success] Generated perfectly balanced dataset of 11,000 rows in ${outPath}!`);
  console.log(`  Tier 0 (Avoid): ${classRows[0].length}`);
  console.log(`  Tier 1 (Limit Intake): ${classRows[1].length}`);
  console.log(`  Tier 2 (Consume in Moderation): ${classRows[2].length}`);
  console.log(`  Tier 3 (Recommended): ${classRows[3].length}`);
  console.log(`  Tier 4 (Highly Recommended): ${classRows[4].length}`);
}

generateBalancedDataset();
