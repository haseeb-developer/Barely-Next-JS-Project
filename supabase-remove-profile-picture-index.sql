-- Remove index on profile_picture because large base64 strings can exceed index row size limits
DROP INDEX IF EXISTS idx_anon_users_profile_picture;

-- Optional: ensure the column exists (no-op if already there)
ALTER TABLE anon_users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;


