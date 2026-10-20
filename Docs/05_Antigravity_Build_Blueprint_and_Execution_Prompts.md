# **Antigravity Build Blueprint, Target Repository Structure & Step-by-Step Execution Guide — NutriTrack AI**

**Base Repository:** [PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)  
**Purpose:** Master implementation guide, file-tree transformation map, copy-pasteable Antigravity agent prompts, testing suite specification, and production `README.md` to complete the project end-to-end.

# **1\. Repository Transformation Map (Current vs. Target Serverless Structure)**

Below is the exact file tree transformation from the current incomplete repository ([PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)) to the completed Serverless Production Architecture:AI-FOOD-PREDICTION/

├── README.md                                  \# \[NEW\] Complete setup, architecture & clinical docs

├── package.json                               \# \[UPDATE\] Rename from 'react-example' to 'nutritrack-ai', add drizzle-orm, @neondatabase/serverless, @upstash/redis, onnxruntime-node, vitest

├── vercel.json                                \# \[NEW\] Serverless function routing, Edge headers & PWA rewrites

├── drizzle.config.ts                          \# \[NEW\] Serverless PostgreSQL migration config

├── .env.example                               \# \[UPDATE\] Add DATABASE\_URL, UPSTASH\_REDIS\_REST\_URL, JWT\_SECRET

├── public/

│   ├── manifest.json                          \# \[NEW\] Installable PWA Web App Manifest

│   └── sw.js                                  \# \[NEW\] Offline-First Service Worker (caches shell \+ 504 rules)

├── data\_assets/

│   ├── health\_food\_suitability\_rules.csv      \# \[NEW/INGEST\] 504 clinical rules (42 variants x 12 nutrients)

│   ├── health\_food\_recommendation\_dataset.csv \# \[NEW/INGEST\] \~11,000 user-food interaction rows

│   └── models/

│       └── nutritrack\_lgbm\_v1.onnx            \# \[NEW\] Quantized LightGBM ONNX model (\<2.5 MB)

├── scripts/

│   ├── seed\_serverless\_db.ts                  \# \[NEW\] Seeds 504 clinical rules \+ 12-nutrient normalized food DB

│   └── train\_export\_onnx.py                   \# \[NEW\] Trains LightGBM on 11k dataset, validates F1\>=0.90, exports ONNX

├── api/                                       \# \[NEW\] Stateless Serverless Functions (Replaces monolithic server.ts)

│   └── v1/

│       ├── score-food.ts                      \# POST /api/v1/score-food (\<300ms p95 hybrid scorer \+ XAI)

│       ├── rank-foods.ts                      \# POST /api/v1/rank-foods (batch personalized ranking \+ swaps)

│       ├── detect-food.ts                     \# POST /api/v1/detect-food (Roboflow YOLOv8 \+ Gemini 2.5 Flash)

│       ├── calculate-consumption.ts           \# POST /api/v1/calculate-consumption (leftover math \+ ledger commit)

│       ├── profile-ledger.ts                  \# GET/PUT /api/v1/profile-ledger (42-variant staging \+ daily gaps)

│       └── clinical-rules.ts                  \# GET/PATCH /api/v1/clinical-rules (Dietitian sign-off & audit log)

├── src/

│   ├── shared/                                \# \[NEW\] Isomorphic deterministic math (runs in Edge API \+ Offline PWA)

│   │   ├── conditionStagingResolver.ts        \# Maps labs (HbA1c, eGFR, BP, LDL, Hb, BMI) \-\> 42 condition variants

│   │   ├── ruleScoringEngine.ts               \# Limiting/Beneficial formulas, Multi-Condition resolver, Portion math

│   │   └── blendingEngine.ts                  \# Authoritative Safety-Floor Rule \+ ML blender & XAI formatter

│   ├── db/

│   │   ├── schema.ts                          \# \[NEW\] Drizzle ORM schema (users, profiles, food\_catalog, rules, ledgers)

│   │   └── client.ts                          \# \[NEW\] Neon HTTP serverless client \+ Upstash Redis edge cache wrapper

│   ├── data/

│   │   ├── indianFoodDb.ts                    \# \[UPDATE\] Backfill full 12 nutrients (Potassium, Calcium, SatFat, Chol)

│   │   ├── nutritionDb.ts                     \# \[UPDATE\] Backfill full 12 nutrients \+ USDA FDC citation IDs

│   │   ├── clinicalRulesSeed.ts               \# \[NEW\] Typed 504-rule fallback & offline IndexedDB seed

│   │   ├── fallbackPlatters.ts                \# \[EXISTING\] Keep as zero-API vision fallback

│   │   └── fitnessService.ts                  \# \[UPDATE\] Connect wearable active burn to daily\_nutrient\_ledgers

│   ├── components/

