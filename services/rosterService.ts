import { supabase } from './supabaseClient';

// ─── Types ──────────────────────────────────────────────
export interface RosterEvent {
    id?: string;
    user_id?: string;
    member_id: string;
    event_type: 'join' | 'leave';
    effective_month: number;
    effective_year: number;
    reason: string;
    created_at?: string;
}

export type MemberRosterStatus = 'active' | 'inactive';

// ─── Helpers ────────────────────────────────────────────
async function getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
}

/** Convert (month, year) to a comparable integer for sorting: year*100 + month */
function toMonthKey(month: number, year: number): number {
    return year * 100 + month;
}

// ─── Core Functions ─────────────────────────────────────

/**
 * Get the list of active member IDs for a given month/year.
 * Logic: A member is active if their latest event on or before the target month is 'join'.
 * Members with NO events at all are considered active (backward compatibility).
 */
export async function getActiveMemberIds(month: number, year: number): Promise<Set<string>> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return new Set();

        // Fetch all roster events for this user, up to the target month
        const { data, error } = await supabase
            .from('member_roster_history')
            .select('member_id, event_type, effective_month, effective_year')
            .eq('user_id', userId)
            .order('effective_year', { ascending: true })
            .order('effective_month', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('getActiveMemberIds error:', error);
            return new Set();
        }

        const targetKey = toMonthKey(month, year);

        // Group events by member, keep only events on or before target month
        const memberLatestEvent: Record<string, 'join' | 'leave'> = {};

        (data || []).forEach(row => {
            const eventKey = toMonthKey(row.effective_month, row.effective_year);
            if (eventKey <= targetKey) {
                memberLatestEvent[row.member_id] = row.event_type as 'join' | 'leave';
            }
        });

        // Also get ALL member IDs from party_members to handle members with no events
        const { data: allMembers, error: membersError } = await supabase
            .from('party_members')
            .select('id')
            .eq('user_id', userId);

        if (membersError) {
            console.error('getActiveMemberIds members error:', membersError);
            return new Set();
        }

        const activeIds = new Set<string>();
        (allMembers || []).forEach(m => {
            const latestEvent = memberLatestEvent[m.id];
            // If no event exists, member is considered active (backward compat)
            // If latest event is 'join', member is active
            // If latest event is 'leave', member is inactive
            if (latestEvent === undefined || latestEvent === 'join') {
                activeIds.add(m.id);
            }
        });

        return activeIds;
    } catch (err) {
        console.error('getActiveMemberIds exception:', err);
        return new Set();
    }
}

/**
 * Record a join event (member starts being active in the branch).
 */
export async function recordJoinEvent(
    memberId: string,
    effectiveMonth: number,
    effectiveYear: number,
    reason: string = 'Gia nhập chi bộ'
): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return false;

        const { error } = await supabase
            .from('member_roster_history')
            .insert({
                user_id: userId,
                member_id: memberId,
                event_type: 'join',
                effective_month: effectiveMonth,
                effective_year: effectiveYear,
                reason
            });

        if (error) {
            console.error('recordJoinEvent error:', error);
            return false;
        }
        return true;
    } catch { return false; }
}

/**
 * Record a leave event (member stops being active in the branch).
 */
export async function recordLeaveEvent(
    memberId: string,
    effectiveMonth: number,
    effectiveYear: number,
    reason: string = 'Chuyển sinh hoạt'
): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return false;

        const { error } = await supabase
            .from('member_roster_history')
            .insert({
                user_id: userId,
                member_id: memberId,
                event_type: 'leave',
                effective_month: effectiveMonth,
                effective_year: effectiveYear,
                reason
            });

        if (error) {
            console.error('recordLeaveEvent error:', error);
            return false;
        }
        return true;
    } catch { return false; }
}

/**
 * Get the full roster history for a specific member.
 */
export async function getRosterHistory(memberId: string): Promise<RosterEvent[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('member_roster_history')
            .select('*')
            .eq('user_id', userId)
            .eq('member_id', memberId)
            .order('effective_year', { ascending: true })
            .order('effective_month', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('getRosterHistory error:', error);
            return [];
        }
        return (data || []) as RosterEvent[];
    } catch { return []; }
}

/**
 * Get the status of a member for a specific month/year.
 * Returns 'active' or 'inactive'.
 */
export async function getMemberStatus(
    memberId: string,
    month: number,
    year: number
): Promise<MemberRosterStatus> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return 'active';

        const { data, error } = await supabase
            .from('member_roster_history')
            .select('event_type, effective_month, effective_year')
            .eq('user_id', userId)
            .eq('member_id', memberId)
            .order('effective_year', { ascending: true })
            .order('effective_month', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('getMemberStatus error:', error);
            return 'active';
        }

        const targetKey = toMonthKey(month, year);
        let latestEvent: 'join' | 'leave' | undefined;

        (data || []).forEach(row => {
            const eventKey = toMonthKey(row.effective_month, row.effective_year);
            if (eventKey <= targetKey) {
                latestEvent = row.event_type as 'join' | 'leave';
            }
        });

        // No events = active (backward compat)
        if (!latestEvent || latestEvent === 'join') return 'active';
        return 'inactive';
    } catch { return 'active'; }
}

/**
 * Batch-create join events for all members that don't have any events yet.
 * Used for migration: ensures all existing members are marked as "joined"
 * from a specific starting month.
 */
export async function migrateExistingMembers(
    startMonth: number = 1,
    startYear: number = 2026
): Promise<number> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return 0;

        // Get all member IDs
        const { data: allMembers } = await supabase
            .from('party_members')
            .select('id')
            .eq('user_id', userId);

        if (!allMembers || allMembers.length === 0) return 0;

        // Get member IDs that already have events
        const { data: existingEvents } = await supabase
            .from('member_roster_history')
            .select('member_id')
            .eq('user_id', userId);

        const membersWithEvents = new Set((existingEvents || []).map(e => e.member_id));

        // Insert join events for members without any events
        const newEvents = allMembers
            .filter(m => !membersWithEvents.has(m.id))
            .map(m => ({
                user_id: userId,
                member_id: m.id,
                event_type: 'join',
                effective_month: startMonth,
                effective_year: startYear,
                reason: 'Thành viên hiện tại (migration)'
            }));

        if (newEvents.length === 0) return 0;

        const { error } = await supabase
            .from('member_roster_history')
            .insert(newEvents);

        if (error) {
            console.error('migrateExistingMembers error:', error);
            return 0;
        }

        return newEvents.length;
    } catch { return 0; }
}
