import { describe, it, expect, beforeEach } from 'vitest';

// Node localStorage polyfill for test environment
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  switchUser,
  getStoredAccounts,
  getDeviceKnownAccounts,
  verifyAccountPassword,
  switchUserWithPassword,
  removeDeviceKnownAccount,
  RegisterInput,
} from '../src/data/authService';

describe('Auth & Multi-Profile Management Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default demo accounts (Priya Sharma & Arjun Mehta)', () => {
    const accounts = getStoredAccounts();
    expect(accounts.length).toBeGreaterThanOrEqual(2);

    const priya = accounts.find((a) => a.email === 'priya@example.com');
    expect(priya).toBeDefined();
    expect(priya?.profile.name).toBe('Priya Sharma');
    expect(priya?.profile.lifestyle.location?.country).toBe('India');
    expect(priya?.profile.lifestyle.location?.state).toBe('Telangana');

    const arjun = accounts.find((a) => a.email === 'arjun@example.com');
    expect(arjun).toBeDefined();
    expect(arjun?.profile.name).toBe('Arjun Mehta');
    expect(arjun?.profile.lifestyle.location?.state).toBe('Punjab');
  });

  it('should enforce mandatory validation on registration', () => {
    // Missing Name
    const res1 = registerUser({
      name: '',
      email: 'test@example.com',
      password: 'password123',
      country: 'India',
      state: 'Telangana',
      age: 25,
      gender: 'male',
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      dietaryPreference: 'vegetarian',
    });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('Name is required');

    // Invalid Email
    const res2 = registerUser({
      name: 'John Doe',
      email: 'invalid-email',
      password: 'password123',
      country: 'India',
      state: 'Telangana',
      age: 25,
      gender: 'male',
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      dietaryPreference: 'vegetarian',
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('valid email');

    // Missing Country / State
    const res3 = registerUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      country: '',
      state: '',
      age: 25,
      gender: 'male',
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      dietaryPreference: 'vegetarian',
    });
    expect(res3.success).toBe(false);
    expect(res3.error).toContain('Country');
  });

  it('should register a valid new user and automatically calculate BMI & 12-nutrient targets', () => {
    const input: RegisterInput = {
      name: 'Dr. Sameer Patel',
      email: 'sameer.patel@clinic.org',
      password: 'securePassword123',
      confirmPassword: 'securePassword123',
      country: 'India',
      state: 'Gujarat',
      age: 34,
      gender: 'male',
      heightCm: 178,
      weightKg: 74,
      activityLevel: 'moderate',
      dietaryPreference: 'vegetarian',
      systolicBP: 122,
      diastolicBP: 80,
      fastingGlucose: 94,
    };

    const res = registerUser(input);
    expect(res.success).toBe(true);
    expect(res.profile).toBeDefined();

    const profile = res.profile!;
    expect(profile.name).toBe('Dr. Sameer Patel');
    expect(profile.bmi).toBeCloseTo(23.4, 0.5);
    expect(profile.bmiCategory).toBe('Normal weight');
    expect(profile.lifestyle.location?.country).toBe('India');
    expect(profile.lifestyle.location?.state).toBe('Gujarat');

    // Verify 12-Nutrient Targets are generated
    expect(profile.targets.calories).toBeGreaterThan(1500);
    expect(profile.targets.protein).toBeGreaterThan(60);
    expect(profile.targets.sodium).toBeDefined();
    expect(profile.targets.potassium).toBeDefined();

    // Verify user is set as active
    const active = getCurrentUser();
    expect(active?.id).toBe(profile.id);
  });

  it('should authenticate existing users with email and password', () => {
    // Correct login
    const loginRes = loginUser('priya@example.com', 'password123');
    expect(loginRes.success).toBe(true);
    expect(loginRes.profile?.name).toBe('Priya Sharma');

    // Incorrect password
    const wrongPass = loginUser('priya@example.com', 'wrongpassword');
    expect(wrongPass.success).toBe(false);
    expect(wrongPass.error).toContain('Incorrect password');

    // Non-existent email
    const noUser = loginUser('ghost@example.com', 'password123');
    expect(noUser.success).toBe(false);
    expect(noUser.error).toContain('No account found');
  });

  it('should switch between user profiles cleanly', () => {
    const priya = switchUser('usr_priya_sharma_01');
    expect(priya?.name).toBe('Priya Sharma');
    expect(getCurrentUser()?.id).toBe('usr_priya_sharma_01');

    const arjun = switchUser('usr_arjun_mehta_02');
    expect(arjun?.name).toBe('Arjun Mehta');
    expect(getCurrentUser()?.id).toBe('usr_arjun_mehta_02');

    logoutUser();
    expect(getCurrentUser()).toBeNull();
  });

  it('should only show device-authenticated accounts in getDeviceKnownAccounts', () => {
    // Before logging in, device accounts are empty (or active user only)
    expect(getDeviceKnownAccounts().length).toBe(0);

    // Logging in as Priya should register ONLY Priya on this device
    const priyaLogin = loginUser('priya@example.com', 'password123');
    expect(priyaLogin.success).toBe(true);

    const deviceAccounts = getDeviceKnownAccounts();
    expect(deviceAccounts.length).toBe(1);
    expect(deviceAccounts[0].profile.name).toBe('Priya Sharma');
    // Arjun Mehta must NOT be in the device accounts
    expect(deviceAccounts.some((a) => a.email === 'arjun@example.com')).toBe(false);
  });

  it('should enforce password verification when switching accounts', () => {
    loginUser('priya@example.com', 'password123');

    // Test verifyAccountPassword
    expect(verifyAccountPassword('usr_arjun_mehta_02', 'password123')).toBe(true);
    expect(verifyAccountPassword('usr_arjun_mehta_02', 'wrongpass')).toBe(false);

    // Attempt switch with wrong password
    const failSwitch = switchUserWithPassword('usr_arjun_mehta_02', 'wrongpass');
    expect(failSwitch.success).toBe(false);
    expect(failSwitch.error).toContain('Incorrect password');
    expect(getCurrentUser()?.id).toBe('usr_priya_sharma_01'); // Remains Priya

    // Attempt switch with correct password
    const successSwitch = switchUserWithPassword('usr_arjun_mehta_02', 'password123');
    expect(successSwitch.success).toBe(true);
    expect(successSwitch.profile?.name).toBe('Arjun Mehta');
    expect(getCurrentUser()?.id).toBe('usr_arjun_mehta_02'); // Now Arjun

    // Both should now be registered on this device
    const deviceAccounts = getDeviceKnownAccounts();
    expect(deviceAccounts.length).toBe(2);

    // Removing Arjun from device should work cleanly
    removeDeviceKnownAccount('usr_arjun_mehta_02');
    const remaining = getDeviceKnownAccounts();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('usr_priya_sharma_01');
  });
});
