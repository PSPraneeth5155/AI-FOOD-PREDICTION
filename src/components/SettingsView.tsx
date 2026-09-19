import React, { useState } from 'react';
import { UserProfile, DietPreference, ActivityLevel } from '../types';
import { calculateBMI, calculateTargets } from '../data/nutritionDb';
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
} from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onOpenHealthReport: () => void;
  onRestartOnboarding: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onOpenHealthReport,
  onRestartOnboarding,
}) => {
  // Collapsible section state
  const [openSection, setOpenSection] = useState<string | null>('bodyProfile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [name, setName] = useState(user.name);
  const [heightCm, setHeightCm] = useState(user.heightCm);
  const [weightKg, setWeightKg] = useState(user.weightKg);
  const [age, setAge] = useState(user.age);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(user.unitSystem || 'metric');

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
    };

    const newTargets = calculateTargets({
      weightKg,
      heightCm,
      age,
      gender: user.gender,
      medical: updatedMedical,
      lifestyle: updatedLifestyle,
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

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Update Body Metrics
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

      {/* Rerun Onboarding Action */}
      <div className="pt-2 flex flex-col space-y-2">
        <button
          onClick={onRestartOnboarding}
          className="w-full py-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
          <span>Re-run Health Onboarding Flow</span>
        </button>
      </div>
    </div>
  );
};
