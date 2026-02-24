import { createClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string> };

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found. Auth & sync disabled.');
}

// Create client only if URL is provided, otherwise create a dummy placeholder
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;
