-- Flag system for confessions posts
-- Users can flag inappropriate posts
-- Posts with 15+ flags are automatically deleted

-- Create flags table
CREATE TABLE IF NOT EXISTS confessions_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES confessions_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Can be Clerk user ID or anonymous user ID
  user_type TEXT NOT NULL CHECK (user_type IN ('clerk', 'anonymous')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, user_type) -- Prevent duplicate flags from same user
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_confessions_flags_post_id ON confessions_flags(post_id);
CREATE INDEX IF NOT EXISTS idx_confessions_flags_user ON confessions_flags(user_id, user_type);

-- Enable RLS
ALTER TABLE confessions_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can flag a post (authenticated users)
CREATE POLICY "Users can flag posts" ON confessions_flags
  FOR INSERT
  WITH CHECK (true);

-- Users can see flag counts (but not who flagged)
CREATE POLICY "Users can view flag counts" ON confessions_flags
  FOR SELECT
  USING (true);

-- Function to automatically delete posts with 15+ flags
CREATE OR REPLACE FUNCTION check_and_delete_flagged_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the post now has 15 or more flags
  IF (SELECT COUNT(*) FROM confessions_flags WHERE post_id = NEW.post_id) >= 15 THEN
    -- Delete the post (cascade will handle related records)
    DELETE FROM confessions_posts WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check flag count after each flag is added
CREATE TRIGGER auto_delete_flagged_posts
  AFTER INSERT ON confessions_flags
  FOR EACH ROW
  EXECUTE FUNCTION check_and_delete_flagged_posts();

