import { edgeCache, db } from '../../src/db/client';
import { userClinicalProfiles, users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { UserProfile } from '../../src/types';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  createdAt: string;
}

// Default pre-seeded demo accounts
const SEED_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_priya_sharma_01',
    email: 'priya@example.com',
    passwordHash: 'password123',
    createdAt: '2026-01-15T08:00:00.000Z',
    profile: {
      id: 'usr_priya_sharma_01',
      name: 'Priya Sharma',
      email: 'priya@example.com',
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
        bloodSugar: 114,
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
        healthGoals: ['Lower Blood Pressure', 'Reverse Prediabetes', 'Heart Protection'],
        regionalPreference: 'South Indian',
        location: {
          country: 'India',
          state: 'Telangana',
        },
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
      fitnessConnections: {
        googleFit: true,
        samsungHealth: false,
        appleHealth: false,
        fitbit: false,
        autoSync: true,
        activeSource: 'google_fit',
        lastSyncedAt: new Date().toISOString(),
      },
      fitnessData: {
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
    },
  },
  {
    id: 'usr_arjun_mehta_02',
    email: 'arjun@example.com',
    passwordHash: 'password123',
    createdAt: '2026-02-10T09:30:00.000Z',
    profile: {
      id: 'usr_arjun_mehta_02',
      name: 'Arjun Mehta',
      email: 'arjun@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      role: 'CONSUMER',
      age: 29,
      gender: 'male',
      heightCm: 180,
      weightKg: 76,
      bmi: 23.5,
      bmiCategory: 'Normal weight',
      unitSystem: 'metric',
      notifications: { mealReminders: true, waterReminders: true, weeklyReport: true },
      onboardingCompleted: true,
      medical: {
        systolicBP: 118,
        diastolicBP: 76,
        fastingGlucose: 88,
        bloodSugar: 88,
        hba1c: 5.1,
        cholesterol: 175,
        ldlCholesterol: 102,
        egfr: 110,
        hemoglobin: 15.2,
      },
      activeConditionVariants: ['ATHLETE_STRENGTH_HYPERTROPHY'],
      lifestyle: {
        activityLevel: 'very_active',
        sleepHours: 8,
        dietaryPreference: 'any',
        allergies: [],
        healthGoals: ['Muscle Hypertrophy', 'High Protein Diet', 'Strength Optimization'],
        regionalPreference: 'North Indian',
        location: {
          country: 'India',
          state: 'Punjab',
        },
      },
      targets: {
        calories: 2600,
        protein: 150,
        carbs: 310,
        fat: 75,
        saturatedFat: 20,
        fiber: 38,
        sugar: 45,
        sodium: 2300,
        cholesterol: 280,
        potassium: 3800,
        calcium: 1200,
        iron: 20,
        waterMl: 3200,
        stepsGoal: 12000,
        activeCaloriesBurnGoal: 650,
      },
      fitnessConnections: {
        googleFit: false,
        samsungHealth: false,
        appleHealth: true,
        fitbit: false,
        autoSync: true,
        activeSource: 'apple_health',
        lastSyncedAt: new Date().toISOString(),
      },
      fitnessData: {
        steps: 11240,
        stepGoal: 12000,
        activeCaloriesBurned: 610,
        activeMinutes: 65,
        distanceKm: 8.4,
        restingHeartRate: 58,
        avgHeartRate: 84,
        sleepHours: 7.8,
        sleepScore: 90,
        bloodOxygenSpO2: 99,
        source: 'apple_health',
        lastSyncedAt: new Date().toISOString(),
      },
    },
  },
];

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { action, email, password, account, userId } = req.body || {};

    // 1. REGISTER NEW ACCOUNT
    if (action === 'register') {
      if (!account || !account.email || !account.passwordHash) {
        res.status(400).json({ success: false, error: 'Incomplete account details for registration.' });
        return;
      }

      const normalizedEmail = account.email.trim().toLowerCase();
      const emailKey = `account:email:${normalizedEmail}`;

      // Check if account already exists in cloud cache
      const existing = await edgeCache.get<UserAccount>(emailKey);
      if (existing) {
        res.status(400).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.',
        });
        return;
      }

      // Check if conflicts with pre-seeded demo accounts
      if (SEED_ACCOUNTS.some((a) => a.email.toLowerCase() === normalizedEmail)) {
        res.status(400).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.',
        });
        return;
      }

      // Store in global cloud cache
      await edgeCache.set(emailKey, account, 86400 * 365); // 1 year TTL in Redis
      await edgeCache.set(`account:id:${account.id}`, account, 86400 * 365);

      // Best-effort persistence in Neon PostgreSQL
      if (db) {
        try {
          const inserted = await db
            .insert(users)
            .values({
              email: normalizedEmail,
              role: account.profile.role || 'CONSUMER',
            })
            .onConflictDoNothing()
            .returning({ id: users.id });

          const dbUserId = inserted.length > 0 ? inserted[0].id : null;
          if (dbUserId) {
            await db
              .insert(userClinicalProfiles)
              .values({
                userId: dbUserId,
                displayName: account.profile.name,
                age: account.profile.age,
                gender: account.profile.gender,
                heightCm: String(account.profile.heightCm),
                weightKg: String(account.profile.weightKg),
                bmi: String(account.profile.bmi),
                activityLevel: account.profile.lifestyle.activityLevel,
                sleepHours: String(account.profile.lifestyle.sleepHours || 7),
                dietaryPreference: account.profile.lifestyle.dietaryPreference || 'any',
                preferredCuisine: 'indian',
                cuisineRegion: account.profile.lifestyle.regionalPreference || 'Pan-Indian',
                activeConditionVariants: account.profile.activeConditionVariants || [],
                systolicBp: account.profile.medical?.systolicBP,
                diastolicBp: account.profile.medical?.diastolicBP,
                fastingBloodSugarMgDl: account.profile.medical?.fastingGlucose
                  ? String(account.profile.medical.fastingGlucose)
                  : null,
                hba1cPercent: account.profile.medical?.hba1c ? String(account.profile.medical.hba1c) : null,
                egfrMlMin: account.profile.medical?.egfr ? String(account.profile.medical.egfr) : null,
                ldlCholesterolMgDl: account.profile.medical?.ldlCholesterol
                  ? String(account.profile.medical.ldlCholesterol)
                  : null,
                totalCholesterolMgDl: account.profile.medical?.cholesterol
                  ? String(account.profile.medical.cholesterol)
                  : null,
                hemoglobinGDl: account.profile.medical?.hemoglobin
                  ? String(account.profile.medical.hemoglobin)
                  : null,
                targetCalories: String(account.profile.targets.calories),
                targetProteinG: String(account.profile.targets.protein),
                targetCarbsG: String(account.profile.targets.carbs),
                targetFiberG: String(account.profile.targets.fiber),
                targetSugarG: String(account.profile.targets.sugar),
                targetFatG: String(account.profile.targets.fat),
                targetSatFatG: String(account.profile.targets.saturatedFat),
                targetSodiumMg: String(account.profile.targets.sodium),
                targetCholesterolMg: String(account.profile.targets.cholesterol),
                targetPotassiumMg: String(account.profile.targets.potassium),
                targetCalciumMg: String(account.profile.targets.calcium),
                targetIronMg: String(account.profile.targets.iron),
              })
              .onConflictDoNothing();
          }
        } catch (dbErr) {
          console.warn('[DB] User insert into Neon PostgreSQL failed, but Redis cached successfully:', dbErr);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Account registered and synchronized to cloud successfully.',
        account,
        profile: account.profile,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    // 2. LOGIN USER
    if (action === 'login') {
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailKey = `account:email:${normalizedEmail}`;

      // Check cloud cache
      let acc = await edgeCache.get<UserAccount>(emailKey);

      // Fallback: Check pre-seeded demo accounts
      if (!acc) {
        acc = SEED_ACCOUNTS.find((a) => a.email.toLowerCase() === normalizedEmail);
      }

      if (!acc) {
        res.status(404).json({
          success: false,
          error: 'No account found with this email address.',
        });
        return;
      }

      if (acc.passwordHash !== password) {
        res.status(401).json({
          success: false,
          error: 'Incorrect password. Please try again.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        account: acc,
        profile: acc.profile,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    // 3. GET ACCOUNT BY ID
    if (action === 'get-account') {
      if (!userId) {
        res.status(400).json({ success: false, error: 'User ID is required.' });
        return;
      }

      let acc = await edgeCache.get<UserAccount>(`account:id:${userId}`);
      if (!acc) {
        acc = SEED_ACCOUNTS.find((a) => a.id === userId);
      }

      if (!acc) {
        res.status(404).json({ success: false, error: 'Account not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        account: acc,
        profile: acc.profile,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    // 4. VERIFY PASSWORD FOR SWITCHING USER
    if (action === 'verify-password') {
      if (!userId || !password) {
        res.status(400).json({ success: false, error: 'User ID and password are required.' });
        return;
      }

      let acc = await edgeCache.get<UserAccount>(`account:id:${userId}`);
      if (!acc) {
        acc = SEED_ACCOUNTS.find((a) => a.id === userId);
      }

      if (!acc) {
        res.status(404).json({ success: false, error: 'Account not found.' });
        return;
      }

      if (acc.passwordHash !== password) {
        res.status(401).json({
          success: false,
          error: 'Incorrect password for this profile. Please try again.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        account: acc,
        profile: acc.profile,
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: `Unsupported action '${action}'. Supported actions: register, login, get-account, verify-password.`,
    });
  } catch (err: any) {
    console.error('[/api/v1/auth] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Authentication server error',
      message: err.message,
    });
  }
}
