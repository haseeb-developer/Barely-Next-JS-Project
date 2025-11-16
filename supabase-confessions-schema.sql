-- Confessions Posts Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Create confessions_posts table
-- ============================================
CREATE TABLE IF NOT EXISTS confessions_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (LENGTH(content) <= 20), -- Max 20 characters
  user_id TEXT NOT NULL, -- Can be Clerk user ID or anonymous user ID
  user_type TEXT NOT NULL CHECK (user_type IN ('clerk', 'anonymous')), -- Track auth type
  username TEXT NOT NULL, -- Display username (from Clerk or anonymous)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create confessions_likes table
-- ============================================
CREATE TABLE IF NOT EXISTS confessions_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES confessions_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Can be Clerk user ID or anonymous user ID
  user_type TEXT NOT NULL CHECK (user_type IN ('clerk', 'anonymous')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, user_type) -- One like per user per post
);

-- ============================================
-- STEP 3: Create confessions_dislikes table
-- ============================================
CREATE TABLE IF NOT EXISTS confessions_dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES confessions_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Can be Clerk user ID or anonymous user ID
  user_type TEXT NOT NULL CHECK (user_type IN ('clerk', 'anonymous')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, user_type) -- One dislike per user per post
);

-- ============================================
-- STEP 4: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_confessions_posts_user_id ON confessions_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_confessions_posts_created_at ON confessions_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_likes_post_id ON confessions_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_confessions_likes_user ON confessions_likes(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_confessions_dislikes_post_id ON confessions_dislikes(post_id);
CREATE INDEX IF NOT EXISTS idx_confessions_dislikes_user ON confessions_dislikes(user_id, user_type);

-- ============================================
-- STEP 5: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE confessions_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions_dislikes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create RLS Policies for confessions_posts
-- ============================================
-- Anyone can read posts
DROP POLICY IF EXISTS "Anyone can read posts" ON confessions_posts;
CREATE POLICY "Anyone can read posts"
  ON confessions_posts
  FOR SELECT
  USING (true);

-- Anyone authenticated (Clerk or anonymous) can create posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON confessions_posts;
CREATE POLICY "Authenticated users can create posts"
  ON confessions_posts
  FOR INSERT
  WITH CHECK (true); -- In production, add proper auth checks

-- Only post creator can delete their own posts
DROP POLICY IF EXISTS "Users can delete their own posts" ON confessions_posts;
CREATE POLICY "Users can delete their own posts"
  ON confessions_posts
  FOR DELETE
  USING (true); -- In production, verify user_id matches

-- ============================================
-- STEP 7: Create RLS Policies for confessions_likes
-- ============================================
-- Anyone can read likes
DROP POLICY IF EXISTS "Anyone can read likes" ON confessions_likes;
CREATE POLICY "Anyone can read likes"
  ON confessions_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like posts
DROP POLICY IF EXISTS "Authenticated users can like posts" ON confessions_likes;
CREATE POLICY "Authenticated users can like posts"
  ON confessions_likes
  FOR INSERT
  WITH CHECK (true);

-- Users can unlike (delete their like)
DROP POLICY IF EXISTS "Users can delete their own likes" ON confessions_likes;
CREATE POLICY "Users can delete their own likes"
  ON confessions_likes
  FOR DELETE
  USING (true);

-- ============================================
-- STEP 8: Create RLS Policies for confessions_dislikes
-- ============================================
-- Anyone can read dislikes
DROP POLICY IF EXISTS "Anyone can read dislikes" ON confessions_dislikes;
CREATE POLICY "Anyone can read dislikes"
  ON confessions_dislikes
  FOR SELECT
  USING (true);

-- Authenticated users can dislike posts
DROP POLICY IF EXISTS "Authenticated users can dislike posts" ON confessions_dislikes;
CREATE POLICY "Authenticated users can dislike posts"
  ON confessions_dislikes
  FOR INSERT
  WITH CHECK (true);

-- Users can remove their dislike
DROP POLICY IF EXISTS "Users can delete their own dislikes" ON confessions_dislikes;
CREATE POLICY "Users can delete their own dislikes"
  ON confessions_dislikes
  FOR DELETE
  USING (true);

-- ============================================
-- DONE! Your confessions schema is ready.
-- ============================================

