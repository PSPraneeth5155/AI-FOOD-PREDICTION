import { resolveConditionVariants } from '../../src/shared/conditionStagingResolver';
import { calculateTargets } from '../../src/data/nutritionDb';
import { edgeCache, getOrCreateDailyLedger, db } from '../../src/db/client';
import { userClinicalProfiles, users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { ConditionVariant, NutrientVector12, UserProfile } from '../../src/types';

// Default consumer clinical profile for cold boot / demo
const DEFAULT_DEMO_PROFILE: UserProfile = {
  id: 'usr_demo_patient_01',
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  role: 'CONSUMER',
  age: 38,
  gender: 'female',
  heightCm: 162,
  weightKg: 68,
  bmi: 25.9,
  bmiCategory: 'Overweight',
  unitSystem: 'metric',
  notifications: { mealReminders: true, waterReminders: true, weeklyReport: true },
  onboardingCompleted: true,
  medical: {
    systolicBP: 138,
    diastolicBP: 88,
    fastingGlucose: 114,
    hba1c: 6.2,
    cholesterol: 215,
    ldlCholesterol: 135,
    egfr: 92,
    hemoglobin: 12.4,
  },
  activeConditionVariants: ['PREDIABETES_EARLY', 'HTN_STAGE_1', 'CHOL_BORDERLINE'],
  lifestyle: {
    activityLevel: 'moderate',
    sleepHours: 7,
    dietaryPreference: 'vegetarian',
    allergies: [],
    healthGoals: ['Lower blood pressure', 'Reverse prediabetes', 'Weight management'],
    regionalPreference: 'South Indian',
  },
  targets: {
    calories: 1850,
    protein: 85,
    carbs: 220,
    fat: 55,
    saturatedFat: 14,
    fiber: 32,
    sugar: 35,
    sodium: 1800,
    cholesterol: 200,
    potassium: 3500,
    calcium: 1000,
    iron: 18,
    waterMl: 2500,
    stepsGoal: 9000,
    activeCaloriesBurnGoal: 400,
  },
};

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const userId = (req.query?.userId || req.body?.userId || DEFAULT_DEMO_PROFILE.id) as string;
  const todayStr = (req.query?.date || new Date().toISOString().split('T')[0]) as string;

  try {
    if (req.method === 'GET') {
      // 1. Retrieve profile from Edge Cache or default
      const profileKey = `profile:${userId}`;
      let profile = await edgeCache.get<UserProfile>(profileKey);

      if (!profile) {
        profile = DEFAULT_DEMO_PROFILE;
        await edgeCache.set(profileKey, profile, 86400);
      }

      // 2. Resolve condition variants dynamically from current vitals
      const activeConditionVariants = resolveConditionVariants(profile);
      profile.activeConditionVariants = activeConditionVariants;

      // 3. Calculate 12-nutrient targets
      const targets = calculateTargets(profile);
      profile.targets = targets;

      // 4. Retrieve daily nutrient ledger
      const ledger = await getOrCreateDailyLedger(userId, todayStr);

      // 5. Calculate 12-nutrient remaining budget and gaps
      const remainingBudget: Record<string, number> = {};
      const gapBudget: Record<string, number> = {};

      const limitingKeys: (keyof NutrientVector12)[] = [
        'calories',
        'totalFat',
        'saturatedFat',
        'sugar',
        'sodium',
        'cholesterol',
      ];

      const beneficialKeys: (keyof NutrientVector12)[] = [
        'protein',
        'carbs',
        'fiber',
        'potassium',
        'calcium',
        'iron',
      ];

      const targetMap: Record<string, number> = {
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fiber: targets.fiber,
        sugar: targets.sugar,
        totalFat: targets.fat,
        saturatedFat: targets.saturatedFat,
        sodium: targets.sodium,
        cholesterol: targets.cholesterol,
        potassium: targets.potassium,
        calcium: targets.calcium,
        iron: targets.iron,
      };

      let adherencePoints = 0;
      const totalEvaluatedNutrients = 12;

      for (const [nutrient, targetVal] of Object.entries(targetMap)) {
        const consumedVal = ledger.consumed[nutrient as keyof NutrientVector12] || 0;
        const diff = targetVal - consumedVal;

        if (limitingKeys.includes(nutrient as any)) {
          remainingBudget[nutrient] = Math.max(0, Number(diff.toFixed(1)));
          gapBudget[nutrient] = consumedVal > targetVal ? Number((consumedVal - targetVal).toFixed(1)) : 0;
          if (consumedVal <= targetVal * 1.05) {
            adherencePoints += 1;
          }
        } else {
          remainingBudget[nutrient] = Math.max(0, Number(diff.toFixed(1)));
          gapBudget[nutrient] = diff > 0 ? Number(diff.toFixed(1)) : 0;
          if (consumedVal >= targetVal * 0.75) {
            adherencePoints += 1;
          }
        }
      }

      ledger.remaining = remainingBudget;
      ledger.gap = gapBudget;

      const adherenceScore = Math.round((adherencePoints / totalEvaluatedNutrients) * 100);

      res.status(200).json({
        success: true,
        userId,
        date: todayStr,
        profile,
        activeConditionVariants,
        targets,
        ledger,
        adherenceScore,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const updates = req.body || {};
      const profileKey = `profile:${userId}`;

      const existingProfile = (await edgeCache.get<UserProfile>(profileKey)) || DEFAULT_DEMO_PROFILE;

      // Merge demographics & lifestyle
      const merged: UserProfile = {
        ...existingProfile,
        ...updates,
        medical: {
          ...existingProfile.medical,
          ...(updates.medical || {}),
        },
        lifestyle: {
          ...existingProfile.lifestyle,
          ...(updates.lifestyle || {}),
        },
      };

      // Recalculate BMI if height or weight changed
      if (merged.heightCm && merged.weightKg) {
        const heightM = merged.heightCm / 100;
        merged.bmi = Number((merged.weightKg / (heightM * heightM)).toFixed(1));
        if (merged.bmi < 18.5) merged.bmiCategory = 'Underweight';
        else if (merged.bmi < 25.0) merged.bmiCategory = 'Normal weight';
        else if (merged.bmi < 30.0) merged.bmiCategory = 'Overweight';
        else merged.bmiCategory = 'Obesity';
      }

      // Re-resolve condition variants based on new labs/vitals
      merged.activeConditionVariants = resolveConditionVariants(merged);

      // Recalculate 12-nutrient targets
      merged.targets = calculateTargets(merged);

      // Save to cache
      await edgeCache.set(profileKey, merged, 86400);

      res.status(200).json({
        success: true,
        message: 'Profile and clinical targets updated successfully',
        profile: merged,
        activeConditionVariants: merged.activeConditionVariants,
        targets: merged.targets,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    res.status(405).json({ error: 'Method not allowed. Use GET, PUT, or POST.' });
  } catch (err: any) {
    console.error('[/api/v1/profile-ledger] Error:', err);
    res.status(500).json({
      error: 'Profile / Ledger operation failed',
      message: err.message,
    });
  }
}
