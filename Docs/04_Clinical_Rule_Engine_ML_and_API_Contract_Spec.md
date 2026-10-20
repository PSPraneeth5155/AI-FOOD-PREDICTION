# **Clinical Rule Engine Mathematics, Hybrid ML Blending & API Contract Specification — NutriTrack AI**

**Base Repository:** [PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)  
**Core Data Assets:** `health_food_suitability_rules.csv` (504 Rules: 42 Condition-Variants x 12 Nutrients) & `health_food_recommendation_dataset.csv` (\~11,000 User-Food Interaction Rows)

# **1\. The 14 Condition Families & 42 Clinical Variants Taxonomy**

To expand the basic heuristic checks currently in [src/data/nutritionDb.ts](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION/blob/main/src/data/nutritionDb.ts) into the full 504-rule clinical engine (42 condition-variants x 12 nutrients), the system implements the following canonical taxonomy and automated Lab/Vital Staging Resolver:

| \# | Condition Family | Variant Codes (42 Total) | Auto-Staging Lab / Vital Trigger Rules | Primary Cited Guidelines & Source Status |
| :---- | :---- | :---- | :---- | :---- |
| **1** | **Diabetes Mellitus** | `DIABETES_T1`, `DIABETES_T2_CONTROLLED`, `DIABETES_T2_UNCONTROLLED`, `DIABETES_GESTATIONAL` (4) | `HbA1c >= 6.5%` or `Fasting Glucose >= 126 mg/dL` (`HbA1c >= 7.5%` \-\> `UNCONTROLLED`) | **ADA Standards of Care** (Carbs, Sugar, Fiber, Sat Fat — `CITED_GUIDELINE`) |
| **2** | **Prediabetes** | `PREDIABETES_EARLY`, `PREDIABETES_HIGH_RISK` (2) | `HbA1c 5.7%–6.4%` or `Fasting Glucose 100–125 mg/dL` (`>=6.0%` \-\> `HIGH_RISK`) | **ADA Standards of Care** (`CITED_GUIDELINE`) |
| **3** | **Hypertension** | `HTN_ELEVATED`, `HTN_STAGE_1`, `HTN_STAGE_2`, `HTN_RESISTANT` (4) | `BP 120–129/<80` (`ELEVATED`), `130–139/80–89` (`STAGE_1`), `>=140/>=90` (`STAGE_2`) | **AHA / ACC 2017 BP Guidelines** (Sodium `<=1500–2300mg/day`, Potassium — `CITED_GUIDELINE`) |
| **4** | **High Cholesterol (Dyslipidemia)** | `CHOL_BORDERLINE`, `CHOL_HIGH_LDL`, `CHOL_HYPERTRIGLYCERIDEMIA` (3) | `LDL 130–159 mg/dL` (`BORDERLINE`), `LDL >= 160 mg/dL` (`HIGH_LDL`) | **AHA / ACC Cholesterol Guidelines** (Sat Fat `<7% kcal`, Dietary Chol `<200mg`, Fiber — `CITED_GUIDELINE`) |
| **5** | **Heart Disease (CAD / HF)** | `HEART_CAD_STABLE`, `HEART_POST_MI`, `HEART_FAILURE_HF` (3) | Clinical diagnosis flag (`HEART_FAILURE_HF` enforces strict Sodium `<=1500mg/day`) | **AHA / ACC Secondary Prevention Guidelines** (`CITED_GUIDELINE`) |
| **6** | **Obesity** | `OBESITY_CLASS_1`, `OBESITY_CLASS_2`, `OBESITY_CLASS_3` (3) | `BMI 30.0–34.9` (`CLASS_1`), `35.0–39.9` (`CLASS_2`), `>=40.0` (`CLASS_3`) | **AHA/ACC/TOS Obesity Guideline** (Caloric deficit, Protein, Fiber — `CITED_GUIDELINE`) |
| **7** | **Underweight** | `UNDERWEIGHT_MILD`, `UNDERWEIGHT_MODERATE_SEVERE` (2) | `BMI 17.0–18.4` (`MILD`), `BMI < 17.0` (`MODERATE_SEVERE`) | **Clinical Estimate** (`ESTIMATE_PENDING_REVIEW` — Calorie & Protein surplus) |
| **8** | **Chronic Kidney Disease (CKD)** | `CKD_STAGE_1_2`, `CKD_STAGE_3A`, `CKD_STAGE_3B`, `CKD_STAGE_4`, `CKD_STAGE_5_DIALYSIS` (5) | `eGFR >=60` (`1_2`), `45–59` (`3A`), `30–44` (`3B`), `15–29` (`4`), `<15` (`5_DIALYSIS`) | **KDOQI 2020 Clinical Practice Guideline for Nutrition in CKD** (Protein `0.55–0.60 g/kg` non-dialysis vs `1.0–1.2 g/kg` dialysis, Potassium, Sodium — `CITED_GUIDELINE`) |
| **9** | **Fatty Liver (NAFLD / MASLD)** | `NAFLD_SIMPLE_STEATOSIS`, `NAFLD_NASH_MASH`, `NAFLD_FIBROSIS` (3) | Clinical diagnosis flag \+ elevated ALT/AST or FibroScan stage | **Clinical Estimate / AASLD Consensus** (Sugar/Fructose & Sat Fat restriction — `ESTIMATE_PENDING_REVIEW`) |
| **10** | **Anemia** | `ANEMIA_IRON_DEFICIENCY_MILD`, `ANEMIA_IRON_DEFICIENCY_SEVERE`, `ANEMIA_PREGNANCY` (3) | `Hemoglobin < 13.0 g/dL` (men) / `< 12.0 g/dL` (women); `< 10.0 g/dL` \-\> `SEVERE` | **WHO / NIH Office of Dietary Supplements** (Iron `18–27mg/day` \+ Protein — `CITED_GUIDELINE`) |
| **11** | **Osteoporosis / Osteopenia** | `OSTEOPENIA`, `OSTEOPOROSIS_ESTABLISHED` (2) | DEXA T-score `-1.0 to -2.4` (`OSTEOPENIA`), `<= -2.5` (`OSTEOPOROSIS`) | **NOF / NIH Calcium & Bone Health Guidelines** (Calcium `1000–1200mg/day`, Protein — `CITED_GUIDELINE`) |
| **12** | **Athletes** | `ATHLETE_ENDURANCE`, `ATHLETE_STRENGTH_HYPERTROPHY`, `ATHLETE_MIXED_SPORT` (3) | Self-selected training profile \+ `activityLevel == 'very_active'` | **ISSN / ACSM Position Stand / Clinical Estimate** (High Protein & Carbs — `ESTIMATE_PENDING_REVIEW`) |
| **13** | **Elderly (Older Adults 65+)** | `ELDERLY_HEALTHY_65_PLUS`, `ELDERLY_SARCOPENIA_FRAIL` (2) | `age >= 65` (with low BMI/grip flag \-\> `SARCOPENIA_FRAIL`) | **PROT-AGE Study Group** (`1.0–1.2 g/kg/day` healthy, `1.2–1.5 g/kg/day` sarcopenia, Calcium — `CITED_GUIDELINE`) |
| **14** | **Pregnant Women** | `PREGNANCY_TRIMESTER_1`, `PREGNANCY_TRIMESTER_2`, `PREGNANCY_TRIMESTER_3` (3) | Trimester selection (`1`, `2`, `3`) | **ACOG / IOM Dietary Reference Intakes** (`+340 kcal` T2, `+452 kcal` T3, Iron `27mg/day`, Calcium `1000mg/day`, Protein `1.1 g/kg/day` — `CITED_GUIDELINE`) |

