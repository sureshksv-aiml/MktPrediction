-- Down migration for: 0000_dizzy_longshot
-- Reverses the Market Signal Intelligence schema creation

-- Drop indexes first
DROP INDEX IF EXISTS "user_preferences_user_id_idx";
DROP INDEX IF EXISTS "session_names_session_user_idx";
DROP INDEX IF EXISTS "session_names_user_id_idx";

-- Drop foreign key constraints
ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_user_id_users_id_fk";
ALTER TABLE "session_names" DROP CONSTRAINT IF EXISTS "session_names_user_id_users_id_fk";

-- Drop tables (dependent tables first)
DROP TABLE IF EXISTS "user_preferences";
DROP TABLE IF EXISTS "session_names";
DROP TABLE IF EXISTS "users";
