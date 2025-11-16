-- Add profile_picture column to anon_users table
ALTER TABLE anon_users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_anon_users_profile_picture ON anon_users(profile_picture) WHERE profile_picture IS NOT NULL;

