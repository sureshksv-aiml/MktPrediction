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
