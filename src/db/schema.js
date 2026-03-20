import { pgTable, text, numeric, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const pricingPlans = pgTable('pricing_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  price: numeric('price').notNull(),
  currency: text('currency').default('USD'),
  description: text('description'),
  features: jsonb('features'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  plan: text('plan').default('free'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const vitalsHistory = pgTable('vitals_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  bloodPressure: text('blood_pressure'),
  glucose: numeric('glucose'),
  bmi: numeric('bmi'),
  heartRate: numeric('heart_rate'),
  sodium: text('sodium'),
  uricAcid: numeric('uric_acid'),
  notes: text('notes'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
});

export const healthDocuments = pgTable('health_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  filename: text('filename').notNull(),
  fileUrl: text('file_url'),
  extractedData: jsonb('extracted_data'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});

export const nutritionLogs = pgTable('nutrition_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  mealName: text('meal_name'),
  calories: numeric('calories'),
  protein: numeric('protein'),
  carbs: numeric('carbs'),
  fat: numeric('fat'),
  loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow(),
});
