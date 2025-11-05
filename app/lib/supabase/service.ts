import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side only Supabase client with service role key.
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use this in server-side code, never expose it to the client.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