# **2\. Deterministic Mathematical Scoring & Portion Formulas**

## **2.1 The 12-Nutrient Evaluation Vector**

Every food item `F` at serving size G grams provides a 12-dimensional nutrient vector:  
`N = [calories_kcal, protein_g, carbs_g, fiber_g, sugar_g, total_fat_g, saturated_fat_g, sodium_mg, cholesterol_mg, potassium_mg, calcium_mg, iron_mg]`.

## **2.2 Per-Meal Threshold Derivation (Standalone vs. Live Daily Ledger Mode)**

* **Default Standalone Per-Meal Threshold (`T_meal[n]`):** Derived from the clinical daily guideline divided by 3 main meals (`T_meal[n] = Daily_Guideline[n] / 3.0`), or 15% of daily guideline when `mealType == 'snack'`.  
* **Live Daily Ledger Mode (When `DailyNutrientLedger` has prior logged meals today):**  
  * Let `Remaining_Meals = Max(1, 3 - Meals_Logged_Today)`.  
  * `Dynamic_Safe_Threshold[n] = Max(0, (Daily_Safe_Limit[n] - Consumed_Today[n]) / Remaining_Meals)`.  
  * `Dynamic_Required_Target[n] = Max(0, (Daily_Required_Target[n] - Consumed_Today[n]) / Remaining_Meals)`.

