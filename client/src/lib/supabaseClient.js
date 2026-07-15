/**
 * supabaseClient.js — the single Supabase client for the entire frontend.
 *
 * Import this wherever you need Supabase. Never instantiate a second client.
 * The service/secret key must never appear here — only the publishable key.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env'
  )
}

const supabase = createClient(supabaseUrl, supabasePublishableKey)

export default supabase
