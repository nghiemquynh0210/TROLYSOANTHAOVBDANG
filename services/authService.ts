import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export type AuthUser = User;

/** Sign up with email & password */
export async function signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName || '' }
        }
    });
    if (error) throw error;
    return data;
}

/** Sign in with email & password */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

/** Sign out */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/** Get current session */
export async function getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

/** Get current user */
export async function getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

/** Listen for auth state changes */
export function onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
}
