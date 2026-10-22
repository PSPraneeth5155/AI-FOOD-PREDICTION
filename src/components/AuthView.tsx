import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, DietPreference, ConditionVariant } from '../types';
import {
  loginUser,
  registerUser,
  RegisterInput,
} from '../data/authService';
import {
  COUNTRIES_AND_STATES,
  getStatesForCountry,
} from '../data/locationFoodData';
import { calculateBMI } from '../data/nutritionDb';
import {
  Activity,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  MapPin,
  Dumbbell,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ================= LOGIN STATE =================
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // ================= SIGNUP STATE =================
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account & Location (Mandatory)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('Telangana');

  // Step 2: Body & Lifestyle (Mandatory)
  const [age, setAge] = useState<number | ''>(28);
  const [gender, setGender] = useState<Gender>('female');
  const [heightCm, setHeightCm] = useState<number | ''>(165);
  const [weightKg, setWeightKg] = useState<number | ''>(65);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [dietaryPreference, setDietaryPreference] = useState<DietPreference>('vegetarian');

  // Step 3: Clinical Vitals & Conditions (Smart Defaults)
  const [systolicBP, setSystolicBP] = useState<number | ''>(120);
  const [diastolicBP, setDiastolicBP] = useState<number | ''>(80);
  const [fastingGlucose, setFastingGlucose] = useState<number | ''>(95);
  const [cholesterol, setCholesterol] = useState<number | ''>(180);
  const [hba1c, setHba1c] = useState<number | ''>(5.4);
  const [selectedConditions, setSelectedConditions] = useState<ConditionVariant[]>([]);

  // Update states whenever country changes
  const availableStates = getStatesForCountry(selectedCountry);

  const handleCountryChange = (cName: string) => {
    setSelectedCountry(cName);
    const states = getStatesForCountry(cName);
    if (states.length > 0) {
      setSelectedState(states[0].name);
    }
  };

  // Live BMI calculation
  const currentHeight = Number(heightCm) || 165;
  const currentWeight = Number(weightKg) || 65;
  const { bmi, category: bmiCategory } = calculateBMI(currentWeight, currentHeight);

  // ================= HANDLE LOGIN =================
  // ================= LOGIN HANDLER =================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoggingIn(true);

    try {
      const res = await loginUser(loginEmail, loginPassword);
      if (res.success && res.profile) {
        onAuthSuccess(res.profile);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your internet connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ================= HANDLE SIGNUP PROGRESSION =================
  const handleStep1Next = () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid Email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!selectedCountry || !selectedState) {
      setErrorMsg('Please select your Country and State.');
      return;
    }
    setSignupStep(2);
  };

  const handleStep2Next = () => {
    setErrorMsg(null);
    if (!age || age < 10 || age > 120) {
      setErrorMsg('Please enter a valid age (10 - 120).');
      return;
    }
    if (!heightCm || heightCm < 90 || heightCm > 240) {
      setErrorMsg('Please enter a valid height (90 - 240 cm).');
      return;
    }
    if (!weightKg || weightKg < 25 || weightKg > 280) {
      setErrorMsg('Please enter a valid weight (25 - 280 kg).');
      return;
    }
    setSignupStep(3);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSigningUp(true);

    const input: RegisterInput = {
      name,
      email,
      password,
      confirmPassword,
      country: selectedCountry,
      state: selectedState,
      age: Number(age),
      gender,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      dietaryPreference,
      systolicBP: systolicBP ? Number(systolicBP) : 120,
      diastolicBP: diastolicBP ? Number(diastolicBP) : 80,
      fastingGlucose: fastingGlucose ? Number(fastingGlucose) : 95,
      cholesterol: cholesterol ? Number(cholesterol) : 180,
      hba1c: hba1c ? Number(hba1c) : 5.4,
      selectedConditions,
    };

    try {
      const res = await registerUser(input);
      if (res.success && res.profile) {
        onAuthSuccess(res.profile);
      } else {
        setErrorMsg(res.error || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your internet connection.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const toggleConditionChip = (cond: ConditionVariant) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 text-slate-800 overflow-hidden relative z-10 transition-all duration-300">
        {/* Brand Header */}
        <div className="p-6 bg-emerald-50/70 border-b border-emerald-100/80 text-center relative">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#00695c] text-white flex items-center justify-center mb-2 shadow-sm">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">NutriTrack AI</h1>
          <p className="text-xs text-emerald-800 font-medium mt-0.5">
            Personalized Clinical Nutrition & Metabolic Health
          </p>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 mt-4 rounded-2xl bg-slate-200/70 text-xs font-bold border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'signup'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: LOGIN */}
        {/* ============================================================ */}
        {activeTab === 'login' && (
          <div className="p-6 space-y-5 animate-in fade-in duration-200">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-2xl bg-[#00695c] hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <span>{isLoggingIn ? 'Authenticating...' : 'Sign In to NutriTrack'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Create a Profile
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SIGNUP (3-STEP GUIDED WIZARD) */}
        {/* ============================================================ */}
        {activeTab === 'signup' && (
          <div className="p-6 space-y-4 animate-in fade-in duration-200">
            {/* Step Progress Pills */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              {[
                { num: 1, label: 'Account & Location' },
                { num: 2, label: 'Body Profile' },
                { num: 3, label: 'Health Vitals' },
              ].map((s) => (
                <div key={s.num} className="flex items-center space-x-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      signupStep === s.num
                        ? 'bg-[#00695c] text-white ring-2 ring-emerald-200'
                        : signupStep > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {signupStep > s.num ? '✓' : s.num}
                  </div>
                  <span
                    className={`text-[10px] font-bold hidden sm:inline ${
                      signupStep === s.num ? 'text-emerald-950' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: Account Credentials & Location */}
            {signupStep === 1 && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Step 1: Account & Location
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter your account details and select your country & state for localized foods.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Confirm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Country & State Dropdowns */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-950 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Location & Cuisine Region</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Country <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        {COUNTRIES_AND_STATES.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        State / Region <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        {availableStates.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Tailors regional recipe databases and nutritional plate recommendations.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full py-3 rounded-2xl bg-[#00695c] hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1"
                >
                  <span>Continue to Body Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 2: Body & Lifestyle */}
            {signupStep === 2 && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Step 2: Body Metrics & Lifestyle
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Required for calculating accurate metabolic targets and calorie thresholds.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Age (Years) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Height (cm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Weight (kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* BMI Preview Banner */}
                <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Calculated BMI:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-black text-slate-900">{bmi || 24.0}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {bmiCategory || 'Normal'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Activity Level <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'sedentary', label: 'Sedentary (Desk job)' },
                      { id: 'light', label: 'Lightly Active' },
                      { id: 'moderate', label: 'Moderately Active' },
                      { id: 'very_active', label: 'Very Active (Athlete)' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setActivityLevel(lvl.id as ActivityLevel)}
                        className={`p-2 rounded-xl text-[10px] font-bold text-left transition-all ${
                          activityLevel === lvl.id
                            ? 'bg-[#00695c] text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Dietary Preference <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['any', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'low_sodium'] as DietPreference[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDietaryPreference(d)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                          dietaryPreference === d
                            ? 'bg-[#00695c] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Next}
                    className="w-2/3 py-2.5 rounded-xl bg-[#00695c] hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1"
                  >
                    <span>Continue to Health Vitals</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Health Vitals & Conditions (Smart Defaults) */}
            {signupStep === 3 && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Step 3: Clinical Vitals & Conditions
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pre-filled with healthy baseline values. Update if you have recent lab reports.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      Blood Pressure (Sys/Dia)
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        placeholder="120"
                        value={systolicBP}
                        onChange={(e) => setSystolicBP(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-center focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                      <span className="text-slate-400">/</span>
                      <input
                        type="number"
                        placeholder="80"
                        value={diastolicBP}
                        onChange={(e) => setDiastolicBP(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-center focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      Fasting Glucose (mg/dL)
                    </label>
                    <input
                      type="number"
                      placeholder="95"
                      value={fastingGlucose}
                      onChange={(e) => setFastingGlucose(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      Total Cholesterol (mg/dL)
                    </label>
                    <input
                      type="number"
                      placeholder="180"
                      value={cholesterol}
                      onChange={(e) => setCholesterol(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      HbA1c (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="5.4"
                      value={hba1c}
                      onChange={(e) => setHba1c(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Health Condition Chips */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Select Any Diagnosed Health Conditions:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'DIABETES_T2_CONTROLLED', label: 'Type 2 Diabetes' },
                      { id: 'PREDIABETES_EARLY', label: 'Prediabetes' },
                      { id: 'HTN_STAGE_1', label: 'Hypertension' },
                      { id: 'CHOL_HIGH_LDL', label: 'High Cholesterol' },
                      { id: 'CKD_STAGE_3A', label: 'CKD (Kidney)' },
                      { id: 'OBESITY_CLASS_1', label: 'Weight Management' },
                    ].map((cond) => (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => toggleConditionChip(cond.id as ConditionVariant)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          selectedConditions.includes(cond.id as ConditionVariant)
                            ? 'bg-rose-50 border-rose-300 text-rose-800 ring-1 ring-rose-400'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Leave blank if healthy or aiming for preventive wellness.
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(2)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSigningUp}
                    className="w-2/3 py-2.5 rounded-xl bg-[#00695c] hover:bg-emerald-800 disabled:opacity-60 active:scale-98 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1"
                  >
                    <span>{isSigningUp ? 'Saving & Syncing...' : 'Create Profile & Launch'}</span>
                    {isSigningUp ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
