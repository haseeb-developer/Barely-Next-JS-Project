-- Migration: Add username color customization columns to anon_users table
-- This allows users to customize their username color with solid colors or gradients

-- Add username_color column if it doesn't exist (for solid colors - hex format)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'username_color'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN username_color TEXT;
    END IF;
END $$;

-- Add username_color_gradient column if it doesn't exist (for gradients - JSON array of colors)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'username_color_gradient'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN username_color_gradient TEXT;
    END IF;
END $$;

-- Add index for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_anon_users_username_color ON anon_users(username_color) WHERE username_color IS NOT NULL;

