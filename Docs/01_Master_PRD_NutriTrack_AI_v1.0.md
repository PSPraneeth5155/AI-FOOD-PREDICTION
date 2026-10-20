# **Product Requirements Document (PRD): NutriTrack AI — Consumption-Aware Food Nutrition Tracking & Personalized Clinical Recommendation System**

# **Product Specification & Architectural Reference**

Document Version: 1.0 (Production Release Specification for Antigravity Build)  
Base Repository: [PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)  
Architecture Target: 100% Cloud-Native Serverless Architecture  
Status: Approved for Engineering & Antigravity Implementation

# **1\. Executive Summary & Product Vision**

**NutriTrack AI** ([AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)) is an AI-powered, consumption-aware food nutrition tracking and explainable clinical dietary recommendation platform. It bridges two critical gaps in modern digital health:

1. **The Served-vs-Consumed Tracking Gap:** Users rarely eat 100% of what is served on their plate, and standard calorie trackers lack accurate regional cuisine recognition (especially diverse South, North, East, and West Indian platters alongside global cuisines). NutriTrack AI uses multimodal computer vision (Gemini 2.5 Flash \+ Roboflow YOLOv8 Indian Food detection pipeline) and a leftover-delta consumption calculator to log actual nutrient intake rather than rough plate estimates.  
2. **The Multi-Condition Clinical Suitability Gap:** Individuals managing chronic conditions (such as Type 2 Diabetes, Stage 2 Hypertension, Chronic Kidney Disease Stages 1–5, Heart Disease, NAFLD/Fatty Liver, High Cholesterol, Anemia, or Osteoporosis) or specialized life stages (Pregnancy Trimesters 1–3, Elderly 65+, Competitive Athletes) cannot easily translate a 12-nutrient label into an actionable answer to: *"Is this specific food safe for my exact combination of conditions right now, in what gram portion, and why?"*

NutriTrack AI solves both challenges through a **Serverless Hybrid Clinical Rule \+ Machine Learning Engine**:

* **Clinical Rule Base (`health_food_suitability_rules.csv`):** 504 deterministic clinical rules spanning **14 Condition Families (42 severity/stage variants) x 12 Core Nutrients**, grounded in peer-reviewed medical guidelines (ADA, AHA, KDOQI 2020, NOF/NIH, ACOG/IOM, PROT-AGE, ACC/AHA) with explicit confidence/citation flags.  
* **Personalized ML Ranking & Calibration Model (`health_food_recommendation_dataset.csv`):** A Gradient Boosted Decision Tree (LightGBM / XGBoost) trained on \~11,000 user-food interaction rows combining user demographics, multi-condition flags, 12 food nutrients, and real-time daily `*_gap` / `*_remaining` nutrient budgets.  
* **Explainable AI (XAI) Layer:** Every food evaluation returns a **0–100 Suitability Score**, one of **5 Recommendation Labels** (`Highly Recommended`, `Recommended`, `Consume in Moderation`, `Limit Intake`, `Avoid`), an exact **Recommended Portion Size (in grams)**, the **Binding Condition Constraint**, and the **Top 2–3 Driving Nutrients** with their Safe/Warning/Danger thresholds and clinical source citations.

# **2\. Current Repository Audit & Gap Analysis**

An audit of the existing prototype repository ([PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)) against the target production system reveals the following completed foundation and remaining engineering gaps that Antigravity must build:

