import type { UserProfile } from '../../src/types';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  createdAt: string;
}

// Built-in environment fallbacks for Upstash Redis Cloud REST
const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL || 'https://sweet-wahoo-163840.upstash.io';
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAAAoAAAAIgcDFhNTRhNjI2ODdiODg0MjVmODRmZDFiM2VjOGRjMjczNw';

// In-memory fallback layer for local/offline execution
const IN_MEMORY_STORE = new Map<string, any>();

async function cloudGet<T>(key: string): Promise<T | null> {
  // 1. Try Upstash REST
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result !== null && data.result !== undefined) {
          let parsed = data.result;
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed);
            } catch {}
          }
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed);
            } catch {}
          }
          return parsed as T;
        }
      }
    } catch (err) {
      console.warn('[CloudAuth] Upstash GET error:', err);
    }
  }
  // 2. Fallback to in-memory
  return IN_MEMORY_STORE.get(key) || null;
}

async function cloudSet(key: string, value: any): Promise<boolean> {
  IN_MEMORY_STORE.set(key, value);
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      const res = await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: serialized,
      });
      return res.ok;
    } catch (err) {
      console.warn('[CloudAuth] Upstash SET error:', err);
    }
  }
  return true;
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
      const existing = await cloudGet<UserAccount>(emailKey);
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
      await cloudSet(emailKey, account);
      await cloudSet(`account:id:${account.id}`, account);

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
      let acc = await cloudGet<UserAccount>(emailKey);

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

      let acc = await cloudGet<UserAccount>(`account:id:${userId}`);
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

      let acc = await cloudGet<UserAccount>(`account:id:${userId}`);
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
