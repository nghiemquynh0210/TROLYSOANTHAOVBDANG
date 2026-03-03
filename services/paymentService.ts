import { supabase } from './supabaseClient';

// ─── Types ─────────────────────────────────────────
export interface DBPartyMember {
    id: string;
    user_id: string;
    stt: number;
    ho_ten: string;
    chuc_vu: string;
    ngay_vao_dang: string;
    member_type: string;
    salary: number;
    region: string;
    fee_amount: number;
    note: string;
    paid: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface DBPayment {
    id?: string;
    user_id: string;
    member_id: string;
    amount: number;
    month: number;
    year: number;
    paid: boolean;
    paid_at?: string | null;
    payment_method: 'manual' | 'qr_transfer' | 'auto_webhook';
    transaction_ref?: string;
    note?: string;
    created_at?: string;
}

/** Helper to get current user ID */
async function getCurrentUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.id) throw new Error("User not authenticated");
    return data.user.id;
}

// ─── Member CRUD ───────────────────────────────────

/** Fetch all members ordered by STT for current user */
export async function fetchMembers(): Promise<DBPartyMember[]> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('party_members')
            .select('*')
            .eq('user_id', userId)
            .order('stt', { ascending: true });
        if (error) {
            console.error('fetchMembers error:', error);
            return [];
        }
        return data || [];
    } catch { return []; }
}

/** Upsert a single member (insert or update) for current user */
export async function upsertMember(member: DBPartyMember): Promise<DBPartyMember | null> {
    try {
        const userId = await getCurrentUserId();
        const memberWithUser = { ...member, user_id: userId };
        const { data, error } = await supabase
            .from('party_members')
            .upsert(memberWithUser, { onConflict: 'id' })
            .select()
            .single();
        if (error) {
            console.error('upsertMember error:', error);
            return null;
        }
        return data;
    } catch { return null; }
}

/** Batch upsert all members for current user */
export async function syncAllMembers(members: DBPartyMember[]): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        const membersWithUser = members.map(m => ({ ...m, user_id: userId }));
        const { error } = await supabase
            .from('party_members')
            .upsert(membersWithUser, { onConflict: 'id' });
        if (error) {
            console.error('syncAllMembers error:', error);
            return false;
        }
        return true;
    } catch { return false; }
}

/** Delete a member by ID */
export async function deleteMember(id: string): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        const { error, count } = await supabase
            .from('party_members')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            console.error('[deleteMember] Supabase error:', error);
            return false;
        }
        console.log(`[deleteMember] Deleted ${count ?? '?'} row(s) for id=${id}`);
        return true;
    } catch (err) {
        console.error('[deleteMember] Exception:', err);
        return false;
    }
}

/** Delete ALL members for current user */
export async function deleteAllMembers(): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        console.log('[deleteAllMembers] Starting delete for user:', userId);
        
        // First, count how many exist
        const { count: existingCount } = await supabase
            .from('party_members')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);
        console.log('[deleteAllMembers] Members to delete:', existingCount);
        
        if (!existingCount || existingCount === 0) {
            console.log('[deleteAllMembers] No members found, nothing to delete');
            return true;
        }

        const { error, count } = await supabase
            .from('party_members')
            .delete({ count: 'exact' })
            .eq('user_id', userId);
        
        if (error) {
            console.error('[deleteAllMembers] Supabase error:', JSON.stringify(error));
            return false;
        }
        
        console.log(`[deleteAllMembers] Successfully deleted ${count ?? '?'} members`);
        
        // Verify deletion
        const { count: remainingCount } = await supabase
            .from('party_members')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        if (remainingCount && remainingCount > 0) {
            console.warn(`[deleteAllMembers] WARNING: ${remainingCount} members still remain after delete!`);
            return false;
        }
        
        console.log('[deleteAllMembers] Verified: all members deleted successfully');
        return true;
    } catch (err) {
        console.error('[deleteAllMembers] Exception:', err);
        return false;
    }
}

/** Update payment status for a member */
export async function updateMemberPaidStatus(id: string, paid: boolean): Promise<boolean> {
    const { error } = await supabase
        .from('party_members')
        .update({ paid })
        .eq('id', id);
    if (error) {
        console.error('updateMemberPaidStatus error:', error);
        return false;
    }
    return true;
}

// ─── Payment History ───────────────────────────────

/** Record a payment for current user */
export async function recordPayment(payment: Omit<DBPayment, 'id' | 'created_at' | 'user_id'>): Promise<DBPayment | null> {
    try {
        const userId = await getCurrentUserId();
        const paymentWithUser = { ...payment, user_id: userId };
        const { data, error } = await supabase
            .from('party_payments')
            .insert(paymentWithUser)
            .select()
            .single();
        if (error) {
            console.error('recordPayment error:', error);
            return null;
        }
        // Also update member paid status
        await updateMemberPaidStatus(payment.member_id, true);
        return data;
    } catch { return null; }
}

/** Get payments for current user for a specific month/year */
export async function fetchPayments(month: number, year: number): Promise<DBPayment[]> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('party_payments')
            .select('*')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('fetchPayments error:', error);
            return [];
        }
        return data || [];
    } catch { return []; }
}

// ─── Conversion helpers ────────────────────────────

/** Convert DB format → app format */
export function dbToAppMember(db: DBPartyMember) {
    return {
        id: db.id,
        userId: db.user_id,
        stt: db.stt,
        hoTen: db.ho_ten,
        chucVu: db.chuc_vu,
        ngayVaoDang: db.ngay_vao_dang,
        memberType: db.member_type,
        salary: Number(db.salary),
        region: db.region,
        feeAmount: Number(db.fee_amount),
        note: db.note,
        paid: db.paid
    };
}

/** Convert app format → DB format */
export function appToDbMember(app: {
    id: string; userId?: string; stt: number; hoTen: string; chucVu: string;
    ngayVaoDang: string; memberType: string; salary: number;
    region: string; feeAmount: number; note: string; paid: boolean;
}): DBPartyMember {
    return {
        id: app.id,
        user_id: app.userId || '',
        stt: app.stt,
        ho_ten: app.hoTen,
        chuc_vu: app.chucVu,
        ngay_vao_dang: app.ngayVaoDang,
        member_type: app.memberType,
        salary: app.salary,
        region: app.region,
        fee_amount: app.feeAmount,
        note: app.note,
        paid: app.paid
    };
}