## **2.3 Per-Nutrient Sub-Score Formulas (`0–100` Scale)**

For each condition variant `c` and nutrient `n in {1..12}`:

1. **Limiting Nutrients (`rule_direction == 'LIMITING'`, e.g., Sodium, Sugar, Saturated Fat, Cholesterol, Potassium in CKD, Carbs in Diabetes):**  
   * If `Food_Value[n] <= Safe_Threshold[c, n]`, then `Score[c, n] = 100.0`.  
   * If `Food_Value[n] > Safe_Threshold[c, n]`, then:  
     `Score[c, n] = Min(100.0, (Safe_Threshold[c, n] / Max(0.01, Food_Value[n])) * 100.0)`  
   * **Hard Danger Penalty:** If `Food_Value[n] >= Danger_Threshold[c, n]`, then `Score[c, n] = Min(Score[c, n], 25.0)` and `Nutrient_Risk_Status[c, n] = 'DANGER'`.  
2. **Beneficial Nutrients (`rule_direction == 'BENEFICIAL'`, e.g., Fiber, Iron in Anemia/Pregnancy, Calcium in Osteoporosis, Protein in Sarcopenia/Athletes):**  
   * `Score[c, n] = Min(100.0, (Food_Value[n] / Max(0.01, Required_Target[c, n])) * 100.0)`

## **2.4 Single-Condition vs. Multi-Condition Resolution Math**

* **Single Condition `c`:**  
  `Rule_Score(c) = Sum_{n=1..12} (Normalized_Weight[c, n] * Score[c, n])`, where `Sum_{n=1..12} Normalized_Weight[c, n] = 1.0`.  
* **Multi-Condition User (`C = {c_1, c_2, ..., c_k}`):**  
  1. **Conflict Resolution for Opposite Nutrient Directions (e.g., Protein in CKD Stage 4 vs. Elderly Sarcopenia):**  
     * **Safety Precedence Rule:** Whenever a nutrient is `LIMITING` with a `Danger_Threshold` in one active condition (e.g., Protein or Potassium in `CKD_STAGE_4`) and `BENEFICIAL` in another condition, **`LIMITING` takes strict clinical precedence** to prevent acute metabolic harm (hyperkalemia / uremia).  
  2. **Effective Per-Nutrient Score Across Conditions:**  
     * For any nutrient where at least one active condition marks it `LIMITING`:  
       `Effective_Score[n] = Min_{c in C_limiting} Score[c, n]` (Strictest-Nutrient-Wins).  
     * For purely `BENEFICIAL` nutrients across all active conditions:  
       `Effective_Score[n] = Max_{c in C_beneficial} Score[c, n]`.  
  3. **Combined Normalized Weight Vector (`W_comb[n]`):**  
     `W_comb[n] = (Sum_{c in C} Severity_Multiplier[c] * Normalized_Weight[c, n]) / (Sum_{n=1..12} Sum_{c in C} Severity_Multiplier[c] * Normalized_Weight[c, n])`  
  4. **Unclamped Multi-Condition Rule Score:**  
     `Raw_Rule_Score = Sum_{n=1..12} (W_comb[n] * Effective_Score[n])`  
  5. **Safety-Floor Clamping & Binding Condition Identification:**  
     * The condition `c*` that produces the lowest `Score[c, n] * Normalized_Weight[c, n]` on a limiting nutrient is recorded as `bindingCondition`.  
     * If any limiting nutrient with `W_comb[n] >= 0.10` breaches `Danger_Threshold[c*, n]`, `Rule_Engine_Score = Min(Raw_Rule_Score, 29.0)` (`Avoid`).  
     * Else if any limiting nutrient breaches `Warning_Threshold[c*, n]`, `Rule_Engine_Score = Min(Raw_Rule_Score, 49.0)` (`Limit Intake`).

