import React, { useState } from 'react';
import { UserProfile, DietPreference, ActivityLevel } from '../types';
import { calculateBMI, calculateTargets } from '../data/nutritionDb';
import {
  getDeviceKnownAccounts,
  switchUserWithPassword,
  removeDeviceKnownAccount,
  logoutUser,
  updateActiveProfile,
  UserAccount,
} from '../data/authService';
import {
  COUNTRIES_AND_STATES,
  getStatesForCountry,
} from '../data/locationFoodData';
import {
  User,
  Heart,
  FileText,
  Bell,
  Scale,
  LogOut,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
  Sliders,
  HeartPulse,
  Activity,
  ShieldCheck,
  Users,
  MapPin,
  X,
  Plus,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onOpenHealthReport: () => void;
  onRestartOnboarding: () => void;
  onOpenWeeklyUpdate?: () => void;
  onOpenFitnessSync?: () => void;
  onOpenClinicianPortal?: () => void;
  onLogout?: () => void;
  onSwitchProfile?: (profile: UserProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onOpenHealthReport,
  onRestartOnboarding,
  onOpenWeeklyUpdate,
  onOpenFitnessSync,
  onOpenClinicianPortal,
  onLogout,
  onSwitchProfile,
}) => {
  // Collapsible section state
  const [openSection, setOpenSection] = useState<string | null>('bodyProfile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Multi-profile switch states
  const [deviceAccounts, setDeviceAccounts] = useState<UserAccount[]>(() => getDeviceKnownAccounts());
  const [unlockingUserId, setUnlockingUserId] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleOpenSwitchModal = () => {
    setDeviceAccounts(getDeviceKnownAccounts());
    setUnlockingUserId(null);
    setUnlockPassword('');
    setUnlockError(null);
    setShowUnlockPassword(false);
    setShowSwitchModal(true);
  };

  const handleUnlockAndSwitch = async (accId: string) => {
    if (!unlockPassword.trim()) {
      setUnlockError('Please enter your password.');
      return;
    }
    const res = await switchUserWithPassword(accId, unlockPassword);
    if (res.success && res.profile) {
      if (onSwitchProfile) {
        onSwitchProfile(res.profile);
      }
      setShowSwitchModal(false);
      setUnlockingUserId(null);
      setUnlockPassword('');
      setUnlockError(null);
    } else {
      setUnlockError(res.error || 'Incorrect password for this profile.');
    }
  };

  const handleRemoveDeviceAccount = (accId: string) => {
    removeDeviceKnownAccount(accId);
    setDeviceAccounts(getDeviceKnownAccounts());
    if (unlockingUserId === accId) {
      setUnlockingUserId(null);
      setUnlockPassword('');
      setUnlockError(null);
    }
  };

  // Form states
  const [name, setName] = useState(user.name);
  const [heightCm, setHeightCm] = useState(user.heightCm);
  const [weightKg, setWeightKg] = useState(user.weightKg);
  const [age, setAge] = useState(user.age);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(user.unitSystem || 'metric');

  // Location
  const [country, setCountry] = useState<string>(user.lifestyle?.location?.country || 'India');
  const [state, setState] = useState<string>(user.lifestyle?.location?.state || 'Telangana');

  // Medical
  const [systolicBP, setSystolicBP] = useState(user.medical.systolicBP || 120);
  const [diastolicBP, setDiastolicBP] = useState(user.medical.diastolicBP || 80);
  const [bloodSugar, setBloodSugar] = useState(user.medical.bloodSugar || 95);
  const [cholesterol, setCholesterol] = useState(user.medical.cholesterol || 185);

  // Lifestyle & Allergies
  const [dietaryPreference, setDietaryPreference] = useState<DietPreference>(
    user.lifestyle.dietaryPreference
  );
  const [regionalPreference, setRegionalPreference] = useState<
    UserProfile['lifestyle']['regionalPreference']
  >(user.lifestyle.regionalPreference || 'South Indian');
  const [allergies, setAllergies] = useState<string[]>(user.lifestyle.allergies);

  // Sync state whenever active user changes
  React.useEffect(() => {
    setName(user.name);
    setHeightCm(user.heightCm);
    setWeightKg(user.weightKg);
    setAge(user.age);
    setUnitSystem(user.unitSystem || 'metric');
    setCountry(user.lifestyle?.location?.country || 'India');
    setState(user.lifestyle?.location?.state || 'Telangana');
    setSystolicBP(user.medical.systolicBP || 120);
    setDiastolicBP(user.medical.diastolicBP || 80);
    setBloodSugar(user.medical.bloodSugar || 95);
    setCholesterol(user.medical.cholesterol || 185);
    setDietaryPreference(user.lifestyle.dietaryPreference);
    setRegionalPreference(user.lifestyle.regionalPreference || 'South Indian');
    setAllergies(user.lifestyle.allergies || []);
  }, [user]);

  // Notifications
  const [mealReminders, setMealReminders] = useState(user.notifications.mealReminders);
  const [waterReminders, setWaterReminders] = useState(user.notifications.waterReminders);
  const [weeklyReport, setWeeklyReport] = useState(user.notifications.weeklyReport);

  const toggleSection = (sec: string) => {
    setOpenSection(openSection === sec ? null : sec);
  };

  const toggleAllergy = (alg: string) => {
    setAllergies((prev) =>
      prev.includes(alg) ? prev.filter((a) => a !== alg) : [...prev, alg]
    );
  };

  const handleSaveSettings = () => {
    const { bmi, category: bmiCategory } = calculateBMI(weightKg, heightCm);

    const updatedMedical = {
      systolicBP,
      diastolicBP,
      bloodSugar,
      cholesterol,
    };

    const updatedLifestyle = {
      ...user.lifestyle,
      dietaryPreference,
      regionalPreference,
      allergies,
      location: {
        country,
        state,
      },
    };

    const newTargets = calculateTargets({
      weightKg,
      heightCm,
      age,
      gender: user.gender,
      activeConditionVariants: user.activeConditionVariants,
      lifestyle: updatedLifestyle,
      medical: updatedMedical,
    });

    const updated: UserProfile = {
      ...user,
      name,
      heightCm,
      weightKg,
      age,
      bmi,
      bmiCategory,
      unitSystem,
      medical: updatedMedical,
      lifestyle: updatedLifestyle,
      targets: newTargets,
      notifications: {
        mealReminders,
        waterReminders,
        weeklyReport,
      },
    };

    updateActiveProfile(updated);
    onUpdateUser(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-4 pb-28 pt-3 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Preferences & Data
          </span>
          <h1 className="text-base font-bold text-slate-900">Settings</h1>
        </div>

        {saveSuccess && (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold flex items-center space-x-1">
            <Check className="w-3.5 h-3.5" />
            <span>Saved!</span>
          </span>
        )}
      </div>

      {/* ACTIVE USER PROFILE & MULTI-ACCOUNT CARD */}
      <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/30 border-2 border-white shadow-xs"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-sm font-bold text-slate-900">{user.name}</h2>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800">
                  {user.role || 'CONSUMER'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">{user.email}</span>
              <div className="flex items-center space-x-1 mt-0.5 text-[10px] text-teal-800 font-semibold">
                <MapPin className="w-3 h-3 text-teal-600" />
                <span>{country}, {state}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 items-end">
            <button
              type="button"
              onClick={handleOpenSwitchModal}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200 flex items-center space-x-1 transition-all"
            >
              <Users className="w-3 h-3 text-teal-700" />
              <span>Switch</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out of NutriTrack AI?')) {
                    logoutUser();
                    onLogout();
                  }
                }}
                className="px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center space-x-0.5"
              >
                <LogOut className="w-2.5 h-2.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DOCTOR HEALTH REPORT HERO CARD */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-800 to-teal-700 text-white shadow-md shadow-teal-900/20 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-teal-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Doctor Health Report</h3>
          </div>
          <p className="text-xs text-teal-100">
            Generate printable clinical summary with vitals & nutrient averages
          </p>
        </div>
        <button
          id="btn-open-health-report"
          onClick={onOpenHealthReport}
          className="px-3.5 py-2 rounded-xl bg-white text-teal-800 text-xs font-bold shadow-sm hover:bg-teal-50 active:scale-95 transition-all shrink-0 ml-2"
        >
          View & Print
        </button>
      </div>

      {/* QUICK ACTIONS FOR WEEKLY CHECK-IN & FITNESS SYNC */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={onOpenWeeklyUpdate}
          className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs hover:border-teal-300 cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Weekly Check-in</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Recalibrate BP, blood sugar & reminder interval
          </p>
          <span className="text-[11px] font-bold text-teal-700 group-hover:underline">
            Manage Vitals →
          </span>
        </div>

        <div
          onClick={onOpenFitnessSync}
          className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs hover:border-teal-300 cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Fitness Apps</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Google Fit, Samsung Health & Apple Health
          </p>
          <span className="text-[11px] font-bold text-teal-700 group-hover:underline">
            Sync Devices →
          </span>
        </div>
      </div>

      {/* GROUP 1: Physical & Body Metrics */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => toggleSection('bodyProfile')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Body & Health Profile</h4>
              <p className="text-[10px] text-slate-400">
                Height, weight, age, and BMI ({user.bmi} {user.bmiCategory})
              </p>
            </div>
          </div>
          {openSection === 'bodyProfile' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSection === 'bodyProfile' && (
          <div className="p-4 pt-1 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-1 text-teal-800 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Location (Country & State)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => {
                      const c = e.target.value;
                      setCountry(c);
                      const states = getStatesForCountry(c);
                      if (states.length > 0) setState(states[0].name);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {COUNTRIES_AND_STATES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">State / Region</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {getStatesForCountry(country).map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Update Body & Location Metrics
            </button>
          </div>
        )}
      </div>

      {/* GROUP 2: Medical Vital Markers */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => toggleSection('medicalMarkers')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Medical Vital Markers</h4>
              <p className="text-[10px] text-slate-400">
                Blood pressure ({systolicBP}/{diastolicBP}), Glucose ({bloodSugar} mg/dL)
              </p>
            </div>
          </div>
          {openSection === 'medicalMarkers' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSection === 'medicalMarkers' && (
          <div className="p-4 pt-1 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fasting Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  value={cholesterol}
                  onChange={(e) => setCholesterol(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Update Medical Vitals
            </button>
          </div>
        )}
      </div>

      {/* GROUP 3: Diet Preference & Allergies */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => toggleSection('dietPreferences')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Diet & Allergies</h4>
              <p className="text-[10px] text-slate-400 capitalize">
                {dietaryPreference} • {allergies.length} allergies
              </p>
            </div>
          </div>
          {openSection === 'dietPreferences' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSection === 'dietPreferences' && (
          <div className="p-4 pt-1 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Dietary Pattern
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['any', 'vegetarian', 'vegan', 'pescatarian'] as DietPreference[]).map((diet) => (
                  <button
                    key={diet}
                    onClick={() => setDietaryPreference(diet)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      dietaryPreference === diet
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Regional Cuisine Preference
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['South Indian', 'North Indian', 'Pan-Indian', 'Global'] as const).map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setRegionalPreference(reg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      regionalPreference === reg
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {reg === 'Global' ? '🌐 ' : '🇮🇳 '}
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Allergens to Exclude
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Dairy', 'Peanuts', 'Tree nuts', 'Gluten', 'Shellfish', 'Soy', 'Eggs'].map(
                  (alg) => {
                    const isSelected = allergies.includes(alg);
                    return (
                      <button
                        key={alg}
                        onClick={() => toggleAllergy(alg)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {alg}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Save Diet Preferences
            </button>
          </div>
        )}
      </div>

      {/* GROUP 4: Units & Notifications */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => toggleSection('appPreferences')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Units & Notifications</h4>
              <p className="text-[10px] text-slate-400 capitalize">
                {unitSystem} units • Reminders enabled
              </p>
            </div>
          </div>
          {openSection === 'appPreferences' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSection === 'appPreferences' && (
          <div className="p-4 pt-1 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold text-slate-700">Measurement System</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setUnitSystem('metric')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    unitSystem === 'metric'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Metric
                </button>
                <button
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    unitSystem === 'imperial'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold text-slate-700">Meal Reminders</span>
              <input
                type="checkbox"
                checked={mealReminders}
                onChange={(e) => setMealReminders(e.target.checked)}
                className="w-4 h-4 accent-teal-600"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold text-slate-700">Water Hydration Prompts</span>
              <input
                type="checkbox"
                checked={waterReminders}
                onChange={(e) => setWaterReminders(e.target.checked)}
                className="w-4 h-4 accent-teal-600"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        )}
      </div>

      {/* Clinician Governance Action */}
      {onOpenClinicianPortal && (
        <div className="pt-2">
          <button
            onClick={onOpenClinicianPortal}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition-all shadow-md border border-slate-700"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Clinician Governance Portal</span>
                <span className="text-[10px] text-slate-400 font-normal">Review & audit 504 clinical threshold rules</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">
              Open Portal
            </span>
          </button>
        </div>
      )}

      {/* Rerun Onboarding Action */}
      <div className="pt-1 flex flex-col space-y-2">
        <button
          onClick={onRestartOnboarding}
          className="w-full py-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
          <span>Re-run Health Onboarding Flow</span>
        </button>
      </div>

      {/* SWITCH USER PROFILE MODAL */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-sky-50">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Switch User Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 divide-y divide-slate-100 max-h-80 overflow-y-auto space-y-2">
              {deviceAccounts.length <= 1 && (
                <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100 text-center mb-1">
                  <p className="text-xs font-bold text-teal-900">
                    Only your profile is on this device
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Other profiles will only appear here once signed into on this device.
                  </p>
                </div>
              )}

              {deviceAccounts.map((acc) => {
                const isActive = acc.id === user.id;
                const isUnlocking = unlockingUserId === acc.id;

                return (
                  <div
                    key={acc.id}
                    className={`rounded-2xl transition-all border ${
                      isActive
                        ? 'bg-teal-50/80 border-teal-200 p-2.5'
                        : isUnlocking
                        ? 'bg-slate-50/90 border-teal-300 p-3 shadow-xs'
                        : 'hover:bg-slate-50/80 border-slate-100 p-2.5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={acc.profile.avatar}
                          alt={acc.profile.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-900 block">{acc.profile.name}</span>
                          <span className="text-[10px] text-slate-400 block">{acc.email}</span>
                          {acc.profile.lifestyle?.location && (
                            <span className="text-[9px] font-bold text-teal-700 block">
                              📍 {acc.profile.lifestyle.location.state}, {acc.profile.lifestyle.location.country}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {isActive ? (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full">
                            Active ✓
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (isUnlocking) {
                                  setUnlockingUserId(null);
                                  setUnlockPassword('');
                                  setUnlockError(null);
                                } else {
                                  setUnlockingUserId(acc.id);
                                  setUnlockPassword('');
                                  setUnlockError(null);
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold flex items-center space-x-1 transition-all shadow-xs"
                            >
                              <Lock className="w-3 h-3" />
                              <span>{isUnlocking ? 'Cancel' : 'Switch'}</span>
                            </button>
                            <button
                              type="button"
                              title="Remove profile from this device"
                              onClick={() => handleRemoveDeviceAccount(acc.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline Password Unlock Section for Inactive Account */}
                    {!isActive && isUnlocking && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                            <Lock className="w-3 h-3 text-teal-600" />
                            <span>Enter Password to Unlock</span>
                          </label>
                        </div>

                        <div className="relative">
                          <input
                            type={showUnlockPassword ? 'text' : 'password'}
                            value={unlockPassword}
                            onChange={(e) => {
                              setUnlockPassword(e.target.value);
                              if (unlockError) setUnlockError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUnlockAndSwitch(acc.id);
                              }
                            }}
                            placeholder="Account password"
                            className="w-full px-3 py-2 pr-9 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showUnlockPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {unlockError && (
                          <div className="flex items-start space-x-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{unlockError}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleUnlockAndSwitch(acc.id)}
                            className="flex-1 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Unlock & Switch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUnlockingUserId(null);
                              setUnlockPassword('');
                              setUnlockError(null);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitchModal(false);
                    logoutUser();
                    onLogout();
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create or Sign into Another Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
