-- Migration: Add previous_username column to anon_users table
-- This allows tracking the previous username when a user changes it

-- Add previous_username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'previous_username'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN previous_username TEXT;
    END IF;
END $$;

-- Create index for faster lookups (optional, but helpful if you query by previous username)
CREATE INDEX IF NOT EXISTS idx_anon_users_previous_username ON anon_users(previous_username);

