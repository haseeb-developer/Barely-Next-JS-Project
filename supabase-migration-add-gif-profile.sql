-- Add GIF profile feature column to anon_users table
ALTER TABLE anon_users 
ADD COLUMN IF NOT EXISTS gif_profile_enabled BOOLEAN DEFAULT FALSE;

