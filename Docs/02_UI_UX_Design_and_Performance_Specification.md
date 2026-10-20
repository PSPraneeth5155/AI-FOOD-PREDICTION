# **UI/UX Design System, Visual Experience & Performance Specification — NutriTrack AI**

**Base Repository:** [PSPraneeth5155/AI-FOOD-PREDICTION](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION)  
**Frontend Stack:** React 19, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Recharts, Lucide React, Progressive Web App (PWA)

# **1\. Visual Identity & Design System ("How the Application Should Look")**

NutriTrack AI combines the clean, reassuring clarity of a clinical decision-support instrument with the responsiveness and warmth of a daily consumer habit app. Extending the existing mobile-first shell in [src/App.tsx](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION/blob/main/src/App.tsx), the UI adheres to the following strict design tokens:

## **1.1 Color Palette & Clinical Semantic Tokens**

| Semantic Token | Tailwind Class / Hex | Usage & Clinical Meaning | Contrast Ratio (WCAG AA) |
| :---- | :---- | :---- | :---- |
| **Brand Primary** | `emerald-600` (`#059669`) / `teal-600` (`#0D9488`) | Primary CTA buttons, active tab indicators, top gradient headers, positive progress rings | 4.6:1 on white |
| **Canvas Surface** | `slate-50` (`#F8FAFC`) | Root viewport background (`min-h-screen bg-slate-50`) | N/A |
| **Card Surface** | `white` (`#FFFFFF`) with `border-slate-100` (`#F1F5F9`) | Elevated content cards (`rounded-2xl shadow-sm p-4`) | N/A |
| **Band 1: Highly Recommended (85–100)** | `emerald-50` bg / `emerald-700` text / `emerald-500` ring (`#10B981`) | Optimal nutrient density & zero clinical threshold violations | 5.4:1 |
| **Band 2: Recommended (70–84.9)** | `teal-50` bg / `teal-700` text / `teal-500` ring (`#14B8A6`) | Safe and beneficial for all active user conditions | 5.1:1 |
| **Band 3: Consume in Moderation (50–69.9)** | `amber-50` bg / `amber-800` text / `amber-500` ring (`#F59E0B`) | Approaches warning threshold; portion control required | 6.2:1 |
| **Band 4: Limit Intake (30–49.9)** | `orange-50` bg / `orange-800` text / `orange-500` ring (`#F97316`) | Exceeds safe per-meal threshold for \>=1 condition; strict gram cap | 5.8:1 |
| **Band 5: Avoid (\<30)** | `rose-50` bg / `rose-800` text / `rose-600` ring (`#E11D48`) | Violates clinical danger threshold (e.g., high potassium in CKD Stage 4\) | 6.5:1 |
| **Source Confidence: Cited Guideline** | `indigo-50` bg / `indigo-700` text (`#4338CA`) | Verified citation (`ADA`, `AHA`, `KDOQI 2020`, `ACOG/IOM`, `NOF/NIH`, `PROT-AGE`) | 6.8:1 |
| **Source Confidence: Clinical Estimate** | `amber-100/70` bg / `amber-900` text (`#78350F`) | Flagged estimate pending dietitian sign-off (never presented as equal to cited) | 7.1:1 |

## **1.2 Typography, Grid & Layout Architecture**

* **Responsive Viewport Architecture:**  
  * **Consumer Mobile PWA (`/`):** Centered mobile app frame (`max-w-md mx-auto min-h-screen bg-slate-50 pb-24 relative shadow-xl`) optimized for `390x844` to `430x932` mobile screens, with optional tablet/desktop two-column expansion (`lg:max-w-5xl lg:grid lg:grid-cols-12 lg:gap-6`).  
  * **Clinical Reviewer Governance Portal (`/clinician-portal`):** Full-width desktop data workspace (`max-w-7xl mx-auto px-6 py-8`) designed for dietitians inspecting the 504 rule rows.  
* **Typography Hierarchy:**  
  * **Font Stack:** `Inter, system-ui, -apple-system, sans-serif` for UI copy; `JetBrains Mono, monospace` for numerical nutrient values, gram weights, suitability scores (`0–100`), and clinical threshold formulas (`tabular-nums` enforced on all numbers so sliders never jitter).  
  * **Scale:** Screen Header `text-xl font-bold tracking-tight text-slate-900`; Card Title `text-base font-semibold text-slate-800`; Nutrient Metric Label `text-xs font-medium uppercase tracking-wider text-slate-500`; Clinical Citation Tag `text-[11px] font-semibold px-2 py-0.5 rounded-full`.

