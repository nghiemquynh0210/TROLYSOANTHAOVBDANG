import { supabase } from './supabaseClient';

export interface PartySettings {
    id?: string;
    user_id?: string;
    branch_name: string;
    superior_party: string;
    bank_name: string;
    bank_account_number: string;
    account_holder_name: string;
}

/** Helper to get current user ID */
async function getCurrentUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.id) throw new Error("User not authenticated");
    return data.user.id;
}

/** Fetch settings for current user */
export async function fetchPartySettings(): Promise<PartySettings | null> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('party_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No settings found, return default
                return {
                    branch_name: '',
                    superior_party: '',
                    bank_name: 'MB Bank',
                    bank_account_number: '',
                    account_holder_name: ''
                };
            }
            console.error('fetchPartySettings error:', error);
            return null;
        }
        return data;
    } catch { return null; }
}

/** Upsert settings for current user */
export async function upsertPartySettings(settings: PartySettings): Promise<PartySettings | null> {
    try {
        const userId = await getCurrentUserId();
        const settingsWithUser = { ...settings, user_id: userId };

        const { data, error } = await supabase
            .from('party_settings')
            .upsert(settingsWithUser, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('upsertPartySettings error:', error);
            return null;
        }
        return data;
    } catch { return null; }
}
