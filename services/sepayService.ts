/**
 * SePay REST API Service
 * Gọi SePay API để lấy danh sách giao dịch và so khớp với đảng viên
 * 
 * API Docs: https://my.sepay.vn/userapi/transactions/list
 * Auth: Bearer token trong header Authorization
 */

declare const process: { env: Record<string, string> };

const SEPAY_API_URL = '/api/sepay/userapi/transactions/list';
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || '';

// ─── Types ─────────────────────────────────────────

/** Raw response from SePay API */
interface SepayRawTransaction {
    id: string;
    bank_brand_name: string;
    account_number: string;
    transaction_date: string;       // "YYYY-MM-DD HH:mm:ss"
    amount_out: string;             // "0.00"
    amount_in: string;              // "46800.00"
    accumulated: string;            // "0.00"
    transaction_content: string;
    code: string | null;
    reference_number: string;
    sub_account: string | null;
    bank_account_id: string;
}

/** Normalized transaction used internally */
export interface SepayTransaction {
    id: string;
    gateway: string;
    transaction_date: string;
    account_number: string;
    sub_account: string | null;
    transfer_type: 'in' | 'out';
    transfer_amount: number;
    accumulated: number;
    code: string | null;
    transaction_content: string;
    reference_number: string;
    description: string;
}

interface SepayRawApiResponse {
    status: number;
    error: string | null;
    messages: {
        success: boolean;
    };
    transactions: SepayRawTransaction[];
}

export interface MatchResult {
    transaction: SepayTransaction;
    memberId: string | null;
    memberName: string | null;
    confidence: 'exact' | 'partial' | 'none';
    matchedBy: string;
}

// ─── Normalize helpers ────────────────────────────

/** Convert raw SePay API transaction to our normalized format */
function normalizeTransaction(raw: SepayRawTransaction): SepayTransaction {
    const amountIn = parseFloat(raw.amount_in) || 0;
    const amountOut = parseFloat(raw.amount_out) || 0;
    return {
        id: String(raw.id),
        gateway: raw.bank_brand_name || '',
        transaction_date: raw.transaction_date,
        account_number: raw.account_number,
        sub_account: raw.sub_account,
        transfer_type: amountIn > 0 ? 'in' : 'out',
        transfer_amount: amountIn > 0 ? amountIn : amountOut,
        accumulated: parseFloat(raw.accumulated) || 0,
        code: raw.code,
        transaction_content: raw.transaction_content || '',
        reference_number: raw.reference_number || '',
        description: raw.transaction_content || ''
    };
}

