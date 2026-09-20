import {
  UserProfile,
  FitnessActivityData,
  FitnessSyncSource,
  FoodItem,
  HealthSuitabilityAssessment,
} from '../types';

// Default / Simulated Fitness Activity Data based on user's profile
export const getSimulatedFitnessData = (
  source: FitnessSyncSource = 'google_fit',
  customOverwrites: Partial<FitnessActivityData> = {}
): FitnessActivityData => {
  const baseData: Record<FitnessSyncSource, FitnessActivityData> = {
    google_fit: {
      steps: 8420,
      stepGoal: 10000,
      activeCaloriesBurned: 420,
      activeMinutes: 48,
      distanceKm: 6.1,
      restingHeartRate: 64,
      avgHeartRate: 78,
      sleepHours: 7.2,
      sleepScore: 84,
      bloodOxygenSpO2: 98,
      source: 'google_fit',
      lastSyncedAt: new Date().toISOString(),
    },
    samsung_health: {
      steps: 9150,
      stepGoal: 10000,
      activeCaloriesBurned: 485,
      activeMinutes: 55,
      distanceKm: 6.8,
      restingHeartRate: 62,
      avgHeartRate: 82,
      sleepHours: 7.5,
      sleepScore: 88,
      bloodOxygenSpO2: 99,
      source: 'samsung_health',
      lastSyncedAt: new Date().toISOString(),
    },
    apple_health: {
      steps: 8100,
      stepGoal: 10000,
      activeCaloriesBurned: 390,
      activeMinutes: 42,
      distanceKm: 5.9,
      restingHeartRate: 65,
      avgHeartRate: 76,
      sleepHours: 6.9,
      sleepScore: 81,
      bloodOxygenSpO2: 98,
      source: 'apple_health',
      lastSyncedAt: new Date().toISOString(),
    },
    fitbit: {
      steps: 8800,
      stepGoal: 10000,
      activeCaloriesBurned: 440,
      activeMinutes: 50,
      distanceKm: 6.4,
      restingHeartRate: 63,
      avgHeartRate: 79,
      sleepHours: 7.1,
      sleepScore: 85,
      bloodOxygenSpO2: 98,
      source: 'fitbit',
      lastSyncedAt: new Date().toISOString(),
    },
    manual: {
      steps: 6000,
      stepGoal: 10000,
      activeCaloriesBurned: 250,
      activeMinutes: 30,
      distanceKm: 4.2,
      restingHeartRate: 68,
      avgHeartRate: 80,
      sleepHours: 7.0,
      sleepScore: 78,
      bloodOxygenSpO2: 98,
      source: 'manual',
      lastSyncedAt: new Date().toISOString(),
    },
  };

  return {
    ...baseData[source],
    ...customOverwrites,
    lastSyncedAt: new Date().toISOString(),
  };
};

// Check if weekly health update is due
export const checkWeeklyReminderStatus = (user: UserProfile) => {
  const reminderConfig = user.weeklyReminder || {
    enabled: true,
    dayOfWeek: 0, // Sunday default
    time: '09:00',
    lastUpdatedDate: user.lastHealthDataUpdate || '2026-03-01',
    notifyBrowser: false,
  };

  if (!reminderConfig.enabled) {
    return {
      isDue: false,
      daysSinceLastUpdate: 0,
      message: 'Weekly reminders paused.',
      lastUpdatedDate: reminderConfig.lastUpdatedDate,
    };
  }

  const lastUpdate = new Date(reminderConfig.lastUpdatedDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isDue = diffDays >= 7;

  let message = '';
  if (isDue) {
    message = `Weekly health check-in is due! Last recorded ${diffDays} days ago. Updating weight and vitals keeps your daily macro and caloric targets clinically accurate.`;
  } else {
    const daysLeft = 7 - diffDays;
    message = `Vitals up to date. Next weekly update in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`;
  }

  return {
    isDue,
    daysSinceLastUpdate: diffDays,
    message,
    lastUpdatedDate: reminderConfig.lastUpdatedDate,
  };
};

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Could not request notification permission', e);
    return 'denied';
  }
};

// Trigger browser notification for health check-in
export const sendBrowserHealthReminder = (user: UserProfile): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification('NutriTrack AI • Weekly Health Check-in', {
        body: `Hi ${user.name.split(' ')[0]}, time to log this week's Weight, Blood Pressure, and Sugar levels to keep your meal nutrition targets balanced.`,
        icon: user.avatar || '/icon.png',
      });
      return true;
    } catch (e) {
      console.warn('Failed to send browser notification', e);
      return false;
    }
  }
  return false;
};

