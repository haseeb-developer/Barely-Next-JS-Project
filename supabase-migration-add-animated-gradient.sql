-- Migration: Add animated_gradient_enabled column to anon_users table
-- This tracks if the user has purchased the animated gradient feature (one-time purchase)

-- Add animated_gradient_enabled column if it doesn't exist (boolean, default false)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'animated_gradient_enabled'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN animated_gradient_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

