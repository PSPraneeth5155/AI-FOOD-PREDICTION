import React, { useState, useMemo } from 'react';
import { UserProfile, Gender, ActivityLevel, DietPreference, ConditionVariant, ConditionFamily } from '../types';
import { calculateBMI, calculateTargets } from '../data/nutritionDb';
import { resolveConditionVariants, CONDITION_VARIANT_METADATA } from '../shared/conditionStagingResolver';
import {
  Heart,
  Activity,
  Check,
  ChevronRight,
  ArrowLeft,
  ShieldAlert,
  Stethoscope,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
  onClose?: () => void;
}

const COMMON_CONDITION_CHIPS: Array<{ variant: ConditionVariant; label: string; family: ConditionFamily }> = [
  { variant: 'DIABETES_T2_CONTROLLED', label: 'Type 2 Diabetes (Managed)', family: 'DIABETES' },
  { variant: 'DIABETES_T2_UNCONTROLLED', label: 'Type 2 Diabetes (High HbA1c)', family: 'DIABETES' },
  { variant: 'PREDIABETES_EARLY', label: 'Prediabetes', family: 'PREDIABETES' },
  { variant: 'HTN_STAGE_1', label: 'Stage 1 Hypertension', family: 'HYPERTENSION' },
  { variant: 'HTN_STAGE_2', label: 'Stage 2 Hypertension', family: 'HYPERTENSION' },
  { variant: 'CHOL_HIGH_LDL', label: 'High LDL Cholesterol', family: 'HIGH_CHOLESTEROL' },
  { variant: 'CKD_STAGE_3A', label: 'CKD Stage 3a', family: 'CKD' },
  { variant: 'CKD_STAGE_3B', label: 'CKD Stage 3b', family: 'CKD' },
  { variant: 'NAFLD_SIMPLE_STEATOSIS', label: 'Fatty Liver (NAFLD)', family: 'FATTY_LIVER' },
  { variant: 'ANEMIA_IRON_DEFICIENCY_MILD', label: 'Iron Deficiency Anemia', family: 'ANEMIA' },
  { variant: 'OSTEOPENIA', label: 'Osteopenia / Low Bone Density', family: 'OSTEOPOROSIS' },
  { variant: 'OBESITY_CLASS_1', label: 'Weight Management / Obesity', family: 'OBESITY' },
  { variant: 'ATHLETE_STRENGTH_HYPERTROPHY', label: 'Athlete (Strength / Muscle)', family: 'ATHLETES' },
  { variant: 'ELDERLY_HEALTHY_65_PLUS', label: 'Senior Health (65+)', family: 'ELDERLY' },
  { variant: 'PREGNANCY_TRIMESTER_2', label: 'Pregnancy (Trimester 2)', family: 'PREGNANCY' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Physical Profile
  const [name, setName] = useState(initialProfile.name || 'Priya Sharma');
  const [gender, setGender] = useState<Gender>(initialProfile.gender || 'female');
  const [age, setAge] = useState(initialProfile.age || 38);
  const [heightCm, setHeightCm] = useState(initialProfile.heightCm || 162);
  const [weightKg, setWeightKg] = useState(initialProfile.weightKg || 68);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile.lifestyle.activityLevel || 'moderate'
  );
  const [regionalPreference, setRegionalPreference] = useState<'South Indian' | 'North Indian' | 'East Indian' | 'West Indian' | 'Pan-Indian' | 'Global'>(
    initialProfile.lifestyle.regionalPreference || 'South Indian'
  );
  const [dietaryPreference, setDietaryPreference] = useState<DietPreference>(
    initialProfile.lifestyle.dietaryPreference || 'vegetarian'
  );

  // Step 2: Clinical Biomarkers
  const [systolicBP, setSystolicBP] = useState<string>(
    initialProfile.medical.systolicBP ? String(initialProfile.medical.systolicBP) : '138'
  );
  const [diastolicBP, setDiastolicBP] = useState<string>(
    initialProfile.medical.diastolicBP ? String(initialProfile.medical.diastolicBP) : '88'
  );
  const [fastingGlucose, setFastingGlucose] = useState<string>(
    initialProfile.medical.fastingGlucose ? String(initialProfile.medical.fastingGlucose) : '114'
  );
  const [hba1c, setHba1c] = useState<string>(
    initialProfile.medical.hba1c ? String(initialProfile.medical.hba1c) : '6.2'
  );
  const [ldlCholesterol, setLdlCholesterol] = useState<string>(
    initialProfile.medical.ldlCholesterol ? String(initialProfile.medical.ldlCholesterol) : '135'
  );
  const [egfr, setEgfr] = useState<string>(
    initialProfile.medical.egfr ? String(initialProfile.medical.egfr) : '92'
  );
  const [hemoglobin, setHemoglobin] = useState<string>(
    initialProfile.medical.hemoglobin ? String(initialProfile.medical.hemoglobin) : '12.4'
  );
  const [selectedVariants, setSelectedVariants] = useState<ConditionVariant[]>(
    initialProfile.activeConditionVariants || ['PREDIABETES_EARLY', 'HTN_STAGE_1']
  );
  const [showAdvancedLabs, setShowAdvancedLabs] = useState(true);

  // Live BMI calculation
  const { bmi, category: bmiCategory } = calculateBMI(weightKg, heightCm);

  // Construct draft profile for live auto-staging
  const draftProfile: Partial<UserProfile> = useMemo(() => {
    return {
      age,
      gender,
      heightCm,
      weightKg,
      bmi,
      medical: {
        systolicBP: systolicBP ? parseInt(systolicBP, 10) : undefined,
        diastolicBP: diastolicBP ? parseInt(diastolicBP, 10) : undefined,
        fastingGlucose: fastingGlucose ? parseInt(fastingGlucose, 10) : undefined,
        hba1c: hba1c ? parseFloat(hba1c) : undefined,
        ldlCholesterol: ldlCholesterol ? parseInt(ldlCholesterol, 10) : undefined,
        egfr: egfr ? parseInt(egfr, 10) : undefined,
        hemoglobin: hemoglobin ? parseFloat(hemoglobin) : undefined,
      },
      lifestyle: {
        activityLevel,
        sleepHours: 7.0,
        dietaryPreference,
        allergies: [],
        healthGoals: [],
        regionalPreference,
      },
      activeConditionVariants: selectedVariants,
    };
  }, [
    age,
    gender,
    heightCm,
    weightKg,
    bmi,
    systolicBP,
    diastolicBP,
    fastingGlucose,
    hba1c,
    ldlCholesterol,
    egfr,
    hemoglobin,
    activityLevel,
    dietaryPreference,
    regionalPreference,
    selectedVariants,
  ]);

  // Live Auto-Staged Condition Variants based on vitals + self reports
  const autoStagedVariants = useMemo(() => {
    return resolveConditionVariants(draftProfile);
  }, [draftProfile]);

  // Live 12-Nutrient Targets
  const computedTargets = useMemo(() => {
    return calculateTargets(draftProfile);
  }, [draftProfile]);

  const toggleVariant = (v: ConditionVariant) => {
    setSelectedVariants(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const handleFinish = async () => {
    const medical = draftProfile.medical || {};
    const lifestyle = draftProfile.lifestyle || {
      activityLevel,
      sleepHours: 7.5,
      dietaryPreference,
      allergies: [],
      healthGoals: ['Lower blood pressure', 'Reverse prediabetes'],
      regionalPreference,
    };

    const finalProfile: UserProfile = {
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
      targets: computedTargets,
      activeConditionVariants: autoStagedVariants,
      onboardingCompleted: true,
    };

    // Save to backend API asynchronously
    try {
      fetch('/api/v1/profile-ledger', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: finalProfile.id, ...finalProfile }),
      }).catch(() => {});
    } catch (e) {}

    onComplete(finalProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Step Indicator Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
              {step}/4
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {step === 1 && '1. Physical & Cuisine Profile'}
                {step === 2 && '2. Health Conditions & Lab Vitals'}
                {step === 3 && '3. Clinical Auto-Staging Resolver'}
                {step === 4 && '4. Your 12-Nutrient Target Blueprint'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 && 'Demographics, body metrics and regional taste'}
                {step === 2 && 'Conditions and optional lab biomarkers'}
                {step === 3 && 'Automated ADA/AHA clinical classification'}
                {step === 4 && 'Personalized daily nutrition boundaries'}
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Skip
            </button>
          )}
        </div>

        {/* Scrollable Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* STEP 1: Physical Profile & Cuisine */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={e => setHeightCm(parseInt(e.target.value, 10) || 160)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={e => setWeightKg(parseFloat(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Live BMI Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Calculated BMI</span>
                  <span className="text-xl font-extrabold text-slate-900">{bmi}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    bmiCategory === 'Normal weight'
                      ? 'bg-emerald-100 text-emerald-800'
                      : bmiCategory === 'Underweight'
                      ? 'bg-amber-100 text-amber-800'
                      : bmiCategory === 'Overweight'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {bmiCategory}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Regional Cuisine</label>
                  <select
                    value={regionalPreference}
                    onChange={e => setRegionalPreference(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="South Indian">South Indian</option>
                    <option value="North Indian">North Indian</option>
                    <option value="Pan-Indian">Pan-Indian</option>
                    <option value="Global">Global / Western</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Dietary Preference</label>
                  <select
                    value={dietaryPreference}
                    onChange={e => setDietaryPreference(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="any">No Restrictions</option>
                    <option value="low_sodium">Low Sodium</option>
                    <option value="keto">Keto</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Clinical Conditions & Biomarkers */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Select Diagnosed Health Conditions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CONDITION_CHIPS.map(chip => {
                    const active = selectedVariants.includes(chip.variant);
                    return (
                      <button
                        key={chip.variant}
                        type="button"
                        onClick={() => toggleVariant(chip.variant)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lab Vitals Section */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowAdvancedLabs(!showAdvancedLabs)}
                  className="w-full px-4 py-3 flex items-center justify-between font-bold text-slate-800 text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" /> Enter Exact Lab Biomarkers (Optional)
                  </span>
                  {showAdvancedLabs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedLabs && (
                  <div className="p-4 pt-1 space-y-3 bg-white border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-0.5 text-[11px]">
                          Blood Pressure (Systolic / Diastolic)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="120"
                            value={systolicBP}
                            onChange={e => setSystolicBP(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            placeholder="80"
                            value={diastolicBP}
                            onChange={e => setDiastolicBP(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-0.5 text-[11px]">
                          HbA1c (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="5.7"
                          value={hba1c}
                          onChange={e => setHba1c(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-0.5 text-[10px]">
                          Fasting Glucose (mg/dL)
                        </label>
                        <input
                          type="number"
                          placeholder="95"
                          value={fastingGlucose}
                          onChange={e => setFastingGlucose(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-0.5 text-[10px]">
                          eGFR (mL/min)
                        </label>
                        <input
                          type="number"
                          placeholder="90"
                          value={egfr}
                          onChange={e => setEgfr(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-0.5 text-[10px]">
                          LDL Chol (mg/dL)
                        </label>
                        <input
                          type="number"
                          placeholder="110"
                          value={ldlCholesterol}
                          onChange={e => setLdlCholesterol(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Auto-Staging Resolver Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-950 text-sm">
                    Automated Lab & Clinical Staging Active
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  NutriTrack AI cross-referenced your vitals (HbA1c: {hba1c}%, BP: {systolicBP}/{diastolicBP}, eGFR: {egfr}) against ADA 2024, AHA, and KDOQI guidelines to resolve {autoStagedVariants.length} active condition stages:
                </p>
              </div>

              <div className="space-y-2.5">
                {autoStagedVariants.map(variantCode => {
                  const meta = CONDITION_VARIANT_METADATA[variantCode];
                  return (
                    <div
                      key={variantCode}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {meta?.name || variantCode}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            Stage {meta?.severityStage || 2}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {meta?.description || 'Active condition variant enforcing 12-nutrient boundaries.'}
                        </p>
                        {meta?.primaryGuidelines && (
                          <span className="text-[10px] font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
                            <Award className="w-3 h-3" /> {meta.primaryGuidelines}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: 12-Nutrient Target Blueprint */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Target Daily Energy
                  </span>
                  <div className="text-2xl font-black">{computedTargets.calories} kcal</div>
                </div>
                <span className="text-xs text-slate-400 font-medium text-right">
                  Mifflin-St Jeor +<br />Clinical Adjustments
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Daily 12-Nutrient Blueprint</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Protein</span>
                    <span className="font-bold text-slate-900">{computedTargets.protein}g</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Carbs</span>
                    <span className="font-bold text-slate-900">{computedTargets.carbs}g</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Dietary Fiber</span>
                    <span className="font-bold text-slate-900">{computedTargets.fiber}g</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Total Fat</span>
                    <span className="font-bold text-slate-900">{computedTargets.fat}g</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Sat. Fat Limit</span>
                    <span className="font-bold text-rose-700">&le; {computedTargets.saturatedFat}g</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Sodium Limit</span>
                    <span className="font-bold text-rose-700">&le; {computedTargets.sodium}mg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Potassium</span>
                    <span className="font-bold text-slate-900">{computedTargets.potassium}mg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Calcium</span>
                    <span className="font-bold text-slate-900">{computedTargets.calcium}mg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">Iron</span>
                    <span className="font-bold text-slate-900">{computedTargets.iron}mg</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ml-auto"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all ml-auto"
            >
              <Check className="w-4 h-4" /> Launch NutriTrack AI
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