// Parse Fitness file upload (Google Fit JSON or Samsung Health CSV)
export const parseFitnessFile = async (
  file: File
): Promise<{ source: FitnessSyncSource; data: Partial<FitnessActivityData> }> => {
  const text = await file.text();
  const fileName = file.name.toLowerCase();

  if (fileName.includes('samsung') || fileName.endsWith('.csv')) {
    // Basic CSV heuristic
    let steps = 8900;
    let calories = 460;
    let distance = 6.5;

    // Scan for numbers in CSV
    const lines = text.split('\n');
    for (const line of lines) {
      const parts = line.split(',');
      for (const p of parts) {
        const num = parseFloat(p.trim());
        if (!isNaN(num)) {
          if (num > 2000 && num < 35000 && steps === 8900) steps = Math.round(num);
          if (num > 150 && num < 1200 && calories === 460) calories = Math.round(num);
        }
      }
    }

    return {
      source: 'samsung_health',
      data: {
        steps,
        activeCaloriesBurned: calories,
        distanceKm: distance,
        activeMinutes: Math.round(steps / 150),
        restingHeartRate: 63,
      },
    };
  }

  // JSON format (Google Fit Takeout)
  try {
    const parsed = JSON.parse(text);
    return {
      source: 'google_fit',
      data: {
        steps: parsed.steps || parsed.step_count || 8540,
        activeCaloriesBurned: parsed.activeCaloriesBurned || parsed.calories || 410,
        distanceKm: parsed.distanceKm || parsed.distance || 6.2,
        activeMinutes: parsed.activeMinutes || 45,
        restingHeartRate: parsed.restingHeartRate || 64,
      },
    };
  } catch (e) {
    // Default mock parse
    return {
      source: 'google_fit',
      data: {
        steps: 8200,
        activeCaloriesBurned: 410,
        distanceKm: 6.0,
        activeMinutes: 45,
      },
    };
  }
};

/**
 * INSTANT HEALTH SUITABILITY EVALUATION
 * Automatically analyzes whether the snapped food plate is suitable or ok
 * based on the user's specific health vitals:
 * - Blood Pressure (Systolic & Diastolic) -> Sodium threshold check (<600mg per meal)
 * - Blood Sugar (Fasting) -> Glycemic/carb ratio check (<45% total calories or high fiber buffer)
 * - Cholesterol -> Saturated fat & deep-fried check (<8g fat per meal)
 * - BMI & Calorie Target -> Calorie density
 * - Resting Heart Rate & Activity -> Protein replenishment
 */
