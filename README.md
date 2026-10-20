# NutriTrack AI (v2.0)
### Deterministic Clinical Rule Engine • LightGBM ONNX • Multimodal Vision • Serverless Edge Architecture

> **NutriTrack AI** is an enterprise-grade clinical nutrition and consumption tracking platform. It personalizes dietary safety and macronutrient/micronutrient allocations for individuals managing complex multi-morbid conditions across **14 Condition Families** and **42 Canonical Severity Variants**, utilizing a **504-Rule Deterministic Clinical Engine** blended with a high-accuracy **LightGBM ONNX Machine Learning Pipeline**.

---

## 🌟 Key Architecture & Capabilities

```
+-----------------------------------------------------------------------------------+
|                                CLIENT APPLICATION                                 |
|  - 4-Step Onboarding Wizard with Lab Auto-Staging (HbA1c, eGFR, BP, LDL, Hb, etc) |
|  - 12-Nutrient Dynamic Daily Ledger with Leftover-Delta Accounting                |
|  - XAI Suitability Drawer (Top 3 drivers, bullet charts, formula breakdowns)      |
|  - Clinician Governance Portal (504 rules, live sum(W)=1.0 validation, audit trail)|
|  - Offline-first PWA with Service Worker & IndexedDB Caching                      |
+-----------------------------------------------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
    +-----------------------------+        +-------------------------------+
    |   ISOMORPHIC RULE ENGINE    |        |       SERVERLESS API          |
    |  - 504 Clinical Rules Seed  |        |  /api/v1/score-food           |
    |  - Multi-Condition Resolver |        |  /api/v1/rank-foods           |
    |  - Portion Optimizer (15-450g)       |  /api/v1/detect-food          |
    |  - Latency: p95 = 0.20 ms   |        |  /api/v1/calculate-consumption|
    +-----------------------------+        |  /api/v1/profile-ledger       |
                   |                       |  /api/v1/clinical-rules       |
                   +-----------+-----------+-------------------------------+
                               |
                               v
            +-------------------------------------+
            |        AUTHORITATIVE BLENDER        |
            |   Score = 0.65*Rule + 0.35*ML       |
            |   (ML cannot override Safety Floor; |
            |    Foods scoring <50 cannot upgrade)|
            +-------------------------------------+
                               |
             +-----------------+-----------------+
             |                                   |
             v                                   v
+-------------------------+         +--------------------------+
|  LIGHTGBM ONNX RUNTIME  |         |   SERVERLESS DATA TIER   |
|  - 48-feature tensor    |         |  - Neon Postgres (Drizzle)|
|  - R² = 0.9833          |         |  - Upstash Redis Cache   |
|  - Macro F1 = 0.8951    |         |  - Zero-latency Fallback |
|  - Model size: 1.2 MB   |         +--------------------------+
|  - Latency: p95 = 0.74ms|
+-------------------------+
```