## **2.5 Portion Recommendation Formula (Limiting Ceiling & Beneficial Floor)**

Given a food's default serving weight `G_default` (in grams):

1. **Limiting-Nutrient Allowed Portion Ceiling (`G_max_safe`):**  
   Across all active limiting nutrients `j` where `Food_Value[j] > 0`:  
   `Allowed_Portion[j] = G_default * (Safe_Threshold_Strictest[j] / Food_Value[j])`  
   `G_max_safe = Min_j (Allowed_Portion[j])`  
2. **Beneficial-Nutrient Desired Portion Floor (`G_min_beneficial`):**  
   Across top beneficial nutrients `k` where `Food_Value[k] > 0`:  
   `Desired_Portion[k] = G_default * (Required_Target[k] / Food_Value[k])`  
   `G_min_beneficial = Min(2.0 * G_default, Max_k (Desired_Portion[k]))`  
3. **Final Recommended Portion (`Recommended_Portion_g`):**  
   * Because clinical safety ceilings can never be violated to chase a beneficial nutrient, `Recommended_Portion_g = Clamp(Min(G_max_safe, Max(G_default, G_min_beneficial)), 15g, 450g)`.  
   * If `G_max_safe < 25g` (meaning even a tiny bite exceeds a clinical danger threshold), `Recommended_Portion_g = 0g` (`Avoid`).

# **3\. Hybrid Rule \+ Machine Learning Blending Specification**

## **3.1 Feature Vector Schema (`health_food_recommendation_dataset.csv`)**

The LightGBM / XGBoost model consumes a 48-feature vector `X`:

* **User Demographic & Biometric Features (10):** `age`, `gender_encoded`, `bmi`, `systolic_bp`, `diastolic_bp`, `fasting_glucose`, `hba1c`, `egfr`, `activity_level_encoded`, `sleep_hours`.  
* **Multi-Hot Condition Variant Vector (14 Family Flags \+ Severity Ordinal):** Encodes active condition variants and their severity stage (`0..5`).  
* **Food 12-Nutrient Vector (12):** `calories`, `protein`, `carbs`, `fiber`, `sugar`, `total_fat`, `saturated_fat`, `sodium`, `cholesterol`, `potassium`, `calcium`, `iron` \+ `glycemic_index_encoded`.  
* **Real-Time Nutrient Gap & Remaining Budget Features (12):** `calories_remaining`, `protein_gap`, `carbs_remaining`, `fiber_gap`, `sugar_remaining`, `sat_fat_remaining`, `sodium_remaining`, `cholesterol_remaining`, `potassium_remaining`, `calcium_gap`, `iron_gap`.

## **3.2 Authoritative Safety-Floor Blending Matrix**

| Rule Engine Score Band | ML Model Score (ML\_Score) | Final Blended Score Formula | Rationale |
| :---- | :---- | :---- | :---- |
| **`>= 50.0` (Moderation / Recommended / Highly Recommended)** | Any (0–100) | `Final_Score = Round(0.65 * Rule_Score + 0.35 * ML_Score, 1)` | Allows ML model to personalize ranking based on real-time nutrient gaps and residual interaction patterns while keeping Rule Engine dominant. |
| **`30.0 – 49.9` (`Limit Intake`)** | Any (0–100) | `Final_Score = Min(Rule_Score, 0.70 * Rule_Score + 0.30 * ML_Score)` (Capped `<= 49.9`) | ML can further penalize an risky food, but can **never** promote a `Limit Intake` food into `Consume in Moderation` or `Recommended`. |
| **`< 30.0` (`Avoid` — Danger Threshold Breached)** | Any (0–100) | `Final_Score = Rule_Score` (Hard locked `< 30.0`) | Zero ML override permitted when a clinical `Danger_Threshold` is violated. |