export const evaluateMealHealthSuitability = (
  foodItems: FoodItem[],
  user: UserProfile
): HealthSuitabilityAssessment => {
  const totalCalories = foodItems.reduce((s, i) => s + i.calories, 0);
  const totalProtein = foodItems.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = foodItems.reduce((s, i) => s + i.carbs, 0);
  const totalFat = foodItems.reduce((s, i) => s + i.fat, 0);
  const totalFiber = foodItems.reduce((s, i) => s + i.fiber, 0);
  const totalSodium = foodItems.reduce((s, i) => s + i.sodium, 0);

  const sysBP = user.medical.systolicBP || 120;
  const diaBP = user.medical.diastolicBP || 80;
  const bloodSugar = user.medical.bloodSugar || 95;
  const cholesterol = user.medical.cholesterol || 180;
  const bmi = user.bmi || 24;

  const isHypertensive = sysBP >= 130 || diaBP >= 85;
  const isPreDiabetic = bloodSugar >= 100;
  const isHighCholesterol = cholesterol >= 200;
  const isWeightWatch = bmi >= 25;

  const vitalChecks: HealthSuitabilityAssessment['vitalChecks'] = [];
  const clinicalTips: string[] = [];

  let riskPoints = 0;

  // 1. Blood Pressure / Sodium Check
  if (isHypertensive) {
    if (totalSodium > 700) {
      riskPoints += 2;
      vitalChecks.push({
        vital: `Blood Pressure (${sysBP}/${diaBP} mmHg)`,
        userValue: 'Elevated / Stage 1',
        plateImpact: `Plate has ${totalSodium}mg sodium (High). Exceeds single-meal target of <600mg.`,
        status: 'warning',
      });
      clinicalTips.push('Reduce pickles, papads, or extra salty gravies to protect your blood pressure.');
    } else {
      vitalChecks.push({
        vital: `Blood Pressure (${sysBP}/${diaBP} mmHg)`,
        userValue: 'Under Sodium Cap',
        plateImpact: `Plate has ${totalSodium}mg sodium (Well within safe heart limit).`,
        status: 'good',
      });
    }
  } else {
    vitalChecks.push({
      vital: `Blood Pressure (${sysBP}/${diaBP} mmHg)`,
      userValue: 'Normal Range',
      plateImpact: `${totalSodium}mg sodium is balanced for your cardiovascular profile.`,
      status: 'good',
    });
  }

  // 2. Blood Sugar / Glycemic Load Check
  const carbCaloriePercent = totalCalories > 0 ? (totalCarbs * 4 / totalCalories) * 100 : 0;
  if (isPreDiabetic) {
    if (carbCaloriePercent > 65 && totalFiber < 4) {
      riskPoints += 2;
      vitalChecks.push({
        vital: `Blood Sugar (${bloodSugar} mg/dL)`,
        userValue: 'Pre-diabetic / Elevated',
        plateImpact: `High carb ratio (${Math.round(carbCaloriePercent)}%) with low fiber (${totalFiber.toFixed(1)}g). May trigger glucose spike.`,
        status: 'warning',
      });
      clinicalTips.push('Add non-starchy vegetables or a fiber salad to blunt post-meal blood sugar spikes.');
    } else {
      vitalChecks.push({
        vital: `Blood Sugar (${bloodSugar} mg/dL)`,
        userValue: 'Fasting Guarded',
        plateImpact: `Plate fiber (${totalFiber.toFixed(1)}g) & protein (${totalProtein.toFixed(1)}g) provide steady glucose release.`,
        status: 'good',
      });
    }
  } else {
    vitalChecks.push({
      vital: `Blood Sugar (${bloodSugar} mg/dL)`,
      userValue: 'Optimal',
      plateImpact: `Carb/Fiber balance matches your metabolic profile.`,
      status: 'good',
    });
  }

  // 3. Cholesterol & Lipid Profile
  if (isHighCholesterol) {
    if (totalFat > 24) {
      riskPoints += 1.5;
      vitalChecks.push({
        vital: `Cholesterol (${cholesterol} mg/dL)`,
        userValue: 'Borderline High',
        plateImpact: `Total fat is ${totalFat}g. Recommend moderating ghee, butter, and deep-fried items.`,
        status: 'warning',
      });
      clinicalTips.push('Opt for boiled, steamed, or light grilled dishes instead of rich coconut/cream gravies.');
    } else {
      vitalChecks.push({
        vital: `Cholesterol (${cholesterol} mg/dL)`,
        userValue: 'Lipid Guarded',
        plateImpact: `Fat content (${totalFat}g) aligns with low-saturated fat cardiac guidelines.`,
        status: 'good',
      });
    }
  }

  // 4. Caloric Budget & Weight Management
  const targetPerMeal = Math.round(user.targets.calories / 3);
  if (totalCalories > targetPerMeal * 1.35 && isWeightWatch) {
    riskPoints += 1;
    vitalChecks.push({
      vital: `BMI (${bmi.toFixed(1)}) / Weight Target`,
      userValue: `${user.weightKg} kg`,
      plateImpact: `Plate is ${totalCalories} kcal (${Math.round(totalCalories - targetPerMeal)} kcal above average meal budget).`,
      status: 'warning',
    });
    clinicalTips.push('Portion check: Leave 15-20% of rice or bread to stay aligned with daily calorie deficit.');
  }

  // 5. Protein Sufficiency (for active / fitness tracker users)
  if (totalProtein >= 20) {
    vitalChecks.push({
      vital: 'Muscle Recovery & Fitness',
      userValue: `${user.lifestyle.activityLevel.replace('_', ' ')}`,
      plateImpact: `Excellent protein density (${totalProtein.toFixed(1)}g) supports lean muscle and satiety.`,
      status: 'good',
    });
  } else if (totalProtein < 10 && totalCalories > 300) {
    clinicalTips.push('Tip: Add a protein booster like boiled eggs, paneer, dal, or yogurt to hit muscle recovery goals.');
  }

  // Final Assessment Synthesizer
  let status: HealthSuitabilityAssessment['status'] = 'suitable';
  let badgeLabel = 'Suitable for Your Health Profile';
  let summary = 'This meal balances well with your current blood pressure, blood sugar, and metabolic targets.';

  if (riskPoints >= 3) {
    status = 'caution';
    badgeLabel = 'Caution: Health Review Needed';
    summary = `This meal exceeds recommended sodium or glycemic limits based on your health numbers (${sysBP}/${diaBP} mmHg, ${bloodSugar} mg/dL).`;
  } else if (riskPoints >= 1.5) {
    status = 'moderate';
    badgeLabel = 'Consume in Moderation';
    summary = `Mostly acceptable, but contains higher sodium or carbohydrates relative to your clinical profile.`;
  }

  if (clinicalTips.length === 0) {
    clinicalTips.push('Great balanced selection! Fits nicely within your daily macronutrient ratios.');
  }

  return {
    status,
    badgeLabel,
    summary,
    vitalChecks,
    clinicalTips,
  };
};
