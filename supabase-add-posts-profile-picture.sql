-- Add profile picture column to confessions_posts to store Clerk users' image URLs
ALTER TABLE confessions_posts
ADD COLUMN IF NOT EXISTS profile_picture TEXT;