| System Layer | Existing Implementation in GitHub Repo | Incomplete / Missing Production Requirements (To Build) |
| :---- | :---- | :---- |
| **Frontend UI (`src/components/`)** | Mobile-first React 19 \+ Tailwind CSS v4 shell (`max-w-md mx-auto`) with 5 tabs (`HomeDashboard`, `MealLogger`, `RecommendationsView`, `InsightsView`, `SettingsView`) and modals (`OnboardingModal`, `MealDetailModal`, `FitnessSyncModal`, `WeeklyHealthUpdateModal`, `HealthReportModal`). | Missing **42-variant clinical severity selector** in Onboarding/Settings; missing **Explainable AI (XAI) Suitability Breakdown Drawer** (Safe/Warning/Danger bars \+ guideline citations \+ binding condition badge); missing **Clinician Rule Review Portal UI**. |
| **Backend Architecture (`server.ts`)** | Stateful monolithic Express server coupled to Vite middleware (`POST /api/detect-food`, `POST /api/calculate-consumption`, `/api/recommendations`, `/api/weekly-report`). | Refactor into **100% Stateless Serverless Functions** (Vercel Functions / AWS Lambda / Cloudflare Workers) with API Gateway routing, rate limiting, and zero monolithic Express coupling. |
| **Clinical Rule Engine** | Basic heuristic checks in `src/data/nutritionDb.ts` (BMI, Mifflin-St Jeor TDEE, simple BP/glucose warnings). | Full **504-Rule Deterministic Engine** (42 condition-variants x 12 nutrients), Limiting/Beneficial scoring math, Portion Floor/Ceiling math, and Multi-Condition Resolution (`Strictest-Constraint Wins` \+ `Normalized Weighted Blend`). |
| **ML Scoring & Blending Engine** | Absent in repository (only heuristic sorting in `RecommendationsView.tsx`). | Build **LightGBM/XGBoost Training & Serverless ONNX Inference Pipeline** trained on `health_food_recommendation_dataset.csv` (\~11,000 rows) \+ **Authoritative Safety-Floor Blending Layer**. |
| **Food & Clinical Databases** | Embedded TypeScript arrays in `src/data/indianFoodDb.ts` (1,199 lines) and `src/data/nutritionDb.ts` (1,156 lines) covering \~8–9 nutrients (missing Potassium, Calcium, Saturated Fat, Cholesterol on several items). | Migrate to **Serverless PostgreSQL (Neon / Supabase)** \+ **Upstash Redis Edge Cache**; normalize all items to the **full 12-nutrient profile**; ingest `health_food_suitability_rules.csv` (504 rules) with versioned audit history and USDA FoodData Central / IFCT citations. |
| **Computer Vision Pipeline** | Gemini 2.5 Flash vision call in `server.ts` \+ static fallback templates (`fallbackPlatters.ts`); `.env.example` lists `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL_ENDPOINT` but Roboflow bounding-box fusion is incomplete. | Complete dual-stage **Roboflow YOLOv8 Bounding-Box \+ Gemini 2.5 Flash Nutritional Reasoning** serverless pipeline with client-side WebP compression (`<= 100 KB`) and EXIF stripping. |
| **Persistence & Daily Ledger** | Browser `localStorage` (`nutritrack_user`, `nutritrack_meals`) and mock `fitnessService.ts`; reset on browser clear. | Persistent **Serverless PostgreSQL** storage \+ real-time **Daily Cumulative Nutrient Ledger** (`*_consumed`, `*_remaining`, `*_gap`) with offline-first IndexedDB sync. |
| **Documentation & Testing** | No `README.md`; `package.json` named `react-example`; zero unit or E2E tests. | Comprehensive `README.md`, OpenAPI 3.1 specs, Vitest unit/regression suite for all 504 clinical rules, and Playwright E2E tests. |

# **3\. Goals & Quantitative Success Metrics**

# **3.1 Primary Product Goals**

1. **Universal 0–100 Suitability Scoring & 5-Band Classification:** Evaluate any food item against any single or multi-condition user profile to output a `0–100` Suitability Score and one of five clinical labels: `Highly Recommended` (85–100), `Recommended` (70–84.9), `Consume in Moderation` (50–69.9), `Limit Intake` (30–49.9), or `Avoid` (\<30).  
2. **Precision Portion & Leftover Accounting:** Compute both the clinically safe recommended gram portion (via Limiting-Nutrient Ceiling and Beneficial-Nutrient Floor math) and actual consumed nutrients after accounting for unconsumed plate leftovers.  
3. **Traceable Explainable AI (XAI):** Accompany 100% of food scores and recommendations with human-readable explanations citing the top 2–3 nutrient drivers, the user's binding condition constraint, the Safe/Warning/Danger threshold values, and the clinical guideline source (`ADA`, `AHA`, `KDOQI 2020`, `NOF/NIH`, `ACOG/IOM`, `PROT-AGE`, `ACC/AHA`, or `Clinical Estimate`).  
4. **Multi-Condition Safety Synthesis:** Support users with co-existing conditions (e.g., CKD Stage 3b \+ Stage 2 Hypertension \+ Type 2 Diabetes) without ever permitting a secondary condition or ML score to override a primary condition's hard safety ceiling.

# **3.2 Key Performance Indicators (KPIs) & SLAs**