# **2\. Screen-by-Screen Visual & Interaction Specifications**

## **2.1 Multi-Condition Clinical Onboarding & Profile Wizard (`OnboardingModal.tsx`)**

Upgrades the existing onboarding modal in [src/components/OnboardingModal.tsx](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION/blob/main/src/components/OnboardingModal.tsx) into a 4-step progressive wizard:

1. **Step 1 — Demographics & Anthropometrics:** Name, Age, Gender, Height (cm), Weight (kg), auto-computed live BMI badge (`Underweight` | `Normal` | `Overweight` | `Obesity Class I/II`), Activity Level (`Sedentary` to `Very Active`), and Sleep Duration (`hours/night`).  
2. **Step 2 — 14 Condition Families & 42 Severity Variants Selector:**  
   * Interactive chip grid for the **14 Condition Families**: `Diabetes`, `Prediabetes`, `Hypertension`, `High Cholesterol`, `Heart Disease`, `Obesity`, `Underweight`, `Kidney Disease (CKD)`, `Fatty Liver (NAFLD)`, `Anemia`, `Osteoporosis`, `Athletes`, `Elderly (65+)`, `Pregnant Women`.  
   * Selecting any condition expands an inline **Severity Sub-Type Drawer** (mapping directly to the 42 clinical variants, e.g., `CKD Stage 1`, `CKD Stage 2`, `CKD Stage 3a/3b`, `CKD Stage 4`, `CKD Stage 5 Dialysis`; `Pregnancy Trimester 1/2/3`; `Type 2 Diabetes Controlled` vs `Uncontrolled`).  
3. **Step 3 — Optional Lab & Vital Auto-Staging:**  
   * Clean numeric inputs with unit toggles for `Systolic/Diastolic BP (mmHg)`, `HbA1c (%)`, `Fasting Blood Sugar (mg/dL)`, `eGFR (mL/min/1.73m2)`, `LDL Cholesterol (mg/dL)`, and `Hemoglobin (g/dL)`.  
   * **Live Auto-Staging Banner:** Entering `BP: 148/94 mmHg` and `eGFR: 48` automatically highlights `"Auto-Detected: Hypertension Stage 2 + CKD Stage 3a"` with a 1-tap confirmation toggle.  
4. **Step 4 — Regional Cuisine & Daily Budget Targets:**  
   * Toggle for **Indian Regional Cuisine Mode** (`South Indian / Tamil Nadu`, `North Indian`, `East Indian`, `West Indian`, `Pan-Indian`, `Global/Western`) \+ Dietary Preference (`Vegetarian`, `Vegan`, `Eggetarian`, `Non-Veg`, `Low-Sodium`).  
   * Displays the computed **12-Nutrient Daily Target Ledger** (Mifflin-St Jeor TDEE adjusted for active clinical conditions).

## **2.2 Home Dashboard & Real-Time Daily Nutrient Ledger (`HomeDashboard.tsx`)**

Enhances [src/components/HomeDashboard.tsx](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION/blob/main/src/components/HomeDashboard.tsx) and src/components/AppleRings.tsx:

* **Top Clinical Status Header:** Displays greeting, active condition pills (e.g., `T2D Uncontrolled`, `HTN Stage 2`), and overall **Daily Suitability Adherence Score (`0–100`)**.  
* **Dual Ring & Budget Hero Card:**  
  * Left: Concentric **Activity & Intake Rings** (`AppleRings.tsx`) showing Net Calories Consumed vs. Wearable Active Burn (`FitnessActivityCard.tsx`).  
  * Right: **Critical Limiting vs. Beneficial Nutrient Gauges** dynamically tailored to the user's conditions (e.g., for CKD \+ Hypertension, surfaces `Sodium Remaining: 620 mg`, `Potassium Remaining: 850 mg`, `Protein Gap: 18 g`).  
* **12-Nutrient Expandable Daily Ledger Accordion:** Shows `Consumed`, `Remaining Budget`, and `Per-Meal Safe Allowance` across all 12 nutrients (`Calories`, `Protein`, `Carbs`, `Fiber`, `Sugar`, `Total Fat`, `Saturated Fat`, `Sodium`, `Cholesterol`, `Potassium`, `Calcium`, `Iron`).  
* **Recent Consumed Meals Timeline:** Cards showing served vs. consumed ratio (e.g., `"2.5 Dosas consumed (83% of plate)"`), suitability badge, and 1-tap access to the XAI Breakdown Drawer.

## **2.3 Consumption-Aware Multimodal Meal Logger (`MealLogger.tsx`)**

