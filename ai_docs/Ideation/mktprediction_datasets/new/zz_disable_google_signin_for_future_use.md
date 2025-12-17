# Plan: Disable Authentication (Google Sign-In & All Auth)

> **Purpose:** Remove all user authentication so visitors bypass login and access the app directly.
> **Approach:** Comment out auth code (not delete) so it can be re-enabled later.
> **Estimated Time:** 30-45 minutes
> **Last Updated:** December 2024

---

## Table of Contents
1. [Overview](#overview)
2. [Impact Summary](#impact-summary)
3. [Part 1: Code Changes](#part-1-code-changes)
4. [Part 2: Database Changes](#part-2-database-changes)
5. [Part 3: GCP & Supabase Configuration](#part-3-gcp--supabase-configuration)
6. [Part 4: Complete File List](#part-4-complete-file-list)
7. [Part 5: Verification Checklist](#part-5-verification-checklist)
8. [Part 6: Re-enabling Authentication](#part-6-re-enabling-authentication)
9. [Execution Order](#execution-order)

---

## Overview

### Current Authentication Setup
- **Provider:** Supabase Auth with Google OAuth
- **Flow:** User clicks "Sign in with Google" → Supabase → Google OAuth → Redirect back → Session created
- **Protected Routes:** `/dashboard`, `/chat`, `/history`, `/preferences`, `/profile`
- **Database:** User records synced from Supabase Auth to `users` table

### After This Change
- No login screen - users go directly to the app
- All users share a single "anonymous" user identity
- Features like preferences and chat history still work (saved to anonymous user)
- Auth code remains in codebase (commented out) for future re-enablement

---

## Impact Summary

| Area | Files to Modify | Complexity |
|------|-----------------|------------|
| Middleware (Auth Redirect) | 1 file | Simple |
| Auth Helpers | 1 file | Simple |
| Protected Layout | 1 file | Simple |
| Landing Page & CTAs | 4 files | Simple |
| Sidebar (Logout/Login) | 1 file | Medium |
| Database | 1 SQL statement | Simple |
| GCP/Supabase Config | None | N/A |

**Total: 8 code files + 1 database change**

---

## Part 1: Code Changes

> **Important:** All commented code must use the prefix `// AUTH DISABLED -` for easy search and re-enablement.

---

### Step 1: Middleware - Remove Auth Redirect

**File:** `apps/web/lib/supabase/middleware.ts`

**What to do:** Comment out the redirect logic (around lines 70-75)

**Before:**
```typescript
if (!user && !isPublicRoute) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  return NextResponse.redirect(url);
}
```

**After:**
```typescript
// AUTH DISABLED - Uncomment to re-enable authentication
// if (!user && !isPublicRoute) {
//   const url = request.nextUrl.clone();
//   url.pathname = "/auth/login";
//   return NextResponse.redirect(url);
// }
```

---

### Step 2: Auth Helpers - Return Anonymous User

**File:** `apps/web/lib/auth.ts`

**What to do:** Add anonymous user constants at the top of the file, then modify the three auth functions to return the anonymous user instead of null/redirect.

**Add at the top of the file (after imports):**
```typescript
// AUTH DISABLED - Anonymous user constants for no-auth mode
// To re-enable auth: remove these constants and uncomment original function bodies
export const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";
export const ANONYMOUS_USER: User = {
  id: ANONYMOUS_USER_ID,
  email: "anonymous@demo.local",
  full_name: "Demo User",
  created_at: new Date(),
  updated_at: new Date(),
};
```

**Modify `getCurrentUserWithRole()` function:**
```typescript
export async function getCurrentUserWithRole(): Promise<{ user: User } | null> {
  // AUTH DISABLED - Return anonymous user
  return { user: ANONYMOUS_USER };

  // AUTH DISABLED - Original implementation commented below
  // try {
  //   const supabase = await createClient();
  //   const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  //   ... rest of original code ...
  // }
}
```

**Modify `getCurrentUserId()` function:**
```typescript
export async function getCurrentUserId(): Promise<string | null> {
  // AUTH DISABLED - Return anonymous user ID
  return ANONYMOUS_USER_ID;

  // AUTH DISABLED - Original implementation commented below
  // try {
  //   const supabase = await createClient();
  //   ... rest of original code ...
  // }
}
```

**Modify `requireUserId()` function:**
```typescript
export async function requireUserId(): Promise<string> {
  // AUTH DISABLED - Return anonymous user ID (no redirect)
  return ANONYMOUS_USER_ID;

  // AUTH DISABLED - Original implementation commented below
  // const userId = await getCurrentUserId();
  // if (!userId) {
  //   redirect("/auth/login");
  // }
  // return userId;
}
```

---

### Step 3: Protected Layout - Remove Auth Check

**File:** `apps/web/app/(protected)/layout.tsx`

**What to do:** Comment out the auth check and redirect, use anonymous user instead.

**Before:**
```typescript
const userData = await getCurrentUserWithRole();

if (!userData) {
  redirect("/auth/login");
}
```

**After:**
```typescript
// AUTH DISABLED - Using anonymous user, uncomment below to re-enable auth
// const userData = await getCurrentUserWithRole();
// if (!userData) {
//   redirect("/auth/login");
// }

// AUTH DISABLED - Anonymous user mode
const userData = await getCurrentUserWithRole(); // Now returns anonymous user
```

> **Note:** Since we modified `getCurrentUserWithRole()` in Step 2 to return anonymous user, this will work automatically. The comment is for documentation purposes.

---

### Step 4: Landing Page - Redirect to Dashboard

**File:** `apps/web/app/(public)/page.tsx`

**Option A - Auto-redirect (Recommended):**

Replace the entire file content with:
```typescript
import { redirect } from "next/navigation";

// AUTH DISABLED - Auto-redirect to dashboard
// To restore landing page: uncomment original LandingPage component below
export default function LandingPage() {
  redirect("/dashboard");
}

// AUTH DISABLED - Original landing page component
// import { HeroSection } from "@/components/landing/HeroSection";
// ... rest of original imports and component ...
```

**Option B - Keep landing page visible:**

Keep the landing page but change CTA buttons (see Steps 5-6).

---

### Step 5: Navbar - Remove Login Button

**File:** `apps/web/components/landing/Navbar.tsx`

**What to do:** Comment out the Login button in the navbar.

**Find and comment out the Login link (usually in the header/nav section):**
```typescript
{/* AUTH DISABLED - Uncomment to re-enable login button
<Link href="/auth/login">
  <Button variant="outline" className="...">
    Login
  </Button>
</Link>
*/}
```

---

### Step 6: Hero & CTA Sections - Update Links

**File:** `apps/web/components/landing/HeroSection.tsx`

**What to do:** Change the CTA button link from `/auth/sign-up` to `/dashboard`

**Before:**
```typescript
<Link href="/auth/sign-up">
  <Button>Analyze My Signals</Button>
</Link>
```

**After:**
```typescript
{/* AUTH DISABLED - Changed from /auth/sign-up to /dashboard */}
<Link href="/dashboard">
  <Button>Analyze My Signals</Button>
</Link>
```

---

**File:** `apps/web/components/landing/CTASection.tsx`

**What to do:** Same change - update link from `/auth/sign-up` to `/dashboard`

**Before:**
```typescript
<Link href="/auth/sign-up">
  <Button>Start Analyzing Signals</Button>
</Link>
```

**After:**
```typescript
{/* AUTH DISABLED - Changed from /auth/sign-up to /dashboard */}
<Link href="/dashboard">
  <Button>Start Analyzing Signals</Button>
</Link>
```

---

### Step 7: Sidebar - Remove Logout/Login Buttons

**File:** `apps/web/components/layout/AppSidebar.tsx`

**What to do:** Comment out the logout/login conditional section in the sidebar footer.

**Find the sidebar footer section and comment out:**
```typescript
{/* AUTH DISABLED - Uncomment to re-enable logout/login buttons
{userId ? (
  <button onClick={handleLogout} className="...">
    <LogOut className="..." />
    {!isCollapsed && <span>Logout</span>}
  </button>
) : (
  <Link href="/auth/login" className="...">
    <LogIn className="..." />
    {!isCollapsed && <span>Login</span>}
  </Link>
)}
*/}
```

**Also comment out the related imports and handler:**
```typescript
// AUTH DISABLED - Uncomment to re-enable
// import { logoutAction } from "@/app/actions/auth";

// AUTH DISABLED - Uncomment to re-enable
// const handleLogout = async () => {
//   const result = await logoutAction();
//   if (result.success) {
//     toast.success("Logged out successfully");
//     router.push("/");
//   } else {
//     toast.error(result.error || "Failed to logout");
//   }
// };
```

---

### Step 8: User Display - No Changes Needed

**File:** `apps/web/components/layout/UserDisplay.tsx`

**No changes required.** This component uses `useUser()` hook which gets data from `UserContext`. Since the protected layout now provides the anonymous user data, this will automatically display "Demo User".

---

## Part 2: Database Changes

### Insert Anonymous User Record

**Where:** Supabase Dashboard → SQL Editor

**Why:** The `user_preferences` and `session_names` tables have foreign key constraints to the `users` table. We need the anonymous user to exist for these features to work.

**SQL to run:**
```sql
-- =====================================================
-- INSERT ANONYMOUS USER FOR NO-AUTH MODE
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================

INSERT INTO public.users (id, email, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'anonymous@demo.local',
  'Demo User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Verify the insert
SELECT * FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

### Tables That Will Use Anonymous User

| Table | Column | What Happens |
|-------|--------|--------------|
| `users` | `id` | Anonymous user record created |
| `user_preferences` | `user_id` | Preferences saved to anonymous user (shared by all visitors) |
| `session_names` | `user_id` | Chat sessions saved to anonymous user |

### Database Trigger - No Changes Needed

The `handle_new_user()` trigger (in migration `0001_tense_meggan.sql`) only fires when new users are created in Supabase Auth. Since we're bypassing auth, this trigger won't fire - no changes needed.

---

## Part 3: GCP & Supabase Configuration

### Supabase Dashboard - No Changes Required

| Setting | Current | Action | Reason |
|---------|---------|--------|--------|
| Google OAuth Provider | Enabled | Keep as-is | No harm, just unused |
| GitHub OAuth Provider | Enabled | Keep as-is | No harm, just unused |
| Email Auth | Enabled | Keep as-is | No harm, just unused |
| Email Confirmations | Required | Keep as-is | Won't trigger without signups |

**The auth providers can remain configured.** They simply won't be used since the UI no longer shows login options.

---

### GCP Services - No Changes Required

| Service | Why No Changes |
|---------|----------------|
| **Cloud Run (Frontend)** | Already configured with `--allow-unauthenticated` |
| **Vertex AI Agent Engine** | Uses service account authentication, not user auth |
| **BigQuery** | Uses service account authentication |
| **Cloud Functions** | Uses service account authentication |
| **Cloud Storage** | Uses service account authentication |

**All backend services authenticate via service accounts**, which is separate from user authentication. Disabling user auth has no impact on these.

---

### Environment Variables - No Changes Required

| Variable | Keep | Reason |
|----------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Still used for database access |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Still used for database access |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Used for admin database operations |
| `DATABASE_URL` | Yes | Required for Drizzle ORM |
| `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | Yes | Used for GCP service auth |

---

## Part 4: Complete File List

### Files to Modify

| # | File Path | Change Type | Lines to Change |
|---|-----------|-------------|-----------------|
| 1 | `apps/web/lib/supabase/middleware.ts` | Comment out redirect | ~6 lines |
| 2 | `apps/web/lib/auth.ts` | Add anonymous user + modify 3 functions | ~50 lines |
| 3 | `apps/web/app/(protected)/layout.tsx` | Comment out auth check | ~5 lines |
| 4 | `apps/web/app/(public)/page.tsx` | Replace with redirect | ~5 lines |
| 5 | `apps/web/components/landing/Navbar.tsx` | Comment out Login button | ~5 lines |
| 6 | `apps/web/components/landing/HeroSection.tsx` | Change CTA link | ~2 lines |
| 7 | `apps/web/components/landing/CTASection.tsx` | Change CTA link | ~2 lines |
| 8 | `apps/web/components/layout/AppSidebar.tsx` | Comment out logout/login | ~20 lines |

### Database Changes

| # | Action | Where |
|---|--------|-------|
| 1 | Run SQL to insert anonymous user | Supabase SQL Editor |

### Files That Need NO Changes

- `apps/web/contexts/UserContext.tsx` - Will receive anonymous user from layout
- `apps/web/components/layout/UserDisplay.tsx` - Will display "Demo User" automatically
- All API routes (`app/api/*`) - Will use anonymous user ID from `getCurrentUserId()`
- All server actions (`app/actions/*`) - Will use anonymous user ID automatically
- Environment files (`.env.local`, `.env.prod`) - No changes
- GCP configurations - No changes
- Supabase dashboard - No changes

---

## Part 5: Verification Checklist

After completing all changes, verify:

- [ ] **Incognito Test:** Open app in incognito/private browser → Should go directly to dashboard (no login)
- [ ] **No Login Screen:** Navigate to `/auth/login` → Should still show login page (but not required)
- [ ] **Dashboard Access:** `/dashboard` loads without authentication
- [ ] **Chat Works:** Can start a chat session and get agent responses
- [ ] **Preferences Save:** Can change signal profile and it persists on refresh
- [ ] **History Works:** Chat sessions appear in history
- [ ] **User Display:** Sidebar shows "Demo User" as the username
- [ ] **No Console Errors:** Browser console has no auth-related errors
- [ ] **Landing Page:** Either redirects to dashboard OR shows updated CTAs pointing to `/dashboard`

---

## Part 6: Re-enabling Authentication

To restore full authentication in the future:

### Quick Steps
1. **Search codebase** for `AUTH DISABLED` comments
2. **Uncomment** all the original code blocks
3. **Remove** the anonymous user constants and early returns
4. **Restore** landing page CTA links to `/auth/sign-up`
5. **Test** login flow works

### Detailed Restoration

| File | What to Restore |
|------|-----------------|
| `middleware.ts` | Uncomment the redirect block |
| `auth.ts` | Remove `ANONYMOUS_USER` constants, uncomment original function bodies |
| `layout.tsx` | Uncomment auth check and redirect |
| `page.tsx` | Restore original landing page component |
| `Navbar.tsx` | Uncomment Login button |
| `HeroSection.tsx` | Change link back to `/auth/sign-up` |
| `CTASection.tsx` | Change link back to `/auth/sign-up` |
| `AppSidebar.tsx` | Uncomment logout/login buttons and handler |

### Database Cleanup (Optional)
```sql
-- Optional: Remove anonymous user after re-enabling auth
-- WARNING: This will delete all preferences and session names saved to anonymous user
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

---

## Execution Order

Execute changes in this order to minimize issues:

```
1. DATABASE
   └── Insert anonymous user in Supabase SQL Editor

2. AUTH HELPERS
   └── apps/web/lib/auth.ts
       └── Add ANONYMOUS_USER constants
       └── Modify getCurrentUserWithRole()
       └── Modify getCurrentUserId()
       └── Modify requireUserId()

3. MIDDLEWARE
   └── apps/web/lib/supabase/middleware.ts
       └── Comment out redirect logic

4. PROTECTED LAYOUT
   └── apps/web/app/(protected)/layout.tsx
       └── Comment out auth check (optional - already works via auth.ts)

5. UI COMPONENTS
   └── apps/web/app/(public)/page.tsx
       └── Add redirect to dashboard
   └── apps/web/components/landing/Navbar.tsx
       └── Comment out Login button
   └── apps/web/components/landing/HeroSection.tsx
       └── Change CTA link
   └── apps/web/components/landing/CTASection.tsx
       └── Change CTA link
   └── apps/web/components/layout/AppSidebar.tsx
       └── Comment out logout/login section

6. TEST
   └── Open in incognito browser
   └── Verify all checklist items
```

---

## Appendix: Search Patterns

### Find All Auth-Disabled Code
```bash
# In project root
grep -r "AUTH DISABLED" apps/web/
```

### Find Auth-Related Files
```bash
# All files that import from auth
grep -r "from.*auth" apps/web/ --include="*.ts" --include="*.tsx"
```

---

## Notes

- **All users share the same identity:** Preferences and chat history are shared across all visitors
- **Security:** This is intended for demo/development purposes. For production with real users, re-enable authentication.
- **Supabase costs:** Auth is free tier on Supabase, so leaving it configured doesn't incur costs
- **GCP unchanged:** Backend services continue using service account auth (unaffected)