| Metric Category | Target SLA / Benchmark | Measurement & Verification Method |
| :---- | :---- | :---- |
| **Single Food-Score Latency** | **\< 300 ms (p95)**, **\< 120 ms (p50)** | Measured at Serverless API Gateway edge using Upstash Redis cached rules \+ ONNX runtime inference. |
| **Batch Food Ranking Latency (Top 20\)** | **\< 450 ms (p95)** | Vectorized rule evaluation \+ LightGBM batch ranking across candidate food items. |
| **AI Meal Photo Detection Latency** | **\< 2.8 seconds (p95)** | End-to-end from client WebP upload (`<=100 KB`) through Gemini 2.5 Flash / Roboflow pipeline. |
| **ML vs. Clinical Rule Agreement** | **\>= 90% Macro F1 Score** | Validated on held-out stratified test split across all 5 recommendation bands before model promotion. |
| **Explainability (XAI) Coverage** | **100% of API responses** | Automated schema validation ensuring every scored food includes `>= 1` cited nutrient driver and `sourceBasis`. |
| **Clinical Governance Sign-Off** | **100% of production rules** | Hard flag gate (`approval_status = 'APPROVED'`) required before any rule row is active in user-facing scoring; unsourced estimates clearly badged. |
| **PWA Performance & Accessibility** | **Lighthouse Score \>= 95**, **LCP \< 1.2s** | Automated Lighthouse CI check on mobile viewport (`390x844`) with WCAG AA (\>=4.5:1) contrast compliance. |

# **4\. Target User Personas & User Stories**

# **4.1 User Personas**

* **Primary Persona — Chronic Condition Manager ("Ramesh, 54, Tiruppur/Chennai"):** Diagnosed with Type 2 Diabetes (HbA1c 7.8%, uncontrolled) and Stage 2 Hypertension. Eats South Indian home-cooked meals (Idli, Dosa, Sambar, Pongal, Rice meals) and needs instant clarity on how many grams/pieces he can safely eat and what local dish (e.g., Kollu Sundal, Ragi Dosa, Moong Dal) can fill his protein/fiber gaps without spiking blood glucose or sodium.  
* **Secondary Persona — Life-Stage & Performance User ("Ananya, 29, 3rd Trimester Pregnancy" / "Vikram, 68, Senior"):** Requires specialized beneficial nutrient floors (e.g., Iron, Calcium, Folate, and Protein per ACOG/IOM or PROT-AGE guidelines) while keeping sodium and saturated fat in check.  
* **Tertiary Persona — Clinical Dietitian & Rule Reviewer ("Dr. Meera, Registered Dietitian"):** Uses the internal Clinical Governance Portal to inspect the 504 rule rows, verify per-meal threshold conversions against KDOQI 2020 and ADA guidelines, replace `"Clinical estimate"` rows with peer-reviewed thresholds, and sign off on rule versions.

# **4.2 Core User Stories & Acceptance Criteria**

| ID | User Role | User Story | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| **US-01** | Stage 2 Hypertensive User | When I scan a plate of Masala Dosa with Sambar or search a packaged snack, I want to immediately see if its sodium level is safe for my blood pressure limit. | System resolves `Hypertension_Stage_2`, evaluates per-meal sodium against the AHA/ACC threshold (`<= 500 mg/meal`), displays risk badge (`Limit Intake` or `Avoid` if exceeded), and highlights Sodium in red with the exact mg value. |
| **US-02** | Uncontrolled Type 2 Diabetic User | I want the recommended portion size adjusted to my glycemic and carbohydrate limits, not a generic restaurant serving size. | System calculates `Allowed_Portion_g` from the most restrictive limiting nutrient (Carbohydrates/Sugar), displays both the standard serving (e.g., `250g`) and the personalized safe portion (e.g., `135g` or `1.5 Dosas`), and lets me log leftovers via slider. |
| **US-03** | 3rd Trimester Pregnant User | I want foods rich in bioavailable iron and calcium surfaced as `Highly Recommended` even if they score neutrally for a general adult. | System loads `Pregnancy_Trimester_3` weight vector (high positive weights on Iron, Calcium, Protein, Fiber), applies the Beneficial Nutrient formula, and ranks iron/calcium-dense foods at the top of `RecommendationsView`. |
| **US-04** | Multi-Condition User (CKD Stage 3 \+ Hypertension) | I want the system to combine both condition rule sets safely and tell me which condition is the binding constraint for a given food. | System evaluates both `CKD_Stage_3` (restricting Potassium, Sodium, and excess Protein per KDOQI 2020\) and `Hypertension_Stage_2`, takes the strictest safety ceiling per nutrient, and displays a badge: `"Binding Constraint: CKD Stage 3 (Potassium 680mg > 600mg limit)"`. |
| **US-05** | Clinical Reviewer (Dietitian) | I want to inspect the exact mathematical formula, threshold value, and guideline source behind any rule row so I can approve, edit, or flag it. | Clinical Review Portal displays all 504 rules filterable by Condition Family, Nutrient, and `Source_Basis` (`Cited Guideline` vs `Clinical Estimate`), records immutable audit diffs on edit, and enforces sign-off status. |
| **US-06** | Product Owner / ML Engineer | I want model agreement, score distribution, and rule citation coverage reported per condition so unsourced estimates are transparent. | Admin analytics endpoint and UI badge surface `sourceConfidence: "CLINICALLY_CITED" | "CLINICAL_ESTIMATE"` on every recommendation and report per-condition F1 agreement. |

