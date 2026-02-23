import { createClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string> };

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found. Check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