Upgrades [src/components/MealLogger.tsx](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION/blob/main/src/components/MealLogger.tsx) into a seamless 3-stage consumption capture flow:

1. **Stage A — Multimodal Capture Bar:**  
   * **Camera / Photo Scan (`Before Meal`):** Uses `navigator.mediaDevices.getUserMedia` or file input, compresses client-side to WebP (`<= 100 KB`), strips EXIF metadata, and overlays real-time **Roboflow YOLOv8 bounding boxes** \+ **Gemini 2.5 Flash dish identification tags** (with `confidenceTier` badges: `High >=0.85`, `Medium 0.60–0.84`, `Low <0.60`).  
   * **Voice Quick-Log:** Web Speech API button (`"Had 2 Ragi Dosas with 1 bowl Sambar and 1 glass buttermilk"`).  
   * **Instant 12-Nutrient Search:** Autocomplete across Indian regional aliases (`regionalNames`) and USDA/IFCT catalog.  
2. **Stage B — Clinical Portion Optimizer & Leftover Delta Slider:**  
   * For each detected food item, displays:  
     * **Suitability Score Ring (`0–100`)** \+ **5-Band Recommendation Badge**.  
     * **Clinical Recommended Portion Callout:** e.g., *"Recommended for your T2D \+ HTN profile: **135g (1.5 Dosas)** — caps Sodium at 380mg & Carbs at 36g"*, with a 1-tap **"Snap to Clinical Portion"** button.  
     * **Served vs. Consumed Leftover Slider (`0% to 100% Leftover`):** Interactive slider (`leftoverPercent`) or "After-Meal Photo Compare" that dynamically recalculates `actualConsumedGrams = servedGrams * (1 - leftoverPercent/100)` and scales all 12 nutrients in real time (`<16ms` per frame).  
3. **Stage C — Pre-Log Safety Check Banner:**  
   * Warns immediately before saving if logging the meal will push any daily limiting nutrient over 100% of the user's daily clinical ceiling.

## **2.4 Explainable AI (XAI) Suitability Breakdown Drawer (`SuitabilityExplanationModal.tsx`)**

Triggered by tapping any food item or recommendation card across the app:

* **Header Summary:** Food Name, Regional Aliases, **0–100 Suitability Score Gauge**, **5-Band Pill Badge**, **Risk Level (`SAFE` | `MODERATE` | `WARNING` | `DANGER`)**, and **Source Confidence Badge** (`Clinically Cited Guideline` vs `Clinical Estimate — Pending Review`).  
* **Binding Condition Constraint Banner:** Highlights which specific condition limited the score or portion (e.g., `"Binding Constraint: CKD Stage 3b — Potassium (640mg per serving exceeds 550mg safe per-meal ceiling)"`).  
* **Top 3 Driving Nutrients Visual Bar Chart:**  
  * Displays horizontal bullet bars for the top 2–3 weighted nutrients with color-coded zones (`Safe Zone` in emerald, `Warning Zone` in amber, `Danger Zone` in rose) and a marker showing where this food lands.  
  * Shows the exact mathematical sub-score formula next to each bar: e.g., `Limiting Score = Min(100, 500mg / 680mg * 100) = 73.5 (Weight: 0.28)`.  
* **Guideline Citation Footer:** Displays the exact guideline reference (`KDOQI 2020 Clinical Practice Guideline for Nutrition in CKD`, `ADA Standards of Care`, `AHA/ACC Sodium Guideline`) or flags `"Clinical Estimate — Scheduled for Dietitian Sign-Off"`.

## **2.5 Personalized Recommendations & Smart Substitutions View (`RecommendationsView.tsx`)**

