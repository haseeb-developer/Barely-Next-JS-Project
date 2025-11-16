-- Migration: Make email optional for anonymous accounts
-- Run this AFTER the initial schema and IP tracking migration
-- This makes email optional since anonymous accounts should only need username + password

-- Make email column nullable (if it exists and is currently NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'email' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE anon_users ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- Remove unique constraint on email (since it can be null and we don't need it unique anymore)
-- First, drop the unique index if it exists
DROP INDEX IF EXISTS idx_anon_users_email;

-- Note: We keep the email column in case users want to optionally provide it
-- But it's no longer required for anonymous accounts

