import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { InferSelectModel } from "drizzle-orm";

// Users table - for application user data (references auth.users.id)
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // References auth.users.id from Supabase
  email: text("email").notNull().unique(), // Synced from auth.users
  full_name: text("full_name"),

  // Metadata
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Zod validation schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Update schema - useful for PATCH requests
export const updateUserSchema = insertUserSchema.partial();

// TypeScript types
export type User = InferSelectModel<typeof users>;
export type UpdateUser = Partial<User>;
