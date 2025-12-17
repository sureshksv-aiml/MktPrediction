import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Lazy initialization to avoid errors during build time
// (env vars are only available at runtime in Cloud Run)
let _db: PostgresJsDatabase | null = null;

function getDb(): PostgresJsDatabase {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(databaseUrl, { prepare: false });
  _db = drizzle(client);
  return _db;
}

// Export a proxy that lazily initializes the database on first access
export const db = new Proxy({} as PostgresJsDatabase, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof PostgresJsDatabase];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});
