import { GoogleGenAI } from '@google/genai';
import { FALLBACK_PLATTER_PRESETS, getFallbackPresetForContext } from '../../src/data/fallbackPlatters';
import { evaluateMultiCondition } from '../../src/shared/ruleScoringEngine';
import { formatFoodSuitabilityResponse } from '../../src/shared/blendingEngine';
import { getActiveClinicalRules } from '../../src/db/client';
import { ConditionVariant, FoodItem } from '../../src/types';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const {
      imageBase64,
      imageUrl,
      mealType = 'lunch',
      isIndianMode = true,
      cuisinePreference,
      activeConditionVariants = [],
    } = req.body || {};

    const ai = getGeminiClient();
    const activeRules = activeConditionVariants && activeConditionVariants.length > 0
      ? await getActiveClinicalRules()
      : [];

    let detectedItems: FoodItem[] = [];
    let mealTitle = 'Detected Meal';
    let isFoodDetected = true;
    let detectionSource = 'fallback-heuristic';

    // 1. Try Gemini Multimodal AI Vision
    if (ai && (imageBase64 || imageUrl)) {
      try {
        let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
        if (imageBase64) {
          let mimeType = 'image/jpeg';
          let cleanBase64 = '';
          const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/s);
          if (match) {
            mimeType = match[1];
            cleanBase64 = match[2].replace(/\s+/g, '');
          } else {
            cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
          }

          if (cleanBase64.length > 50) {
            imagePart = {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
              },
            };
          }
        }

        if (imagePart) {
          const prompt = `You are an expert clinical nutrition and computer vision system specializing in multi-item food recognition (Indian regional dishes like Biryani, Dosa, Idli, Sambar, Rasam, Chutneys, Dal, Paneer, Curries, Rotis, Paratha, Poha, Upma, as well as Global dishes like Pizza, Burgers, Salads, Eggs, Toast, Rice, Pasta, Fruits).

Examine the provided image with extreme precision and detect the ACTUAL food and beverage items present in THIS SPECIFIC PHOTO.
CRITICAL DIRECTIVES:
1. Identify what is ACTUALLY in the image. NEVER assume default dishes or presets.
   - If the user uploaded an Apple or Banana -> detect Apple / Banana.
   - If the user uploaded Chicken Biryani with Raita -> detect Chicken Biryani, Raita.
   - If the user uploaded Dosa and Sambar -> detect Dosa, Sambar (and accompanying chutneys).
   - If the user uploaded Dal, Rice, and Roti -> detect Dal, Rice, Roti.
   - If the image contains no food (e.g. screenshot, document, blank, non-food item), set "isFoodDetected": false and "detectedItems": [].
2. For multiple items on a plate or table, detect and segment EACH individual item with its normalized bounding box (ymin, xmin, ymax, xmax from 0 to 1000).
3. Classify realistic macros and protein content:
   - "isHighProtein": true if protein >= 8g per serving (e.g. eggs, chicken, fish, paneer, tofu, lentils, dal, chickpeas, yogurt).
4. Provide confidence calibration:
   - "confidenceTier": "high" for distinct items, "medium" for visually ambiguous curries/chutneys, "low" for obscure items.
   - "similarCandidates": 2-3 likely alternatives if visually similar (e.g. Sambar vs Rasam; Butter Chicken vs Paneer Butter Masala).

For each item, identify:
- name: standard English or regional dish name
- category: Grains | Curries/Gravies | Protein | Dairy | Vegetables | Fruits | Accompaniments | Snacks | Beverages | Desserts
- cuisineRegion: South Indian | North Indian | East Indian | West Indian | Pan-Indian | Global
- servingDescription: standard serving description with gram estimate
- calories: kcal
- protein: grams
- carbs: grams
- fat: total fat in grams
- saturatedFat: saturated fat in grams
- fiber: grams
- sugar: grams
- sodium: mg
- cholesterol: mg
- potassium: mg
- calcium: mg
- iron: mg
- isHighProtein: boolean (true if protein >= 8g)
- confidenceTier: "high" | "medium" | "low"
- confidence: 0.0 to 1.0
- similarCandidates: [2-3 alternative names]
- box: { ymin, xmin, ymax, xmax } from 0 to 1000

Respond ONLY with valid JSON:
{
  "isFoodDetected": true,
  "mealTitle": "Short descriptive title of the plate",
  "detectedItems": [ ... ]
}`;

          const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
          let jsonText: string | null = null;

          for (const modelName of candidateModels) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: [imagePart, { text: prompt }],
                config: { responseMimeType: 'application/json' },
              });
              const text = response.text?.trim();
              if (text) {
                jsonText = text;
                break;
              }
            } catch (modelErr: any) {
              console.warn(`[Vision] ${modelName} attempt error:`, modelErr?.message);
            }
          }

          if (jsonText) {
            const cleanJson = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(cleanJson);

            if (parsed.isFoodDetected === false || (Array.isArray(parsed.detectedItems) && parsed.detectedItems.length === 0)) {
              res.status(200).json({
                success: true,
                source: 'ai-vision',
                isFoodDetected: false,
                mealTitle: 'No Food Detected',
                message: 'No food items were recognized in this image. Tap "+ Search Food Library" to choose your dishes.',
                detectedItems: [],
              });
              return;
            }

            if (Array.isArray(parsed.detectedItems) && parsed.detectedItems.length > 0) {
              detectionSource = 'ai-vision-gemini';
              mealTitle = parsed.mealTitle || 'Analyzed Meal';

              // Format items with 12 nutrients and clinical pre-scoring
              detectedItems = parsed.detectedItems.map((item: any, idx: number) => {
                const confScore = typeof item.confidence === 'number' ? Math.min(0.95, Math.max(0.4, item.confidence)) : 0.82;
                const tier: 'high' | 'medium' | 'low' = item.confidenceTier || (confScore >= 0.8 ? 'high' : confScore >= 0.5 ? 'medium' : 'low');

                const foodItem: FoodItem = {
                  id: `ai-food-${Date.now()}-${idx}`,
                  name: item.name || 'Dish Item',
                  originalPrediction: item.name || 'Dish Item',
                  category: item.category || 'Grains',
                  portion: item.portion || 'medium',
                  portionMultiplier: item.portion === 'small' ? 0.7 : item.portion === 'large' ? 1.4 : 1.0,
                  servingDescription: item.servingDescription || `${item.portion || 'medium'} serving`,
                  calories: Number(item.calories || 200),
                  protein: Number(item.protein || 5),
                  carbs: Number(item.carbs || 30),
                  fat: Number(item.fat || 5),
                  saturatedFat: Number(item.saturatedFat || 1.5),
                  fiber: Number(item.fiber || 2),
                  sugar: Number(item.sugar || 1),
                  sodium: Number(item.sodium || 200),
                  cholesterol: Number(item.cholesterol || 0),
                  potassium: Number(item.potassium || 150),
                  calcium: Number(item.calcium || 30),
                  iron: Number(item.iron || 1.2),
                  isHighProtein: Boolean(item.isHighProtein ?? ((item.protein || 0) >= 8)),
                  confidence: Number(confScore.toFixed(2)),
                  confidenceTier: tier,
                  isConfirmed: tier === 'high',
                  similarCandidates: Array.isArray(item.similarCandidates) ? item.similarCandidates : [],
                  box: item.box || {
                    ymin: 150 + idx * 80,
                    xmin: 150 + idx * 80,
                    ymax: 450 + idx * 80,
                    xmax: 450 + idx * 80,
                  },
                  cuisineRegion: item.cuisineRegion || (isIndianMode ? 'South Indian' : 'Global'),
                  dataSource: 'PROTOTYPE_SYNTHETIC',
                };

                // Run pre-scoring against user's conditions
                if (activeConditionVariants.length > 0) {
                  const evalResult = evaluateMultiCondition(foodItem, activeRules, activeConditionVariants as ConditionVariant[], {
                    mealType,
                  });
                  foodItem.suitability = formatFoodSuitabilityResponse(foodItem, evalResult, undefined, startTime);
                }

                return foodItem;
              });
            }
          }
        }
      } catch (geminiErr: any) {
        console.warn('[Vision] Gemini pipeline failed, falling back to platter presets:', geminiErr?.message);
      }
    }

    // 2. Fallback to Platter Presets if Gemini not available or failed
    if (detectedItems.length === 0) {
      const fallbackPreset = getFallbackPresetForContext(mealType, isIndianMode, cuisinePreference);
      detectionSource = 'fallback-preset';
      mealTitle = fallbackPreset.name;
      detectedItems = fallbackPreset.items.map((item, idx) => {
        const foodItem: FoodItem = {
          ...item,
          id: `preset-${Date.now()}-${idx}`,
        };
        if (activeConditionVariants.length > 0) {
          const evalResult = evaluateMultiCondition(foodItem, activeRules, activeConditionVariants as ConditionVariant[], {
            mealType,
          });
          foodItem.suitability = formatFoodSuitabilityResponse(foodItem, evalResult, undefined, startTime);
        }
        return foodItem;
      });
    }

    res.status(200).json({
      success: true,
      source: detectionSource,
      isFoodDetected: true,
      mealTitle,
      detectedItems,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('[/api/v1/detect-food] Fatal Error:', err);
    res.status(500).json({
      error: 'Vision detection failure',
      message: err.message,
    });
  }
}
