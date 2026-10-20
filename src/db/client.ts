import 'dotenv/config';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { Redis } from '@upstash/redis';
import * as schema from './schema';
import { CLINICAL_RULES_SEED } from '../data/clinicalRulesSeed';
import { INDIAN_FOOD_DATABASE } from '../data/indianFoodDb';
import { FOOD_DATABASE } from '../data/nutritionDb';
import { ClinicalSuitabilityRule, DailyNutrientLedger, NutrientVector12 } from '../types';

// ================= DATABASE CLIENT =================
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

if (databaseUrl && !databaseUrl.includes('placeholder')) {
  try {
    const sql: NeonQueryFunction<boolean, boolean> = neon(databaseUrl);
    dbInstance = drizzle(sql, { schema });
  } catch (err) {
    console.warn('[DB] Failed to initialize Neon database, using in-memory adapter:', err);
  }
}

export const db = dbInstance;

// ================= REDIS / FAST CACHE CLIENT =================
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisInstance: Redis | null = null;
if (redisUrl && redisToken && !redisUrl.includes('placeholder')) {
  try {
    redisInstance = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (err) {
    console.warn('[Redis] Failed to initialize Upstash Redis, using in-memory adapter:', err);
  }
}

export const redis = redisInstance;

// ================= IN-MEMORY WARM FALLBACK LAYER =================
const IN_MEMORY_CACHE = new Map<string, { value: any; expiresAt?: number }>();
const IN_MEMORY_LEDGERS = new Map<string, DailyNutrientLedger>();

export const edgeCache = {
  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      try {
        return await redis.get<T>(key);
      } catch (e) {
        console.warn(`[EdgeCache] Redis get error on ${key}, falling back to memory:`, e);
      }
    }
    const item = IN_MEMORY_CACHE.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      IN_MEMORY_CACHE.delete(key);
      return null;
    }
    return item.value as T;
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (redis) {
      try {
        if (ttlSeconds) {
          await redis.set(key, value, { ex: ttlSeconds });
        } else {
          await redis.set(key, value);
        }
        return;
      } catch (e) {
        console.warn(`[EdgeCache] Redis set error on ${key}, falling back to memory:`, e);
      }
    }
    IN_MEMORY_CACHE.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },

  async del(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key);
        return;
      } catch (e) {
        console.warn(`[EdgeCache] Redis del error on ${key}:`, e);
      }
    }
    IN_MEMORY_CACHE.delete(key);
  },
};

/**
 * Retrieves the active 504 clinical rules.
 * Uses Upstash Redis edge cache with <5ms lookup, falling back to compiled TS seed.
 */
export async function getActiveClinicalRules(): Promise<ClinicalSuitabilityRule[]> {
  const cacheKey = 'rules:active_504';
  const cached = await edgeCache.get<ClinicalSuitabilityRule[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length === 504) {
    return cached;
  }

  // If not cached, cache the seed rules
  await edgeCache.set(cacheKey, CLINICAL_RULES_SEED, 86400); // 24 hours
  return CLINICAL_RULES_SEED;
}

/**
 * Retrieves or creates a daily nutrient ledger for a user on a given date.
 */
export async function getOrCreateDailyLedger(
  userId: string,
  dateString: string
): Promise<DailyNutrientLedger> {
  const key = `ledger:${userId}:${dateString}`;
  const cached = await edgeCache.get<DailyNutrientLedger>(key);
  if (cached) return cached;

  const inMem = IN_MEMORY_LEDGERS.get(key);
  if (inMem) return inMem;

  const emptyLedger: DailyNutrientLedger = {
    userId,
    date: dateString,
    activeCaloriesBurned: 0,
    consumed: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      totalFat: 0,
      saturatedFat: 0,
      sodium: 0,
      cholesterol: 0,
      potassium: 0,
      calcium: 0,
      iron: 0,
    },
    remaining: {},
    gap: {},
  };

  await edgeCache.set(key, emptyLedger, 86400);
  IN_MEMORY_LEDGERS.set(key, emptyLedger);
  return emptyLedger;
}

/**
 * Commits a meal's consumed nutrients into the user's daily ledger.
 */
export async function updateDailyLedgerConsumed(
  userId: string,
  dateString: string,
  consumedDelta: Partial<NutrientVector12>
): Promise<DailyNutrientLedger> {
  const ledger = await getOrCreateDailyLedger(userId, dateString);

  for (const [k, v] of Object.entries(consumedDelta)) {
    const key = k as keyof NutrientVector12;
    if (typeof v === 'number' && !isNaN(v)) {
      ledger.consumed[key] = Number(((ledger.consumed[key] || 0) + v).toFixed(1));
    }
  }

  const cacheKey = `ledger:${userId}:${dateString}`;
  await edgeCache.set(cacheKey, ledger, 86400);
  IN_MEMORY_LEDGERS.set(cacheKey, ledger);

  return ledger;
}
