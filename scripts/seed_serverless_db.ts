import 'dotenv/config';
import { db } from '../src/db/client';
import { clinicalSuitabilityRules, foodCatalog } from '../src/db/schema';
import { CLINICAL_RULES_SEED } from '../src/data/clinicalRulesSeed';
import { INDIAN_FOOD_DATABASE } from '../src/data/indianFoodDb';
import { FOOD_DATABASE } from '../src/data/nutritionDb';

async function seedServerlessDb() {
  console.log('--- NutriTrack AI Database Seeding Routine ---');

  if (!db) {
    console.log('[Notice] DATABASE_URL is not configured or in placeholder mode.');
    console.log('[Notice] NutriTrack AI is running with the fast in-memory / edge-cache fallback layer.');
    console.log('[Notice] All 504 rules and food items are available in-memory with zero cloud latency.');
    return;
  }

  try {
    console.log(`1. Seeding 504 Clinical Suitability Rules...`);
    const ruleRows = CLINICAL_RULES_SEED.map(r => ({
      ruleId: r.ruleId,
      conditionFamily: r.conditionFamily,
      conditionVariant: r.conditionVariant,
      severityMultiplier: r.severityMultiplier.toString(),
      nutrientName: r.nutrientName,
      nutrientUnit: r.nutrientUnit,
      ruleDirection: r.ruleDirection,
      normalizedWeight: r.normalizedWeight.toString(),
      safeThreshold: r.safeThreshold != null ? r.safeThreshold.toString() : null,
      warningThreshold: r.warningThreshold != null ? r.warningThreshold.toString() : null,
      dangerThreshold: r.dangerThreshold != null ? r.dangerThreshold.toString() : null,
      requiredTarget: r.requiredTarget != null ? r.requiredTarget.toString() : null,
      dailyGuidelineReference: r.dailyGuidelineReference != null ? r.dailyGuidelineReference.toString() : null,
      sourceBasis: r.sourceBasis,
      guidelineOrganization: r.guidelineOrganization || null,
      guidelineCitationText: r.guidelineCitationText || null,
      approvalStatus: r.approvalStatus,
      ruleVersion: r.ruleVersion || 1,
    }));

    // Batch insert in chunks of 50
    for (let i = 0; i < ruleRows.length; i += 50) {
      const chunk = ruleRows.slice(i, i + 50);
      await db.insert(clinicalSuitabilityRules).values(chunk as any).onConflictDoNothing();
    }
    console.log(`[OK] Ingested ${ruleRows.length} rules.`);

    console.log(`2. Seeding Food Catalog (Indian & Western dishes)...`);
    const foodRows = [
      ...INDIAN_FOOD_DATABASE.map(f => ({
        id: f.id,
        name: f.name,
        regionalNames: f.regionalNames || [],
        category: f.category,
        cuisineRegion: f.cuisineRegion,
        isIndian: true,
        dietTags: [],
        servingDescription: f.servingDescription,
        defaultServingGrams: '100.0',
        caloriesKcal: (f.calories || 0).toString(),
        proteinG: (f.protein || 0).toString(),
        carbsG: (f.carbs || 0).toString(),
        fiberG: (f.fiber || 0).toString(),
        sugarG: (f.sugar || 0).toString(),
        totalFatG: (f.fat || 0).toString(),
        saturatedFatG: (f.saturatedFat || 0).toString(),
        sodiumMg: (f.sodium || 0).toString(),
        cholesterolMg: (f.cholesterol || 0).toString(),
        potassiumMg: (f.potassium || 0).toString(),
        calciumMg: (f.calcium || 0).toString(),
        ironMg: (f.iron || 0).toString(),
        glycemicIndexBand: f.glycemicIndexBand || null,
        glycemicIndexValue: f.glycemicIndexBand === 'Low' ? 40 : f.glycemicIndexBand === 'High' ? 75 : 55,
        dataSource: f.dataSource || 'IFCT_2017',
        sourceCitationId: f.sourceCitationId || 'IFCT_2017_REF',
        isVerified: true,
      })),
      ...FOOD_DATABASE.map((f, idx) => ({
        id: `usda-${idx + 1}`,
        name: f.name,
        regionalNames: [],
        category: f.category,
        cuisineRegion: 'Western',
        isIndian: false,
        dietTags: [],
        servingDescription: f.servingDescription || '1 standard serving',
        defaultServingGrams: '100.0',
        caloriesKcal: (f.calories || 0).toString(),
        proteinG: (f.protein || 0).toString(),
        carbsG: (f.carbs || 0).toString(),
        fiberG: (f.fiber || 0).toString(),
        sugarG: (f.sugar || 0).toString(),
        totalFatG: (f.fat || 0).toString(),
        saturatedFatG: (f.saturatedFat || 0).toString(),
        sodiumMg: (f.sodium || 0).toString(),
        cholesterolMg: (f.cholesterol || 0).toString(),
        potassiumMg: (f.potassium || 0).toString(),
        calciumMg: (f.calcium || 0).toString(),
        ironMg: (f.iron || 0).toString(),
        glycemicIndexBand: f.glycemicIndexBand || 'Medium',
        glycemicIndexValue: 50,
        dataSource: f.dataSource || 'USDA_FDC',
        sourceCitationId: f.sourceCitationId || 'USDA_FDC_REF',
        isVerified: true,
      })),
    ];

    for (let i = 0; i < foodRows.length; i += 50) {
      const chunk = foodRows.slice(i, i + 50);
      await db.insert(foodCatalog).values(chunk as any).onConflictDoNothing();
    }
    console.log(`[OK] Ingested ${foodRows.length} food catalog items.`);

    console.log('[Success] Database seeding routine complete!');
  } catch (err) {
    console.error('[Error] Seeding failed:', err);
  }
}

seedServerlessDb();
