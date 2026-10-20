import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  role: varchar('role', { length: 32 }).default('CONSUMER').notNull(), // 'CONSUMER' | 'CLINICIAN' | 'ADMIN'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. User Clinical Profiles Table
export const userClinicalProfiles = pgTable('user_clinical_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 120 }).notNull(),
  age: smallint('age').notNull(),
  gender: varchar('gender', { length: 16 }).notNull(), // 'male' | 'female' | 'other'
  heightCm: numeric('height_cm', { precision: 5, scale: 2 }).notNull(),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
  bmi: numeric('bmi', { precision: 4, scale: 1 }).notNull(),
  activityLevel: varchar('activity_level', { length: 24 }).notNull(), // 'sedentary' | 'light' | 'moderate' | 'very_active'
  sleepHours: numeric('sleep_hours', { precision: 3, scale: 1 }).default('7.0'),
  dietaryPreference: varchar('dietary_preference', { length: 32 }).default('any').notNull(),
  preferredCuisine: varchar('preferred_cuisine', { length: 32 }).default('indian').notNull(),
  cuisineRegion: varchar('cuisine_region', { length: 64 }).default('South Indian'),

  // Active 42-variant condition codes array (stored as JSON array of strings for edge compatibility)
  activeConditionVariants: jsonb('active_condition_variants').default([]).notNull(),

  // Lab & Vital Measurements
  systolicBp: smallint('systolic_bp'),
  diastolicBp: smallint('diastolic_bp'),
  fastingBloodSugarMgDl: numeric('fasting_blood_sugar_mg_dl', { precision: 5, scale: 1 }),
  hba1cPercent: numeric('hba1c_percent', { precision: 4, scale: 2 }),
  egfrMlMin: numeric('egfr_ml_min', { precision: 5, scale: 1 }),
  ldlCholesterolMgDl: numeric('ldl_cholesterol_mg_dl', { precision: 5, scale: 1 }),
  totalCholesterolMgDl: numeric('total_cholesterol_mg_dl', { precision: 5, scale: 1 }),
  hemoglobinGDl: numeric('hemoglobin_g_dl', { precision: 4, scale: 1 }),
  trimester: smallint('trimester'),

  // Computed Daily 12-Nutrient Targets
  targetCalories: numeric('target_calories', { precision: 6, scale: 1 }).notNull(),
  targetProteinG: numeric('target_protein_g', { precision: 5, scale: 1 }).notNull(),
  targetCarbsG: numeric('target_carbs_g', { precision: 5, scale: 1 }).notNull(),
  targetFiberG: numeric('target_fiber_g', { precision: 5, scale: 1 }).notNull(),
  targetSugarG: numeric('target_sugar_g', { precision: 5, scale: 1 }).notNull(),
  targetFatG: numeric('target_fat_g', { precision: 5, scale: 1 }).notNull(),
  targetSatFatG: numeric('target_sat_fat_g', { precision: 5, scale: 1 }).notNull(),
  targetSodiumMg: numeric('target_sodium_mg', { precision: 6, scale: 1 }).notNull(),
  targetCholesterolMg: numeric('target_cholesterol_mg', { precision: 5, scale: 1 }).notNull(),
  targetPotassiumMg: numeric('target_potassium_mg', { precision: 6, scale: 1 }).notNull(),
  targetCalciumMg: numeric('target_calcium_mg', { precision: 6, scale: 1 }).notNull(),
  targetIronMg: numeric('target_iron_mg', { precision: 5, scale: 1 }).notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Food Catalog Table
export const foodCatalog = pgTable('food_catalog', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  regionalNames: jsonb('regional_names').default([]).notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  cuisineRegion: varchar('cuisine_region', { length: 64 }).notNull(),
  isIndian: boolean('is_indian').default(false).notNull(),
  dietTags: jsonb('diet_tags').default([]).notNull(),
  servingDescription: varchar('serving_description', { length: 120 }).notNull(),
  defaultServingGrams: numeric('default_serving_grams', { precision: 6, scale: 1 }).default('100.0').notNull(),

  // Complete 12-Nutrient Profile
  caloriesKcal: numeric('calories_kcal', { precision: 6, scale: 1 }).notNull(),
  proteinG: numeric('protein_g', { precision: 5, scale: 2 }).notNull(),
  carbsG: numeric('carbs_g', { precision: 5, scale: 2 }).notNull(),
  fiberG: numeric('fiber_g', { precision: 5, scale: 2 }).notNull(),
  sugarG: numeric('sugar_g', { precision: 5, scale: 2 }).notNull(),
  totalFatG: numeric('total_fat_g', { precision: 5, scale: 2 }).notNull(),
  saturatedFatG: numeric('saturated_fat_g', { precision: 5, scale: 2 }).notNull(),
  sodiumMg: numeric('sodium_mg', { precision: 6, scale: 1 }).notNull(),
  cholesterolMg: numeric('cholesterol_mg', { precision: 6, scale: 1 }).notNull(),
  potassiumMg: numeric('potassium_mg', { precision: 6, scale: 1 }).notNull(),
  calciumMg: numeric('calcium_mg', { precision: 6, scale: 1 }).notNull(),
  ironMg: numeric('iron_mg', { precision: 5, scale: 2 }).notNull(),

  glycemicIndexBand: varchar('glycemic_index_band', { length: 16 }),
  glycemicIndexValue: smallint('glycemic_index_value'),

  dataSource: varchar('data_source', { length: 64 }).notNull(), // 'USDA_FDC' | 'IFCT_2017' | 'PROTOTYPE_SYNTHETIC'
  sourceCitationId: varchar('source_citation_id', { length: 128 }),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Clinical Suitability Rules Table (504 Rules)
export const clinicalSuitabilityRules = pgTable('clinical_suitability_rules', {
  ruleId: varchar('rule_id', { length: 96 }).primaryKey(), // e.g. 'CKD_STAGE_3B__POTASSIUM'
  conditionFamily: varchar('condition_family', { length: 64 }).notNull(),
  conditionVariant: varchar('condition_variant', { length: 64 }).notNull(),
  severityMultiplier: numeric('severity_multiplier', { precision: 4, scale: 2 }).default('1.00').notNull(),
  nutrientName: varchar('nutrient_name', { length: 32 }).notNull(),
  nutrientUnit: varchar('nutrient_unit', { length: 16 }).notNull(),
  ruleDirection: varchar('rule_direction', { length: 16 }).notNull(), // 'LIMITING' | 'BENEFICIAL'
  normalizedWeight: numeric('normalized_weight', { precision: 5, scale: 4 }).notNull(),

  safeThreshold: numeric('safe_threshold', { precision: 8, scale: 2 }),
  warningThreshold: numeric('warning_threshold', { precision: 8, scale: 2 }),
  dangerThreshold: numeric('danger_threshold', { precision: 8, scale: 2 }),
  requiredTarget: numeric('required_target', { precision: 8, scale: 2 }),
  dailyGuidelineReference: numeric('daily_guideline_reference', { precision: 8, scale: 2 }),

  sourceBasis: varchar('source_basis', { length: 32 }).notNull(), // 'CLINICALLY_CITED' | 'CLINICAL_ESTIMATE'
  guidelineOrganization: varchar('guideline_organization', { length: 64 }),
  guidelineCitationText: text('guideline_citation_text'),
  approvalStatus: varchar('approval_status', { length: 32 }).default('ESTIMATE_PENDING_REVIEW').notNull(),
  reviewedByClinicianId: uuid('reviewed_by_clinician_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  ruleVersion: integer('rule_version').default(1).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Clinical Rule Audit Log Table
export const clinicalRuleAuditLog = pgTable('clinical_rule_audit_log', {
  auditId: uuid('audit_id').defaultRandom().primaryKey(),
  ruleId: varchar('rule_id', { length: 96 })
    .references(() => clinicalSuitabilityRules.ruleId)
    .notNull(),
  changedByUserId: uuid('changed_by_user_id')
    .references(() => users.id)
    .notNull(),
  previousSnapshot: jsonb('previous_snapshot').notNull(),
  newSnapshot: jsonb('new_snapshot').notNull(),
  changeReason: text('change_reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Daily Nutrient Ledgers Table
export const dailyNutrientLedgers = pgTable(
  'daily_nutrient_ledgers',
  {
    ledgerId: uuid('ledger_id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    logDate: date('log_date').notNull(),
    activeCaloriesBurned: numeric('active_calories_burned', { precision: 6, scale: 1 }).default('0').notNull(),

    // Consumed 12 Nutrients
    consumedCalories: numeric('consumed_calories', { precision: 6, scale: 1 }).default('0').notNull(),
    consumedProteinG: numeric('consumed_protein_g', { precision: 5, scale: 1 }).default('0').notNull(),
    consumedCarbsG: numeric('consumed_carbs_g', { precision: 5, scale: 1 }).default('0').notNull(),
    consumedFiberG: numeric('consumed_fiber_g', { precision: 5, scale: 1 }).default('0').notNull(),
    consumedSugarG: numeric('consumed_sugar_g', { precision: 5, scale: 1 }).default('0').notNull(),
    consumedFatG: numeric('consumed_fat_g', { precision: 5, scale: 1 }).default('0').notNull(),
    consumedSatFatG: numeric('consumed_sat_fat_g', { precision: 5, scale: 1 }).default('0').notNull(),
    consumedSodiumMg: numeric('consumed_sodium_mg', { precision: 6, scale: 1 }).default('0').notNull(),
    consumedCholesterolMg: numeric('consumed_cholesterol_mg', { precision: 6, scale: 1 }).default('0').notNull(),
    consumedPotassiumMg: numeric('consumed_potassium_mg', { precision: 6, scale: 1 }).default('0').notNull(),
    consumedCalciumMg: numeric('consumed_calcium_mg', { precision: 6, scale: 1 }).default('0').notNull(),
    consumedIronMg: numeric('consumed_iron_mg', { precision: 5, scale: 1 }).default('0').notNull(),
  },
  table => [uniqueIndex('user_log_date_idx').on(table.userId, table.logDate)]
);

// 7. Meal Logs Table
export const mealLogs = pgTable('meal_logs', {
  mealId: uuid('meal_id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ledgerId: uuid('ledger_id')
    .references(() => dailyNutrientLedgers.ledgerId, { onDelete: 'cascade' })
    .notNull(),
  loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow().notNull(),
  mealType: varchar('meal_type', { length: 24 }).notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  leftoverPercent: numeric('leftover_percent', { precision: 4, scale: 1 }).default('0').notNull(),
  itemsJson: jsonb('items_json').notNull(), // Array of LoggedFoodItem with XAI score snapshots
  ruleSetVersionHash: varchar('rule_set_version_hash', { length: 64 }).notNull(),
  mlModelVersion: varchar('ml_model_version', { length: 32 }).notNull(),
});
