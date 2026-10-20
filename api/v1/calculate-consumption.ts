import { FoodItem, NutrientVector12 } from '../../src/types';
import { updateDailyLedgerConsumed } from '../../src/db/client';

export default async function handler(req: any, res: any) {
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
      userId = 'anonymous-user',
      date = new Date().toISOString().split('T')[0],
      servedItems = [],
      leftoverPercent,
      overallLeftoverPercent,
      mealType = 'lunch',
      title = 'Logged Meal',
    } = req.body || {};

    if (!Array.isArray(servedItems) || servedItems.length === 0) {
      res.status(400).json({ error: 'servedItems must be a non-empty array of FoodItems' });
      return;
    }

    const rawLeftover = leftoverPercent !== undefined ? leftoverPercent : overallLeftoverPercent !== undefined ? overallLeftoverPercent : 0;
    const clampedLeftover = Math.max(0, Math.min(100, Number(rawLeftover) || 0));
    const consumedRatio = Math.max(0, (100 - clampedLeftover) / 100);

    const actualItems: FoodItem[] = servedItems.map(item => ({
      ...item,
      calories: Math.round((item.calories || 0) * consumedRatio),
      protein: Number(((item.protein || 0) * consumedRatio).toFixed(1)),
      carbs: Number(((item.carbs || 0) * consumedRatio).toFixed(1)),
      fat: Number(((item.fat || 0) * consumedRatio).toFixed(1)),
      saturatedFat: item.saturatedFat !== undefined ? Number(((item.saturatedFat || 0) * consumedRatio).toFixed(1)) : undefined,
      fiber: Number(((item.fiber || 0) * consumedRatio).toFixed(1)),
      sugar: Number(((item.sugar || 0) * consumedRatio).toFixed(1)),
      sodium: Math.round((item.sodium || 0) * consumedRatio),
      cholesterol: item.cholesterol !== undefined ? Math.round(((item.cholesterol || 0) * consumedRatio)) : undefined,
      potassium: item.potassium !== undefined ? Math.round(((item.potassium || 0) * consumedRatio)) : undefined,
      calcium: item.calcium !== undefined ? Math.round(((item.calcium || 0) * consumedRatio)) : undefined,
      iron: item.iron !== undefined ? Number(((item.iron || 0) * consumedRatio).toFixed(1)) : undefined,
    }));

    // Sum consumed totals across 12 nutrients
    const consumedTotals: NutrientVector12 = {
      calories: actualItems.reduce((acc, i) => acc + (i.calories || 0), 0),
      protein: Number(actualItems.reduce((acc, i) => acc + (i.protein || 0), 0).toFixed(1)),
      carbs: Number(actualItems.reduce((acc, i) => acc + (i.carbs || 0), 0).toFixed(1)),
      fiber: Number(actualItems.reduce((acc, i) => acc + (i.fiber || 0), 0).toFixed(1)),
      sugar: Number(actualItems.reduce((acc, i) => acc + (i.sugar || 0), 0).toFixed(1)),
      totalFat: Number(actualItems.reduce((acc, i) => acc + (i.fat || 0), 0).toFixed(1)),
      saturatedFat: Number(actualItems.reduce((acc, i) => acc + (i.saturatedFat || 0), 0).toFixed(1)),
      sodium: actualItems.reduce((acc, i) => acc + (i.sodium || 0), 0),
      cholesterol: actualItems.reduce((acc, i) => acc + (i.cholesterol || 0), 0),
      potassium: actualItems.reduce((acc, i) => acc + (i.potassium || 0), 0),
      calcium: actualItems.reduce((acc, i) => acc + (i.calcium || 0), 0),
      iron: Number(actualItems.reduce((acc, i) => acc + (i.iron || 0), 0).toFixed(1)),
    };

    // Update serverless edge cache / database daily nutrient ledger
    const updatedLedger = await updateDailyLedgerConsumed(userId, date, consumedTotals);

    res.status(200).json({
      success: true,
      mealType,
      title,
      leftoverPercent: clampedLeftover,
      overallLeftoverPercent: clampedLeftover,
      consumedRatio,
      consumptionRatio: consumedRatio,
      actualItems,
      totals: consumedTotals,
      totalNetConsumed: consumedTotals,
      updatedLedger,
      ledger: updatedLedger,
    });
  } catch (err: any) {
    console.error('[/api/v1/calculate-consumption] Error:', err);
    res.status(500).json({
      error: 'Failed to calculate consumed nutrition',
      message: err.message,
    });
  }
}
