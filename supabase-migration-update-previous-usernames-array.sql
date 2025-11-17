-- Change previous_username from single TEXT to array of TEXT to store all previous usernames

-- Step 1: Add new array column first
ALTER TABLE anon_users 
ADD COLUMN IF NOT EXISTS previous_usernames TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing data from previous_username to previous_usernames array
UPDATE anon_users 
SET previous_usernames = ARRAY[previous_username]::TEXT[]
WHERE previous_username IS NOT NULL AND previous_username != '';

-- Step 3: Drop the old column after migration is complete
ALTER TABLE anon_users DROP COLUMN IF EXISTS previous_username;

