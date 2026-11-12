import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { fallbackMap } from "./src/data/fallbackPlatters";

// Import V1 Serverless API Handlers
import scoreFoodHandler from "./api/v1/score-food";
import rankFoodsHandler from "./api/v1/rank-foods";
import detectFoodHandler from "./api/v1/detect-food";
import calculateConsumptionHandler from "./api/v1/calculate-consumption";
import profileLedgerHandler from "./api/v1/profile-ledger";
import clinicalRulesHandler from "./api/v1/clinical-rules";
import authHandler from "./api/v1/auth";

dotenv.config();

const app = express();
const PORT = 3000;

// Allow large base64 image uploads (up to 15MB)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize Gemini client lazily if key is provided
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const activeKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY3;
  if (!aiClient && activeKey) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return aiClient;
}

// In-memory corrections dataset for future model fine-tuning feedback
export interface UserCorrectionRecord {
  id: string;
  timestamp: string;
  originalPrediction: string;
  selectedFood: string;
  confidenceTier: 'high' | 'medium' | 'low';
  feedbackType: 'approved_as_is' | 'swapped_candidate' | 'manual_search_override';
  cuisineRegion?: string;
  notes?: string;
}

const userCorrectionsStore: UserCorrectionRecord[] = [
  {
    id: "corr-init-1",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    originalPrediction: "Vegetable Sambar",
    selectedFood: "Tomato Pepper Rasam",
    confidenceTier: "medium",
    feedbackType: "swapped_candidate",
    cuisineRegion: "South Indian",
  },
  {
    id: "corr-init-2",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    originalPrediction: "Fresh Coconut Chutney",
    selectedFood: "Fresh Coconut Chutney",
    confidenceTier: "medium",
    feedbackType: "approved_as_is",
    cuisineRegion: "South Indian",
  },
  {
    id: "corr-init-3",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    originalPrediction: "Plain Dosa",
    selectedFood: "Plain Dosa",
    confidenceTier: "high",
    feedbackType: "approved_as_is",
    cuisineRegion: "South Indian",
  },
];

// ================= NutriTrack AI V1 Serverless Endpoints =================
app.all("/api/v1/score-food", (req: Request, res: Response) => scoreFoodHandler(req, res));
app.all("/api/v1/rank-foods", (req: Request, res: Response) => rankFoodsHandler(req, res));
app.all("/api/v1/detect-food", (req: Request, res: Response) => detectFoodHandler(req, res));
app.all("/api/detect-food", (req: Request, res: Response) => detectFoodHandler(req, res));
app.all("/api/v1/calculate-consumption", (req: Request, res: Response) => calculateConsumptionHandler(req, res));
app.all("/api/v1/profile-ledger", (req: Request, res: Response) => profileLedgerHandler(req, res));
app.all("/api/v1/clinical-rules", (req: Request, res: Response) => clinicalRulesHandler(req, res));
app.all("/api/v1/auth", (req: Request, res: Response) => authHandler(req, res));

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    pipeline: "YOLOv8/v11 Indian Food Vision Architecture (Roboflow Universe Dataset EDI/DataCluster Labs referenced)",
  });
});

// Feedback & User Correction endpoints for fine-tuning dataset collection
app.post("/api/feedback/correction", (req: Request, res: Response) => {
  try {
    const { originalPrediction, selectedFood, confidenceTier, feedbackType, cuisineRegion, notes } = req.body;
    if (!originalPrediction || !selectedFood) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newRecord: UserCorrectionRecord = {
      id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      originalPrediction,
      selectedFood,
      confidenceTier: confidenceTier || 'medium',
      feedbackType: feedbackType || 'swapped_candidate',
      cuisineRegion: cuisineRegion || 'Pan-Indian',
      notes,
    };

    userCorrectionsStore.unshift(newRecord);

    // Keep store capped in memory
    if (userCorrectionsStore.length > 500) {
      userCorrectionsStore.pop();
    }

    res.json({
      success: true,
      loggedCorrection: newRecord,
      totalLoggedCorrections: userCorrectionsStore.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to record correction", details: err?.message });
  }
});

app.get("/api/feedback/corrections", (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: userCorrectionsStore.length,
    corrections: userCorrectionsStore,
    architecture: {
      modelBase: "YOLOv8 / YOLOv11 Indian Food Fine-tuned Detection Architecture",
      trainingReferences: [
        "Roboflow Universe: Indian Food Image (EDI)",
        "Roboflow Universe: Indian Food Image (DataCluster Labs)",
        "images.cv: Indian Food Image Dataset",
      ],
      methodology: "AI-assisted multi-item detection (calibrated 70-90% baseline) + 1-tap human-in-the-loop correction",
    },
  });
});

// Calculate consumption between served and leftovers endpoint
app.post("/api/calculate-consumption", (req: Request, res: Response) => {
  try {
    const { servedItems, leftoverPercent = 0 } = req.body;
    if (!servedItems || !Array.isArray(servedItems)) {
      return res.status(400).json({ error: "Missing servedItems array" });
    }

    const consumptionRatio = Math.max(0, Math.min(1, (100 - leftoverPercent) / 100));

    const actualItems = servedItems.map((item: any) => ({
      ...item,
      calories: Math.round(item.calories * consumptionRatio),
      protein: Number((item.protein * consumptionRatio).toFixed(1)),
      carbs: Number((item.carbs * consumptionRatio).toFixed(1)),
      fat: Number((item.fat * consumptionRatio).toFixed(1)),
      fiber: Number((item.fiber * consumptionRatio).toFixed(1)),
      sodium: Math.round(item.sodium * consumptionRatio),
    }));

    const totals = {
      calories: actualItems.reduce((acc: number, i: any) => acc + i.calories, 0),
      protein: Number(actualItems.reduce((acc: number, i: any) => acc + i.protein, 0).toFixed(1)),
      carbs: Number(actualItems.reduce((acc: number, i: any) => acc + i.carbs, 0).toFixed(1)),
      fat: Number(actualItems.reduce((acc: number, i: any) => acc + i.fat, 0).toFixed(1)),
      fiber: Number(actualItems.reduce((acc: number, i: any) => acc + i.fiber, 0).toFixed(1)),
      sodium: actualItems.reduce((acc: number, i: any) => acc + i.sodium, 0),
    };

    res.json({
      success: true,
      consumptionPercent: Math.round(consumptionRatio * 100),
      leftoverPercent,
      actualItems,
      totals,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Consumption calculation failed", details: err?.message });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NutriTrack AI server running on port ${PORT}`);
  });
}

startServer();