### 1. 14 Condition Families & 42 Canonical Severity Variants
NutriTrack stages biometrics and lab markers deterministically into 42 condition variants:
- **Diabetes & Glycemic**: `DIABETES_T1`, `DIABETES_T2_CONTROLLED`, `DIABETES_T2_UNCONTROLLED`, `DIABETES_GESTATIONAL`, `PREDIABETES`
- **Cardiovascular**: `HYPERTENSION_STAGE_1`, `HYPERTENSION_STAGE_2`, `HYPERTENSION_CRISIS`, `HEART_DISEASE_CAD`, `HEART_FAILURE_CONGESTIVE`
- **Lipid Spectrum**: `DYSLIPIDEMIA_MILD`, `DYSLIPIDEMIA_SEVERE`, `HYPERTRIGLYCERIDEMIA`
- **Renal (CKD)**: `CKD_STAGE_1`, `CKD_STAGE_2`, `CKD_STAGE_3A`, `CKD_STAGE_3B`, `CKD_STAGE_4`, `CKD_STAGE_5_DIALYSIS`
- **Metabolic & Hepatic**: `FATTY_LIVER_NAFLD`, `NASH_FIBROSIS`, `CIRRHOSIS_COMPENSATED`, `CIRRHOSIS_DECOMPENSATED`
- **Gastrointestinal**: `GERD_MILD`, `GERD_SEVERE_EROSIVE`, `IBD_IN_REMISSION`, `IBD_ACTIVE_FLARE`, `CELIAC_DISEASE`
- **Purine & Gout**: `HYPERURICEMIA_ASYMPTOMATIC`, `GOUT_INTERCRITICAL`, `GOUT_ACUTE_FLARE`
- **Weight & Adiposity**: `OBESITY_CLASS_1`, `OBESITY_CLASS_2`, `OBESITY_CLASS_3_MORBID`
- **Endocrine & Deficiency**: `HYPOTHYROIDISM_HASHIMOTOS`, `HYPERTHYROIDISM_GRAVES`, `ANEMIA_IRON_DEFICIENCY`
- **Life Stages & Performance**:
  - `ATHLETE_ENDURANCE`, `ATHLETE_STRENGTH_HYPERTROPHY`, `ATHLETE_MIXED_SPORT`
  - `ELDERLY_HEALTHY_65_PLUS`, `ELDERLY_SARCOPENIA_FRAIL`
  - `PREGNANCY_TRIMESTER_1`, `PREGNANCY_TRIMESTER_2`, `PREGNANCY_TRIMESTER_3`

### 2. 504-Rule Deterministic Clinical Engine
- **Coverage**: Exactly 42 condition variants $\times$ 12 monitored nutrients = **504 versioned rules**.
- **12 Nutrients**: Calories, Protein, Total Carbs, Dietary Fiber, Free Sugar, Total Fat, Saturated Fat, Sodium, Dietary Cholesterol, Potassium, Calcium, Iron.
- **Formulas**:
  - Limiting Nutrients:
    $$\text{Score} = \min\left(100, \frac{\text{SafeThreshold}}{\max(\text{Intake}, 0.001)} \times 100\right)$$
  - Beneficial Nutrients:
    $$\text{Score} = \min\left(100, \frac{\text{Intake}}{\text{Target}} \times 100\right)$$
- **Arbitration Principle**: *Strictest-Nutrient-Wins* combined with Severity-Weighted Normalized Blending:
  $$\text{FinalRuleScore} = \min(\text{HardFloor}, \sum W_i \times S_i)$$
  $$\sum W_i = 1.0000 \quad \text{(strictly enforced invariant)}$$
- **Portion Optimizer**: Automatically solves for safe portion weight in grams ($15\text{g} \le W \le 450\text{g}$) so high-risk foods can be eaten safely without breaching condition ceilings.

### 3. LightGBM ONNX Machine Learning Pipeline
- **Dataset**: 11,000 synthetic patient-food interaction rows (`data_assets/health_food_recommendation_dataset.csv`), uniformly balanced across 5 recommendation tiers (2,200 samples each).
- **Features (48-dimensional tensor)**: 10 user biometrics, 14 condition family severities, 13 food nutrient values, 11 gap/remaining budget features.
- **Model Performance**:
  - **$R^2$ Score**: **0.9833** (exceeds $\ge 0.88$ requirement)
  - **MAE**: **2.65 points** (out of 100)
  - **Macro F1**: **0.8951** (exceeds $\ge 0.88$ requirement)
  - **Accuracy**: **0.90**
- **Model Artifact**: `data_assets/models/nutritrack_lgbm_v1.onnx` (1.2 MB, target $< 2.5\text{ MB}$).
- **Authoritative Safety-Floor Blending**:
  - $\text{Rule} \ge 50$: $0.65 \times \text{Rule} + 0.35 \times \text{ML}$
  - $\text{Rule} \in [30, 49.9]$: $\min(\text{Rule}, 0.70 \times \text{Rule} + 0.30 \times \text{ML})$ capped $\le 49.9$
  - $\text{Rule} < 30$: Locked strictly to Rule score (ML override prohibited).

### 4. Multimodal Meal Recognition & Leftover Accounting
- **Visual Ingestion**: Client-side WebP compression ($\le 100\text{ KB}$, EXIF stripped) before dispatch.
- **Vision Models**: Google Gemini 2.5 Flash dish recognition combined with Roboflow spatial detection; instant platter presets fallback on offline or API disconnects.
- **Leftover Delta Math**:
  $$\text{ActualConsumed}_j = \text{ServedIntake}_j \times \left(1 - \frac{\text{LeftoverPercent}}{100}\right)$$
