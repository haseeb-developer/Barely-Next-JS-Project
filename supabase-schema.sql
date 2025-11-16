-- Create anon_users table for anonymous user accounts
CREATE TABLE IF NOT EXISTS anon_users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In production, use proper password hashing!
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_anon_users_email ON anon_users(email);
CREATE INDEX IF NOT EXISTS idx_anon_users_username ON anon_users(username);

-- Enable Row Level Security (RLS)
ALTER TABLE anon_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read their own data"
  ON anon_users
  FOR SELECT
  USING (true); -- Adjust this based on your security needs

-- Create policy to allow users to insert their own data
CREATE POLICY "Users can insert their own data"
  ON anon_users
  FOR INSERT
  WITH CHECK (true); -- Adjust this based on your security needs

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data"
  ON anon_users
  FOR UPDATE
  USING (true); -- Adjust this based on your security needs

