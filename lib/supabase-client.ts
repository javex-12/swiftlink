import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured() {
  // If we have hardcoded fallbacks or env vars, we are good to go
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));
}
