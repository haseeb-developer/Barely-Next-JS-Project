-- Add tags column to confessions_posts table
-- Run this in your Supabase SQL Editor

-- Add tags column (array of text)
ALTER TABLE confessions_posts 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for tags for faster queries
CREATE INDEX IF NOT EXISTS idx_confessions_posts_tags ON confessions_posts USING GIN(tags);

-- Note: Tags will be stored as an array of strings
-- Example: ['nature', 'love', 'life']

