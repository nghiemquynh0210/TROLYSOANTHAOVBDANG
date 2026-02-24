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

/** Get current user's profile — auto-creates if missing */
export async function getMyProfile(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to fetch existing profile
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (data) return data as UserProfile;

    // Profile doesn't exist yet (user registered before table was created)
    // Auto-create it
    if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .upsert({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || '',
                role: 'user',
                approved: false
            })
            .select()
            .single();
        if (insertError) {
            console.warn('Profile auto-create error:', insertError.message);
            return null;
        }
        return newProfile as UserProfile;
    }

    console.warn('Profile fetch error:', error?.message);
    return null;
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

/** Delete user profile (admin only) */
export async function deleteUserProfile(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);
    return !error;
}
