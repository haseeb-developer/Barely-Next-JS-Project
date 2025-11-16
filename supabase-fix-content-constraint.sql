-- Fix content constraint - Remove 20 character limit
-- Run this in your Supabase SQL Editor

-- Drop the old constraint that limits content to 20 characters
ALTER TABLE confessions_posts 
DROP CONSTRAINT IF EXISTS confessions_posts_content_check;

-- The content column should now accept any length
-- Word count validation is handled in the application layer (10-50 words)