## **3.3 5-Band Label Mapping Table**

* `85.0 – 100.0` \-\> **`Highly Recommended`** (`riskLevel: "SAFE"`)  
* `70.0 – 84.9` \-\> **`Recommended`** (`riskLevel: "SAFE"`)  
* `50.0 – 69.9` \-\> **`Consume in Moderation`** (`riskLevel: "MODERATE"`)  
* `30.0 – 49.9` \-\> **`Limit Intake`** (`riskLevel: "WARNING"`)  
* `0.0 – 29.9` \-\> **`Avoid`** (`riskLevel: "DANGER"`)

# **4\. Production TypeScript Interfaces (`src/types.ts` v2.0 Upgrade) & REST API Contracts**

## **4.1 Upgraded TypeScript Definitions (`src/types.ts`)**

export type ConditionFamily \=

  | 'DIABETES' | 'PREDIABETES' | 'HYPERTENSION' | 'HIGH\_CHOLESTEROL'

  | 'HEART\_DISEASE' | 'OBESITY' | 'UNDERWEIGHT' | 'CKD'

  | 'FATTY\_LIVER' | 'ANEMIA' | 'OSTEOPOROSIS' | 'ATHLETES'

  | 'ELDERLY' | 'PREGNANCY';

export type RecommendationLabel \=

  | 'Highly Recommended'

  | 'Recommended'

  | 'Consume in Moderation'

  | 'Limit Intake'

  | 'Avoid';

export type RiskLevel \= 'SAFE' | 'MODERATE' | 'WARNING' | 'DANGER';

export type SourceConfidence \= 'CLINICALLY\_CITED' | 'CLINICAL\_ESTIMATE';

export interface NutrientVector12 {

  calories: number;      // kcal

  protein: number;       // g

  carbs: number;         // g

  fiber: number;         // g

  sugar: number;         // g

  totalFat: number;      // g

  saturatedFat: number;  // g

  sodium: number;        // mg

  cholesterol: number;   // mg

  potassium: number;     // mg

  calcium: number;       // mg

  iron: number;          // mg

}

export interface NutrientDriverExplanation {

  nutrient: keyof NutrientVector12;

  direction: 'LIMITING' | 'BENEFICIAL';

  foodValue: number;

  unit: 'kcal' | 'g' | 'mg';

  safeOrRequiredThreshold: number;

  warningThreshold?: number;

  dangerThreshold?: number;

  subScore: number;          // 0-100

  normalizedWeight: number;  // 0-1

  status: 'SAFE' | 'WARNING' | 'DANGER' | 'OPTIMAL\_BENEFIT' | 'DEFICIT';

  conditionVariant: string;

  sourceBasis: SourceConfidence;

  guidelineOrganization?: string; // e.g. 'KDOQI 2020', 'ADA', 'AHA'

  guidelineCitation?: string;

  humanReadableReason: string;

}

export interface FoodSuitabilityResponse {

  foodId: string;

  foodName: string;

  evaluatedPortionGrams: number;

  suitabilityScore: number;             // 0 \- 100

  ruleEngineScore: number;              // 0 \- 100

  mlPredictedScore?: number;            // 0 \- 100

  recommendationLabel: RecommendationLabel;

  riskLevel: RiskLevel;

  recommendedPortionGrams: number;

  recommendedHouseholdMeasure: string;

  bindingConditionVariant: string;

  sourceConfidence: SourceConfidence;

  topDrivers: NutrientDriverExplanation\[\]; // Top 2-3 weighted drivers

  allNutrientBreakdowns: NutrientDriverExplanation\[\];

  ruleSetVersionHash: string;

  mlModelVersion: string;

  latencyMs: number;

}

## **4.2 Sample `POST /api/v1/score-food` JSON Request & Response**

