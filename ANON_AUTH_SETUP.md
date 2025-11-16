# Anonymous Authentication Setup Guide

## Overview
This project now supports anonymous user authentication alongside Clerk authentication. Users can create anonymous accounts that persist their data even after logging out and logging back in.

## Features
- **Account Dropdown**: Single "Account" button that shows Sign In, Sign Up, and Anonymous Sign Up options
- **Anonymous Accounts**: Users can create accounts with email/password that are stored in Supabase
- **Persistent Data**: User data persists across sessions using UUID-based identification
- **Dynamic UI**: Header shows user email when logged in via anonymous account
- **Responsive**: Works on both desktop and mobile

## Setup Instructions

### 1. Create Supabase Table
Run the SQL script in `supabase-schema.sql` in your Supabase SQL Editor:

```sql
-- The SQL is already in supabase-schema.sql file
```

Or manually create the table:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase-schema.sql`

### 2. Environment Variables
Make sure your `.env.local` file has the Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

### 3. How It Works

#### For New Users:
1. Click "Account" button in header
2. Select "Anonymous Sign Up"
3. Redirected to `/anon-account` page
4. Can toggle between Sign Up and Login
5. After signup/login, UUID is generated and stored in localStorage
6. User data is saved to Supabase `anon_users` table

#### For Returning Users:
1. If user has email in localStorage, page automatically shows Login form
2. User logs in with email/password
3. Data is retrieved from Supabase using the stored UUID
4. Header shows user's email address

#### Logout:
- Click "Account" → "Logout" when logged in as anonymous user
- Clears localStorage and returns to guest state

## Security Notes

⚠️ **IMPORTANT**: The current implementation stores passwords in plain text. For production:

1. **Hash passwords** using bcrypt or similar before storing
2. **Use Supabase Auth** instead of custom authentication for better security
3. **Implement proper session management** with JWT tokens
4. **Add rate limiting** to prevent brute force attacks
5. **Use HTTPS** for all authentication requests

## File Structure

- `app/components/AccountDropdown.tsx` - Account dropdown component
- `app/anon-account/page.tsx` - Anonymous account login/signup page
- `app/lib/anon-auth.ts` - Authentication utilities and localStorage management
- `supabase-schema.sql` - Database schema for anonymous users

## Usage

The Account dropdown automatically appears in the header when:
- User is NOT signed in via Clerk
- Shows "Account" button with dropdown menu

When anonymous user is logged in:
- Header shows user's email address
- Account dropdown shows logout option

## Next Steps

Consider implementing:
- Password hashing (bcrypt)
- Email verification
- Password reset functionality
- Session tokens instead of localStorage
- Better error handling
- Loading states

