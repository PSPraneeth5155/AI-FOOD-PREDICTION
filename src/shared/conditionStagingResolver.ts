import { ConditionFamily, ConditionVariant, Gender, MedicalProfile, UserProfile } from '../types';

export interface ConditionVariantMeta {
  code: ConditionVariant;
  family: ConditionFamily;
  name: string;
  severityStage: number; // 1 to 5
  description: string;
  primaryGuidelines: string;
  sourceStatus: 'CITED_GUIDELINE' | 'CLINICAL_ESTIMATE';
}

export const CONDITION_VARIANT_METADATA: Record<ConditionVariant, ConditionVariantMeta> = {
  // 1. Diabetes
  DIABETES_T1: {
    code: 'DIABETES_T1',
    family: 'DIABETES',
    name: 'Type 1 Diabetes Mellitus',
    severityStage: 3,
    description: 'Autoimmune insulin deficiency requiring strict carb consistency.',
    primaryGuidelines: 'ADA Standards of Care',
    sourceStatus: 'CITED_GUIDELINE',
  },
  DIABETES_T2_CONTROLLED: {
    code: 'DIABETES_T2_CONTROLLED',
    family: 'DIABETES',
    name: 'Type 2 Diabetes (Controlled)',
    severityStage: 2,
    description: 'HbA1c < 7.5% with managed glycemic control.',
    primaryGuidelines: 'ADA Standards of Care',
    sourceStatus: 'CITED_GUIDELINE',
  },
  DIABETES_T2_UNCONTROLLED: {
    code: 'DIABETES_T2_UNCONTROLLED',
    family: 'DIABETES',
    name: 'Type 2 Diabetes (Uncontrolled)',
    severityStage: 4,
    description: 'HbA1c >= 7.5% or fasting blood sugar >= 160 mg/dL requiring strict per-meal carb caps.',
    primaryGuidelines: 'ADA Standards of Care',
    sourceStatus: 'CITED_GUIDELINE',
  },
  DIABETES_GESTATIONAL: {
    code: 'DIABETES_GESTATIONAL',
    family: 'DIABETES',
    name: 'Gestational Diabetes Mellitus (GDM)',
    severityStage: 3,
    description: 'Glucose intolerance during pregnancy per ACOG/ADA targets.',
    primaryGuidelines: 'ADA / ACOG Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 2. Prediabetes
  PREDIABETES_EARLY: {
    code: 'PREDIABETES_EARLY',
    family: 'PREDIABETES',
    name: 'Early Prediabetes',
    severityStage: 1,
    description: 'HbA1c 5.7–5.9% or fasting glucose 100–109 mg/dL.',
    primaryGuidelines: 'ADA Standards of Care',
    sourceStatus: 'CITED_GUIDELINE',
  },
  PREDIABETES_HIGH_RISK: {
    code: 'PREDIABETES_HIGH_RISK',
    family: 'PREDIABETES',
    name: 'High-Risk Prediabetes',
    severityStage: 2,
    description: 'HbA1c 6.0–6.4% or fasting glucose 110–125 mg/dL.',
    primaryGuidelines: 'ADA Standards of Care',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 3. Hypertension
  HTN_ELEVATED: {
    code: 'HTN_ELEVATED',
    family: 'HYPERTENSION',
    name: 'Elevated Blood Pressure',
    severityStage: 1,
    description: 'Systolic 120–129 mmHg and diastolic < 80 mmHg.',
    primaryGuidelines: 'AHA / ACC 2017 BP Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  HTN_STAGE_1: {
    code: 'HTN_STAGE_1',
    family: 'HYPERTENSION',
    name: 'Stage 1 Hypertension',
    severityStage: 2,
    description: 'Systolic 130–139 mmHg or diastolic 80–89 mmHg.',
    primaryGuidelines: 'AHA / ACC 2017 BP Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  HTN_STAGE_2: {
    code: 'HTN_STAGE_2',
    family: 'HYPERTENSION',
    name: 'Stage 2 Hypertension',
    severityStage: 3,
    description: 'Systolic >= 140 mmHg or diastolic >= 90 mmHg (<=1500mg/day sodium ceiling).',
    primaryGuidelines: 'AHA / ACC 2017 BP Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  HTN_RESISTANT: {
    code: 'HTN_RESISTANT',
    family: 'HYPERTENSION',
    name: 'Resistant / Severe Hypertension',
    severityStage: 4,
    description: 'Systolic >= 160 mmHg or diastolic >= 100 mmHg requiring strict vascular protection.',
    primaryGuidelines: 'AHA / ACC 2017 BP Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 4. High Cholesterol
  CHOL_BORDERLINE: {
    code: 'CHOL_BORDERLINE',
    family: 'HIGH_CHOLESTEROL',
    name: 'Borderline High Cholesterol',
    severityStage: 1,
    description: 'LDL 130–159 mg/dL or total cholesterol 200–239 mg/dL.',
    primaryGuidelines: 'AHA / ACC Cholesterol Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  CHOL_HIGH_LDL: {
    code: 'CHOL_HIGH_LDL',
    family: 'HIGH_CHOLESTEROL',
    name: 'High LDL Dyslipidemia',
    severityStage: 3,
    description: 'LDL >= 160 mg/dL or total cholesterol >= 240 mg/dL.',
    primaryGuidelines: 'AHA / ACC Cholesterol Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  CHOL_HYPERTRIGLYCERIDEMIA: {
    code: 'CHOL_HYPERTRIGLYCERIDEMIA',
    family: 'HIGH_CHOLESTEROL',
    name: 'Hypertriglyceridemia',
    severityStage: 3,
    description: 'High triglycerides requiring restricted refined sugars and simple carbs.',
    primaryGuidelines: 'AHA Scientific Statement',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 5. Heart Disease
  HEART_CAD_STABLE: {
    code: 'HEART_CAD_STABLE',
    family: 'HEART_DISEASE',
    name: 'Coronary Artery Disease (Stable)',
    severityStage: 2,
    description: 'Stable atherosclerotic heart disease requiring cardioprotective diet.',
    primaryGuidelines: 'AHA / ACC Secondary Prevention',
    sourceStatus: 'CITED_GUIDELINE',
  },
  HEART_POST_MI: {
    code: 'HEART_POST_MI',
    family: 'HEART_DISEASE',
    name: 'Post-Myocardial Infarction / Post-CABG',
    severityStage: 4,
    description: 'Recent acute cardiac event; strict limit on saturated fat and sodium.',
    primaryGuidelines: 'AHA / ACC Secondary Prevention',
    sourceStatus: 'CITED_GUIDELINE',
  },
  HEART_FAILURE_HF: {
    code: 'HEART_FAILURE_HF',
    family: 'HEART_DISEASE',
    name: 'Congestive Heart Failure (CHF)',
    severityStage: 4,
    description: 'Congestive heart failure enforcing strict fluid and <=1500mg/day sodium limits.',
    primaryGuidelines: 'AHA / ACC HF Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 6. Obesity
  OBESITY_CLASS_1: {
    code: 'OBESITY_CLASS_1',
    family: 'OBESITY',
    name: 'Class 1 Obesity',
    severityStage: 1,
    description: 'BMI 30.0–34.9 kg/m2 with moderate caloric deficit target.',
    primaryGuidelines: 'AHA / ACC / TOS Obesity Guideline',
    sourceStatus: 'CITED_GUIDELINE',
  },
  OBESITY_CLASS_2: {
    code: 'OBESITY_CLASS_2',
    family: 'OBESITY',
    name: 'Class 2 Obesity',
    severityStage: 2,
    description: 'BMI 35.0–39.9 kg/m2 with structured volume and satiety focus.',
    primaryGuidelines: 'AHA / ACC / TOS Obesity Guideline',
    sourceStatus: 'CITED_GUIDELINE',
  },
  OBESITY_CLASS_3: {
    code: 'OBESITY_CLASS_3',
    family: 'OBESITY',
    name: 'Class 3 Severe Obesity',
    severityStage: 3,
    description: 'BMI >= 40.0 kg/m2 requiring aggressive glycemic, fiber, and calorie optimization.',
    primaryGuidelines: 'AHA / ACC / TOS Obesity Guideline',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 7. Underweight
  UNDERWEIGHT_MILD: {
    code: 'UNDERWEIGHT_MILD',
    family: 'UNDERWEIGHT',
    name: 'Mild Underweight',
    severityStage: 1,
    description: 'BMI 17.0–18.4 kg/m2 requiring calorie and protein density.',
    primaryGuidelines: 'Clinical Nutrition Consensus',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },
  UNDERWEIGHT_MODERATE_SEVERE: {
    code: 'UNDERWEIGHT_MODERATE_SEVERE',
    family: 'UNDERWEIGHT',
    name: 'Moderate to Severe Underweight',
    severityStage: 3,
    description: 'BMI < 17.0 kg/m2 requiring structured hypercaloric, nutrient-dense nutrition.',
    primaryGuidelines: 'Clinical Nutrition Consensus',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },

  // 8. Chronic Kidney Disease (CKD)
  CKD_STAGE_1_2: {
    code: 'CKD_STAGE_1_2',
    family: 'CKD',
    name: 'CKD Stage 1–2 (Early)',
    severityStage: 1,
    description: 'eGFR >= 60 mL/min with confirmed renal markers; moderate protein/sodium pacing.',
    primaryGuidelines: 'KDOQI 2020 CKD Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  CKD_STAGE_3A: {
    code: 'CKD_STAGE_3A',
    family: 'CKD',
    name: 'CKD Stage 3a (Mild-Moderate)',
    severityStage: 2,
    description: 'eGFR 45–59 mL/min; protein 0.6–0.8 g/kg/day, sodium cap <=2000 mg/day.',
    primaryGuidelines: 'KDOQI 2020 CKD Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  CKD_STAGE_3B: {
    code: 'CKD_STAGE_3B',
    family: 'CKD',
    name: 'CKD Stage 3b (Moderate-Severe)',
    severityStage: 3,
    description: 'eGFR 30–44 mL/min; strict potassium and phosphorus limits alongside low protein.',
    primaryGuidelines: 'KDOQI 2020 CKD Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  CKD_STAGE_4: {
    code: 'CKD_STAGE_4',
    family: 'CKD',
    name: 'CKD Stage 4 (Severe Non-Dialysis)',
    severityStage: 4,
    description: 'eGFR 15–29 mL/min; hard safety ceiling on potassium, sodium, and excess protein.',
    primaryGuidelines: 'KDOQI 2020 CKD Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  CKD_STAGE_5_DIALYSIS: {
    code: 'CKD_STAGE_5_DIALYSIS',
    family: 'CKD',
    name: 'CKD Stage 5 (Dialysis)',
    severityStage: 5,
    description: 'eGFR < 15 mL/min on hemodialysis/PD; high protein (1.2g/kg), strict fluid/potassium control.',
    primaryGuidelines: 'KDOQI 2020 CKD Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 9. Fatty Liver
  NAFLD_SIMPLE_STEATOSIS: {
    code: 'NAFLD_SIMPLE_STEATOSIS',
    family: 'FATTY_LIVER',
    name: 'NAFLD Simple Steatosis (Grade 1)',
    severityStage: 1,
    description: 'Fat accumulation in hepatocytes; restrict added fructose and refined sugars.',
    primaryGuidelines: 'AASLD Practice Guidance',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },
  NAFLD_NASH_MASH: {
    code: 'NAFLD_NASH_MASH',
    family: 'FATTY_LIVER',
    name: 'NASH / MASH with Inflammation',
    severityStage: 2,
    description: 'Steatohepatitis with elevated liver enzymes; high antioxidant and Mediterranean diet.',
    primaryGuidelines: 'AASLD Practice Guidance',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },
  NAFLD_FIBROSIS: {
    code: 'NAFLD_FIBROSIS',
    family: 'FATTY_LIVER',
    name: 'NAFLD with Advanced Fibrosis',
    severityStage: 4,
    description: 'Hepatic fibrosis; strict limit on saturated fat, sodium, and alcohol/processed foods.',
    primaryGuidelines: 'AASLD Practice Guidance',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },

  // 10. Anemia
  ANEMIA_IRON_DEFICIENCY_MILD: {
    code: 'ANEMIA_IRON_DEFICIENCY_MILD',
    family: 'ANEMIA',
    name: 'Mild Iron-Deficiency Anemia',
    severityStage: 1,
    description: 'Hemoglobin 10.0–12.9 g/dL (men) or 10.0–11.9 g/dL (women); priority bioavailable iron.',
    primaryGuidelines: 'WHO / NIH ODS Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  ANEMIA_IRON_DEFICIENCY_SEVERE: {
    code: 'ANEMIA_IRON_DEFICIENCY_SEVERE',
    family: 'ANEMIA',
    name: 'Severe Iron-Deficiency Anemia',
    severityStage: 3,
    description: 'Hemoglobin < 10.0 g/dL; high iron, vitamin C pairing, protein optimization.',
    primaryGuidelines: 'WHO / NIH ODS Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  ANEMIA_PREGNANCY: {
    code: 'ANEMIA_PREGNANCY',
    family: 'ANEMIA',
    name: 'Pregnancy-Associated Anemia',
    severityStage: 2,
    description: 'Hemoglobin < 11.0 g/dL during pregnancy; target 27 mg/day iron per ACOG.',
    primaryGuidelines: 'ACOG Practice Bulletin',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 11. Osteoporosis
  OSTEOPENIA: {
    code: 'OSTEOPENIA',
    family: 'OSTEOPOROSIS',
    name: 'Osteopenia (Mild Bone Loss)',
    severityStage: 1,
    description: 'T-score between -1.0 and -2.4; target 1000 mg/day calcium + protein support.',
    primaryGuidelines: 'NOF / NIH Bone Health Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },
  OSTEOPOROSIS_ESTABLISHED: {
    code: 'OSTEOPOROSIS_ESTABLISHED',
    family: 'OSTEOPOROSIS',
    name: 'Established Osteoporosis',
    severityStage: 3,
    description: 'T-score <= -2.5; target 1200 mg/day calcium, vitamin D, bone-supportive mineral balance.',
    primaryGuidelines: 'NOF / NIH Bone Health Guidelines',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 12. Athletes
  ATHLETE_ENDURANCE: {
    code: 'ATHLETE_ENDURANCE',
    family: 'ATHLETES',
    name: 'Endurance Athlete (Runners/Cyclists)',
    severityStage: 2,
    description: 'High carbohydrate turnover (6–10 g/kg) and steady electrolytes (sodium/potassium).',
    primaryGuidelines: 'ACSM / ISSN Position Stand',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },
  ATHLETE_STRENGTH_HYPERTROPHY: {
    code: 'ATHLETE_STRENGTH_HYPERTROPHY',
    family: 'ATHLETES',
    name: 'Strength / Hypertrophy Athlete',
    severityStage: 2,
    description: 'High protein requirement (1.6–2.2 g/kg/day) for muscle protein synthesis.',
    primaryGuidelines: 'ISSN Position Stand',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },
  ATHLETE_MIXED_SPORT: {
    code: 'ATHLETE_MIXED_SPORT',
    family: 'ATHLETES',
    name: 'Mixed-Discipline / Team Sport Athlete',
    severityStage: 2,
    description: 'Balanced high-energy demand (1.4–1.8 g/kg protein, 4–7 g/kg carbs).',
    primaryGuidelines: 'ACSM Position Stand',
    sourceStatus: 'CLINICAL_ESTIMATE',
  },

  // 13. Elderly
  ELDERLY_HEALTHY_65_PLUS: {
    code: 'ELDERLY_HEALTHY_65_PLUS',
    family: 'ELDERLY',
    name: 'Healthy Older Adult (65+)',
    severityStage: 1,
    description: 'Age 65+ requiring 1.0–1.2 g/kg/day protein and 1200 mg calcium per PROT-AGE.',
    primaryGuidelines: 'PROT-AGE Study Group',
    sourceStatus: 'CITED_GUIDELINE',
  },
  ELDERLY_SARCOPENIA_FRAIL: {
    code: 'ELDERLY_SARCOPENIA_FRAIL',
    family: 'ELDERLY',
    name: 'Older Adult with Sarcopenia / Frailty',
    severityStage: 3,
    description: 'Age 65+ with muscle wasting; target 1.2–1.5 g/kg protein + high bioavailability.',
    primaryGuidelines: 'PROT-AGE Study Group',
    sourceStatus: 'CITED_GUIDELINE',
  },

  // 14. Pregnancy
  PREGNANCY_TRIMESTER_1: {
    code: 'PREGNANCY_TRIMESTER_1',
    family: 'PREGNANCY',
    name: 'Pregnancy Trimester 1 (Weeks 1–12)',
    severityStage: 1,
    description: 'Focus on folate, baseline calories, and nausea-friendly nutrient pacing.',
    primaryGuidelines: 'ACOG / IOM DRIs',
    sourceStatus: 'CITED_GUIDELINE',
  },
  PREGNANCY_TRIMESTER_2: {
    code: 'PREGNANCY_TRIMESTER_2',
    family: 'PREGNANCY',
    name: 'Pregnancy Trimester 2 (Weeks 13–27)',
    severityStage: 2,
    description: '+340 kcal/day, 71g protein/day, high calcium and iron demands per IOM.',
    primaryGuidelines: 'ACOG / IOM DRIs',
    sourceStatus: 'CITED_GUIDELINE',
  },
  PREGNANCY_TRIMESTER_3: {
    code: 'PREGNANCY_TRIMESTER_3',
    family: 'PREGNANCY',
    name: 'Pregnancy Trimester 3 (Weeks 28–40)',
    severityStage: 3,
    description: '+452 kcal/day, 27 mg/day iron, 1000 mg/day calcium, fetal growth support.',
    primaryGuidelines: 'ACOG / IOM DRIs',
    sourceStatus: 'CITED_GUIDELINE',
  },
};

/**
 * Maps a single condition variant code to its parent condition family.
 */
export function getConditionFamilyForVariant(variant: ConditionVariant): ConditionFamily {
  return CONDITION_VARIANT_METADATA[variant]?.family ?? 'DIABETES';
}

/**
 * Canonical Lab-to-Variant Auto-Staging Resolver.
 * Maps self-reported flags AND quantitative biometric/lab readings to the 42 canonical condition variants.
 */
export function resolveConditionVariants(
  profile: Partial<UserProfile> & {
    medical?: MedicalProfile;
    age?: number;
    gender?: Gender;
    bmi?: number;
    activeConditionVariants?: ConditionVariant[];
  }
): ConditionVariant[] {
  const result = new Set<ConditionVariant>();

  // 1. Preserve any explicitly confirmed self-reported variants
  if (profile.activeConditionVariants && profile.activeConditionVariants.length > 0) {
    profile.activeConditionVariants.forEach(v => result.add(v));
  }

  const medical = profile.medical || {};
  const age = profile.age ?? 35;
  const gender = profile.gender ?? 'male';
  const bmi = profile.bmi ?? (
    profile.weightKg && profile.heightCm
      ? Number((profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1))
      : 23.5
  );

  // 2. Pregnancy Trimester Auto-Staging
  if (medical.trimester === 1) result.add('PREGNANCY_TRIMESTER_1');
  else if (medical.trimester === 2) result.add('PREGNANCY_TRIMESTER_2');
  else if (medical.trimester === 3) result.add('PREGNANCY_TRIMESTER_3');

  // 3. Glycemic / Diabetes Auto-Staging
  const hba1c = medical.hba1c;
  const fbg = medical.fastingGlucose ?? medical.bloodSugar;
  const isPregnant = medical.trimester !== undefined;

  if (hba1c !== undefined || fbg !== undefined) {
    const isDiabetic = (hba1c !== undefined && hba1c >= 6.5) || (fbg !== undefined && fbg >= 126);
    const isPrediabetic = (hba1c !== undefined && hba1c >= 5.7 && hba1c < 6.5) ||
                          (fbg !== undefined && fbg >= 100 && fbg < 126);

    if (isDiabetic) {
      if (isPregnant) {
        result.add('DIABETES_GESTATIONAL');
      } else if ((hba1c !== undefined && hba1c >= 7.5) || (fbg !== undefined && fbg >= 160)) {
        result.delete('DIABETES_T2_CONTROLLED');
        result.add('DIABETES_T2_UNCONTROLLED');
      } else if (!result.has('DIABETES_T1') && !result.has('DIABETES_T2_UNCONTROLLED')) {
        result.add('DIABETES_T2_CONTROLLED');
      }
    } else if (isPrediabetic && !result.has('DIABETES_T1') && !result.has('DIABETES_T2_CONTROLLED') && !result.has('DIABETES_T2_UNCONTROLLED')) {
      if ((hba1c !== undefined && hba1c >= 6.0) || (fbg !== undefined && fbg >= 110)) {
        result.add('PREDIABETES_HIGH_RISK');
      } else {
        result.add('PREDIABETES_EARLY');
      }
    }
  }

  // 4. Hypertension Auto-Staging
  const sbp = medical.systolicBP;
  const dbp = medical.diastolicBP;
  if (sbp !== undefined || dbp !== undefined) {
    const s = sbp ?? 120;
    const d = dbp ?? 80;

    if (s >= 160 || d >= 100) {
      result.delete('HTN_ELEVATED');
      result.delete('HTN_STAGE_1');
      result.delete('HTN_STAGE_2');
      result.add('HTN_RESISTANT');
    } else if (s >= 140 || d >= 90) {
      result.delete('HTN_ELEVATED');
      result.delete('HTN_STAGE_1');
      result.add('HTN_STAGE_2');
    } else if ((s >= 130 && s <= 139) || (d >= 80 && d <= 89)) {
      result.delete('HTN_ELEVATED');
      result.add('HTN_STAGE_1');
    } else if (s >= 120 && s <= 129 && d < 80) {
      result.add('HTN_ELEVATED');
    }
  }

  // 5. Chronic Kidney Disease (CKD) Auto-Staging
  const egfr = medical.egfr;
  if (egfr !== undefined) {
    result.delete('CKD_STAGE_1_2');
    result.delete('CKD_STAGE_3A');
    result.delete('CKD_STAGE_3B');
    result.delete('CKD_STAGE_4');
    result.delete('CKD_STAGE_5_DIALYSIS');

    if (egfr < 15) {
      result.add('CKD_STAGE_5_DIALYSIS');
    } else if (egfr < 30) {
      result.add('CKD_STAGE_4');
    } else if (egfr < 45) {
      result.add('CKD_STAGE_3B');
    } else if (egfr < 60) {
      result.add('CKD_STAGE_3A');
    } else {
      result.add('CKD_STAGE_1_2');
    }
  }

  // 6. Cholesterol / Dyslipidemia Auto-Staging
  const ldl = medical.ldlCholesterol;
  const totalChol = medical.cholesterol;
  if (ldl !== undefined || totalChol !== undefined) {
    if ((ldl !== undefined && ldl >= 160) || (totalChol !== undefined && totalChol >= 240)) {
      result.delete('CHOL_BORDERLINE');
      result.add('CHOL_HIGH_LDL');
    } else if ((ldl !== undefined && ldl >= 130) || (totalChol !== undefined && totalChol >= 200)) {
      if (!result.has('CHOL_HIGH_LDL')) {
        result.add('CHOL_BORDERLINE');
      }
    }
  }

  // 7. Anemia Auto-Staging
  const hb = medical.hemoglobin;
  if (hb !== undefined) {
    result.delete('ANEMIA_IRON_DEFICIENCY_MILD');
    result.delete('ANEMIA_IRON_DEFICIENCY_SEVERE');
    result.delete('ANEMIA_PREGNANCY');

    if (isPregnant) {
      if (hb < 11.0) result.add('ANEMIA_PREGNANCY');
    } else {
      const isMale = gender === 'male';
      const cutoff = isMale ? 13.0 : 12.0;
      if (hb < 10.0) {
        result.add('ANEMIA_IRON_DEFICIENCY_SEVERE');
      } else if (hb < cutoff) {
        result.add('ANEMIA_IRON_DEFICIENCY_MILD');
      }
    }
  }

  // 8. BMI / Obesity & Underweight Auto-Staging
  if (bmi > 0) {
    result.delete('OBESITY_CLASS_1');
    result.delete('OBESITY_CLASS_2');
    result.delete('OBESITY_CLASS_3');
    result.delete('UNDERWEIGHT_MILD');
    result.delete('UNDERWEIGHT_MODERATE_SEVERE');

    if (bmi >= 40.0) {
      result.add('OBESITY_CLASS_3');
    } else if (bmi >= 35.0) {
      result.add('OBESITY_CLASS_2');
    } else if (bmi >= 30.0) {
      result.add('OBESITY_CLASS_1');
    } else if (bmi < 17.0) {
      result.add('UNDERWEIGHT_MODERATE_SEVERE');
    } else if (bmi < 18.5) {
      result.add('UNDERWEIGHT_MILD');
    }
  }

  // 9. Age 65+ Auto-Staging
  if (age >= 65) {
    if (bmi < 20.0) {
      result.delete('ELDERLY_HEALTHY_65_PLUS');
      result.add('ELDERLY_SARCOPENIA_FRAIL');
    } else if (!result.has('ELDERLY_SARCOPENIA_FRAIL')) {
      result.add('ELDERLY_HEALTHY_65_PLUS');
    }
  }

  // 10. Athletes Auto-Staging
  if (profile.lifestyle?.activityLevel === 'very_active') {
    const goals = profile.lifestyle.healthGoals || [];
    const hasHypertrophyGoal = goals.some(g => /muscle|strength|hypertrophy|bulk/i.test(g));
    const hasEnduranceGoal = goals.some(g => /endurance|cardio|marathon|run/i.test(g));

    if (hasHypertrophyGoal && !result.has('ATHLETE_STRENGTH_HYPERTROPHY')) {
      result.add('ATHLETE_STRENGTH_HYPERTROPHY');
    } else if (hasEnduranceGoal && !result.has('ATHLETE_ENDURANCE')) {
      result.add('ATHLETE_ENDURANCE');
    } else if (!result.has('ATHLETE_STRENGTH_HYPERTROPHY') && !result.has('ATHLETE_ENDURANCE')) {
      result.add('ATHLETE_MIXED_SPORT');
    }
  }

  return Array.from(result);
}
