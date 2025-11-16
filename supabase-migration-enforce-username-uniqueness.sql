-- Migration: Enforce case-insensitive username uniqueness
-- This ensures usernames are globally unique regardless of case (e.g., "Hello" and "hello" are the same)
-- Run this AFTER the initial schema has been created

-- Check if the table and column exist before proceeding
DO $$ 
BEGIN
    -- Only proceed if the table and username column exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'username'
    ) THEN
        -- First, let's ensure all existing usernames are lowercase
        UPDATE anon_users 
        SET username = LOWER(username) 
        WHERE username != LOWER(username);
        
        -- Create a unique index that's case-insensitive
        -- This will prevent "Hello", "hello", "HELLO" from all existing
        CREATE UNIQUE INDEX IF NOT EXISTS idx_anon_users_username_lower 
        ON anon_users (LOWER(username));
        
        RAISE NOTICE 'Username uniqueness migration completed successfully';
    ELSE
        RAISE NOTICE 'anon_users table or username column does not exist. Please run the initial schema first.';
    END IF;
END $$;

-- Note: The original UNIQUE constraint on username column is case-sensitive
-- The LOWER() index ensures case-insensitive uniqueness globally