- **12-Nutrient Ledger**: Atomically decrements today's remaining allowances across all 12 nutrients.

---

## ⚡ Performance & Latency Benchmarks

Tested on standard x64 execution environment (`npm run bench`):

| Component / Endpoint | Target Specification | Measured p50 | Measured p95 | Status |
| :--- | :--- | :--- | :--- | :--- |
| **504-Rule Engine** (`evaluateMultiCondition`) | $\le 5.0\text{ ms}$ | **0.12 ms** | **0.20 ms** | 🟢 **25x faster** |
| **/api/v1/score-food** (Rule + ONNX ML) | $\le 50.0\text{ ms}$ | **0.21 ms** | **0.74 ms** | 🟢 **67x faster** |
| **/api/v1/rank-foods** (Batch of 15 candidates) | $\le 450.0\text{ ms}$ | **9.40 ms** | **33.31 ms** | 🟢 **13.5x faster** |

---

## 🛠️ Project Structure

```
├── api/v1/                         # Serverless Vercel Edge / Node Endpoints
│   ├── score-food.ts               # POST: 504 rules + ONNX scoring + XAI drivers
│   ├── rank-foods.ts               # POST: Batch scoring & regional substitutions
│   ├── detect-food.ts             # POST: Multimodal Gemini + Roboflow fusion
│   ├── calculate-consumption.ts   # POST: Leftover-delta ledger commit
│   ├── profile-ledger.ts          # GET/PUT: Biometrics, auto-staging, targets
│   └── clinical-rules.ts          # GET/PATCH: Clinician governance & audit trail
├── data_assets/
│   ├── health_food_recommendation_dataset.csv  # 11,000 balanced interaction rows
│   ├── health_food_suitability_rules.csv        # 504 versioned clinical rules
│   └── models/
│       ├── nutritrack_lgbm_v1.onnx              # Exported ONNX model (1.2 MB)
│       └── model_metadata.json                  # Metrics & feature specifications
├── scripts/
│   ├── generate_interaction_dataset.ts          # Synthetic training dataset generator
│   ├── train_export_onnx.py                     # LightGBM training & ONNX exporter
│   └── seed_serverless_db.ts                    # Neon DB seeder
├── src/
│   ├── components/
│   │   ├── HomeDashboard.tsx                    # 12-nutrient ledger & adherence gauge
│   │   ├── SuitabilityExplanationModal.tsx      # XAI drawer with bullet bar drivers
│   │   ├── ClinicianReviewPortal.tsx            # 504-rule grid with live sum(W)=1.0
│   │   ├── OnboardingModal.tsx                  # 4-step wizard with lab auto-staging
│   │   ├── MealLogger.tsx                       # WebP image capture & leftover slider
│   │   ├── RecommendationsView.tsx              # Gap-filling & regional swaps
│   │   └── SettingsView.tsx                     # Profile & clinician portal trigger
│   ├── data/
│   │   ├── clinicalRulesSeed.ts                 # All 504 rules typed & weighted
│   │   ├── indianFoodDb.ts                      # 51 Indian dishes with 12 nutrients
│   │   └── nutritionDb.ts                       # 20 Western dishes (USDA FDC cited)
│   ├── db/
│   │   ├── schema.ts                            # Drizzle ORM PostgreSQL schema
│   │   └── client.ts                            # Dual-mode Neon + Upstash / memory fallback
│   └── shared/
│       ├── conditionStagingResolver.ts          # Lab-to-variant auto-staging
│       ├── ruleScoringEngine.ts                 # 504-rule execution & portion optimizer
│       ├── blendingEngine.ts                    # Safety-Floor blending & XAI formatter
│       └── onnxInferenceEngine.ts               # Node.js ONNX runtime session runner
├── tests/
│   ├── apiLatency.test.ts                       # p95 latency benchmarks
│   ├── onnxInference.test.ts                    # LightGBM model accuracy & inference
│   ├── portionCalculator.test.ts                # Safe gram solving tests
│   ├── ruleScoringEngine.test.ts                # 12 clinical engine unit tests
│   └── serverlessApi.test.ts                    # Serverless endpoint integration tests
├── drizzle.config.ts                            # Drizzle Kit migration config
├── vercel.json                                  # Vercel Serverless deployment manifest
└── server.ts                                    # Local Express dev adapter for api/v1/*
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.10+ (only required if retraining the ONNX model)

### 2. Installation
```bash
git clone <repo-url>
cd "NutriTrack AI"
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```env
# Optional: Neon Serverless Postgres (app runs seamlessly in in-memory mode without this)
DATABASE_URL="postgresql://user:password@ep-project.us-east-2.aws.neon.tech/nutritrack?sslmode=require"

# Optional: Upstash Redis Edge Cache (app runs in local edge memory mode without this)
UPSTASH_REDIS_REST_URL="https://your-upstash-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Optional: Google Gemini Vision API for food photo recognition
GEMINI_API_KEY="your-gemini-api-key"

# Optional: Roboflow Vision API
ROBOFLOW_API_KEY="your-roboflow-api-key"
```

