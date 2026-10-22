import { UserProfile, Gender, ActivityLevel, DietPreference, ConditionVariant } from '../types';
import { calculateBMI, calculateTargets, DEFAULT_USER_PROFILE } from './nutritionDb';
import { resolveConditionVariants } from '../shared/conditionStagingResolver';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // Plain/hash for client-side multi-user demonstration
  profile: UserProfile;
  createdAt: string;
}

export interface RegisterInput {
  // Mandatory Credentials
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;

  // Mandatory Location
  country: string;
  state: string;

  // Mandatory Body & Lifestyle
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietaryPreference: DietPreference;

  // Clinical Vitals (Optional - with smart defaults)
  systolicBP?: number;
  diastolicBP?: number;
  fastingGlucose?: number;
  hba1c?: number;
  cholesterol?: number;
  ldlCholesterol?: number;
  egfr?: number;
  hemoglobin?: number;
  selectedConditions?: ConditionVariant[];
  allergies?: string[];
  healthGoals?: string[];
}

const STORAGE_ACCOUNTS_KEY = 'nutritrack_accounts_db';
const STORAGE_ACTIVE_USER_KEY = 'nutritrack_active_user_id';
const STORAGE_DEVICE_ACCOUNTS_KEY = 'nutritrack_device_accounts';

// Node / Browser storage fallback
const memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {}
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (e) {}
  memoryStore[key] = value;
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch (e) {}
  delete memoryStore[key];
}

// Default Pre-Seeded Profiles
const SEED_ACCOUNT_PRIYA: UserAccount = {
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
};

const SEED_ACCOUNT_ARJUN: UserAccount = {
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
};

/**
 * Initializes and retrieves all accounts stored in localStorage
 */
export function getStoredAccounts(): UserAccount[] {
  try {
    const raw = getStorageItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) {
      const initial = [SEED_ACCOUNT_PRIYA, SEED_ACCOUNT_ARJUN];
      setStorageItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading accounts from storage', e);
  }
  return [SEED_ACCOUNT_PRIYA, SEED_ACCOUNT_ARJUN];
}

/**
 * Saves or updates accounts list in storage
 */
export function saveAccounts(accounts: UserAccount[]): void {
  try {
    setStorageItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Error saving accounts to storage', e);
  }
}

/**
 * Retrieves the list of user IDs that have authenticated on this local device
 */
