import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "./users";

// Signal profile types for Market Signal Intelligence
export type SignalProfile = "quant" | "fundamental" | "news" | "balanced" | string;

// Custom profile weights structure
export interface CustomProfileWeights {
  market: number;
  news: number;
  speech: number;
}

// Custom profile structure
export interface CustomProfile {
  id: string;
  name: string;
  weights: CustomProfileWeights;
}

// User Preferences table - stores signal weighting profiles and watched tickers
export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    // Signal weighting profile: 'quant', 'fundamental', 'news', 'balanced'
    signal_profile: text("signal_profile").default("balanced").notNull(),

    // Watched tickers as JSON array: ["TSLA", "AAPL", "NVDA"]
    watched_tickers: jsonb("watched_tickers").default([]).notNull(),

    // Custom profiles as JSON array: [{id, name, weights: {market, news, speech}}]
    custom_profiles: jsonb("custom_profiles").default([]).notNull(),

    // Metadata
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Index for efficient preference lookups by user
    index("user_preferences_user_id_idx").on(t.user_id),
  ]
);

// Zod validation schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const selectUserPreferencesSchema = createSelectSchema(userPreferences);

// Update schema - useful for PATCH requests
export const updateUserPreferencesSchema =
  insertUserPreferencesSchema.partial();

// TypeScript types
export type UserPreferences = InferSelectModel<typeof userPreferences>;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
export type UpdateUserPreferences = Partial<UserPreferences>;

// User preferences creation type (for API requests)
export type CreateUserPreferencesData = {
  signal_profile?: SignalProfile;
  watched_tickers?: string[];
  custom_profiles?: CustomProfile[];
};

// Signal profile definitions
export const SIGNAL_PROFILES = {
  quant: {
    name: "Quant Trader",
    description: "Price action focused",
    weights: { market: 0.6, news: 0.3, speech: 0.1 },
  },
  fundamental: {
    name: "Fundamental Analyst",
    description: "Earnings call insights first",
    weights: { market: 0.3, news: 0.2, speech: 0.5 },
  },
  news: {
    name: "News/Sentiment Trader",
    description: "Media sentiment driven",
    weights: { market: 0.2, news: 0.5, speech: 0.3 },
  },
  balanced: {
    name: "Balanced",
    description: "Equal weight all signals",
    weights: { market: 0.33, news: 0.33, speech: 0.34 },
  },
} as const;
