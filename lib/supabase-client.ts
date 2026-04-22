import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://ytoejmdujqtbgjdtzwwl.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0b2VqbWR1anF0YmdqZHR6d3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NTIwMjAsImV4cCI6MjA5MjMyODAyMH0.5LGXrgMywc0F8BV5Dz1TMPgHzW6sZhsKnFwtKVVBVok';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || PROD_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PROD_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured() {
  // If we have hardcoded fallbacks or env vars, we are good to go
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));
}
