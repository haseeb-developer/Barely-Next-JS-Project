-- Migration: Add purchased_gradient_color_slots column to anon_users table
-- This tracks how many additional gradient color slots (4th, 5th, etc.) the user has purchased

-- Add purchased_gradient_color_slots column if it doesn't exist (integer, default 0)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'purchased_gradient_color_slots'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN purchased_gradient_color_slots INTEGER DEFAULT 0;
    END IF;
END $$;

