-- Complete Supabase Setup for Anonymous Accounts
-- Run this entire file in your Supabase SQL Editor to set up everything at once

-- ============================================
-- STEP 1: Create anon_users table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS anon_users (
  id UUID PRIMARY KEY,
  password TEXT NOT NULL, -- In production, use proper password hashing!
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Add missing columns if they don't exist
-- ============================================
-- Add username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'username'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN username TEXT;
    END IF;
END $$;

-- Add email column if it doesn't exist (make it nullable)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'email'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add ip_address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN ip_address TEXT;
    END IF;
END $$;

-- ============================================
-- STEP 3: Add constraints to username column
-- ============================================
-- Make username NOT NULL and UNIQUE (only if it's currently nullable)
DO $$ 
BEGIN
    -- Check if username is nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' 
        AND column_name = 'username' 
        AND is_nullable = 'YES'
    ) THEN
        -- First, set any NULL usernames to a temporary value
        UPDATE anon_users SET username = 'temp_' || id::text WHERE username IS NULL;
        -- Then make it NOT NULL
        ALTER TABLE anon_users ALTER COLUMN username SET NOT NULL;
    END IF;
    
    -- Add UNIQUE constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'anon_users_username_key'
    ) THEN
        ALTER TABLE anon_users ADD CONSTRAINT anon_users_username_key UNIQUE (username);
    END IF;
END $$;

-- ============================================
-- STEP 4: Create indexes for faster lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_anon_users_email ON anon_users(email);
CREATE INDEX IF NOT EXISTS idx_anon_users_username ON anon_users(username);
CREATE INDEX IF NOT EXISTS idx_anon_users_ip ON anon_users(ip_address);

-- Create case-insensitive unique index for username (ensures global uniqueness)
-- Drop it first if it exists to avoid conflicts
DROP INDEX IF EXISTS idx_anon_users_username_lower;
CREATE UNIQUE INDEX idx_anon_users_username_lower 
ON anon_users (LOWER(username));

-- ============================================
-- STEP 2: Create banned_ips table
-- ============================================
CREATE TABLE IF NOT EXISTS banned_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  banned_by TEXT, -- Admin or system
  is_permanent BOOLEAN DEFAULT true
);

-- Create index on IP address for fast lookups
CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON banned_ips(ip_address);

-- ============================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE anon_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_ips ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS Policies for anon_users
-- ============================================
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read their own data" ON anon_users;
DROP POLICY IF EXISTS "Users can insert their own data" ON anon_users;
DROP POLICY IF EXISTS "Users can update their own data" ON anon_users;

-- Create new policies
CREATE POLICY "Users can read their own data"
  ON anon_users
  FOR SELECT
  USING (true); -- Adjust this based on your security needs

CREATE POLICY "Users can insert their own data"
  ON anon_users
  FOR INSERT
  WITH CHECK (true); -- Adjust this based on your security needs

CREATE POLICY "Users can update their own data"
  ON anon_users
  FOR UPDATE
  USING (true); -- Adjust this based on your security needs

-- ============================================
-- STEP 5: Create RLS Policies for banned_ips
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read banned IPs" ON banned_ips;
DROP POLICY IF EXISTS "Service role can insert banned IPs" ON banned_ips;

-- Create new policies
CREATE POLICY "Anyone can read banned IPs"
  ON banned_ips
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert banned IPs"
  ON banned_ips
  FOR INSERT
  WITH CHECK (true); -- In production, restrict this to service role only

-- ============================================
-- STEP 6: Update existing data (if any)
-- ============================================
-- Convert any existing usernames to lowercase for consistency
-- Only update if username column exists and has data
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'username'
    ) THEN
        UPDATE anon_users 
        SET username = LOWER(username) 
        WHERE username IS NOT NULL AND username != LOWER(username);
    END IF;
END $$;

-- ============================================
-- DONE! Your database is now set up.
-- ============================================