│   │   ├── HomeDashboard.tsx                  \# \[UPDATE\] Add 12-Nutrient Daily Ledger Accordion & Adherence Score

│   │   ├── MealLogger.tsx                     \# \[UPDATE\] Add WebP client compression, Clinical Portion Snap & Safety Check

│   │   ├── SuitabilityExplanationModal.tsx    \# \[NEW\] XAI Drawer: Top 3 nutrient bars, binding condition, citations

│   │   ├── RecommendationsView.tsx            \# \[UPDATE\] Add Live Gap-Filling toggle & Regional Substitution swaps

│   │   ├── OnboardingModal.tsx                \# \[UPDATE\] Add 14 Condition Families / 42 Variants \+ Lab Auto-Staging

│   │   ├── ClinicianReviewPortal.tsx          \# \[NEW\] Dietitian 504-rule editor, citation verifier & version diff UI

│   │   ├── InsightsView.tsx                   \# \[UPDATE\] Add 12-nutrient gap trends & condition adherence chart

│   │   ├── SettingsView.tsx                   \# \[UPDATE\] Add Clinician Portal switch & Offline Sync status

│   │   ├── AppleRings.tsx                     \# \[EXISTING\]

│   │   ├── BottomNavBar.tsx                   \# \[EXISTING\]

│   │   ├── FitnessActivityCard.tsx            \# \[EXISTING\]

│   │   ├── FitnessSyncModal.tsx               \# \[EXISTING\]

│   │   ├── HealthReportModal.tsx              \# \[EXISTING\]

│   │   ├── MealDetailModal.tsx                \# \[UPDATE\] Embed XAI topDrivers and guideline badges

│   │   └── WeeklyHealthUpdateModal.tsx        \# \[UPDATE\] Trigger Lab-to-Variant re-staging on vital changes

│   ├── types.ts                               \# \[UPDATE\] Full v2.0 interfaces (12 nutrients, 42 variants, XAI payload)

│   ├── App.tsx                                \# \[UPDATE\] Integrate Offline IndexedDB sync \+ SuitabilityExplanationModal

│   └── main.tsx                               \# \[UPDATE\] Register PWA Service Worker (sw.js)

└── tests/

    ├── ruleScoringEngine.test.ts              \# \[NEW\] Unit tests across all 14 condition families & multi-condition edge cases

    ├── portionCalculator.test.ts              \# \[NEW\] Limiting ceiling vs Beneficial floor boundary tests

    └── apiLatency.bench.ts                    \# \[NEW\] Verifies \<300ms p95 execution SLA

# **2\. Step-by-Step Antigravity Execution Prompts**

Copy and paste the following sequential prompts into **Antigravity** to complete the build systematically without breaking existing functionality:

## **Prompt 1 — Data Model Upgrade (src/types.ts & 12-Nutrient Normalization)**

Antigravity Task 1:  
Read 04\_Clinical\_Rule\_Engine\_ML\_and\_API\_Contract\_Spec and inspect src/types.ts, src/data/indianFoodDb.ts, and `src/data/nutritionDb.ts`.

1. Upgrade `src/types.ts` to support the full 12-nutrient vector (`calories`, `protein`, `carbs`, `fiber`, `sugar`, `totalFat`, `saturatedFat`, `sodium`, `cholesterol`, `potassium`, `calcium`, `iron`), the 14 Condition Families / 42 Condition-Variants taxonomy, `NutrientDriverExplanation`, and `FoodSuitabilityResponse`.  
2. Update every entry in `src/data/indianFoodDb.ts` and `src/data/nutritionDb.ts` so all 12 nutrients are explicitly populated (backfilling realistic IFCT 2017 / USDA FoodData Central values for `saturatedFat`, `cholesterol`, `potassium`, `calcium`, and `iron` where missing) alongside `dataSource` and `sourceCitationId` fields.  
3. Run `npm run lint` (`tsc --noEmit`) to verify zero TypeScript errors.

## **Prompt 2 — Isomorphic 504-Rule Engine, Multi-Condition Resolver & Portion Optimizer**

**Antigravity Task 2:**  
Create `src/shared/conditionStagingResolver.ts`, `src/shared/ruleScoringEngine.ts`, and `src/shared/blendingEngine.ts` implementing Section 2 and Section 3 of `04_Clinical_Rule_Engine_ML_and_API_Contract_Spec`:

1. Implement `resolveConditionVariants(profile)` to map self-reported conditions AND raw lab values (`systolicBP`, `diastolicBP`, `hba1c`, `fastingGlucose`, `egfr`, `ldlCholesterol`, `hemoglobin`, `bmi`, `trimester`) to the 42 canonical condition variants.  
2. Implement the 504-rule evaluation math (`42 variants x 12 nutrients`):  
   * Limiting formula: `Min(100, Safe_Threshold / Food_Value * 100)` with hard Danger clamping.  
   * Beneficial formula: `Min(100, Food_Value / Required_Target * 100)`.  
   * Multi-condition synthesis: Strictest-Nutrient-Wins for limiting ceilings, Severity-Weighted Normalized Blend (`Sum(W) == 1.0`) for overall score, and automatic identification of `bindingConditionVariant`.  
   * Portion Recommendation Optimizer: Limiting-nutrient allowed portion ceiling floor-capped by beneficial-nutrient required portion.  