Upgrades [src/components/RecommendationsView.tsx](https://github.com/PSPraneeth5155/AI-FOOD-PREDICTION/blob/main/src/components/RecommendationsView.tsx):

* **Real-Time Gap-Filling Mode:** Toggle between `"Best For My Conditions Overall"` and `"Fill Today's Remaining Nutrient Gaps"` (uses live `*_gap` and `*_remaining` features fed into the LightGBM/ONNX ranking model).  
* **Smart Regional Substitution Cards:** When a logged or searched food scores `< 50` (`Limit Intake` or `Avoid`), displays side-by-side culturally matched swaps (e.g., swapping **White Rice \+ Pickle (`Score: 34 - Limit Intake`)** \-\> **Millet/Ragi Pongal \+ Kollu Sundal (`Score: 89 - Highly Recommended`)** with `+6.4g Fiber`, `-540mg Sodium`).

## **2.6 Clinical Reviewer & Rule Governance Portal (`/clinician-portal`)**

Dedicated internal interface for Tertiary Users (Registered Dietitians / Clinicians):

* **504-Rule Matrix Data Grid:** Filterable by **14 Condition Families**, **42 Condition-Variants**, **12 Nutrients**, `Rule_Type` (`Limiting` vs `Beneficial`), and `Source_Basis` (`Cited Guideline` vs `Clinical Estimate`).  
* **Inline Threshold & Weight Editor:** Allows clinicians to update `Safe_Threshold`, `Warning_Threshold`, `Danger_Threshold`, `Required_Value`, `Normalized_Weight`, and `Guideline_Citation_URL` with live validation (`Sum of weights per condition variant == 1.00`).  
* **1-Click Clinical Sign-Off & Version Diff Viewer:** Displays side-by-side diffs (`v1.0` vs `v1.1`), requires a review rationale comment, and promotes rules from `ESTIMATE_PENDING_REVIEW` to `APPROVED_CITED`.

# **3\. Application Performance Engineering ("How the Application Should Perform")**

To hit the strict **\< 300ms p95 single food-score latency** and **Lighthouse \>= 95** targets in a serverless architecture, the application implements the following performance engineering standards:

## **3.1 End-to-End Latency Budget Breakdown (`< 300ms p95` Target)**

| Execution Stage | p50 Budget | p95 Budget | Optimization Mechanism |
| :---- | :---- | :---- | :---- |
| **1\. Edge TLS & API Gateway Routing** | 12 ms | 28 ms | Global Edge Network (Vercel Edge / Cloudflare / AWS CloudFront) with HTTP/3 keep-alive. |
| **2\. User Profile & Condition Rule Lookup** | 8 ms | 22 ms | **Upstash Redis Edge Cache** \+ in-memory isolate cache of the 504 clinical rules (\~180 KB JSON payload cached in warm serverless memory, `0ms` DB roundtrip on warm hit). |
| **3\. Deterministic 504-Rule Engine Math** | 2 ms | 6 ms | Pure vectorized TypeScript/Float64 array evaluation across 12 nutrients x active user conditions. |
| **4\. Serverless ML Inference (LightGBM/ONNX)** | 9 ms | 24 ms | In-process `onnxruntime-node` / WebAssembly model execution (\< 2.5 MB quantized ONNX model loaded in warm function memory — zero external Python microservice hop). |
| **5\. Safety-Floor Blending & XAI Formatting** | 3 ms | 8 ms | Deterministic top-3 driver sorting and citation attachment. |
| **6\. Async Audit & Telemetry Logging** | 0 ms (non-blocking) | 0 ms (non-blocking) | `waitUntil()` background promise writes interaction log to Serverless Postgres after HTTP response is flushed. |
| **Total End-to-End API Latency** | **\~34 ms (p50)** | **\~88 ms Warm / \< 260 ms Cold (p95)** | **Strictly satisfies `< 300 ms p95` SLA even on cold starts.** |

## **3.2 Frontend & PWA Runtime Performance Requirements**

1. **Zero-Latency Leftover & Portion Sliders (`60 FPS / < 16ms`):** Adjusting the portion gram slider or leftover percentage slider in `MealLogger.tsx` executes the deterministic rule formula locally in a shared TypeScript module (`shared/scoringEngine.ts`) for instant visual feedback, then syncs the final confirmed log to the serverless backend.  
2. **Client-Side Image Compression Pipeline (`< 150ms`):** Before invoking `/api/v1/detect-food`, an offscreen HTML5 Canvas resizes camera photos to `max 1024x1024px`, encodes to WebP (`quality: 0.78`, target `<= 100 KB`), and strips EXIF metadata, cutting upload time on 4G mobile networks from \~3.5s to `< 250ms`.  
3. **Offline-First PWA & IndexedDB Sync:** Service Worker (`sw.js`) caches the app shell, the 504 clinical rules, and the top 500 regional Indian \+ Western food items in `IndexedDB`. Users can search foods, compute clinical suitability scores, and log meals with **0% network connectivity**, automatically syncing queued logs when connectivity returns.  
4. **Bundle Size & Core Web Vitals Budgets:**  
   * Initial JS Bundle (gzipped): `< 140 KB` (code-splitting `InsightsView` Recharts and `ClinicianPortal` via `React.lazy()`).  
   * Largest Contentful Paint (LCP): `< 1.2 seconds`.  
   * Cumulative Layout Shift (CLS): `< 0.02` (explicit aspect-ratio containers on meal photo cards and SVG score rings).  
   * Interaction to Next Paint (INP): `< 75 ms`.