/** Remove Vietnamese diacritics for fuzzy matching */
function removeDiacritics(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

/** Normalize a name for comparison: lowercase, no diacritics, trim spaces */
function normalizeName(name: string): string {
    return removeDiacritics(name)
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

// ─── API Calls ────────────────────────────────────

/**
 * Fetch transactions from SePay API
 * @param fromDate - Start date (YYYY-MM-DD)
 * @param toDate - End date (YYYY-MM-DD), optional
 * @param limit - Max results (default 100)
 */
export async function fetchSepayTransactions(
    fromDate?: string,
    toDate?: string,
    limit: number = 100
): Promise<{ transactions: SepayTransaction[]; error: string | null }> {
    if (!SEPAY_API_KEY) {
        return { transactions: [], error: 'Chưa cấu hình SePay API Key (VITE_SEPAY_API_KEY)' };
    }

    try {
        const params = new URLSearchParams();
        if (fromDate) params.append('transaction_date_min', fromDate);
        if (toDate) params.append('transaction_date_max', toDate + ' 23:59:59');
        params.append('limit', String(limit));

        const url = `${SEPAY_API_URL}?${params.toString()}`;
        console.log('[SePay] Fetching:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SEPAY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[SePay] API Error:', response.status, errText);
            return {
                transactions: [],
                error: `SePay API lỗi ${response.status}: ${errText.slice(0, 200)}`
            };
        }

        const data: SepayRawApiResponse = await response.json();
        console.log('[SePay] Raw response:', JSON.stringify(data).slice(0, 500));

        if (!data.messages?.success) {
            return { transactions: [], error: data.error || 'SePay trả về lỗi không xác định' };
        }

        // Normalize and filter incoming transactions (tiền vào)
        const all = (data.transactions || []).map(normalizeTransaction);
        const incoming = all.filter(t => t.transfer_type === 'in');
        console.log(`[SePay] Got ${all.length} total, ${incoming.length} incoming transactions`);

        return { transactions: incoming, error: null };
    } catch (err) {
        console.error('[SePay] Network error:', err);
        return {
            transactions: [],
            error: `Lỗi kết nối SePay: ${err instanceof Error ? err.message : String(err)}`
        };
    }
}

// ─── Transaction Matching ─────────────────────────

/**
 * Parse the transfer content to extract month range/year and member name
 * Supported formats:
 *   "DP T03/2026 Nguyen Van A"       → single month
 *   "DP T032026 Nguyen Van A"        → single month (no separator)
 *   "DP T03-T06/2026 Nguyen Van A"   → month range
 *   "DP T03-06/2026 Nguyen Van A"    → month range (short)
 *   "DP T03-T12 2026 Nguyen Van A"   → month range
 *   "DP 2026 Nguyen Van A"           → full year (T01-T12)
 *   "DANGPHI T03/2026 ..."           → alternative prefix
 */
function parseTransferContent(content: string): {
    startMonth: number | null;
    endMonth: number | null;
    year: number | null;
    memberName: string | null;
} {
    if (!content) return { startMonth: null, endMonth: null, year: null, memberName: null };

    const normalized = content.trim().toUpperCase();

    // Pattern A: Month range  "DP T03-T06/2026 Name" or "DP T03-06/2026 Name" or "DP T03-T12 2026 Name"
    const rangePatterns = [
        /(?:DP|DANG\s*PHI)\s*T(\d{1,2})\s*[-–]\s*T?(\d{1,2})\s*[\/\-]?\s*(\d{4})\s+(.+)/i,
        /T(\d{1,2})\s*[-–]\s*T?(\d{1,2})\s*[\/\-]\s*(\d{4})\s+(.+)/i,
    ];
    for (const pattern of rangePatterns) {
        const match = normalized.match(pattern);
        if (match) {
            return {
                startMonth: parseInt(match[1], 10),
                endMonth: parseInt(match[2], 10),
                year: parseInt(match[3], 10),
                memberName: match[4].trim()
            };
        }
    }

    // Pattern B: Full year "DP 2026 Nguyen Van A" (no month → all 12 months)
    const yearPattern = /(?:DP|DANG\s*PHI)\s+(\d{4})\s+(.+)/i;
    const yearMatch = normalized.match(yearPattern);
    if (yearMatch) {
        return {
            startMonth: 1,
            endMonth: 12,
            year: parseInt(yearMatch[1], 10),
            memberName: yearMatch[2].trim()
        };
    }

    // Pattern C: Single month "DP T03/2026 Name" or "DP T032026 Name"
    const singlePatterns = [
        /(?:DP|DANG\s*PHI)\s*T(\d{1,2})[\/\-]?(\d{4})\s+(.+)/i,
        /(?:DP|DANG\s*PHI)\s*T(\d{1,2})\s*(\d{4})\s+(.+)/i,
        /T(\d{1,2})[\/\-](\d{4})\s+(.+)/i,
    ];
    for (const pattern of singlePatterns) {
        const match = normalized.match(pattern);
        if (match) {
            const m = parseInt(match[1], 10);
            return {
                startMonth: m,
                endMonth: m,
                year: parseInt(match[2], 10),
                memberName: match[3].trim()
            };
        }
    }

    return { startMonth: null, endMonth: null, year: null, memberName: null };
}

/**
 * Match SePay transactions against party members for a specific month/year
 */
export function matchTransactionsToMembers(
    transactions: SepayTransaction[],
    members: { id: string; hoTen: string; feeAmount: number }[],
    targetMonth: number,
    targetYear: number
): MatchResult[] {
    const results: MatchResult[] = [];

    for (const tx of transactions) {
        const parsed = parseTransferContent(tx.transaction_content);

        // Check if targetMonth falls within the parsed month range
        const monthInRange = parsed.startMonth && parsed.endMonth && parsed.year === targetYear
            && targetMonth >= parsed.startMonth && targetMonth <= parsed.endMonth;

        if (!monthInRange) {
            const rangeLabel = parsed.startMonth && parsed.endMonth && parsed.startMonth !== parsed.endMonth
                ? `T${parsed.startMonth}-T${parsed.endMonth}/${parsed.year}`
                : parsed.startMonth ? `T${parsed.startMonth}/${parsed.year}` : null;
            results.push({
                transaction: tx,
                memberId: null,
                memberName: null,
                confidence: 'none',
                matchedBy: rangeLabel
                    ? `Tháng không khớp (${rangeLabel} ≠ T${targetMonth}/${targetYear})`
                    : 'Không đọc được nội dung CK'
            });
            continue;
        }

        if (!parsed.memberName) {
            results.push({
                transaction: tx,
                memberId: null,
                memberName: null,
                confidence: 'none',
                matchedBy: 'Không tìm thấy tên trong nội dung CK'
            });
            continue;
        }

        const txName = normalizeName(parsed.memberName);

        // Try exact match first
        let matched = false;
        for (const member of members) {
            const memberNorm = normalizeName(member.hoTen);

            if (txName === memberNorm) {
                results.push({
                    transaction: tx,
                    memberId: member.id,
                    memberName: member.hoTen,
                    confidence: 'exact',
                    matchedBy: `Tên khớp chính xác: "${member.hoTen}"`
                });
                matched = true;
                break;
            }
        }

        // Try partial match (name contains)
        if (!matched) {
            for (const member of members) {
                const memberNorm = normalizeName(member.hoTen);

                if (txName.includes(memberNorm) || memberNorm.includes(txName)) {
                    results.push({
                        transaction: tx,
                        memberId: member.id,
                        memberName: member.hoTen,
                        confidence: 'partial',
                        matchedBy: `Tên gần đúng: "${member.hoTen}"`
                    });
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            results.push({
                transaction: tx,
                memberId: null,
                memberName: null,
                confidence: 'none',
                matchedBy: `Không tìm thấy đảng viên tên "${parsed.memberName}"`
            });
        }
    }

    return results;
}

/**
 * Get date range for a specific month/year
 * Mở rộng phạm vi tìm kiếm: từ đầu tháng trước đến cuối tháng hiện tại
 * Vì đảng viên có thể nộp phí tháng sau từ tháng trước
 */
export function getMonthDateRange(month: number, year: number): { fromDate: string; toDate: string } {
    // Start from 1st of previous month (people may pay early)
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const fromDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    // End at last day of target month
    const lastDay = new Date(year, month, 0).getDate();
    const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { fromDate, toDate };
}

/**
 * Full flow: fetch transactions and match for a month
 */
export async function checkPaymentsForMonth(
    members: { id: string; hoTen: string; feeAmount: number }[],
    month: number,
    year: number
): Promise<{ results: MatchResult[]; error: string | null }> {
    const { fromDate, toDate } = getMonthDateRange(month, year);
    const { transactions, error } = await fetchSepayTransactions(fromDate, toDate);

    if (error) {
        return { results: [], error };
    }

    const results = matchTransactionsToMembers(transactions, members, month, year);
    return { results, error: null };
}
