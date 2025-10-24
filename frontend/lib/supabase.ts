import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      flowType: 'pkce', // Use PKCE flow for better security
      detectSessionInUrl: true,
      persistSession: true,
    }
  }
)

export { supabase }