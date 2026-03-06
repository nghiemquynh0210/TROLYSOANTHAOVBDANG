import { supabase } from './supabaseClient';

// ─── Types ─────────────────────────────────────────
export interface FinanceEntry {
    id?: string;
    user_id?: string;
    entry_date: string;          // YYYY-MM-DD
    ref_number: string;          // Số hiệu chứng từ
    description: string;         // Diễn giải
    entry_type: 'auto_dang_phi' | 'manual';
    // Phần thu
    thu_dang_phi: number;        // (1) Đảng phí
    thu_kinh_phi_cap_tren: number; // (2) Kinh phí cấp trên cấp
    thu_khac: number;            // (3) Thu khác
    // Phần chi
    chi_bao_tap_chi: number;     // (5) Báo, tạp chí
    chi_dai_hoi: number;         // (6) Đại hội
    chi_khen_thuong: number;     // (7) Khen thưởng
    chi_ho_tro: number;          // (8) Chi hỗ trợ
    chi_phu_cap_cap_uy: number;  // (9) Phụ cấp cấp ủy
    chi_khac: number;            // (10) Chi khác
    // Meta
    month: number;
    year: number;
    created_at?: string;
}

// ─── Constants ─────────────────────────────────────
export const INCOME_FIELDS: { key: keyof FinanceEntry; label: string; code: number }[] = [
    { key: 'thu_dang_phi', label: 'Đảng phí', code: 1 },
    { key: 'thu_kinh_phi_cap_tren', label: 'KP cấp trên cấp', code: 2 },
    { key: 'thu_khac', label: 'Thu khác', code: 3 },
];

export const EXPENSE_FIELDS: { key: keyof FinanceEntry; label: string; code: number }[] = [
    { key: 'chi_bao_tap_chi', label: 'Báo, tạp chí', code: 5 },
    { key: 'chi_dai_hoi', label: 'Đại hội', code: 6 },
    { key: 'chi_khen_thuong', label: 'Khen thưởng', code: 7 },
    { key: 'chi_ho_tro', label: 'Chi hỗ trợ', code: 8 },
    { key: 'chi_phu_cap_cap_uy', label: 'PC cấp ủy', code: 9 },
    { key: 'chi_khac', label: 'Chi khác', code: 10 },
];

export function calcTotalIncome(e: FinanceEntry): number {
    return (e.thu_dang_phi || 0) + (e.thu_kinh_phi_cap_tren || 0) + (e.thu_khac || 0);
}

export function calcTotalExpense(e: FinanceEntry): number {
    return (e.chi_bao_tap_chi || 0) + (e.chi_dai_hoi || 0) + (e.chi_khen_thuong || 0)
        + (e.chi_ho_tro || 0) + (e.chi_phu_cap_cap_uy || 0) + (e.chi_khac || 0);
}

export function emptyEntry(month: number, year: number): FinanceEntry {
    return {
        entry_date: `${year}-${String(month).padStart(2, '0')}-01`,
        ref_number: '',
        description: '',
        entry_type: 'manual',
        thu_dang_phi: 0, thu_kinh_phi_cap_tren: 0, thu_khac: 0,
        chi_bao_tap_chi: 0, chi_dai_hoi: 0, chi_khen_thuong: 0,
        chi_ho_tro: 0, chi_phu_cap_cap_uy: 0, chi_khac: 0,
        month, year,
    };
}

// ─── Helpers ───────────────────────────────────────
async function getCurrentUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.id) throw new Error('User not authenticated');
    return data.user.id;
}

// ─── CRUD ──────────────────────────────────────────

/** Fetch entries for a given month/year */
export async function fetchFinanceEntries(month: number, year: number): Promise<FinanceEntry[]> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('party_finance_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year)
            .order('entry_date', { ascending: true });
        if (error) { console.error('fetchFinanceEntries:', error); return []; }
        return (data || []).map(d => ({
            ...d,
            thu_dang_phi: Number(d.thu_dang_phi) || 0,
            thu_kinh_phi_cap_tren: Number(d.thu_kinh_phi_cap_tren) || 0,
            thu_khac: Number(d.thu_khac) || 0,
            chi_bao_tap_chi: Number(d.chi_bao_tap_chi) || 0,
            chi_dai_hoi: Number(d.chi_dai_hoi) || 0,
            chi_khen_thuong: Number(d.chi_khen_thuong) || 0,
            chi_ho_tro: Number(d.chi_ho_tro) || 0,
            chi_phu_cap_cap_uy: Number(d.chi_phu_cap_cap_uy) || 0,
            chi_khac: Number(d.chi_khac) || 0,
        }));
    } catch { return []; }
}

/** Create a new entry */
export async function createFinanceEntry(entry: Omit<FinanceEntry, 'id' | 'created_at' | 'user_id'>): Promise<FinanceEntry | null> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('party_finance_entries')
            .insert({ ...entry, user_id: userId })
            .select()
            .single();
        if (error) { console.error('createFinanceEntry:', error); return null; }
        return data;
    } catch { return null; }
}

/** Update an entry */
export async function updateFinanceEntry(id: string, updates: Partial<FinanceEntry>): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('party_finance_entries')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId);
        if (error) { console.error('updateFinanceEntry:', error); return false; }
        return true;
    } catch { return false; }
}

/** Delete an entry */
export async function deleteFinanceEntry(id: string): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('party_finance_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) { console.error('deleteFinanceEntry:', error); return false; }
        return true;
    } catch { return false; }
}

/** Calculate opening balance = sum(income - expense) of ALL entries BEFORE this month */
export async function calculateOpeningBalance(month: number, year: number): Promise<number> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('party_finance_entries')
            .select('thu_dang_phi, thu_kinh_phi_cap_tren, thu_khac, chi_bao_tap_chi, chi_dai_hoi, chi_khen_thuong, chi_ho_tro, chi_phu_cap_cap_uy, chi_khac, month, year')
            .eq('user_id', userId);
        if (error || !data) return 0;

        let balance = 0;
        for (const row of data) {
            // Only count entries from months BEFORE the requested month
            if (row.year < year || (row.year === year && row.month < month)) {
                const inc = (Number(row.thu_dang_phi) || 0) + (Number(row.thu_kinh_phi_cap_tren) || 0) + (Number(row.thu_khac) || 0);
                const exp = (Number(row.chi_bao_tap_chi) || 0) + (Number(row.chi_dai_hoi) || 0) + (Number(row.chi_khen_thuong) || 0)
                    + (Number(row.chi_ho_tro) || 0) + (Number(row.chi_phu_cap_cap_uy) || 0) + (Number(row.chi_khac) || 0);
                balance += inc - exp;
            }
        }
        return balance;
    } catch { return 0; }
}
