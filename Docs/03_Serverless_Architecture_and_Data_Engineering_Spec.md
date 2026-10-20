# **Serverless System Architecture & Data Engineering Specification — NutriTrack AI**

**Base Repository:** [PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)  
**Architecture Paradigm:** 100% Cloud-Native, Event-Driven, Zero-Idle-Cost Serverless Architecture  
Primary Latency Target: \< 300 ms (p95) for single food-score & explanation requests; elastic scaling from \~125 to 10,000+ food catalog items

# **1\. Executive Architecture Overview: From Monolith (server.ts) to Serverless**

In the existing prototype repository ([server.ts](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION/blob/main/server.ts)), the application runs as a single long-lived Node.js/Express process coupled with Vite middleware, storing user logs in browser localStorage and keeping food datasets hardcoded in TypeScript files (src/data/indianFoodDb.ts and src/data/nutritionDb.ts).

To satisfy production scalability, clinical auditability, zero idle infrastructure cost, and \< 300ms p95 latency, NutriTrack AI is architected as a 6-Layer Cloud-Native Serverless System deployable seamlessly on Vercel Serverless \+ Neon Serverless Postgres \+ Upstash Redis (or AWS API Gateway \+ AWS Lambda \+ Aurora Serverless v2 \+ ElastiCache Serverless):

## **1.1 High-Level Serverless Topology Diagram (Logical Flow)**

\[Client Layer: React 19 PWA \+ Service Worker \+ IndexedDB Offline Cache\]

       │  (HTTPS / TLS 1.3 — WebP \<=100KB Images, JWT Auth)

       ▼

