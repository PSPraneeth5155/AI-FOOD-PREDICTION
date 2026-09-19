import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, DietPreference } from '../types';
import { calculateBMI, calculateTargets } from '../data/nutritionDb';
import { Heart, Activity, Check, ChevronRight, ArrowLeft } from 'lucide-react';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState(initialProfile.name || 'Alex Morgan');
  const [gender, setGender] = useState<Gender>(initialProfile.gender || 'female');
  const [age, setAge] = useState(initialProfile.age || 28);
  const [heightCm, setHeightCm] = useState(initialProfile.heightCm || 172);
  const [weightKg, setWeightKg] = useState(initialProfile.weightKg || 68);

  // Medical
  const [systolicBP, setSystolicBP] = useState<string>(
    initialProfile.medical.systolicBP ? String(initialProfile.medical.systolicBP) : '120'
  );
  const [diastolicBP, setDiastolicBP] = useState<string>(
    initialProfile.medical.diastolicBP ? String(initialProfile.medical.diastolicBP) : '80'
  );
  const [bloodSugar, setBloodSugar] = useState<string>(
    initialProfile.medical.bloodSugar ? String(initialProfile.medical.bloodSugar) : '95'
  );
  const [cholesterol, setCholesterol] = useState<string>(
    initialProfile.medical.cholesterol ? String(initialProfile.medical.cholesterol) : '185'
  );

  // Lifestyle
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile.lifestyle.activityLevel || 'moderate'
  );
  const [sleepHours, setSleepHours] = useState(initialProfile.lifestyle.sleepHours || 7.5);
  const [dietaryPreference, setDietaryPreference] = useState<DietPreference>(
    initialProfile.lifestyle.dietaryPreference || 'any'
  );
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    initialProfile.lifestyle.allergies || []
  );

  // Live BMI calculation
  const { bmi, category: bmiCategory } = calculateBMI(weightKg, heightCm);

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const allergyOptions = ['Dairy', 'Peanuts', 'Tree nuts', 'Gluten', 'Shellfish', 'Soy', 'Eggs'];

  const handleFinish = () => {
    const medical = {
      systolicBP: systolicBP ? parseInt(systolicBP, 10) : undefined,
      diastolicBP: diastolicBP ? parseInt(diastolicBP, 10) : undefined,
      bloodSugar: bloodSugar ? parseInt(bloodSugar, 10) : undefined,
      cholesterol: cholesterol ? parseInt(cholesterol, 10) : undefined,
    };

    const lifestyle = {
      activityLevel,
      sleepHours,
      dietaryPreference,
      allergies: selectedAllergies,
      healthGoals: ['Sustain High Energy', 'Balanced Nutrition'],
    };

    const targets = calculateTargets({
      weightKg,
      heightCm,
      age,
      gender,
      medical,
      lifestyle,
    });

    const updated: UserProfile = {
      ...initialProfile,
      name,
      gender,
      age,
      heightCm,
      weightKg,
      bmi,
      bmiCategory,
      medical,
      lifestyle,
      targets,
      onboardingCompleted: true,
    };

    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl overflow-hidden my-auto transition-all">
        {/* Header with Step indicator */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              {step}/3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === 1 && 'Basic Physical Profile'}
                {step === 2 && 'Health & Vital Markers'}
                {step === 3 && 'Lifestyle & Diet'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 && 'Personalizes your calorie & macro limits'}
                {step === 2 && 'Optional — helps identify healthy gaps'}
                {step === 3 && 'Tailors food recommendation filters'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg"
            >
              Skip
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-teal-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* STEP 1: BASIC BODY METRICS */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Non-binary / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Math.max(10, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Height <span className="text-slate-400 font-normal">(cm)</span>
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(80, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight <span className="text-slate-400 font-normal">(kg)</span>
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Math.max(30, parseFloat(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Real-time BMI Card */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {bmi}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                      Calculated BMI
                    </span>
                    <p className="text-xs font-medium text-slate-700">{bmiCategory}</p>
                  </div>
                </div>
                <span className="text-[10px] text-teal-700 bg-white px-2.5 py-1 rounded-full border border-teal-200 font-medium">
                  WHO standard
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: MEDICAL MARKERS (OPTIONAL) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-100 flex items-start space-x-2.5">
                <Heart className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-800">
                  These optional clinical markers adjust sodium and carbohydrate safety bounds. You can update or skip them anytime.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Blood Pressure <span className="text-slate-400 font-normal">(Systolic / Diastolic mmHg)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="120 (Systolic)"
                    value={systolicBP}
                    onChange={(e) => setSystolicBP(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  />
                  <input
                    type="number"
                    placeholder="80 (Diastolic)"
                    value={diastolicBP}
                    onChange={(e) => setDiastolicBP(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fasting Glucose <span className="text-slate-400 font-normal">(mg/dL)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 95"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Cholesterol <span className="text-slate-400 font-normal">(mg/dL)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 185"
                    value={cholesterol}
                    onChange={(e) => setCholesterol(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LIFESTYLE & DIET PREFERENCES */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  <span>Daily Activity Level</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sedentary', label: 'Sedentary', sub: 'Desk work' },
                    { id: 'light', label: 'Light', sub: '1-2 days/wk' },
                    { id: 'moderate', label: 'Moderate', sub: '3-5 days/wk' },
                    { id: 'very_active', label: 'Very Active', sub: 'Heavy daily' },
                  ].map((act) => (
                    <button
                      type="button"
                      key={act.id}
                      onClick={() => setActivityLevel(act.id as ActivityLevel)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        activityLevel === act.id
                          ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{act.label}</div>
                      <div className="text-[10px] text-slate-500">{act.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dietary Preference</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'any', label: 'Anything' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'pescatarian', label: 'Pescatarian' },
                  ].map((diet) => (
                    <button
                      type="button"
                      key={diet.id}
                      onClick={() => setDietaryPreference(diet.id as DietPreference)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        dietaryPreference === diet.id
                          ? 'bg-teal-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {diet.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Allergies & Sensitivities <span className="text-slate-400 font-normal">(Excludes from recommendations)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allergyOptions.map((alg) => {
                    const isSelected = selectedAllergies.includes(alg);
                    return (
                      <button
                        type="button"
                        key={alg}
                        onClick={() => toggleAllergy(alg)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{alg}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center space-x-1.5 bg-teal-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-800 active:scale-95 transition-all shadow-md shadow-teal-700/20"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center space-x-1.5 bg-teal-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-800 active:scale-95 transition-all shadow-md shadow-teal-700/25"
            >
              <span>Get Started</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