# **5\. Comprehensive Scope & Resolution of Draft v0.1 Open Questions**

# **5.1 Architectural Decisions Resolving All Draft v0.1 Open Questions**

To ensure Antigravity can build the complete production system without ambiguity, all five Open Questions from Section 11 of Draft PRD v0.1 are formally resolved as follows:

1. **Multi-Condition Rule Combination Strategy (Resolved):**  
   * **Hard Safety Ceiling (Limiting Nutrients):** Uses **Strictest-Nutrient-Wins** (`Min(Safe_Threshold_c)` and `Min(Danger_Threshold_c)` across all active user conditions `c`). If *any* active condition classifies a nutrient level as `Danger`, that nutrient's risk flag is locked to `Danger`.  
   * **Overall Suitability Score Combination:** Uses a **Severity-Weighted Normalized Blend** of the user's active condition weight vectors (`W_combined[n] = Sum(severity_c * W[c,n]) / Sum(severity_c)`), coupled with a **Hard Safety Floor Clamp**: if any critical limiting nutrient exceeds a condition's `Danger_Threshold`, the final blended Suitability Score is capped at `<= 49.9` (`Limit Intake`) or `<= 29.9` (`Avoid`).  
2. **Condition Severity Staging Input Mode (Resolved):**  
   * Supports a **Dual-Mode (Self-Reported \+ Lab-Derived Auto-Staging)** intake in `OnboardingModal` and `SettingsView`. Users can select a known stage directly (e.g., `CKD Stage 3`, `Stage 2 Hypertension`) OR enter raw lab/vital values (`HbA1c %`, `Fasting Blood Glucose mg/dL`, `Systolic/Diastolic BP mmHg`, `eGFR mL/min`, `LDL/Total Cholesterol mg/dL`, `Hemoglobin g/dL`, `BMI`), from which the deterministic staging resolver automatically assigns the exact variant among the 42 condition-variants and prompts user confirmation whenever vitals are updated in `WeeklyHealthUpdateModal`.  
3. **Clinical Sign-Off Workflow & Cadence (Resolved):**  
   * Every row in `clinical_rules` carries a `status` (`APPROVED_CITED`, `APPROVED_CLINICAL_CONSENSUS`, `ESTIMATE_PENDING_REVIEW`, `REJECTED`) and `version`. Rules in `ESTIMATE_PENDING_REVIEW` can be active in v1 **only** if the API and UI explicitly render a `"Clinical Estimate — Pending Dietitian Sign-Off"` disclosure badge. Changing any threshold creates a new immutable rule version row (`rule_audit_log`) requiring a `CLINICIAN` or `ADMIN` JWT role signature.  
4. **ML Model Role & Blending Strategy (Resolved):**  
   * In v1, the LightGBM/XGBoost model is trained on the 11,000-row interaction dataset to predict context-aware suitability scores incorporating **running daily nutrient gaps (`*_gap`, `*_remaining`)**.  
   * **Authoritative Safety-Floor Blending Formula:**  
     * `Final_Score = (0.65 * Rule_Engine_Score) + (0.35 * ML_Predicted_Score)` when `Rule_Engine_Score >= 50`.  
     * **Safety Override:** Whenever `Rule_Engine_Score < 50` (`Limit Intake` or `Avoid`), `Final_Score = Min(Rule_Engine_Score, ML_Predicted_Score)`. The ML model can **never** upgrade an unsafe food into a recommended band.  