> **Zero Cloud Dependency Notice**: You can run and test all features without Neon or Upstash credentials. The app includes high-performance in-memory databases and caching fallbacks with warmed sub-millisecond latencies.

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Both the React Single-Page Application and the `/api/v1/*` serverless API handlers are mounted and operational.

### 5. Running the Automated Test Suite
```bash
npm run test
```
Executes all 32 unit and integration tests across 5 suites:
```
 ✓ tests/portionCalculator.test.ts (3 tests)
 ✓ tests/ruleScoringEngine.test.ts (12 tests)
 ✓ tests/serverlessApi.test.ts (9 tests)
 ✓ tests/onnxInference.test.ts (5 tests)
 ✓ tests/apiLatency.test.ts (3 tests)
```

### 6. Running Latency Benchmarks
```bash
npm run bench
```

### 7. Building for Production
```bash
npm run build
```

---

## ☁️ Vercel Deployment Instructions

NutriTrack AI is built natively for serverless deployment on **Vercel**:

1. **Push to GitHub**:
   Ensure your repository has the latest code and ONNX model (`data_assets/models/nutritrack_lgbm_v1.onnx`).

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your Git repository.
   - Framework Preset: **Vite**.
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Configure Environment Variables**:
   In the Vercel Project Settings > Environment Variables, add:
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini key for multimodal meal recognition.
   - `DATABASE_URL`: *(Optional)* Neon PostgreSQL connection string.
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: *(Optional)* Upstash credentials.

4. **Deploy**:
   Click **"Deploy"**. Vercel will build the frontend and deploy each handler in `api/v1/*.ts` as an isolated serverless function configured with 1024 MB memory and 30s timeouts according to `vercel.json`.

---

## 📜 Medical References & Guidelines

- **ADA 2024 Standards of Care in Diabetes**: Glycemic target thresholds, carbohydrate consistency, and nephropathy screening.
- **KDIGO 2024 Clinical Practice Guideline for CKD**: Sodium $< 2000\text{ mg/day}$, protein restrictions for non-dialysis CKD ($0.6\text{–}0.8\text{ g/kg/day}$), potassium staging.
- **AHA/ACC 2019 Guideline on the Primary Prevention of Cardiovascular Disease**: Saturated fat $< 6\%$ of calories, sodium $< 1500\text{ mg/day}$.
- **ICMR-NIN 2020 Dietary Guidelines for Indians**: Recommended Dietary Allowances (RDA) and Estimated Average Requirements (EAR) for Indian adults.
- **Indian Food Composition Tables (IFCT) 2017**: Comprehensive 12-nutrient profiles for regional Indian dishes.
- **ESPEN / PROT-AGE Geriatric Nutrition Guidelines**: Protein intake for adults 65+ ($1.0\text{–}1.5\text{ g/kg/day}$) and sarcopenia prevention.

---

## 📄 License
MIT License. NutriTrack AI is intended for dietary reference and educational clinical governance.
