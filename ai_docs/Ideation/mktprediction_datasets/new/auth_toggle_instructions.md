# Authentication Toggle Instructions

> **Purpose:** Step-by-step guide to disable authentication for testing, then re-enable it for production.
> **Scope:** 4 code files + 1 database change
> **Search Pattern:** All auth-disabled code uses `// AUTH DISABLED -` comment prefix

---

## Table of Contents
1. [Part A: Disable Authentication](#part-a-disable-authentication)
2. [Part B: Re-Enable Authentication](#part-b-re-enable-authentication)
3. [Database SQL Reference](#database-sql-reference)
4. [Verification Checklist](#verification-checklist)
5. [Files Summary](#files-summary)
6. [Quick Commands](#quick-commands)

---

## Part A: Disable Authentication

Follow these 6 steps **in order** to bypass login and allow direct access to the app.

---

### Step A1: Database - Insert Anonymous User

**Location:** Supabase Dashboard > SQL Editor (https://supabase.com/dashboard)

**Run this SQL:**

```sql
-- Insert anonymous user for no-auth mode
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'anonymous@demo.local',
  'Demo User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Verify insert
SELECT * FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

**Expected Result:** One row with the anonymous user should appear.

---

### Step A2: Update Auth Helpers

**File:** `apps/web/lib/auth.ts`

**REPLACE THE ENTIRE FILE with this content:**

```typescript
import { type User } from "@/lib/drizzle/schema";

// AUTH DISABLED - Anonymous user constants for no-auth mode
// To re-enable auth: remove these constants and uncomment original function bodies
export const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";

// IMPORTANT: Use a fixed date to prevent React hydration errors
// (server and client must render the same initial value)
const FIXED_DATE = new Date("2024-01-01T00:00:00.000Z");

export const ANONYMOUS_USER: User = {
  id: ANONYMOUS_USER_ID,
  email: "anonymous@demo.local",
  full_name: "Demo User",
  created_at: FIXED_DATE,
  updated_at: FIXED_DATE,
};

// AUTH DISABLED - Original imports (uncomment to re-enable)
// import { createClient } from "@/lib/supabase/server";
// import { db } from "@/lib/drizzle/db";
// import { users } from "@/lib/drizzle/schema";
// import { eq } from "drizzle-orm";
// import { redirect } from "next/navigation";

/**
 * Get the current authenticated user
 * Auto-creates user in local database if they exist in Supabase Auth but not locally
 * (handles Google OAuth first-time login)
 * @returns Promise<{user: User} | null>
 */
export async function getCurrentUserWithRole(): Promise<{
  user: User;
} | null> {
  // AUTH DISABLED - Return anonymous user
  return { user: ANONYMOUS_USER };

  // AUTH DISABLED - Original implementation commented below
  // try {
  //   const supabase = await createClient();
  //   const {
  //     data: { user: authUser },
  //     error: authError,
  //   } = await supabase.auth.getUser();
  //
  //   if (authError || !authUser) {
  //     return null;
  //   }
  //
  //   // Get user data from our database
  //   let userData = await db
  //     .select()
  //     .from(users)
  //     .where(eq(users.id, authUser.id))
  //     .limit(1);
  //
  //   // If user doesn't exist in our database, create them (first-time OAuth login)
  //   if (userData.length === 0) {
  //     const newUser = await db
  //       .insert(users)
  //       .values({
  //         id: authUser.id,
  //         email: authUser.email || "",
  //         full_name:
  //           authUser.user_metadata?.full_name ||
  //           authUser.user_metadata?.name ||
  //           null,
  //       })
  //       .returning();
  //
  //     if (newUser.length === 0) {
  //       console.error("Failed to create user in local database");
  //       return null;
  //     }
  //
  //     userData = newUser;
  //   }
  //
  //   return { user: userData[0] };
  // } catch (error) {
  //   console.error("Error getting current user:", error);
  //   return null;
  // }
}

/**
 * Get current user ID - optimized for performance
 * Use when you only need user identification
 * @returns Promise<string | null> - Returns the user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  // AUTH DISABLED - Return anonymous user ID
  return ANONYMOUS_USER_ID;

  // AUTH DISABLED - Original implementation commented below
  // try {
  //   const supabase = await createClient();
  //   const {
  //     data: { user },
  //     error,
  //   } = await supabase.auth.getUser();
  //
  //   if (error || !user) {
  //     return null;
  //   }
  //
  //   return user.id;
  // } catch (error) {
  //   console.error("Error in getCurrentUserId:", error);
  //   return null;
  // }
}

/**
 * Require user ID - optimized for most common use case
 * Use this for most common authentication use case - getting the user ID
 * @returns Promise<string> - Returns the user ID
 */
export async function requireUserId(): Promise<string> {
  // AUTH DISABLED - Return anonymous user ID (no redirect)
  return ANONYMOUS_USER_ID;

  // AUTH DISABLED - Original implementation commented below
  // const userId = await getCurrentUserId();
  //
  // if (!userId) {
  //   redirect("/auth/login");
  // }
  //
  // return userId;
}
```

---

### Step A3: Update Middleware

**File:** `apps/web/lib/supabase/middleware.ts`

**Find this block (around lines 70-75):**

```typescript
if (!user && !isPublicRoute) {
  // no user, potentially respond by redirecting the user to the login page
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  return NextResponse.redirect(url);
}
```

**REPLACE with:**

```typescript
// AUTH DISABLED - Uncomment to re-enable authentication redirect
// if (!user && !isPublicRoute) {
//   // no user, potentially respond by redirecting the user to the login page
//   const url = request.nextUrl.clone();
//   url.pathname = "/auth/login";
//   return NextResponse.redirect(url);
// }
```

---

### Step A4: Update Landing Page

**File:** `apps/web/app/(public)/page.tsx`

**REPLACE THE ENTIRE FILE with this content:**

```typescript
import { redirect } from "next/navigation";

// AUTH DISABLED - Auto-redirect to dashboard
// To restore: see ai_docs/Ideation/mktprediction_datasets/new/auth_toggle_instructions.md Part B
export default function HomePage() {
  redirect("/dashboard");
}

// AUTH DISABLED - Original landing page (uncomment to restore)
// import HeroSection from "@/components/landing/HeroSection";
// import FeaturesSection from "@/components/landing/FeaturesSection";
// import ProblemSection from "@/components/landing/ProblemSection";
// import DemoSection from "@/components/landing/DemoSection";
// import FAQSection from "@/components/landing/FAQSection";
// import CTASection from "@/components/landing/CTASection";
//
// export default function HomePage() {
//   return (
//     <>
//       <HeroSection />
//       <FeaturesSection />
//       <ProblemSection />
//       <DemoSection />
//       <FAQSection />
//       <CTASection />
//     </>
//   );
// }
```

---

### Step A5: Update Dashboard Page

**File:** `apps/web/app/(protected)/dashboard/page.tsx`

**Find these lines at the TOP of the file:**

```typescript
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
```

**REPLACE with:**

```typescript
import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard";

// AUTH DISABLED - Original imports (uncomment to re-enable)
// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  // AUTH DISABLED - Uncomment to re-enable authentication check
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();
  //
  // if (!user) {
  //   redirect("/login");
  // }

  return (
```

**Note:** Keep the rest of the file (the JSX return statement) unchanged.

---

### Step A6: Run Type Check & Restart Server

```bash
cd apps/web
npm run type-check
```

**Expected Result:** No errors.

Then restart your dev server:

```bash
npm run dev
```

**Test:** Open `http://localhost:3000` in an incognito browser - should redirect directly to dashboard.

---

## Part B: Re-Enable Authentication

Follow these 6 steps **in order** to restore full authentication.

---

### Step B1: Restore Auth Helpers

**File:** `apps/web/lib/auth.ts`

**REPLACE THE ENTIRE FILE with this content:**

```typescript
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import { users, type User } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user
 * Auto-creates user in local database if they exist in Supabase Auth but not locally
 * (handles Google OAuth first-time login)
 * @returns Promise<{user: User} | null>
 */
export async function getCurrentUserWithRole(): Promise<{
  user: User;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Get user data from our database
    let userData = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    // If user doesn't exist in our database, create them (first-time OAuth login)
    if (userData.length === 0) {
      const newUser = await db
        .insert(users)
        .values({
          id: authUser.id,
          email: authUser.email || "",
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            null,
        })
        .returning();

      if (newUser.length === 0) {
        console.error("Failed to create user in local database");
        return null;
      }

      userData = newUser;
    }

    return { user: userData[0] };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get current user ID - optimized for performance
 * Use when you only need user identification
 * @returns Promise<string | null> - Returns the user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("Error in getCurrentUserId:", error);
    return null;
  }
}

/**
 * Require user ID - optimized for most common use case
 * Use this for most common authentication use case - getting the user ID
 * @returns Promise<string> - Returns the user ID
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return userId;
}
```

---

### Step B2: Restore Middleware

**File:** `apps/web/lib/supabase/middleware.ts`

**Find this block:**

```typescript
// AUTH DISABLED - Uncomment to re-enable authentication redirect
// if (!user && !isPublicRoute) {
//   // no user, potentially respond by redirecting the user to the login page
//   const url = request.nextUrl.clone();
//   url.pathname = "/auth/login";
//   return NextResponse.redirect(url);
// }
```

**REPLACE with:**

```typescript
if (!user && !isPublicRoute) {
  // no user, potentially respond by redirecting the user to the login page
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  return NextResponse.redirect(url);
}
```

---

### Step B3: Restore Landing Page

**File:** `apps/web/app/(public)/page.tsx`

**REPLACE THE ENTIRE FILE with this content:**

```typescript
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ProblemSection from "@/components/landing/ProblemSection";
import DemoSection from "@/components/landing/DemoSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ProblemSection />
      <DemoSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
```

---

### Step B4: Restore Dashboard Page

**File:** `apps/web/app/(protected)/dashboard/page.tsx`

**Find these lines at the TOP of the file:**

```typescript
import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard";

// AUTH DISABLED - Original imports (uncomment to re-enable)
// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  // AUTH DISABLED - Uncomment to re-enable authentication check
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();
  //
  // if (!user) {
  //   redirect("/login");
  // }

  return (
```

**REPLACE with:**

```typescript
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
```

**Note:** Keep the rest of the file (the JSX return statement) unchanged.

---

### Step B5: Run Type Check & Restart Server

```bash
cd apps/web
npm run type-check
```

**Expected Result:** No errors.

Then restart your dev server:

```bash
npm run dev
```

---

### Step B6: Database Cleanup (Optional)

If you want to remove the anonymous user and all their data:

**Location:** Supabase Dashboard > SQL Editor

```sql
-- WARNING: This deletes all preferences/sessions saved to anonymous user
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

---

## Database SQL Reference

### Insert Anonymous User
```sql
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'anonymous@demo.local',
  'Demo User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
```

### Delete Anonymous User
```sql
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

### Check Anonymous User Exists
```sql
SELECT * FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

---

## Verification Checklist

### After Disabling Auth (Part A)
- [ ] Anonymous user exists in database (run SELECT query)
- [ ] Type check passes (`npm run type-check`)
- [ ] Dev server restarted
- [ ] Visit `http://localhost:3000` in incognito browser
- [ ] Should redirect directly to `/dashboard`
- [ ] Dashboard loads without login prompt
- [ ] No console errors related to authentication

### After Re-Enabling Auth (Part B)
- [ ] Type check passes (`npm run type-check`)
- [ ] Dev server restarted
- [ ] Visit `http://localhost:3000` in incognito browser
- [ ] Should show landing page
- [ ] Click login - should redirect to Google OAuth
- [ ] After login - should access dashboard
- [ ] Logout works correctly

---

## Files Summary

| # | File | Disable Auth (Part A) | Re-Enable Auth (Part B) |
|---|------|----------------------|------------------------|
| 1 | `apps/web/lib/auth.ts` | Return anonymous user | Restore Supabase auth |
| 2 | `apps/web/lib/supabase/middleware.ts` | Comment out redirect block | Uncomment redirect block |
| 3 | `apps/web/app/(public)/page.tsx` | Redirect to `/dashboard` | Restore landing page components |
| 4 | `apps/web/app/(protected)/dashboard/page.tsx` | Comment out auth check | Restore auth check |
| 5 | Database (Supabase) | Insert anonymous user | Delete anonymous user (optional) |

---

## Quick Commands

### Find all auth-disabled code:
```bash
grep -r "AUTH DISABLED" apps/web/
```

### Type check:
```bash
cd apps/web && npm run type-check
```

### Clear Next.js cache (if issues):
```bash
cd apps/web && rm -rf .next && npm run dev
```

---

## Troubleshooting

### React Hydration Errors

If you see errors like "Text content did not match" or "Hydration failed":

1. **Time-based values**: Any `new Date()` or `toLocaleTimeString()` will differ between server and client. Solutions:
   - Use a fixed date for static values (like `FIXED_DATE` above)
   - Add `suppressHydrationWarning` prop to elements with dynamic timestamps:
     ```tsx
     <span suppressHydrationWarning>
       Updated: {lastUpdated.toLocaleTimeString()}
     </span>
     ```

2. **Already fixed in**:
   - `apps/web/components/volatility/VolatilityDashboard.tsx` (line 114)
   - `apps/web/components/volatility/ForecastTable.tsx` (line 80)
   - `apps/web/components/volatility/AlertsPanel.tsx` (line 93)

### BigQuery Authentication Errors

If you see "Request had insufficient authentication scopes" or quota errors:

1. Ensure quota project is set:
   ```bash
   gcloud auth application-default set-quota-project ccibt-hack25ww7-736
   ```

2. Verify ADC credentials:
   ```bash
   gcloud auth application-default login
   ```

3. Check environment variables in `apps/web/.env.local`:
   ```
   GOOGLE_CLOUD_PROJECT="ccibt-hack25ww7-736"
   BIGQUERY_DATASET="market_volatility"
   ```
