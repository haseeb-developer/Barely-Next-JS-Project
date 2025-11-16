-- Migration: Add IP Address Tracking and Banning System
-- Run this AFTER the initial schema has been created
-- This migration adds IP tracking to existing anon_users table and creates banned_ips table

-- Add ip_address column to existing anon_users table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anon_users' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE anon_users ADD COLUMN ip_address TEXT;
    END IF;
END $$;

-- Create index on IP address for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_anon_users_ip ON anon_users(ip_address);

-- Create banned_ips table for permanent IP bans (if it doesn't exist)
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

-- Enable Row Level Security for banned_ips
ALTER TABLE banned_ips ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading banned IPs (for checking bans)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'banned_ips' AND policyname = 'Anyone can read banned IPs'
    ) THEN
        CREATE POLICY "Anyone can read banned IPs"
          ON banned_ips
          FOR SELECT
          USING (true);
    END IF;
END $$;

-- Create policy to allow inserting banned IPs (server-side only)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'banned_ips' AND policyname = 'Service role can insert banned IPs'
    ) THEN
        CREATE POLICY "Service role can insert banned IPs"
          ON banned_ips
          FOR INSERT
          WITH CHECK (true); -- In production, restrict this to service role only
    END IF;
END $$;