3. Implement `blendRuleAndMlScore(ruleScore, mlScore, hasDangerViolation)` enforcing the Authoritative Safety-Floor rule (ML can never upgrade a food with `ruleScore < 50`).  
4. Write Vitest unit tests in `tests/ruleScoringEngine.test.ts` covering single-condition, multi-condition (`CKD_STAGE_3B + HTN_STAGE_2 + DIABETES_T2_UNCONTROLLED`), and portion calculation cases.

## **Prompt 3 — Serverless Architecture Refactor & Database/Cache Integration**

**Antigravity Task 3:**  
Refactor the monolithic `server.ts` into stateless serverless functions under `api/v1/` following `03_Serverless_Architecture_and_Data_Engineering_Spec`:

1. Create `src/db/schema.ts` (Drizzle ORM schema for `users`, `user_clinical_profiles`, `food_catalog`, `clinical_suitability_rules`, `clinical_rule_audit_log`, `daily_nutrient_ledgers`, and `meal_logs`) and `src/db/client.ts` (Neon Serverless Postgres HTTP connection \+ Upstash Redis edge cache with in-memory warm fallback so local dev works seamlessly even without cloud credentials).  
2. Create the 6 serverless endpoints:  
   * `api/v1/score-food.ts` (executes rule engine \+ ONNX ML inference \+ XAI driver extraction in `< 300ms p95`).  
   * `api/v1/rank-foods.ts` (ranks catalog foods for user's conditions and live daily `*_gap` / `*_remaining` budget, returning smart regional food swaps).  
   * `api/v1/detect-food.ts` (fuses Roboflow YOLOv8 bounding-box detection \+ Gemini 2.5 Flash vision analysis \+ `fallbackPlatters.ts` failover).  
   * `api/v1/calculate-consumption.ts` (computes actual intake from `leftoverPercent` and updates `daily_nutrient_ledgers`).  
   * `api/v1/profile-ledger.ts` and `api/v1/clinical-rules.ts`.  
3. Keep a lightweight dev adapter in `server.ts` that mounts the `api/v1/*` handlers for local `npm run dev` while generating `vercel.json` for serverless cloud deployment.

## **Prompt 4 — ML Training & ONNX Export Pipeline**

**Antigravity Task 4:**  
Create `scripts/train_export_onnx.py` to train the Gradient Boosting (LightGBM) model on data\_assets/health\_food\_recommendation\_dataset.csv (\~11,000 rows):

1. Extract the 48 features (user demographics, condition flags, 12 food nutrients, and `*_gap` / `*_remaining` features).  
2. Train a LightGBM model, evaluate 5-band classification agreement against the ground-truth suitability labels, and assert `Macro F1 >= 0.90`.  
3. Export the trained model to `data_assets/models/nutritrack_lgbm_v1.onnx` and wire `onnxruntime-node` into `api/v1/score-food.ts` and `api/v1/rank-foods.ts`.

## **Prompt 5 — UI/UX Completion, XAI Drawer & Clinician Governance Portal**

**Antigravity Task 5:**  
Update the React 19 frontend components following `02_UI_UX_Design_and_Performance_Specification`:

1. Build `src/components/SuitabilityExplanationModal.tsx` displaying the `0–100` Suitability Score ring, 5-band badge, `bindingConditionVariant` alert banner, Top 3 driving nutrient bullet bars (`Safe` / `Warning` / `Danger` zones), exact formula math, and `CLINICALLY_CITED` vs `CLINICAL_ESTIMATE` badge.  
2. Upgrade `OnboardingModal.tsx` and `WeeklyHealthUpdateModal.tsx` with the 14 Condition Families / 42 Variants selector and live Lab-to-Stage auto-detection.  
3. Upgrade `MealLogger.tsx` with client-side WebP compression (`<=100KB`, EXIF stripped), the `'Snap to Clinical Portion'` button, and real-time `<16ms` leftover slider recalculation.  
4. Upgrade `HomeDashboard.tsx` and `RecommendationsView.tsx` to display the 12-Nutrient Daily Remaining Ledger and culturally matched regional food substitutions.  
5. Build `src/components/ClinicianReviewPortal.tsx` allowing dietitians to filter, inspect, edit, and approve/reject all 504 rule rows with immutable version diffing.

# **3\. Production Environment Variables & Serverless Config**

## **3.1 `.env.example` (Updated for Serverless Production)**

\# AI & Computer Vision APIs

GEMINI\_API\_KEY="your\_google\_gemini\_api\_key"

ROBOFLOW\_API\_KEY="your\_roboflow\_api\_key"

ROBOFLOW\_MODEL\_ENDPOINT="https\://detect.roboflow.com/indian-food-yolov8/1"

\# Serverless Database (Neon PostgreSQL) & Edge Cache (Upstash Redis)

DATABASE\_URL="postgresql://user:password@ep-serverless-pooler.ap-south-1.aws.neon.tech/nutritrack?sslmode=require"

UPSTASH\_REDIS\_REST\_URL="https\://ap1-serverless-cache.upstash.io"

UPSTASH\_REDIS\_REST\_TOKEN="your\_upstash\_redis\_token"

\# Security & Runtime Configuration

JWT\_SECRET="generate\_32\_byte\_hex\_secret"

ML\_MODEL\_ONNX\_PATH="./data\_assets/models/nutritrack\_lgbm\_v1.onnx"

VITE\_APP\_URL="http\://localhost:3000"

## **3.2 `vercel.json` (Serverless Deployment Manifest)**

{

  "version": 2,

  "framework": "vite",

  "buildCommand": "npm run build",

  "outputDirectory": "dist",

  "functions": {

    "api/v1/score-food.ts": { "memory": 256, "maxDuration": 5 },

    "api/v1/rank-foods.ts": { "memory": 512, "maxDuration": 10 },

    "api/v1/detect-food.ts": { "memory": 512, "maxDuration": 15 },

    "api/v1/calculate-consumption.ts": { "memory": 256, "maxDuration": 5 },

    "api/v1/profile-ledger.ts": { "memory": 256, "maxDuration": 5 },

    "api/v1/clinical-rules.ts": { "memory": 256, "maxDuration": 10 }

  },

  "rewrites": \[

    { "source": "/api/v1/(.\*)", "destination": "/api/v1/\$1" },

    { "source": "/((?\!api/).\*)", "destination": "/index.html" }

  \]

}

# **4\. Production `README.md` Template for GitHub Repository**

Antigravity should write the following `README.md` directly to the root of [PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION):\# NutriTrack AI — Consumption-Aware Food Nutrition Tracking & Explainable Clinical Recommendation System

NutriTrack AI is a serverless, mobile-first Progressive Web App (PWA) that combines \*\*Multimodal Meal Vision (Gemini 2.5 Flash \+ Roboflow YOLOv8)\*\*, \*\*Served-vs-Consumed Leftover Accounting\*\*, and a \*\*Hybrid 504-Rule \+ LightGBM/ONNX Clinical Suitability Engine\*\* covering \*\*14 Condition Families (42 severity variants) x 12 Nutrients\*\*.

\#\# Key Capabilities

\- \*\*0–100 Clinical Suitability Score & 5 Recommendation Bands:\*\* Evaluates any food item against single or multi-condition health profiles (\`Highly Recommended\`, \`Recommended\`, \`Consume in Moderation\`, \`Limit Intake\`, \`Avoid\`).

\- \*\*14 Condition Families (42 Variants):\*\* Diabetes, Prediabetes, Hypertension, High Cholesterol, Heart Disease, Obesity, Underweight, Chronic Kidney Disease (Stages 1–5), Fatty Liver (NAFLD), Anemia, Osteoporosis, Athletes, Elderly (65+), and Pregnancy (Trimesters 1–3).

\- \*\*Precision Portion & Leftover Calculator:\*\* Computes recommended safe gram portions (Limiting Ceiling / Beneficial Floor) and scales actual consumed nutrients by plate leftover percentage.

\- \*\*Explainable AI (XAI) Layer:\*\* Surfaces the top 2–3 driving nutrients, binding condition constraint, Safe/Warning/Danger thresholds, and clinical citations (\`ADA\`, \`AHA\`, \`KDOQI 2020\`, \`NOF/NIH\`, \`ACOG/IOM\`, \`PROT-AGE\`).

\- \*\*100% Serverless Architecture:\*\* Stateless Edge/Node.js functions \+ Neon Serverless PostgreSQL \+ Upstash Redis \+ in-memory ONNX Runtime (\`\< 300ms p95\` scoring latency).

\#\# Quick Start

1\. Clone the repository and install dependencies:

   npm install

2\. Copy \`.env.example\` to \`.env\` and configure your API keys (\`GEMINI\_API\_KEY\`, \`DATABASE\_URL\`, \`UPSTASH\_REDIS\_REST\_URL\`).

3\. Seed the 504 clinical rules and 12-nutrient food catalog:

   npm run db:seed

4\. Start the development server:

   npm run dev

5\. Run the 504-rule unit test suite and latency benchmarks:

   npm run test  
