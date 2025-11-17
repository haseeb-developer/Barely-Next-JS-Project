-- Migration: Add verified_owner flag to track verified owner status
-- This allows us to mark specific users as verified owners in the database

-- Create a simple table to track verified owner user IDs
CREATE TABLE IF NOT EXISTS verified_owners (
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('clerk', 'anonymous')),
  PRIMARY KEY (user_id, user_type)
);

-- Enable RLS
ALTER TABLE verified_owners ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (so verified badges show for all users)
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow read verified owners" ON verified_owners;
CREATE POLICY "Allow read verified owners" ON verified_owners
FOR SELECT USING (true);

-- Only allow inserts/updates via service role (admin only)
-- This will be done through API routes with service role key

-- Insert the verified owner (haseeb.devv@gmail.com)
-- Note: We need to get the Clerk user ID for this email
-- This will be done through an admin API endpoint or manually
-- For now, we'll create a placeholder that can be updated

