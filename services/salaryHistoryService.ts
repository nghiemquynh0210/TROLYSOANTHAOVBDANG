import { supabase } from './supabaseClient';

// ─── Types ─────────────────────────────────────────
export interface SalaryHistoryEntry {
    id?: string;
    user_id?: string;
    member_id: string;
    old_salary: number;
    new_salary: number;
    effective_month: number;
    effective_year: number;
    reason: string;
    created_at?: string;
}

// ─── Helpers ───────────────────────────────────────
async function getCurrentUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.id) throw new Error('User not authenticated');
    return data.user.id;
}

// ─── CRUD ──────────────────────────────────────────

/** Fetch full salary history for a member, ordered by effective date */
export async function fetchSalaryHistory(memberId: string): Promise<SalaryHistoryEntry[]> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('member_salary_history')
            .select('*')
            .eq('user_id', userId)
            .eq('member_id', memberId)
            .order('effective_year', { ascending: false })
            .order('effective_month', { ascending: false });
        if (error) { console.error('fetchSalaryHistory:', error); return []; }
        return (data || []).map(d => ({
            ...d,
            old_salary: Number(d.old_salary) || 0,
            new_salary: Number(d.new_salary) || 0,
        }));
    } catch { return []; }
}

/** Fetch all salary changes in a specific month/year (across all members) */
export async function fetchMonthlySalaryChanges(month: number, year: number): Promise<SalaryHistoryEntry[]> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('member_salary_history')
            .select('*')
            .eq('user_id', userId)
            .eq('effective_month', month)
            .eq('effective_year', year)
            .order('created_at', { ascending: false });
        if (error) { console.error('fetchMonthlySalaryChanges:', error); return []; }
        return (data || []).map(d => ({
            ...d,
            old_salary: Number(d.old_salary) || 0,
            new_salary: Number(d.new_salary) || 0,
        }));
    } catch { return []; }
}

/** Create a new salary change record */
export async function createSalaryChange(entry: Omit<SalaryHistoryEntry, 'id' | 'created_at' | 'user_id'>): Promise<SalaryHistoryEntry | null> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('member_salary_history')
            .insert({ ...entry, user_id: userId })
            .select()
            .single();
        if (error) { console.error('createSalaryChange:', error); return null; }
        return data;
    } catch { return null; }
}

/**
 * Get the effective salary for a member at a given month/year.
 * Carry-forward logic: finds the most recent salary change <= the requested month/year.
 * If no history exists, returns the member's current salary (fallback).
 */
export async function getSalaryForMonth(
    memberId: string,
    month: number,
    year: number,
    fallbackSalary: number
): Promise<number> {
    try {
        const userId = await getCurrentUserId();
        // Find the most recent change where effective date <= requested date
        const { data, error } = await supabase
            .from('member_salary_history')
            .select('new_salary, effective_month, effective_year')
            .eq('user_id', userId)
            .eq('member_id', memberId)
            .or(
                `effective_year.lt.${year},and(effective_year.eq.${year},effective_month.lte.${month})`
            )
            .order('effective_year', { ascending: false })
            .order('effective_month', { ascending: false })
            .limit(1);
        if (error || !data || data.length === 0) return fallbackSalary;
        return Number(data[0].new_salary) || fallbackSalary;
    } catch { return fallbackSalary; }
}
/**
 * Get effective salaries for all members at a given month/year.
 * Returns a map of member_id -> effective_salary.
 */
export async function fetchAllSalariesForMonth(
    month: number,
    year: number
): Promise<Record<string, number>> {
    try {
        const userId = await getCurrentUserId();
        // Fetch all history entries for this user that are effective on or before target date
        const { data, error } = await supabase
            .from('member_salary_history')
            .select('member_id, new_salary, effective_month, effective_year')
            .eq('user_id', userId)
            .or(
                `effective_year.lt.${year},and(effective_year.eq.${year},effective_month.lte.${month})`
            )
            .order('member_id')
            .order('effective_year', { ascending: false })
            .order('effective_month', { ascending: false });

        if (error) { console.error('fetchAllSalariesForMonth:', error); return {}; }

        const salaryMap: Record<string, number> = {};
        // Since we ordered by effective date desc, the first entry for each member_id is the most recent one
        (data || []).forEach(d => {
            if (!salaryMap[d.member_id]) {
                salaryMap[d.member_id] = Number(d.new_salary) || 0;
            }
        });
        return salaryMap;
    } catch { return {}; }
}