**Request:**{

  "userId": "u\_94821",

  "activeConditionVariants": \["CKD\_STAGE\_3B", "HTN\_STAGE\_2", "DIABETES\_T2\_UNCONTROLLED"\],

  "mealType": "breakfast",

  "foodItem": {

    "id": "ind\_masala\_dosa\_sambar",

    "name": "Masala Dosa with Sambar & Coconut Chutney",

    "servingGrams": 250,

    "nutrients": {

      "calories": 480, "protein": 11.5, "carbs": 68.0, "fiber": 5.2,

      "sugar": 4.8, "totalFat": 16.5, "saturatedFat": 5.8, "sodium": 790,

      "cholesterol": 0, "potassium": 640, "calcium": 85, "iron": 2.4

    }

  },

  "dailyRemainingBudget": {

    "sodium": 950, "potassium": 1100, "carbs": 95, "protein": 38

  }

}

**Response (`200 OK`, `42ms`):**n  
{  
"foodId": "ind\_masala\_dosa\_sambar",  
"foodName": "Masala Dosa with Sambar & Coconut Chutney",  
"evaluatedPortionGrams": 250,  
"suitabilityScore": 44.6,  
"ruleEngineScore": 45.2,  
"mlPredictedScore": 43.1,  
"recommendationLabel": "Limit Intake",  
"riskLevel": "WARNING",  
"recommendedPortionGrams": 145,  
"recommendedHouseholdMeasure": "1 small dosa \+ 1/2 cup low-salt sambar (145g)",  
"bindingConditionVariant": "HTN\_STAGE\_2",  
"sourceConfidence": "CLINICALLY\_CITED",  
"topDrivers": \[  
{  
"nutrient": "sodium",  
"direction": "LIMITING",  
"foodValue": 790,  
"unit": "mg",  
"safeOrRequiredThreshold": 500,  
"warningThreshold": 650,  
"dangerThreshold": 850,  
"subScore": 63.3,  
"normalizedWeight": 0.28,  
"status": "WARNING",  
"conditionVariant": "HTN\_STAGE\_2",  
"sourceBasis": "CLINICALLY\_CITED",  
"guidelineOrganization": "AHA / ACC",  
"guidelineCitation": "AHA/ACC Guideline: \<=1500 mg/day sodium for Stage 2 Hypertension (500 mg/meal)",  
"humanReadableReason": "790 mg sodium exceeds your 500 mg per-meal Stage 2 Hypertension limit by 58%."  
},  
{  
"nutrient": "potassium",  
"direction": "LIMITING",  
"foodValue": 640,  
"unit": "mg",  
"safeOrRequiredThreshold": 550,  
"warningThreshold": 620,  
"dangerThreshold": 750,  
"subScore": 85.9,  
"normalizedWeight": 0.24,  
"status": "WARNING",  
"conditionVariant": "CKD\_STAGE\_3B",  
"sourceBasis": "CLINICALLY\_CITED",  
"guidelineOrganization": "KDOQI 2020",  
"guidelineCitation": "KDOQI 2020 CKD Stage 3b potassium restriction to maintain normokalemia",  
"humanReadableReason": "Potato masala and sambar contribute 640 mg potassium, exceeding the 550 mg CKD Stage 3b per-meal threshold."  
},  
{  
"nutrient": "carbs",  
"direction": "LIMITING",  
"foodValue": 68.0,  
"unit": "g",  
"safeOrRequiredThreshold": 45.0,  
"warningThreshold": 60.0,  
"dangerThreshold": 75.0,  
"subScore": 66.2,  
"normalizedWeight": 0.22,  
"status": "WARNING",  
"conditionVariant": "DIABETES\_T2\_UNCONTROLLED",  
"sourceBasis": "CLINICALLY\_CITED",  
"guidelineOrganization": "ADA",  
"guidelineCitation": "ADA Standards of Care: Carbohydrate distribution \<=45g per meal for uncontrolled T2D",  
"humanReadableReason": "68g carbohydrates exceeds the 45g per-meal glycemic target; reducing portion to 145g lowers carbs to 39.4g."  
}  
\],  
"ruleSetVersionHash": "sha256:9f84c2b1e7",  
"mlModelVersion": "lgbm-onnx-v1.0.2",  
"latencyMs": 42  
}