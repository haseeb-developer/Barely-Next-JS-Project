-- Migration: Add purchased_colors columns to anon_users table
-- This allows tracking colors that users have purchased for reuse

-- Add purchased_solid_colors column if it doesn't exist (JSON array of hex colors)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'purchased_solid_colors'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN purchased_solid_colors TEXT DEFAULT '[]';
    END IF;
END $$;

-- Add purchased_gradient_colors column if it doesn't exist (JSON array of gradient arrays)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'purchased_gradient_colors'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN purchased_gradient_colors TEXT DEFAULT '[]';
    END IF;
END $$;

