import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

const missingSupabaseError = new Error(
  'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel project settings.',
)

function createMissingSupabaseProxy() {
  return new Proxy(
    {},
    {
      get() {
        throw missingSupabaseError
      },
      apply() {
        throw missingSupabaseError
      },
    },
  )
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabase =
  isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : (createMissingSupabaseProxy() as any)