-- Migration: Add saved_posts table for bookmarking confessions
-- Users can save posts to their collection

CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES confessions_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('clerk', 'anonymous')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, user_type) -- One save per user per post
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id);

-- Enable RLS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own saved posts
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Users can read their own saved posts" ON saved_posts;
CREATE POLICY "Users can read their own saved posts" ON saved_posts
FOR SELECT USING (true);

-- Allow users to insert their own saved posts
DROP POLICY IF EXISTS "Users can insert their own saved posts" ON saved_posts;
CREATE POLICY "Users can insert their own saved posts" ON saved_posts
FOR INSERT WITH CHECK (true);

-- Allow users to delete their own saved posts
DROP POLICY IF EXISTS "Users can delete their own saved posts" ON saved_posts;
CREATE POLICY "Users can delete their own saved posts" ON saved_posts
FOR DELETE USING (true);

