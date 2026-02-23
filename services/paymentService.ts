import { supabase } from './supabaseClient';

// ─── Types ─────────────────────────────────────────
export interface DBPartyMember {
    id: string;
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

// ─── Member CRUD ───────────────────────────────────

/** Fetch all members ordered by STT */
export async function fetchMembers(): Promise<DBPartyMember[]> {
    const { data, error } = await supabase
        .from('party_members')
        .select('*')
        .order('stt', { ascending: true });
    if (error) {
        console.error('fetchMembers error:', error);
        return [];
    }
    return data || [];
}

/** Upsert a single member (insert or update) */
export async function upsertMember(member: DBPartyMember): Promise<DBPartyMember | null> {
    const { data, error } = await supabase
        .from('party_members')
        .upsert(member, { onConflict: 'id' })
        .select()
        .single();
    if (error) {
        console.error('upsertMember error:', error);
        return null;
    }
    return data;
}

/** Batch upsert all members */
export async function syncAllMembers(members: DBPartyMember[]): Promise<boolean> {
    const { error } = await supabase
        .from('party_members')
        .upsert(members, { onConflict: 'id' });
    if (error) {
        console.error('syncAllMembers error:', error);
        return false;
    }
    return true;
}

/** Delete a member by ID */
export async function deleteMember(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('party_members')
        .delete()
        .eq('id', id);
    if (error) {
        console.error('deleteMember error:', error);
        return false;
    }
    return true;
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

/** Record a payment */
export async function recordPayment(payment: Omit<DBPayment, 'id' | 'created_at'>): Promise<DBPayment | null> {
    const { data, error } = await supabase
        .from('party_payments')
        .insert(payment)
        .select()
        .single();
    if (error) {
        console.error('recordPayment error:', error);
        return null;
    }
    // Also update member paid status
    await updateMemberPaidStatus(payment.member_id, true);
    return data;
}

/** Get payments for a specific month/year */
export async function fetchPayments(month: number, year: number): Promise<DBPayment[]> {
    const { data, error } = await supabase
        .from('party_payments')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('fetchPayments error:', error);
        return [];
    }
    return data || [];
}

// ─── Conversion helpers ────────────────────────────

/** Convert DB format → app format */
export function dbToAppMember(db: DBPartyMember) {
    return {
        id: db.id,
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
    id: string; stt: number; hoTen: string; chucVu: string;
    ngayVaoDang: string; memberType: string; salary: number;
    region: string; feeAmount: number; note: string; paid: boolean;
}): DBPartyMember {
    return {
        id: app.id,
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