5. **Daily Cumulative Nutrient Budgeting (Resolved — Included in v1\!):**  
   * Because the existing repository (`InsightsView.tsx` and `HomeDashboard.tsx`) already tracks daily logged meals and computes nutrient gaps, and the 11,000-row training dataset explicitly includes `*_gap` and `*_remaining` features, **real-time single-day cumulative nutrient budgeting is wired into v1** (while multi-day rolling weekly meal planning remains v2). Each meal evaluation dynamically adjusts per-meal thresholds based on remaining daily budget when daily logs are present, defaulting to `Daily_Guideline / 3` when evaluating a standalone food item.

# **5.2 In-Scope (v1.0 Production Build)**

* **Full 14-Condition Family / 42-Variant Rule Engine:** Diabetes (3 variants), Prediabetes (2), Hypertension (3), High Cholesterol (3), Heart Disease/CAD (3), Obesity (3), Underweight (2), Chronic Kidney Disease/CKD (5 stages), Fatty Liver/NAFLD (3), Anemia (3), Osteoporosis (2), Athletes (4), Elderly 65+ (3), Pregnant Women (3 trimesters).  
* **Full 12-Nutrient Evaluation Profile:** Calories (kcal), Protein (g), Carbohydrates (g), Fiber (g), Sugar (g), Total Fat (g), Saturated Fat (g), Sodium (mg), Cholesterol (mg), Potassium (mg), Calcium (mg), Iron (mg).  
* **Serverless Hybrid Rule \+ LightGBM/ONNX Scoring & Ranking Engine** with `< 300ms p95` latency.  
* **Multimodal Meal Logger:** Camera/Photo capture (Gemini 2.5 Flash \+ Roboflow Indian Food Detection), Voice transcript logging, Search across expanded Indian (`indianFoodDb`) \+ Global/USDA (`nutritionDb`) catalog, and **Served-vs-Consumed Leftover Slider**.  
* **Explainable AI (XAI) Suitability UI** & **Clinical Reviewer Governance UI**.  
* **Wearable Fitness Sync Integration** (Google Fit, Apple Health, Samsung Health, Fitbit activity calorie adjustments).

# **5.3 Out of Scope (Deferred to v2.0)**

* Continuous Glucose Monitor (CGM) real-time Bluetooth streaming.  
* Automated multi-day grocery list & e-commerce cart checkout.  
* Pharmacokinetic drug-nutrient interaction checking (e.g., Warfarin-Vitamin K).  
* Clinical supplement/micronutrient prescription dosing.

# **6\. Functional Requirements Summary**

# **6.1 Input Requirements**

1. **User Health & Clinical Profile (`UserProfile`):** Demographics (`age`, `gender`, `heightCm`, `weightKg`, `bmi`, `activityLevel`, `sleepHours`), Dietary preference (`vegetarian`, `vegan`, `pescatarian`, `keto`, `low_sodium`, `any`), Regional preference (`isIndianMode`, `cuisineRegion`), Active Condition Flags \+ Severity Sub-Types (mapped to the 42 clinical variants), and Quantitative Lab/Vital Readings (`systolicBP`, `diastolicBP`, `fastingGlucose`, `hba1c`, `eGFR`, `ldlCholesterol`, `hemoglobin`).  
2. **Food Item Nutrient Vector (`FoodNutrientProfile`):** Standardized per-serving (`servingGrams`) and per-100g values for all 12 core nutrients plus `glycemicIndex` (`Low`, `Medium`, `High`) and `sourceCitation` (`USDA_FDC`, `IFCT_2017`, `CURATED_ESTIMATE`).  
3. **Real-Time Daily Ledger Context (`DailyNutrientLedger`):** Running totals consumed today across all 12 nutrients, wearable `activeCaloriesBurned`, and computed `*_remaining` and `*_gap` vectors.

# **6.2 Core Processing Pipeline**

