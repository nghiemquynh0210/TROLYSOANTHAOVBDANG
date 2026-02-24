import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'user';
    approved: boolean;
    created_at: string;
    updated_at: string;
}

/** Get current user's profile */
export async function getMyProfile(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    if (error) {
        console.warn('Profile fetch error:', error.message);
        return null;
    }
    return data as UserProfile;
}

/** Get all user profiles (admin only) */
export async function getAllProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Fetch all profiles error:', error.message);
        return [];
    }
    return (data || []) as UserProfile[];
}

/** Approve a user (admin only) */
export async function approveUser(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_profiles')
        .update({ approved: true })
        .eq('id', userId);
    return !error;
}

/** Reject / revoke approval (admin only) */
export async function rejectUser(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_profiles')
        .update({ approved: false })
        .eq('id', userId);
    return !error;
}

/** Set user role (admin only) */
export async function setUserRole(userId: string, role: 'admin' | 'user'): Promise<boolean> {
    const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);
    return !error;
}