export function getDeviceAccountIds(): string[] {
  try {
    const raw = getStorageItem(STORAGE_DEVICE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading device accounts from storage', e);
  }

  // Fallback: If device accounts list is not initialized yet, check active user session
  const activeId = getStorageItem(STORAGE_ACTIVE_USER_KEY);
  if (activeId) {
    const initial = [activeId];
    setStorageItem(STORAGE_DEVICE_ACCOUNTS_KEY, JSON.stringify(initial));
    return initial;
  }

  return [];
}

/**
 * Registers an account ID as known/authenticated on this local device
 */
export function addDeviceKnownAccount(userId: string): void {
  try {
    const current = getDeviceAccountIds();
    if (!current.includes(userId)) {
      current.push(userId);
      setStorageItem(STORAGE_DEVICE_ACCOUNTS_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn('Error adding device account', e);
  }
}

/**
 * Removes an account ID from known device accounts (does not delete account itself)
 */
export function removeDeviceKnownAccount(userId: string): void {
  try {
    const current = getDeviceAccountIds();
    const filtered = current.filter((id) => id !== userId);
    setStorageItem(STORAGE_DEVICE_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Error removing device account', e);
  }
}

/**
 * Returns full account objects for accounts that have logged in on this device
 */
export function getDeviceKnownAccounts(): UserAccount[] {
  const deviceIds = getDeviceAccountIds();
  const allAccounts = getStoredAccounts();
  return allAccounts.filter((acc) => deviceIds.includes(acc.id));
}

/**
 * Verifies if the provided password matches the account
 */
export function verifyAccountPassword(userId: string, password: string): boolean {
  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.id === userId);
  if (!account) return false;
  return account.passwordHash === password;
}

/**
 * Password-protected switch profile
 */
export function switchUserWithPassword(
  userId: string,
  password: string
): { success: boolean; error?: string; profile?: UserProfile } {
  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.id === userId);
  if (!account) {
    return { success: false, error: 'Account not found.' };
  }

  if (account.passwordHash !== password) {
    return { success: false, error: 'Incorrect password for this profile. Please try again.' };
  }

  // Set active session & ensure registered on this device
  setStorageItem(STORAGE_ACTIVE_USER_KEY, userId);
  addDeviceKnownAccount(userId);

  return { success: true, profile: account.profile };
}

/**
 * Authenticate user with Email and Password
 */
export function loginUser(email: string, password: string): { success: boolean; error?: string; profile?: UserProfile } {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();

  const account = accounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);
  if (!account) {
    return { success: false, error: 'No account found with this email address.' };
  }

  if (account.passwordHash !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  // Set active session & register as device account
  setStorageItem(STORAGE_ACTIVE_USER_KEY, account.id);
  addDeviceKnownAccount(account.id);

  return { success: true, profile: account.profile };
}

/**
 * Register a new user profile with all mandatory validation + smart clinical defaults
 */
export function registerUser(input: RegisterInput): { success: boolean; error?: string; profile?: UserProfile } {
  // 1. Mandatory Validations
  if (!input.name || input.name.trim().length < 2) {
    return { success: false, error: 'Full Name is required (minimum 2 characters).' };
  }
  if (!input.email || !input.email.includes('@') || !input.email.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!input.password || input.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }
  if (input.confirmPassword !== undefined && input.password !== input.confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }
  if (!input.country || input.country.trim().length === 0) {
    return { success: false, error: 'Please select your Country from the dropdown.' };
  }
  if (!input.state || input.state.trim().length === 0) {
    return { success: false, error: 'Please select your State/Region from the dropdown.' };
  }
  if (!input.age || input.age < 5 || input.age > 120) {
    return { success: false, error: 'Please enter a valid Age between 5 and 120.' };
  }
  if (!input.gender) {
    return { success: false, error: 'Please select your Gender.' };
  }
  if (!input.heightCm || input.heightCm < 80 || input.heightCm > 250) {
    return { success: false, error: 'Please enter a valid Height (80 - 250 cm).' };
  }
  if (!input.weightKg || input.weightKg < 20 || input.weightKg > 300) {
    return { success: false, error: 'Please enter a valid Weight (20 - 300 kg).' };
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const accounts = getStoredAccounts();

  // Check unique email
  if (accounts.some((acc) => acc.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'An account with this email address already exists. Please log in.' };
  }

  // 2. Compute Body Metrics
  const { bmi, category: bmiCategory } = calculateBMI(input.weightKg, input.heightCm);

  // 3. Clinical Vitals (With Smart Clinical Defaults)
  const systolicBP = input.systolicBP || 120;
  const diastolicBP = input.diastolicBP || 80;
  const fastingGlucose = input.fastingGlucose || (input.selectedConditions?.includes('DIABETES_T2_CONTROLLED') ? 130 : 92);
  const bloodSugar = fastingGlucose;
  const cholesterol = input.cholesterol || 180;
  const ldlCholesterol = input.ldlCholesterol || 110;
  const egfr = input.egfr || 100;
  const hemoglobin = input.hemoglobin || (input.gender === 'female' ? 12.8 : 14.5);

  const medical = {
    systolicBP,
    diastolicBP,
    fastingGlucose,
    bloodSugar,
    hba1c: input.hba1c || (fastingGlucose > 125 ? 7.0 : fastingGlucose > 100 ? 5.9 : 5.2),
    cholesterol,
    ldlCholesterol,
    egfr,
    hemoglobin,
  };

  // Determine regional preference based on Country & State
  let regionalPref: UserProfile['lifestyle']['regionalPreference'] = 'Global';
  if (input.country.toLowerCase() === 'india') {
    const s = input.state.toLowerCase();
    if (['telangana', 'andhra pradesh', 'tamil nadu', 'kerala', 'karnataka'].includes(s)) {
      regionalPref = 'South Indian';
    } else if (['punjab', 'delhi', 'kashmir', 'rajasthan', 'uttar pradesh', 'bihar'].includes(s)) {
      regionalPref = 'North Indian';
    } else if (['maharashtra', 'gujarat', 'goa'].includes(s)) {
      regionalPref = 'West Indian';
    } else if (['west bengal', 'odisha'].includes(s)) {
      regionalPref = 'East Indian';
    } else {
      regionalPref = 'Pan-Indian';
    }
  }

  // 4. Construct Draft Profile for Condition Staging
  const draftProfile: Partial<UserProfile> = {
    age: input.age,
    gender: input.gender,
    bmi,
    bmiCategory,
    medical,
    activeConditionVariants: input.selectedConditions || [],
    lifestyle: {
      activityLevel: input.activityLevel,
      sleepHours: 7.5,
      dietaryPreference: input.dietaryPreference,
      allergies: input.allergies || [],
      healthGoals: input.healthGoals || ['Balanced Vitality', 'Healthy Weight'],
      regionalPreference: regionalPref,
      location: {
        country: input.country,
        state: input.state,
      },
    },
  };

  // Resolve condition variants dynamically
  const resolvedVariants = resolveConditionVariants(draftProfile);
  const finalConditions = Array.from(new Set([...(input.selectedConditions || []), ...resolvedVariants]));

  // 5. Calculate Daily 12-Nutrient Targets
  const targets = calculateTargets({
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age: input.age,
    gender: input.gender,
    activeConditionVariants: finalConditions,
    lifestyle: {
      activityLevel: input.activityLevel,
      dietaryPreference: input.dietaryPreference,
      sleepHours: 7.5,
      allergies: input.allergies || [],
      healthGoals: input.healthGoals || ['Balanced Vitality', 'Healthy Weight'],
      regionalPreference: regionalPref,
      location: {
        country: input.country,
        state: input.state,
      },
    },
    medical,
  });

  const userId = `usr_${Date.now()}`;
  const avatarIndex = (accounts.length % 4) + 1;
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
  ];

  const newProfile: UserProfile = {
    id: userId,
    name: input.name.trim(),
    email: normalizedEmail,
    avatar: avatars[avatarIndex - 1],
    role: 'CONSUMER',
    age: input.age,
    gender: input.gender,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    bmi,
    bmiCategory,
    medical,
    activeConditionVariants: finalConditions,
    lifestyle: {
      activityLevel: input.activityLevel,
      sleepHours: 7.5,
      dietaryPreference: input.dietaryPreference,
      allergies: input.allergies || [],
      healthGoals: input.healthGoals || ['Balanced Vitality', 'Healthy Weight'],
      regionalPreference: regionalPref,
      location: {
        country: input.country,
        state: input.state,
      },
    },
    targets,
    unitSystem: 'metric',
    notifications: {
      mealReminders: true,
      waterReminders: true,
      weeklyReport: true,
    },
    fitnessConnections: {
      googleFit: false,
      samsungHealth: false,
      appleHealth: false,
      fitbit: false,
      autoSync: false,
      activeSource: 'manual',
    },
    fitnessData: {
      steps: 4500,
      stepGoal: 10000,
      activeCaloriesBurned: 180,
      activeMinutes: 25,
      distanceKm: 3.2,
      restingHeartRate: 70,
      avgHeartRate: 78,
      source: 'manual',
      lastSyncedAt: new Date().toISOString(),
    },
    onboardingCompleted: true,
  };

  const newAccount: UserAccount = {
    id: userId,
    email: normalizedEmail,
    passwordHash: input.password,
    profile: newProfile,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  // Set active session & register as device account
  setStorageItem(STORAGE_ACTIVE_USER_KEY, userId);
  addDeviceKnownAccount(userId);

  return { success: true, profile: newProfile };
}

/**
 * Logout active user session
 */
export function logoutUser(): void {
  removeStorageItem(STORAGE_ACTIVE_USER_KEY);
}

/**
 * Retrieve the currently logged in user profile (or null if unauthenticated)
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const activeId = getStorageItem(STORAGE_ACTIVE_USER_KEY);
    const accounts = getStoredAccounts();

    if (activeId) {
      const match = accounts.find((a) => a.id === activeId);
      if (match) return match.profile;
    }
  } catch (e) {
    console.warn('Error fetching current user profile', e);
  }
  return null;
}

/**
 * Switch active profile to another account
 */
export function switchUser(userId: string): UserProfile | null {
  const accounts = getStoredAccounts();
  const match = accounts.find((a) => a.id === userId);
  if (match) {
    setStorageItem(STORAGE_ACTIVE_USER_KEY, userId);
    return match.profile;
  }
  return null;
}

/**
 * Update current active user's profile in storage
 */
export function updateActiveProfile(updated: UserProfile): void {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.id === updated.id);
  if (index >= 0) {
    accounts[index].profile = updated;
    saveAccounts(accounts);
  }
}