1. **Condition & Stage Resolution:** Maps user flags and lab values to `1..N` active rows in the 42-variant condition matrix.  
2. **Per-Nutrient Limiting & Beneficial Scoring:** Computes `0–100` sub-scores for all 12 nutrients using per-meal or remaining-budget thresholds.  
3. **Multi-Condition Synthesis & Safety Clamping:** Combines weights, enforces strictest limiting thresholds, and identifies the primary `bindingCondition`.  
4. **Portion Floor/Ceiling Optimization:** Computes `recommendedPortionGrams` bounded between beneficial nutrient floor and limiting nutrient ceiling.  
5. **ML Inference & Safety-Floor Blending:** Runs serverless ONNX model inference and blends with rule score.  
6. **XAI Payload Generation:** Extracts top 2–3 positive/negative nutrient drivers, exact threshold comparisons, and guideline citations.

# **6.3 Output Payload Requirements**

* `suitabilityScore` (`0–100` float, rounded to 1 decimal)  
* `recommendationLabel` (`Highly Recommended` | `Recommended` | `Consume in Moderation` | `Limit Intake` | `Avoid`)  
* `riskLevel` (`SAFE` | `MODERATE` | `WARNING` | `DANGER`)  
* `recommendedPortionGrams` (integer grams) & `recommendedHouseholdMeasure` (e.g., `"1.5 medium dosas (135g)"`)  
* `bindingCondition` (condition variant driving the strictest constraint)  
* `sourceConfidence` (`CLINICALLY_CITED` | `CLINICAL_ESTIMATE`)  
* `explanations[]` (ordered array of top nutrient drivers with `nutrient`, `foodValue`, `thresholdValue`, `status`, `conditionVariant`, `guidelineCitation`, and `humanReadableSummary`)

# **7\. Non-Functional, Privacy & Regulatory Compliance Requirements**

1. **Clinical Safety & Non-Maleficence Gate:** No rule row with `status = 'REJECTED'` may ever be evaluated. Any recommendation relying on a rule with `status = 'ESTIMATE_PENDING_REVIEW'` must display an amber `"Clinical Estimate"` badge in the UI and include a medical disclaimer stating that NutriTrack AI provides informational dietary guidance and does not replace licensed medical advice.  
2. **Security & Health Data Privacy (HIPAA / DISHA / DPDP Act Alignment):**  
   * All health profiles and lab values are encrypted in transit (TLS 1.3) and at rest (AES-256 in Serverless PostgreSQL).  
   * Meal photos are compressed client-side to WebP (`<= 100 KB`) with **all EXIF GPS and device serial metadata stripped on-device** before upload.  
   * Row-Level Security (RLS) ensures users can only access their own profile and meal logs.  
3. **Immutable Auditability:** Every recommendation log stores the exact `rule_set_version_hash` and `ml_model_version` used at the timestamp of scoring so any historical recommendation can be deterministically reproduced.  
4. **Horizontal Serverless Elasticity:** Stateless compute functions auto-scale from zero to thousands of concurrent requests with Upstash Redis edge caching maintaining `< 300ms p95` latency as the food catalog scales from \~125 prototype items to `10,000+` verified USDA/IFCT items.

# **8\. Phased Implementation Roadmap**

* **Phase 0 — Prototype Foundation (Completed in GitHub Repo & Draft Assets):** React 19 UI shell, Gemini 2.5 Flash vision endpoint, Indian & Western static TypeScript datasets, 11,000-row synthetic interaction dataset, and 504-rule clinical CSV prototype.  
* **Phase 1 — Serverless Core & Database Migration:** Migrate `server.ts` to stateless serverless functions; deploy Serverless PostgreSQL (Neon/Supabase) \+ Upstash Redis; normalize all food items to 12 nutrients; seed the 504 clinical rules with version tracking.  
* **Phase 2 — 504-Rule Engine, Multi-Condition Resolver & ML ONNX Pipeline:** Implement deterministic scoring, portion floor/ceiling calculator, multi-condition blending, and LightGBM \-\> ONNX serverless inference with \>=90% macro F1 validation.  
* **Phase 3 — Frontend UI Upgrade, XAI Drawer & Clinical Review Portal:** Upgrade `OnboardingModal` (42 condition variants \+ lab auto-staging), build the XAI Suitability Breakdown Drawer, wire real-time Daily Ledger budget gaps into `HomeDashboard` and `RecommendationsView`, and add the Dietitian Rule Review UI.  
* **Phase 4 — Roboflow \+ Gemini Vision Fusion, Automated Testing & Production Launch:** Complete dual-stage vision pipeline, add Vitest 504-rule regression suite \+ Playwright E2E tests, verify `<300ms p95` latency and Lighthouse `>=95`, and publish production documentation.