\[Edge & API Gateway Layer: Vercel Edge / AWS API Gateway \+ Upstash Rate Limiter\]

       │

       ├──► /api/v1/score-food          (Serverless Function: Rule \+ ONNX ML Scorer)

       ├──► /api/v1/rank-foods          (Serverless Function: Personalized Batch Ranker)

       ├──► /api/v1/detect-food         (Serverless Function: Roboflow \+ Gemini 2.5 Flash Vision)

       ├──► /api/v1/calculate-consumption (Serverless Function: Leftover Delta & Ledger Commit)

       ├──► /api/v1/profile-ledger      (Serverless Function: User Profile, Auto-Staging & Daily Gaps)

       └──► /api/v1/clinical-rules      (Serverless Function: Dietitian Governance & Sign-Off API)

               │

               ├──────► \[Fast State & Cache Layer: Upstash Serverless Redis\]

               │         • Versioned 504 Clinical Rules Hash (\`rules:v{active\_hash}\`) — \<5ms lookup

               │         • Hot Food Nutrient Vectors (\`food:item:{id}\`)

               │         • User Daily Remaining Budget Ledger (\`ledger:{userId}:{YYYY-MM-DD}\`)

               │

               ├──────► \[Serverless AI & ML Inference Layer\]

               │         • In-Function ONNX Runtime (\`lightgbm\_suitability\_v1.onnx\` \< 2.5MB)

               │         • Google Gemini 2.5 Flash Serverless API (\`@google/genai\`)

               │         • Roboflow Serverless Hosted Inference API (\`YOLOv8-IndianFood\`)

               │

               └──────► \[Serverless Persistent Data Layer: Neon Serverless PostgreSQL\]

                         • \`users\` & \`user\_clinical\_profiles\` (42-variant flags \+ lab vitals)

                         • \`food\_catalog\` (10,000+ USDA FDC \+ IFCT Indian foods, 12 nutrients, pgvector)

                         • \`clinical\_suitability\_rules\` (504 rules \+ version history \+ sign-off audit)

                         • \`meal\_logs\` & \`daily\_nutrient\_ledgers\` (Served vs Consumed \+ XAI snapshot)

                         • \`interaction\_training\_logs\` (De-identified consented logs for ML retraining)

# **2\. Serverless Compute Decomposition (Refactoring server.ts)**

Instead of a single monolithic server.ts, backend logic is decomposed into six isolated, stateless serverless functions under api/v1/ sharing a lightweight core library (src/server/core/):

| Serverless Function Endpoint | Runtime & Memory | Cold / Warm Execution | Responsibility & Execution Flow |
| :---- | :---- | :---- | :---- |
| **POST /api/v1/score-food** | Edge / Node.js 22 Serverless (256 MB) | \<180ms cold / \~34ms warm | Fetches active 504-rule matrix from warm isolate / Upstash Redis, resolves user's multi-condition profile \+ today's remaining budget, runs deterministic 12-nutrient scoring \+ portion optimizer, executes in-memory ONNX ML model, applies Authoritative Safety-Floor Blending, and returns score \+ XAI payload. |
| **POST /api/v1/rank-foods** | Node.js 22 Serverless (512 MB) | \<280ms cold / \~85ms warm | Pre-filters candidate foods from food\_catalog (by cuisine, meal type, dietary preference, and hard danger thresholds), vector-scores candidates via the Hybrid Rule \+ LightGBM ONNX model using live \*\_gap features, and returns top-N ranked dishes plus regional substitutions. |
| **POST /api/v1/detect-food** | Node.js 22 Serverless (512 MB, 15s timeout) | \~1.8s–2.6s (Vision API bound) | Orchestrates parallel **Roboflow YOLOv8 bounding-box detection** and **Gemini 2.5 Flash multimodal analysis**, maps detected dishes against food\_catalog (Indian & Western DBs) for verified 12-nutrient grounding, and falls back to fallbackPlatters.ts if external vision quotas fail. |
| **POST /api/v1/calculate-consumption** | Edge / Node.js 22 Serverless (256 MB) | \<120ms cold / \~25ms warm | Computes actual intake from servedItems and leftoverPercent ((100 \- leftoverPercent)/100), persists the confirmed LoggedMeal to Serverless Postgres via HTTP connection pooling, and atomically updates daily\_nutrient\_ledgers (\*\_consumed, \*\_remaining, \*\_gap). |
| **GET/PUT /api/v1/profile-ledger** | Edge / Node.js 22 Serverless (256 MB) | \<140ms cold / \~30ms warm | Manages user demographics, executes the **Lab-to-42-Variant Auto-Staging Resolver** (mapping HbA1c, eGFR, BP, LDL, Hemoglobin, BMI to condition variants), calculates Mifflin-St Jeor \+ clinical daily targets, and syncs wearable activity burns (fitnessService). |
| **GET/PATCH /api/v1/clinical-rules** | Node.js 22 Serverless (256 MB, RBAC CLINICIAN) | \<180ms cold / \~40ms warm | Powers the Dietitian Clinical Review Portal: lists all 504 rules with citation statuses, validates weight vector normalization (Sum(W) \== 1.0), appends immutable audit logs on edits/approvals, and invalidates/refreshes the Upstash Redis rule cache hash. |

# **3\. Serverless Database Architecture & Complete Relational Schema**

## **3.1 Why Neon Serverless PostgreSQL \+ Upstash Serverless Redis?**

* **Neon Serverless PostgreSQL** provides autoscaling compute (scales to zero when idle), connection pooling over HTTP/WebSockets (@neondatabase/serverless) compatible with edge/serverless functions, native JSONB support for XAI payloads, and full ACID transactions for clinical rule versioning and audit logs.  
* **Upstash Serverless Redis** provides HTTP-based global low-latency caching (\< 5ms read latency) for the active 504-rule matrix and user daily remaining nutrient ledgers without TCP connection overhead.

## **3.2 Production SQL / Drizzle ORM Schema Specification**

### **Table 1: users & user\_clinical\_profiles**

CREATE TABLE users (

    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,

    role VARCHAR(32) NOT NULL DEFAULT 'CONSUMER', \-- 'CONSUMER' | 'CLINICIAN' | 'ADMIN'

    created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE TABLE user\_clinical\_profiles (

    user\_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    display\_name VARCHAR(120) NOT NULL,

    age SMALLINT NOT NULL CHECK (age BETWEEN 1 AND 120),

    gender VARCHAR(16) NOT NULL, \-- 'male' | 'female' | 'other'

    height\_cm NUMERIC(5,2) NOT NULL,

    weight\_kg NUMERIC(5,2) NOT NULL,

    bmi NUMERIC(4,1) GENERATED ALWAYS AS (weight\_kg / ((height\_cm / 100.0) \* (height\_cm / 100.0))) STORED,

    activity\_level VARCHAR(24) NOT NULL, \-- 'sedentary' | 'light' | 'moderate' | 'very\_active'

    sleep\_hours NUMERIC(3,1) DEFAULT 7.0,

    dietary\_preference VARCHAR(32) NOT NULL DEFAULT 'any',

    preferred\_cuisine VARCHAR(32) NOT NULL DEFAULT 'indian',

    cuisine\_region VARCHAR(64) DEFAULT 'South Indian',

    \-- Active 42-variant condition codes (e.g. \['DIABETES\_T2\_UNCONTROLLED', 'HTN\_STAGE\_2', 'CKD\_STAGE\_3'\])

    active\_condition\_variants TEXT\[\] NOT NULL DEFAULT '{}',

    \-- Lab & Vital Measurements (Encrypted at Rest)

    systolic\_bp SMALLINT,

    diastolic\_bp SMALLINT,

    fasting\_blood\_sugar\_mg\_dl NUMERIC(5,1),

    hba1c\_percent NUMERIC(4,2),

    egfr\_ml\_min NUMERIC(5,1),

    ldl\_cholesterol\_mg\_dl NUMERIC(5,1),

    total\_cholesterol\_mg\_dl NUMERIC(5,1),

    hemoglobin\_g\_dl NUMERIC(4,1),

    trimester SMALLINT CHECK (trimester IN (1, 2, 3)),

    \-- Computed Daily 12-Nutrient Targets

    target\_calories NUMERIC(6,1) NOT NULL,

    target\_protein\_g NUMERIC(5,1) NOT NULL,

    target\_carbs\_g NUMERIC(5,1) NOT NULL,

    target\_fiber\_g NUMERIC(5,1) NOT NULL,

    target\_sugar\_g NUMERIC(5,1) NOT NULL,

    target\_fat\_g NUMERIC(5,1) NOT NULL,

    target\_sat\_fat\_g NUMERIC(5,1) NOT NULL,

    target\_sodium\_mg NUMERIC(6,1) NOT NULL,

    target\_cholesterol\_mg NUMERIC(5,1) NOT NULL,

    target\_potassium\_mg NUMERIC(6,1) NOT NULL,

    target\_calcium\_mg NUMERIC(6,1) NOT NULL,

    target\_iron\_mg NUMERIC(5,1) NOT NULL,

    updated\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

### **Table 2: food\_catalog (Unified 12-Nutrient Schema for Indian \+ Global Foods)**

CREATE TABLE food\_catalog (

    id VARCHAR(64) PRIMARY KEY, \-- e.g. 'ind\_masala\_dosa\_01' or 'usda\_171287'

    name VARCHAR(255) NOT NULL,

    regional\_names TEXT\[\] NOT NULL DEFAULT '{}',

    category VARCHAR(64) NOT NULL,

    cuisine\_region VARCHAR(64) NOT NULL, \-- 'South Indian', 'North Indian', 'Western', etc.

    is\_indian BOOLEAN NOT NULL DEFAULT FALSE,

    diet\_tags TEXT\[\] NOT NULL DEFAULT '{}', \-- 'vegetarian', 'vegan', 'low\_gi', etc.

    serving\_description VARCHAR(120) NOT NULL, \-- e.g. '1 medium dosa (100g)'

    default\_serving\_grams NUMERIC(6,1) NOT NULL DEFAULT 100.0,

    \-- Complete 12-Nutrient Profile per default\_serving\_grams

    calories\_kcal NUMERIC(6,1) NOT NULL,

    protein\_g NUMERIC(5,2) NOT NULL,

    carbs\_g NUMERIC(5,2) NOT NULL,

    fiber\_g NUMERIC(5,2) NOT NULL,

    sugar\_g NUMERIC(5,2) NOT NULL,

    total\_fat\_g NUMERIC(5,2) NOT NULL,

    saturated\_fat\_g NUMERIC(5,2) NOT NULL,

    sodium\_mg NUMERIC(6,1) NOT NULL,

    cholesterol\_mg NUMERIC(6,1) NOT NULL,

    potassium\_mg NUMERIC(6,1) NOT NULL,

    calcium\_mg NUMERIC(6,1) NOT NULL,

    iron\_mg NUMERIC(5,2) NOT NULL,

    glycemic\_index\_band VARCHAR(16), \-- 'Low' | 'Medium' | 'High'

    glycemic\_index\_value SMALLINT,

    \-- Data Provenance & Citation

    data\_source VARCHAR(64) NOT NULL, \-- 'USDA\_FDC' | 'IFCT\_2017' | 'PROTOTYPE\_SYNTHETIC'

    source\_citation\_id VARCHAR(128),

    is\_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE INDEX idx\_food\_catalog\_cuisine\_cat ON food\_catalog(cuisine\_region, category);

CREATE INDEX idx\_food\_catalog\_name\_trgm ON food\_catalog USING GIN (regional\_names);

### **Table 3: clinical\_suitability\_rules (504 Versioned Rules \+ Audit Trail)**

CREATE TABLE clinical\_suitability\_rules (

    rule\_id VARCHAR(96) PRIMARY KEY, \-- e.g. 'CKD\_STAGE\_3\_\_POTASSIUM'

    condition\_family VARCHAR(64) NOT NULL, \-- 1 of 14 families

    condition\_variant VARCHAR(64) NOT NULL, \-- 1 of 42 variants

    severity\_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,

    nutrient\_name VARCHAR(32) NOT NULL, \-- 1 of 12 nutrients

    nutrient\_unit VARCHAR(16) NOT NULL, \-- 'kcal' | 'g' | 'mg'

    rule\_direction VARCHAR(16) NOT NULL, \-- 'LIMITING' | 'BENEFICIAL'

    normalized\_weight NUMERIC(5,4) NOT NULL CHECK (normalized\_weight BETWEEN 0 AND 1),

    \-- Per-Meal Thresholds (Derived from Daily Guideline / 3 or Clinical Per-Meal Standard)

    safe\_threshold NUMERIC(8,2),      \-- For LIMITING nutrients

    warning\_threshold NUMERIC(8,2),   \-- For LIMITING nutrients

    danger\_threshold NUMERIC(8,2),    \-- Hard ceiling for LIMITING nutrients

    required\_target NUMERIC(8,2),     \-- For BENEFICIAL nutrients

    daily\_guideline\_reference NUMERIC(8,2),

    \-- Clinical Provenance & Governance Sign-Off

    source\_basis VARCHAR(32) NOT NULL, \-- 'CITED\_GUIDELINE' | 'CLINICAL\_ESTIMATE'

    guideline\_organization VARCHAR(64), \-- 'ADA' | 'AHA' | 'KDOQI 2020' | 'NOF/NIH' | 'ACOG/IOM' | 'PROT-AGE' | 'ACC/AHA'

    guideline\_citation\_text TEXT,

    approval\_status VARCHAR(32) NOT NULL DEFAULT 'ESTIMATE\_PENDING\_REVIEW',

    \-- 'APPROVED\_CITED' | 'APPROVED\_CLINICAL\_CONSENSUS' | 'ESTIMATE\_PENDING\_REVIEW' | 'REJECTED'

    reviewed\_by\_clinician\_id UUID REFERENCES users(id),

    reviewed\_at TIMESTAMPTZ,

    rule\_version INTEGER NOT NULL DEFAULT 1,

    updated\_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(condition\_variant, nutrient\_name)

);

CREATE TABLE clinical\_rule\_audit\_log (

    audit\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

    rule\_id VARCHAR(96) NOT NULL REFERENCES clinical\_suitability\_rules(rule\_id),

    changed\_by\_user\_id UUID NOT NULL REFERENCES users(id),

    previous\_snapshot JSONB NOT NULL,

    new\_snapshot JSONB NOT NULL,

    change\_reason TEXT NOT NULL,

    created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

### **Table 4: daily\_nutrient\_ledgers & meal\_logs**

CREATE TABLE daily\_nutrient\_ledgers (

    ledger\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

    user\_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    log\_date DATE NOT NULL,

    active\_calories\_burned NUMERIC(6,1) NOT NULL DEFAULT 0,

    \-- Running Consumed Totals across 12 Nutrients

    consumed\_calories NUMERIC(6,1) NOT NULL DEFAULT 0,

    consumed\_protein\_g NUMERIC(5,1) NOT NULL DEFAULT 0,

    consumed\_carbs\_g NUMERIC(5,1) NOT NULL DEFAULT 0,

    consumed\_fiber\_g NUMERIC(5,1) NOT NULL DEFAULT 0,

    consumed\_sugar\_g NUMERIC(5,1) NOT NULL DEFAULT 0,

    consumed\_fat\_g NUMERIC(5,1) NOT NULL DEFAULT 0,

    consumed\_sat\_fat\_g NUMERIC(5,1) NOT NULL DEFAULT 0,

    consumed\_sodium\_mg NUMERIC(6,1) NOT NULL DEFAULT 0,

    consumed\_cholesterol\_mg NUMERIC(6,1) NOT NULL DEFAULT 0,

    consumed\_potassium\_mg NUMERIC(6,1) NOT NULL DEFAULT 0,

    consumed\_calcium\_mg NUMERIC(6,1) NOT NULL DEFAULT 0,

    consumed\_iron\_mg NUMERIC(5,1) NOT NULL DEFAULT 0,

    UNIQUE(user\_id, log\_date)

);

CREATE TABLE meal\_logs (

    meal\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

    user\_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    ledger\_id UUID NOT NULL REFERENCES daily\_nutrient\_ledgers(ledger\_id) ON DELETE CASCADE,

    logged\_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    meal\_type VARCHAR(24) NOT NULL, \-- 'breakfast' | 'lunch' | 'dinner' | 'snack'

    leftover\_percent NUMERIC(4,1) NOT NULL DEFAULT 0,

    items\_json JSONB NOT NULL, \-- Array of DetectedFoodItem with per-item XAI scores

    rule\_set\_version\_hash VARCHAR(64) NOT NULL,

    ml\_model\_version VARCHAR(32) NOT NULL

);

# **4\. Serverless ML Training, ONNX Export & Inference Pipeline**

## **4.1 Offline / Scheduled Serverless Training Workflow**

1. **Training Dataset Source:** Starts with health\_food\_recommendation\_dataset.csv (\~11,000 rows pairing user profiles, condition flags, 12 food nutrients, \*\_gap / \*\_remaining features, and ground-truth suitability scores/labels). As consented real user logs accumulate in interaction\_training\_logs, a scheduled serverless job (GitHub Actions / AWS EventBridge \+ Modal/SageMaker Serverless) retrains the model weekly.  
2. **Model Architecture:** **LightGBM Regressor & 5-Class Classifier** (objective='regression\_l1' for 0–100 Suitability Score calibration \+ multiclass probability calibration).  
3. **Promotion Gate:** Automated CI pipeline evaluates the candidate model against the clinically reviewed rule validation set. Promotion to production requires **Macro F1 \>= 0.90** across all 5 recommendation bands and **zero safety-floor inversions**.  
4. **ONNX Quantization & Bundling:** The validated LightGBM model is exported via onnxmltools to artifacts/models/nutritrack\_lgbm\_v1.onnx (\~1.2 MB). Because the ONNX artifact is under 2 MB, it is bundled directly inside the /api/v1/score-food and /api/v1/rank-foods serverless functions and executed via onnxruntime-node in \~9 ms with zero network serialization overhead.

# **5\. Serverless Security, Observability & Deployment Configuration**

## **5.1 Multi-Provider Serverless Deployment Configurations**

* **Option A (Recommended for Fastest Antigravity Turnkey — Vercel \+ Neon \+ Upstash):**  
  * vercel.json routes /api/v1/\* to serverless functions in api/v1/\*.ts and serves the Vite PWA static build via Global Edge CDN.  
* **Option B (AWS Serverless — SAM / SST v3):**  
  * sst.config.ts / template.yaml provisions AWS CloudFront \+ S3 (PWA), Amazon API Gateway HTTP API, 6 Node.js 22 AWS Lambda functions (arm64 Graviton2), Aurora Serverless v2 (0.5–4 ACUs), and ElastiCache Serverless Redis.

## **5.2 Rate Limiting, Auth & Cost Guardrails**

* **Upstash @upstash/ratelimit Sliding Window:**  
  * /api/v1/score-food & /api/v1/rank-foods: 60 requests / minute / user.  
  * /api/v1/detect-food (Gemini 2.5 Flash \+ Roboflow Vision): 10 requests / minute / user with automatic fallback to deterministic local platter recognition if quota is exceeded.  
* **Authentication:** Stateless JWT (jose Web Crypto API compatible with Edge runtimes) carrying sub (userId) and role (CONSUMER | CLINICIAN | ADMIN).

