import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Check if we're in a CI/CD build environment (env vars not available at build time)
const isBuildTime =
  !!process.env.CI || // Standard CI flag
  !!process.env.GOOGLE_CLOUD_PROJECT || // Google Cloud Build
  !!process.env.K_SERVICE || // Cloud Run (shouldn't happen at build, but safety check)
  process.env.npm_lifecycle_event === "build"; // npm run build

export const env = createEnv({
  // Skip validation during CI/CD builds (env vars are set at runtime, not build time)
  skipValidation: isBuildTime,
  server: {
    // Drizzle
    DATABASE_URL: z.string().url(),

    // Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // ADK
    ADK_URL: z.string().url(),

    // Google AI - for Gemini 2.5 Pro
    GEMINI_API_KEY: z.string().min(1),

    // Google Cloud - optional, only needed when ADK_URL points to googleapis.com
    GOOGLE_SERVICE_ACCOUNT_KEY_BASE64: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // Agent Engine detection for client-side polling interval adjustment
    NEXT_PUBLIC_IS_AGENT_ENGINE: z
      .string()
      .transform((val) => val === "true")
      .default("false"),
  },
  runtimeEnv: {
    // Server variables
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_SERVICE_ACCOUNT_KEY_BASE64:
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64,
    ADK_URL: process.env.ADK_URL,

    // Client variables
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_IS_AGENT_ENGINE: process.env.NEXT_PUBLIC_IS_AGENT_ENGINE,
  },
});
