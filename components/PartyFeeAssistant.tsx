
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    MEMBER_TYPES, MINIMUM_WAGES, calculatePartyFee, calculateRetention,
    MemberType, RETENTION_RATES, BANK_CONFIG, getVietQRUrl,
    getMinimumWages, setMinimumWages, DEFAULT_MINIMUM_WAGES
} from '../data/partyFee';
import {
    Calculator, Wallet, Info, AlertTriangle, ChevronUp,
    Users, CheckCircle2, HelpCircle, FileText, ClipboardPaste,
    Trash2, Download, Plus, UserPlus, X, Printer, Table2,
    Copy, ClipboardCheck, BarChart3, Shield, Clock, Target, FileSpreadsheet,
    QrCode, Share2, Settings, BookOpen, PlusCircle, Pencil
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    fetchMembers as fetchDbMembers, syncAllMembers,
    upsertMember, deleteMember as deleteDbMember, deleteAllMembers,
    recordPayment, fetchPayments, fetchYearToDateTotals, dbToAppMember, appToDbMember
} from '../services/paymentService';
import {
    fetchPartySettings, upsertPartySettings, PartySettings
} from '../services/partySettingsService';
import { checkPaymentsForMonth, MatchResult } from '../services/sepayService';
import {
    FinanceEntry, fetchFinanceEntries, createFinanceEntry, updateFinanceEntry,
    deleteFinanceEntry, calculateOpeningBalance, calcTotalIncome, calcTotalExpense,
    INCOME_FIELDS, EXPENSE_FIELDS, emptyEntry
} from '../services/financeService';
import * as salaryHistoryService from '../services/salaryHistoryService';
import { SalaryHistoryEntry } from '../services/salaryHistoryService';
import { parseExcelToMembers } from '../services/fileParserService';
import * as rosterService from '../services/rosterService';
import { Search, Landmark, RefreshCw, History, Upload, ArrowRightLeft, LogIn, LogOut } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

// ─── Types ───────────────────────────────────────────
interface PartyMember {
    id: string;
    stt: number;
    hoTen: string;
    chucVu: string;
    ngayVaoDang: string;
    memberType: MemberType;
    salary: number;       // lương / lương hưu / trợ cấp tuỳ loại
    region: string;
    feeAmount: number;
    note: string;
    paid: boolean;        // Trạng thái đã nộp đảng phí
}

type TabMode = 'calculator' | 'memberlist' | 'report' | 'finance' | 'settings';

// ─── localStorage helpers ────────────────────────────
const STORAGE_KEY = 'party_fee_members';
function loadMembers(userId?: string): PartyMember[] {
    try {
        const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}
function saveMembers(list: PartyMember[], userId?: string) {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(list));
}

// ─── Excel paste parser ──────────────────────────────
function parseExcelPaste(raw: string): Partial<PartyMember>[] {
    const lines = raw.trim().split('\n').filter(l => l.trim());
    return lines.map((line, idx) => {
        const cols = line.split('\t').map(c => c.trim());
        // Heuristic: try to detect common column layouts
        // Typical: STT | Họ tên | Chức vụ | Ngày vào Đảng | Lương/Trợ cấp
        // Or just: Họ tên | Chức vụ
        // We'll be flexible: first non-numeric col is name
        let stt = idx + 1;
        let hoTen = '';
        let chucVu = '';
        let ngayVaoDang = '';
        let salary = 0;

        if (cols.length >= 5) {
            // Full format: STT | Họ tên | Chức vụ | Ngày vào Đảng | Lương
            stt = parseInt(cols[0]) || idx + 1;
            hoTen = cols[1];
            chucVu = cols[2];
            ngayVaoDang = cols[3];
            salary = parseNumber(cols[4]);
        } else if (cols.length === 4) {
            // STT | Họ tên | Chức vụ | Lương/Ngày
            stt = parseInt(cols[0]) || idx + 1;
            hoTen = cols[1];
            chucVu = cols[2];
            const last = cols[3];
            if (parseNumber(last) > 0) salary = parseNumber(last);
            else ngayVaoDang = last;
        } else if (cols.length === 3) {
            if (isNaN(parseInt(cols[0]))) {
                hoTen = cols[0]; chucVu = cols[1]; salary = parseNumber(cols[2]);
            } else {
                stt = parseInt(cols[0]); hoTen = cols[1]; chucVu = cols[2];
            }
        } else if (cols.length === 2) {
            hoTen = cols[0]; chucVu = cols[1];
        } else if (cols.length === 1) {
            hoTen = cols[0];
        }

        return { stt, hoTen, chucVu, ngayVaoDang, salary };
    });
}

function parseNumber(s: string): number {
    const cleaned = s.replace(/[.,\s]/g, '').replace(/đ$/i, '');
    return parseInt(cleaned) || 0;
}

// ─── Component ───────────────────────────────────────
const PartyFeeAssistant: React.FC = () => {
    const [tabMode, setTabMode] = useState<TabMode>('calculator');

    // Calculator state
    const [selectedType, setSelectedType] = useState<MemberType>('bhxh');
    const [salary, setSalary] = useState<string>('');
    const [pension, setPension] = useState<string>('');
    const [extraIncome, setExtraIncome] = useState<string>('');
    const [allowance, setAllowance] = useState<string>('');
    const [region, setRegion] = useState<string>('Vùng I');
    const [showGuide, setShowGuide] = useState(false);

    // Report state
    const now = new Date();
    const [reportCopied, setReportCopied] = useState(false);
    const [showTextReport, setShowTextReport] = useState(false);

    // Member list state
    const [members, setMembers] = useState<PartyMember[]>([]);
    const [supabaseSynced, setSupabaseSynced] = useState(false);

    // Settings state
    const [settings, setSettings] = useState<PartySettings>({
        branch_name: '',
        superior_party: '',
        bank_name: 'MB Bank',
        bank_account_number: '',
        account_holder_name: '',
        sepay_api_key: ''
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [showPasteArea, setShowPasteArea] = useState(false);
    const [defaultRegion, setDefaultRegion] = useState('Vùng I');
    const [qrMember, setQrMember] = useState<PartyMember | null>(null);
    const [defaultType, setDefaultType] = useState<MemberType>('bhxh');

    // SePay integration state
    const [sepayChecking, setSepayChecking] = useState(false);
    const [sepayResults, setSepayResults] = useState<MatchResult[] | null>(null);
    const [sepayError, setSepayError] = useState<string | null>(null);
    const [showSepayModal, setShowSepayModal] = useState(false);

    // Monthly payment tracking state
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [monthlyPaidMap, setMonthlyPaidMap] = useState<Record<string, boolean>>({});
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    // Editable minimum wage state
    const [userId, setUserId] = useState<string | null>(null);
    const [showWageSettings, setShowWageSettings] = useState(false);
    const [editWages, setEditWages] = useState<Record<string, number>>(DEFAULT_MINIMUM_WAGES);
    const [wagesSaved, setWagesSaved] = useState(false);

    // Finance tab state
    const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
    const [financeOpeningBalance, setFinanceOpeningBalance] = useState(0);
    const [financeLoading, setFinanceLoading] = useState(false);
    const [showFinanceForm, setShowFinanceForm] = useState(false);
    const [editingFinanceEntry, setEditingFinanceEntry] = useState<FinanceEntry | null>(null);

    // Salary adjustment modal state
    const [salaryModal, setSalaryModal] = useState<{
        open: boolean;
        memberId: string;
        memberName: string;
        oldSalary: number;
        newSalary: number;
        effectiveMonth: number;
        effectiveYear: number;
        reason: string;
    }>({ open: false, memberId: '', memberName: '', oldSalary: 0, newSalary: 0, effectiveMonth: new Date().getMonth() + 1, effectiveYear: new Date().getFullYear(), reason: '' });
    // Salary history popup state
    const [salaryHistoryPopup, setSalaryHistoryPopup] = useState<{ open: boolean; memberId: string; memberName: string; entries: SalaryHistoryEntry[] }>({ open: false, memberId: '', memberName: '', entries: [] });
    // Monthly salary changes summary
    const [monthlySalaryChanges, setMonthlySalaryChanges] = useState<SalaryHistoryEntry[]>([]);
    // Effective salaries map (memberId -> salary) for the selected month/year
    const [effectiveSalaries, setEffectiveSalaries] = useState<Record<string, number>>({});

    // Year-to-date payment totals (actual data from party_payments)
    const [ytdTotals, setYtdTotals] = useState<{ monthlyTotals: Record<number, number>; grandTotal: number }>({ monthlyTotals: {}, grandTotal: 0 });

    // Roster (monthly member tracking) state
    const [activeMemberIds, setActiveMemberIds] = useState<Set<string>>(new Set());
    const [rosterLoaded, setRosterLoaded] = useState(false);
    const [transferModal, setTransferModal] = useState<{
        open: boolean;
        type: 'leave' | 'join';
        memberId: string;
        memberName: string;
        month: number;
        year: number;
        reason: string;
    }>({ open: false, type: 'leave', memberId: '', memberName: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), reason: '' });

    // Import state
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Custom confirm modal state
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        title: string;
        message: string;
        type: 'warning' | 'success' | 'info';
    }>({ open: false, title: '', message: '', type: 'warning' });
    const confirmResolveRef = React.useRef<((v: boolean) => void) | null>(null);

    const showConfirm = useCallback((message: string, title = 'Xác nhận', type: 'warning' | 'success' | 'info' = 'warning'): Promise<boolean> => {
        return new Promise(resolve => {
            confirmResolveRef.current = resolve;
            setConfirmState({ open: true, title, message, type });
        });
    }, []);

    const handleConfirmResult = useCallback((result: boolean) => {
        confirmResolveRef.current?.(result);
        confirmResolveRef.current = null;
        setConfirmState(prev => ({ ...prev, open: false }));
    }, []);

    // Load payment data + active roster for selected month/year
    useEffect(() => {
        const loadPaymentsAndRoster = async () => {
            setPaymentsLoading(true);
            try {
                const [payments, effSals, activeIds] = await Promise.all([
                    fetchPayments(selectedMonth, selectedYear),
                    salaryHistoryService.fetchAllSalariesForMonth(selectedMonth, selectedYear),
                    rosterService.getActiveMemberIds(selectedMonth, selectedYear)
                ]);
                const paidMap: Record<string, boolean> = {};
                payments.forEach(p => {
                    if (p.paid) paidMap[p.member_id] = true;
                });
                setMonthlyPaidMap(paidMap);
                setEffectiveSalaries(effSals);
                setActiveMemberIds(activeIds);
                setRosterLoaded(true);
            } catch {
                console.warn('Failed to load payments/roster');
            }
            setPaymentsLoading(false);
        };
        loadPaymentsAndRoster();
    }, [selectedMonth, selectedYear]);

    // Load monthly salary changes summary
    useEffect(() => {
        const loadSalaryChanges = async () => {
            try {
                const changes = await salaryHistoryService.fetchMonthlySalaryChanges(selectedMonth, selectedYear);
                setMonthlySalaryChanges(changes);
            } catch {
                console.warn('Failed to load salary changes');
            }
        };
        loadSalaryChanges();
    }, [selectedMonth, selectedYear, tabMode]);

    // Auto-load finance entries & YTD totals when month/year changes or when entering report/finance tabs
    useEffect(() => {
        const loadFinanceAndYTD = async () => {
            try {
                const [entries, opening, ytd] = await Promise.all([
                    fetchFinanceEntries(selectedMonth, selectedYear),
                    calculateOpeningBalance(selectedMonth, selectedYear),
                    fetchYearToDateTotals(selectedYear, selectedMonth)
                ]);
                setFinanceEntries(entries.filter(e => e.entry_type !== 'auto_dang_phi'));
                setFinanceOpeningBalance(opening);
                setYtdTotals(ytd);
            } catch {
                console.warn('Failed to load finance/YTD data');
            }
        };
        loadFinanceAndYTD();
    }, [selectedMonth, selectedYear, tabMode]);

    // Toggle paid status for a member in selected month
    const toggleMonthlyPaid = useCallback(async (memberId: string, memberName: string, currentlyPaid: boolean) => {
        const action = currentlyPaid
            ? `Chuyển "${memberName}" về CHƯA NỘP tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}?`
            : `Xác nhận "${memberName}" ĐÃ NỘP đảng phí tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}?`;
        const confirmed = await showConfirm(action, currentlyPaid ? 'Thu hồi' : 'Xác nhận thanh toán', currentlyPaid ? 'warning' : 'success');
        if (!confirmed) return;
        if (currentlyPaid) {
            // Mark as unpaid: remove payment record
            const { supabase } = await import('../services/supabaseClient');
            await supabase.from('party_payments').delete()
                .eq('member_id', memberId)
                .eq('month', selectedMonth)
                .eq('year', selectedYear);
            setMonthlyPaidMap(prev => ({ ...prev, [memberId]: false }));
        } else {
            // Mark as paid: create payment record
            const member = members.find(m => m.id === memberId);
            await recordPayment({
                member_id: memberId,
                amount: member?.feeAmount || 0,
                month: selectedMonth,
                year: selectedYear,
                paid: true,
                payment_method: 'manual',
                note: `Đảng phí T${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
            });
            setMonthlyPaidMap(prev => ({ ...prev, [memberId]: true }));
        }
    }, [selectedMonth, selectedYear, members, showConfirm]);

    // Filter + sort members by Vietnamese name (A→Z by TÊN — last word)
    // Now also filters by active roster for the selected month
    const filteredMembers = useMemo(() => {
        const getLastName = (fullName: string) => {
            const parts = fullName.trim().split(/\s+/);
            return parts[parts.length - 1] || '';
        };
        const sortFn = (a: PartyMember, b: PartyMember) => {
            const lastA = getLastName(a.hoTen);
            const lastB = getLastName(b.hoTen);
            const cmp = lastA.localeCompare(lastB, 'vi');
            return cmp !== 0 ? cmp : a.hoTen.localeCompare(b.hoTen, 'vi');
        };
        // Step 1: Filter by active roster (if loaded)
        const rosterFiltered = rosterLoaded && activeMemberIds.size > 0
            ? members.filter(m => activeMemberIds.has(m.id))
            : members;
        // Step 2: Apply search filter
        const searchFiltered = searchTerm.trim()
            ? rosterFiltered.filter(m =>
                m.hoTen.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                m.chucVu.toLowerCase().includes(searchTerm.toLowerCase().trim())
            )
            : rosterFiltered;
        // Step 3: Apply effective salaries + sort
        return searchFiltered.map(m => {
            const effectiveSalary = effectiveSalaries[m.id] !== undefined ? effectiveSalaries[m.id] : m.salary;
            if (effectiveSalary === m.salary) return m;
            const fee = calculatePartyFee(m.loaiHinh || 'bhxh', {
                salary: effectiveSalary,
                region: m.vung || 'Vùng I'
            });
            return { ...m, salary: effectiveSalary, feeAmount: fee.amount };
        }).sort(sortFn);
    }, [members, searchTerm, effectiveSalaries, activeMemberIds, rosterLoaded]);

    // Inactive members for the current month (for display purposes)
    const inactiveMembers = useMemo(() => {
        if (!rosterLoaded || activeMemberIds.size === 0) return [];
        return members.filter(m => !activeMemberIds.has(m.id));
    }, [members, activeMemberIds, rosterLoaded]);

    // ─── Calculator logic ────────────────────
    const typeInfo = useMemo(() =>
        MEMBER_TYPES.find(t => t.key === selectedType)!,
        [selectedType]
    );

    const result = useMemo(() => {
        return calculatePartyFee(selectedType, {
            salary: parseFloat(salary) || 0,
            pension: parseFloat(pension) || 0,
            extraIncome: parseFloat(extraIncome) || 0,
            allowance: parseFloat(allowance) || 0,
            region
        });
    }, [selectedType, salary, pension, extraIncome, allowance, region]);

    const yearlyAmount = result.amount * 12;
    const retention = calculateRetention(result.amount);

    const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ';

    const resetInputs = () => {
        setSalary(''); setPension(''); setExtraIncome(''); setAllowance('');
    };

    // ─── Member list logic ───────────────────
    const recalcFee = useCallback((m: Partial<PartyMember> & { memberType: MemberType; salary: number; region: string }): number => {
        const typeInfo = MEMBER_TYPES.find(t => t.key === m.memberType);
        if (!typeInfo) return 0;
        if (typeInfo.fixedAmount) return typeInfo.fixedAmount;
        if (typeInfo.exemptMsg) return 0;

        const r = calculatePartyFee(m.memberType, {
            salary: typeInfo.needsSalary ? m.salary : 0,
            pension: (typeInfo.needsPension) ? m.salary : 0,
            allowance: typeInfo.needsAllowance ? m.salary : 0,
            region: m.region
        });
        return r.amount;
    }, []);

    const persistMembers = useCallback((list: PartyMember[]) => {
        setMembers(list);
        saveMembers(list, userId || undefined);
        // Async sync to Supabase
        syncAllMembers(list.map(appToDbMember)).then(ok => {
            if (ok) setSupabaseSynced(true);
        });
    }, [userId]);

    // Load data from Supabase on mount
    useEffect(() => {
        const initData = async () => {
            setSettingsLoading(true);
            try {
                // Get current user ID for storage scoping
                const { supabase } = await import('../services/supabaseClient');
                const { data: { user } } = await supabase.auth.getUser();
                const currentId = user?.id || null;
                setUserId(currentId);

                // Initialize wages with per-user settings
                setEditWages(getMinimumWages(currentId || undefined));

                // Fetch members
                const dbList = await fetchDbMembers();
                if (dbList.length > 0) {
                    const appList = dbList.map(dbToAppMember) as PartyMember[];
                    setMembers(appList);
                    saveMembers(appList, currentId || undefined);
                    setSupabaseSynced(true);
                } else if (currentId) {
                    // Try to load from user-specific localStorage as fallback
                    const local = loadMembers(currentId);
                    if (local.length > 0) {
                        setMembers(local);
                        syncAllMembers(local.map(appToDbMember)).then(ok => {
                            if (ok) setSupabaseSynced(true);
                        });
                    } else {
                        // Truly new user: check global legacy storage (optional migration path)
                        // If we want a clean slate for brand new accounts, we SHOULD NOT 
                        // pull from global 'party_fee_members' if it belongs to someone else.
                        // However, to help the very first migration, we check if global exists.
                        // CRITICAL: For "Tài khoản mới hoàn toàn mới", we ensure it's empty.
                        setMembers([]);
                    }
                }

                // Fetch settings
                const dbSettings = await fetchPartySettings();
                if (dbSettings) setSettings(dbSettings);

                // Migrate existing members to roster (one-time)
                await rosterService.migrateExistingMembers(1, 2026);
            } catch (err) {
                console.warn('Supabase data fetch failed:', err);
            }
            setSettingsLoading(false);
        };
        initData();
    }, []);

    const handlePasteImport = useCallback(() => {
        if (!pasteText.trim()) return;
        const parsed = parseExcelPaste(pasteText);
        const existing = members.length;
        const newMembers: PartyMember[] = parsed.map((p, i) => {
            const m: PartyMember = {
                id: crypto.randomUUID(),
                stt: existing + i + 1,
                hoTen: p.hoTen || '',
                chucVu: p.chucVu || '',
                ngayVaoDang: p.ngayVaoDang || '',
                memberType: defaultType,
                salary: p.salary || 0,
                region: defaultRegion,
                feeAmount: 0,
                note: '',
                paid: false
            };
            m.feeAmount = recalcFee(m);
            return m;
        });
        const updated = [...members, ...newMembers];
        // re-number STT
        updated.forEach((m, i) => m.stt = i + 1);
        persistMembers(updated);
        setPasteText('');
        setShowPasteArea(false);
    }, [pasteText, members, defaultType, defaultRegion, recalcFee, persistMembers]);

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const parsedMembers = await parseExcelToMembers(file);
            if (parsedMembers.length === 0) {
                await showConfirm('Không tìm thấy dữ liệu hợp lệ trong file.', 'Thông báo', 'info');
                setImporting(false);
                return;
            }

            const confirmed = await showConfirm(
                `Tìm thấy ${parsedMembers.length} đảng viên. Bạn có muốn nhập vào danh sách?`,
                'Xác nhận nhập file',
                'success'
            );

            if (!confirmed) {
                setImporting(false);
                return;
            }

            // Map to DB format and sync
            const dbMembers = parsedMembers.map(m => {
                const memberType = (m.memberType as MemberType) || defaultType;
                const salary = m.salary || 0;
                const region = m.region || defaultRegion;

                const dbM = appToDbMember({
                    id: crypto.randomUUID(),
                    stt: m.stt || 0,
                    hoTen: m.hoTen,
                    chucVu: m.chucVu || '',
                    ngayVaoDang: m.ngayVaoDang || '',
                    memberType,
                    salary,
                    region,
                    feeAmount: recalcFee({ memberType, salary, region }),
                    paid: false,
                    note: m.note || ''
                });
                return dbM;
            });

            const success = await syncAllMembers(dbMembers);
            if (success) {
                // Refresh list
                const freshDbList = await fetchDbMembers();
                const appList = freshDbList.map(dbToAppMember) as PartyMember[];
                setMembers(appList);
                saveMembers(appList, userId || undefined);
                await showConfirm(`Đã nhập thành công ${parsedMembers.length} đảng viên.`, 'Thành công', 'success');
            } else {
                await showConfirm('Lỗi khi lưu dữ liệu vào cơ sở dữ liệu.', 'Lỗi', 'warning');
            }
        } catch (err) {
            console.error('Import error:', err);
            await showConfirm('Lỗi khi xử lý file: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'), 'Lỗi', 'warning');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddOne = useCallback(async () => {
        const m: PartyMember = {
            id: crypto.randomUUID(),
            stt: members.length + 1,
            hoTen: '',
            chucVu: '',
            ngayVaoDang: '',
            memberType: defaultType,
            salary: 0,
            region: defaultRegion,
            feeAmount: 0,
            note: '',
            paid: false
        };
        m.feeAmount = recalcFee(m);
        persistMembers([...members, m]);
        // Auto-create join event for the new member
        setTimeout(async () => {
            await rosterService.recordJoinEvent(m.id, selectedMonth, selectedYear, 'Thêm mới');
            const activeIds = await rosterService.getActiveMemberIds(selectedMonth, selectedYear);
            setActiveMemberIds(activeIds);
        }, 500); // Wait for Supabase sync
    }, [members, defaultType, defaultRegion, recalcFee, persistMembers, selectedMonth, selectedYear]);

    const updateMember = useCallback((id: string, updates: Partial<PartyMember>) => {
        const updated = members.map(m => {
            if (m.id !== id) return m;
            const merged = { ...m, ...updates };
            merged.feeAmount = recalcFee(merged);
            return merged;
        });
        persistMembers(updated);
    }, [members, recalcFee, persistMembers]);

    const removeMember = useCallback((id: string) => {
        const updated = members.filter(m => m.id !== id);
        updated.forEach((m, i) => m.stt = i + 1);
        persistMembers(updated);
        deleteDbMember(id); // Remove from Supabase too
    }, [members, persistMembers]);

    // Handle transfer confirmation (leave/rejoin)
    const handleTransferConfirm = useCallback(async () => {
        const { type, memberId, month, year, reason } = transferModal;
        if (!memberId) return;

        let ok = false;
        if (type === 'leave') {
            ok = await rosterService.recordLeaveEvent(memberId, month, year, reason || 'Chuyển sinh hoạt');
        } else {
            ok = await rosterService.recordJoinEvent(memberId, month, year, reason || 'Tiếp nhận');
        }

        if (ok) {
            // Refresh active member IDs
            const activeIds = await rosterService.getActiveMemberIds(selectedMonth, selectedYear);
            setActiveMemberIds(activeIds);
            setTransferModal(prev => ({ ...prev, open: false }));
            await showConfirm(
                type === 'leave'
                    ? `Đã ghi nhận chuyển đi từ T${String(month).padStart(2, '0')}/${year}.`
                    : `Đã ghi nhận tiếp nhận từ T${String(month).padStart(2, '0')}/${year}.`,
                'Thành công', 'success'
            );
        } else {
            await showConfirm('Lỗi khi ghi nhận. Vui lòng thử lại.', 'Lỗi', 'warning');
        }
    }, [transferModal, selectedMonth, selectedYear, showConfirm]);

    const clearAll = useCallback(async () => {
        const confirmed = await showConfirm(
            `Bạn có chắc chắn muốn XÓA TẤT CẢ ${members.length} đảng viên khỏi danh sách? Hành động này không thể hoàn tác!`,
            'Xóa tất cả đảng viên',
            'warning'
        );
        if (!confirmed) return;

        try {
            // Step 1: Delete from Supabase FIRST
            console.log('[clearAll] Deleting all members from Supabase...');
            const dbDeleteOk = await deleteAllMembers();

            if (!dbDeleteOk) {
                console.error('[clearAll] Supabase delete failed!');
                await showConfirm(
                    'Không thể xóa dữ liệu trên server. Vui lòng thử lại hoặc kiểm tra kết nối mạng.',
                    'Lỗi xóa dữ liệu',
                    'warning'
                );
                return; // Don't clear local state if server delete failed
            }

            // Step 2: Clear local state ONLY after Supabase confirms deletion
            console.log('[clearAll] Supabase delete successful, clearing local state...');
            setMembers([]);

            // Step 3: Clear ALL localStorage keys
            if (userId) {
                localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
            }
            localStorage.removeItem(STORAGE_KEY); // Clear global legacy key too

            console.log('[clearAll] All members deleted successfully');
        } catch (err) {
            console.error('[clearAll] Exception:', err);
            await showConfirm(
                'Đã xảy ra lỗi khi xóa dữ liệu. Vui lòng thử lại.',
                'Lỗi',
                'warning'
            );
        }
    }, [members.length, userId, showConfirm]);

    // ─── Member list summary ─────────────────
    const memberSummary = useMemo(() => {
        const total = members.reduce((s, m) => s + m.feeAmount, 0);
        const byType: Record<string, { count: number, fee: number }> = {};
        members.forEach(m => {
            const label = MEMBER_TYPES.find(t => t.key === m.memberType)?.label || m.memberType;
            if (!byType[label]) byType[label] = { count: 0, fee: 0 };
            byType[label].count++;
            byType[label].fee += m.feeAmount;
        });
        const ret = calculateRetention(total);
        return { total, yearly: total * 12, byType, retention: ret, count: members.length };
    }, [members]);

    const getRateLabel = (type: MemberType): string => {
        const now = new Date();
        const isPhase1 = now < new Date('2028-01-01');
        switch (type) {
            case 'bhxh': return '1%';
            case 'huu_tri': return '0,5%';
            case 'huu_lam_them': return '0,5%';
            case 'om_dau_thai_san': return '1%';
            case 'chua_du_tuoi_huu': return isPhase1 ? '0,3%' : '0,5%';
            case 'du_tuoi_huu': return isPhase1 ? '0,2%' : '0,3%';
            case 'hoc_sinh_sv': return '5.000đ';
            case 'nguoi_co_cong': return '0,5%';
            case 'mien': return 'Miễn';
            default: return '—';
        }
    };

    // ─── Export CSV ──────────────────────────
    const exportCSV = useCallback(() => {
        const header = 'STT,Họ tên,Chức vụ,Ngày vào Đảng,Đối tượng,Tỷ lệ,Lương/Trợ cấp,Đảng phí/tháng';
        const rows = members.map(m => {
            const typeLabel = MEMBER_TYPES.find(t => t.key === m.memberType)?.label || '';
            return `${m.stt},"${m.hoTen}","${m.chucVu}","${m.ngayVaoDang}","${typeLabel}","${getRateLabel(m.memberType)}",${m.salary},${m.feeAmount}`;
        });
        const totalRow = `,"","","","TỔNG CỘNG","","",${memberSummary.total}`;
        const csv = '\ufeff' + [header, ...rows, totalRow].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `danh-sach-dang-phi-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    }, [members, memberSummary]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-700 to-yellow-800 rounded-2xl px-6 py-5 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wide">Trợ lý Đảng phí</h2>
                            <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest">
                                Theo QĐ 01-QĐ/TW ngày 03/02/2026 • Hiệu lực từ 01/02/2026
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Mode tabs */}
                        <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-md">
                            <button
                                onClick={() => setTabMode('calculator')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${tabMode === 'calculator' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                <Calculator className="w-3.5 h-3.5" /> Tính phí
                            </button>
                            <button
                                onClick={() => setTabMode('memberlist')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all relative ${tabMode === 'memberlist' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                <Users className="w-3.5 h-3.5" /> Danh sách ĐV
                                {members.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[7px] font-black text-white flex items-center justify-center border border-white/30">
                                        {members.length > 99 ? '99+' : members.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setTabMode('finance')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${tabMode === 'finance' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" /> Thu, chi
                            </button>
                            <button
                                onClick={() => setTabMode('report')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${tabMode === 'report' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                <FileText className="w-3.5 h-3.5" /> Báo cáo
                            </button>
                            <button
                                onClick={() => setTabMode('settings')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${tabMode === 'settings' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                <Settings className="w-3.5 h-3.5" /> Thiết lập
                            </button>
                        </div>
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20"
                        >
                            <Info className="w-3.5 h-3.5" /> Hướng dẫn
                        </button>
                    </div>
                </div>
            </div>

            {/* Guide panel */}
            {showGuide && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Bảng mức đóng đảng phí
                        </h3>
                        <button onClick={() => setShowGuide(false)} className="text-amber-400 hover:text-amber-600">
                            <ChevronUp className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="bg-amber-100">
                                    <th className="text-left p-2 font-bold text-amber-800 rounded-tl-lg">Đối tượng</th>
                                    <th className="text-center p-2 font-bold text-amber-800">2026-2027</th>
                                    <th className="text-center p-2 font-bold text-amber-800 rounded-tr-lg">Từ 2028</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100">
                                <tr className="bg-white"><td className="p-2 font-medium text-gray-700">Có BHXH bắt buộc</td><td className="p-2 text-center font-bold text-amber-700" colSpan={2}>1% lương BHXH</td></tr>
                                <tr className="bg-white"><td className="p-2 font-medium text-gray-700">Hưu trí</td><td className="p-2 text-center font-bold text-amber-700" colSpan={2}>0,5% lương hưu</td></tr>
                                <tr className="bg-white"><td className="p-2 font-medium text-gray-700">Chưa đủ tuổi hưu (không BHXH)</td><td className="p-2 text-center text-amber-700">0,3% LTT vùng</td><td className="p-2 text-center text-amber-700">0,5% LTT vùng</td></tr>
                                <tr className="bg-white"><td className="p-2 font-medium text-gray-700">Đủ tuổi hưu (không BHXH)</td><td className="p-2 text-center text-amber-700">0,2% LTT vùng</td><td className="p-2 text-center text-amber-700">0,3% LTT vùng</td></tr>
                                <tr className="bg-white"><td className="p-2 font-medium text-gray-700">Học sinh, sinh viên</td><td className="p-2 text-center font-bold text-amber-700" colSpan={2}>5.000đ/tháng</td></tr>
                                <tr className="bg-white"><td className="p-2 font-medium text-gray-700">Ốm đau, thai sản</td><td className="p-2 text-center font-bold text-amber-700" colSpan={2}>1% trợ cấp BHXH</td></tr>
                                <tr className="bg-white"><td className="p-2 font-medium text-gray-700">Người có công, mất sức LĐ</td><td className="p-2 text-center font-bold text-amber-700" colSpan={2}>50% mức đóng QĐ</td></tr>
                                <tr className="bg-amber-50"><td className="p-2 font-medium text-green-700">Miễn: ≥50 năm tuổi Đảng, hộ nghèo, bệnh hiểm nghèo</td><td className="p-2 text-center font-bold text-green-600" colSpan={2}>Miễn đóng</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-start gap-2 bg-white rounded-xl p-3 border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700">
                            <strong>Lưu ý:</strong> Không đóng đảng phí 3 tháng trong năm mà không có lý do chính đáng, chi bộ xem xét đề nghị xóa tên khỏi danh sách đảng viên.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-amber-100">
                        <p className="text-[10px] text-gray-600">
                            <strong>Lương tối thiểu vùng 2026:</strong>{' '}
                            {Object.entries(MINIMUM_WAGES).map(([v, w], i) => (
                                <span key={v}>{i > 0 && ' • '}<strong>{v}:</strong> {w.toLocaleString('vi-VN')}đ</span>
                            ))}
                        </p>
                    </div>
                </div>
            )}

            {/* ═══════════════ TAB: CALCULATOR ═══════════════ */}
            {tabMode === 'calculator' && (
                <>
                    {/* Calculator */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-gray-500" />
                            <h3 className="text-xs font-black uppercase text-gray-600 tracking-widest">Tính đảng phí</h3>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Member type selection */}
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                    Đối tượng đảng viên
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {MEMBER_TYPES.map(t => (
                                        <button
                                            key={t.key}
                                            onClick={() => { setSelectedType(t.key); resetInputs(); }}
                                            className={`p-3 rounded-xl text-left transition-all border-2 ${selectedType === t.key
                                                ? 'bg-amber-50 border-amber-400 shadow-sm'
                                                : 'bg-gray-50 border-gray-200 hover:border-amber-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {selectedType === t.key
                                                    ? <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                    : <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                                                }
                                                <span className={`text-xs font-bold ${selectedType === t.key ? 'text-amber-800' : 'text-gray-600'}`}>
                                                    {t.label}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-1 ml-6">{t.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic inputs */}
                            {typeInfo && !typeInfo.fixedAmount && !typeInfo.exemptMsg && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {typeInfo.needsSalary && (
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
                                                Lương tính BHXH (đồng/tháng)
                                            </label>
                                            <input type="number" placeholder="VD: 8000000" value={salary}
                                                onChange={e => setSalary(e.target.value)}
                                                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
                                        </div>
                                    )}
                                    {typeInfo.needsPension && (
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
                                                Lương hưu (đồng/tháng)
                                            </label>
                                            <input type="number" placeholder="VD: 5000000" value={pension}
                                                onChange={e => setPension(e.target.value)}
                                                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
                                        </div>
                                    )}
                                    {typeInfo.needsExtraIncome && (
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
                                                Tiền công/phụ cấp (đồng/tháng)
                                            </label>
                                            <input type="number" placeholder="VD: 3000000" value={extraIncome}
                                                onChange={e => setExtraIncome(e.target.value)}
                                                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
                                        </div>
                                    )}
                                    {typeInfo.needsAllowance && (
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
                                                Trợ cấp hàng tháng (đồng)
                                            </label>
                                            <input type="number" placeholder="VD: 4000000" value={allowance}
                                                onChange={e => setAllowance(e.target.value)}
                                                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
                                        </div>
                                    )}
                                    {typeInfo.needsRegion && (
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
                                                Vùng lương tối thiểu
                                            </label>
                                            <select value={region} onChange={e => setRegion(e.target.value)}
                                                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400">
                                                {Object.entries(MINIMUM_WAGES).map(([v, w]) => (
                                                    <option key={v} value={v}>{v} — {w.toLocaleString('vi-VN')}đ/tháng</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Exemption message */}
                            {typeInfo?.exemptMsg && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-green-800">Miễn đóng đảng phí</p>
                                        <p className="text-xs text-green-600 mt-0.5">{typeInfo.exemptMsg}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result card */}
                    {selectedType !== 'mien' && (
                        <div className="bg-gradient-to-br from-amber-600 to-yellow-700 rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 text-white">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wallet className="w-5 h-5" />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Kết quả tính đảng phí</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200">Hàng tháng</p>
                                        <p className="text-3xl font-black mt-1">{formatCurrency(result.amount)}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200">Cả năm</p>
                                        <p className="text-3xl font-black mt-1">{formatCurrency(yearlyAmount)}</p>
                                    </div>
                                </div>

                                {/* Formula */}
                                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md mb-4">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200 mb-1">Công thức</p>
                                    <p className="text-sm font-mono font-bold">{result.formula}</p>
                                    {result.note && (
                                        <p className="text-xs text-amber-200 mt-1 flex items-center gap-1">
                                            <HelpCircle className="w-3 h-3" /> {result.note}
                                        </p>
                                    )}
                                </div>

                                {/* Retention split */}
                                {result.amount > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md">
                                            <p className="text-[9px] font-bold text-amber-200 uppercase">Chi bộ giữ lại ({RETENTION_RATES.chiBoGiu}%)</p>
                                            <p className="text-lg font-black">{formatCurrency(retention.chiBoGiu)}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md">
                                            <p className="text-[9px] font-bold text-amber-200 uppercase">Nộp cấp trên ({RETENTION_RATES.nopCapTren}%)</p>
                                            <p className="text-lg font-black">{formatCurrency(retention.nopCapTren)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════ TAB: MEMBER LIST ═══════════════ */}
            {tabMode === 'memberlist' && (
                <>
                    {/* Toolbar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <h3 className="text-xs font-black uppercase text-gray-600 tracking-widest">
                                        Danh sách đảng viên ({members.length} người)
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button onClick={() => setShowPasteArea(!showPasteArea)}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
                                        <ClipboardPaste className="w-3.5 h-3.5" /> Dán từ Excel
                                    </button>
                                    <button onClick={() => fileInputRef.current?.click()}
                                        disabled={importing}
                                        className={`px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${importing ? 'opacity-50 cursor-wait' : ''}`}>
                                        <Upload className="w-3.5 h-3.5" /> {importing ? 'Đang nhập...' : 'Nhập từ File'}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImportExcel}
                                        accept=".csv, .xlsx, .xls"
                                        className="hidden"
                                    />
                                    <button onClick={handleAddOne}
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
                                        <UserPlus className="w-3.5 h-3.5" /> Thêm 1 ĐV
                                    </button>
                                    {members.length > 0 && (
                                        <>
                                            <button onClick={exportCSV}
                                                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
                                                <Download className="w-3.5 h-3.5" /> Xuất CSV
                                            </button>
                                            <button onClick={clearAll}
                                                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border border-red-200">
                                                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Month/Year Selector + Search */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Month dropdown */}
                                <div className="flex items-center gap-1.5">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tháng:</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={e => setSelectedMonth(Number(e.target.value))}
                                        className="bg-white border-2 border-amber-200 rounded-lg text-xs font-bold text-amber-700 px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 cursor-pointer"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>Tháng {String(m).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Year dropdown */}
                                <div className="flex items-center gap-1.5">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Năm:</label>
                                    <select
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(Number(e.target.value))}
                                        className="bg-white border-2 border-amber-200 rounded-lg text-xs font-bold text-amber-700 px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 cursor-pointer"
                                    >
                                        {[2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Payment summary for month */}
                                <div className="flex items-center gap-1.5 ml-auto">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${Object.values(monthlyPaidMap).filter(Boolean).length === members.filter(m => m.feeAmount > 0).length && members.length > 0
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        {paymentsLoading ? '...' : `${Object.values(monthlyPaidMap).filter(Boolean).length}/${members.filter(m => m.feeAmount > 0).length}`} đã nộp T{String(selectedMonth).padStart(2, '0')}
                                    </span>
                                    {/* SePay Check Button */}
                                    <button
                                        onClick={async () => {
                                            setSepayChecking(true);
                                            setSepayError(null);
                                            setSepayResults(null);
                                            try {
                                                const { results, error } = await checkPaymentsForMonth(
                                                    members.map(m => ({ id: m.id, hoTen: m.hoTen, feeAmount: m.feeAmount })),
                                                    selectedMonth,
                                                    selectedYear,
                                                    settings.sepay_api_key
                                                );
                                                if (error) {
                                                    setSepayError(error);
                                                } else {
                                                    setSepayResults(results);
                                                    // Auto-record matched payments
                                                    for (const r of results) {
                                                        if (r.memberId && (r.confidence === 'exact' || r.confidence === 'partial') && !monthlyPaidMap[r.memberId]) {
                                                            await recordPayment({
                                                                member_id: r.memberId,
                                                                amount: r.transaction.transfer_amount,
                                                                month: selectedMonth,
                                                                year: selectedYear,
                                                                paid: true,
                                                                payment_method: 'auto_webhook',
                                                                transaction_ref: r.transaction.reference_number || r.transaction.id,
                                                                note: `Auto SePay: ${r.transaction.transaction_content}`
                                                            });
                                                            setMonthlyPaidMap(prev => ({ ...prev, [r.memberId!]: true }));
                                                        }
                                                    }
                                                }
                                            } catch (err) {
                                                setSepayError(err instanceof Error ? err.message : 'Lỗi không xác định');
                                            }
                                            setSepayChecking(false);
                                            setShowSepayModal(true);
                                        }}
                                        disabled={sepayChecking || members.length === 0}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${sepayChecking
                                            ? 'bg-blue-100 text-blue-400 cursor-wait'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm'
                                            }`}
                                        title="Kiểm tra giao dịch CK qua SePay"
                                    >
                                        {sepayChecking ? (
                                            <><RefreshCw className="w-3 h-3 animate-spin" /> Đang kiểm tra...</>
                                        ) : (
                                            <><Landmark className="w-3 h-3" /> Kiểm tra CK</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Search bar + Settings button */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Tìm kiếm đảng viên theo tên, chức vụ..."
                                        className="w-full pl-9 pr-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowWageSettings(!showWageSettings)}
                                    className={`p-2 rounded-xl border-2 transition-all ${showWageSettings
                                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                                        : 'bg-white border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200'
                                        }`}
                                    title="Cài đặt lương tối thiểu vùng"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Wage Settings Panel */}
                        {showWageSettings && (
                            <div className="px-6 py-4 border-b border-gray-200 bg-amber-50/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Settings className="w-3.5 h-3.5" /> Cài đặt lương tối thiểu vùng
                                    </h4>
                                    <button onClick={() => setShowWageSettings(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {Object.keys(DEFAULT_MINIMUM_WAGES).map(region => (
                                        <div key={region}>
                                            <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">{region}</label>
                                            <input
                                                type="number"
                                                defaultValue={editWages[region]}
                                                key={`wage-${region}-${editWages[region]}`}
                                                onBlur={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setEditWages(prev => ({ ...prev, [region]: val }));
                                                }}
                                                className="w-full p-2 bg-white border-2 border-amber-200 rounded-lg text-xs font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 text-right"
                                            />
                                            <p className="text-[8px] text-gray-400 mt-0.5 text-right">
                                                Mặc định: {DEFAULT_MINIMUM_WAGES[region].toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={() => {
                                            setMinimumWages(editWages, userId || undefined);
                                            setWagesSaved(true);
                                            setTimeout(() => setWagesSaved(false), 2000);
                                            // Force re-render members to recalculate fees
                                            setMembers(prev => prev.map(m => {
                                                const fee = calculatePartyFee(m.memberType, { salary: m.salary });
                                                return { ...m, feeAmount: fee.amount };
                                            }));
                                        }}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> {wagesSaved ? 'Đã lưu ✔' : 'Lưu thay đổi'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditWages({ ...DEFAULT_MINIMUM_WAGES });
                                            setMinimumWages({ ...DEFAULT_MINIMUM_WAGES }, userId || undefined);
                                            setMembers(prev => prev.map(m => {
                                                const fee = calculatePartyFee(m.memberType, { salary: m.salary });
                                                return { ...m, feeAmount: fee.amount };
                                            }));
                                        }}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                                    >
                                        Khôi phục mặc định
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Paste area */}
                        {showPasteArea && (
                            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <ClipboardPaste className="w-3.5 h-3.5" /> Dán dữ liệu từ Excel / Google Sheets
                                    </h4>
                                    <button onClick={() => setShowPasteArea(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Đối tượng mặc định</label>
                                        <select value={defaultType} onChange={e => setDefaultType(e.target.value as MemberType)}
                                            className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                                            {MEMBER_TYPES.map(t => (
                                                <option key={t.key} value={t.key}>{t.label} ({getRateLabel(t.key)})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Vùng mặc định</label>
                                        <select value={defaultRegion} onChange={e => setDefaultRegion(e.target.value)}
                                            className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                                            {Object.entries(MINIMUM_WAGES).map(([v, w]) => (
                                                <option key={v} value={v}>{v} — {w.toLocaleString('vi-VN')}đ</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-3 border border-blue-200">
                                    <p className="text-[9px] text-blue-600 mb-1.5 font-bold">
                                        💡 Copy dữ liệu từ Excel rồi dán vào ô bên dưới. Hỗ trợ các định dạng:
                                    </p>
                                    <div className="text-[9px] text-gray-500 space-y-0.5 font-mono">
                                        <p>• <strong>5 cột:</strong> STT | Họ tên | Chức vụ | Ngày vào Đảng | Lương</p>
                                        <p>• <strong>4 cột:</strong> STT | Họ tên | Chức vụ | Lương/Ngày</p>
                                        <p>• <strong>3 cột:</strong> Họ tên | Chức vụ | Lương</p>
                                        <p>• <strong>2 cột:</strong> Họ tên | Chức vụ</p>
                                        <p>• <strong>1 cột:</strong> Họ tên</p>
                                    </div>
                                </div>

                                <textarea
                                    value={pasteText}
                                    onChange={e => setPasteText(e.target.value)}
                                    placeholder="Dán dữ liệu Excel vào đây (mỗi dòng = 1 đảng viên, các cột phân cách bởi Tab)..."
                                    className="w-full p-3 bg-white border-2 border-blue-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 min-h-[120px] font-mono resize-y"
                                    onPaste={(e) => {
                                        // Allow native paste behavior
                                    }}
                                />

                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] text-gray-400">
                                        {pasteText.trim() ? `${pasteText.trim().split('\n').filter(l => l.trim()).length} dòng phát hiện` : 'Chưa có dữ liệu'}
                                    </p>
                                    <button onClick={handlePasteImport} disabled={!pasteText.trim()}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${pasteText.trim()
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}>
                                        <Plus className="w-3.5 h-3.5" /> Nhập {pasteText.trim() ? `${pasteText.trim().split('\n').filter(l => l.trim()).length} đảng viên` : ''}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Member table */}
                        {members.length > 0 ? (<>
                            <div className="overflow-x-auto">
                                {searchTerm && (
                                    <div className="px-4 py-2 bg-amber-50 text-xs text-amber-700 font-medium border-b border-amber-200">
                                        Tìm thấy {filteredMembers.length}/{members.length} đảng viên cho "{searchTerm}"
                                    </div>
                                )}
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="p-3 text-left font-bold text-gray-500 uppercase text-[9px] tracking-wider w-10">#</th>
                                            <th className="p-3 text-left font-bold text-gray-500 uppercase text-[9px] tracking-wider min-w-[140px]">Họ tên</th>
                                            <th className="p-3 text-left font-bold text-gray-500 uppercase text-[9px] tracking-wider min-w-[100px]">Chức vụ</th>
                                            <th className="p-3 text-left font-bold text-gray-500 uppercase text-[9px] tracking-wider min-w-[150px]">Đối tượng</th>
                                            <th className="p-3 text-center font-bold text-gray-500 uppercase text-[9px] tracking-wider w-16">Tỷ lệ</th>
                                            <th className="p-3 text-right font-bold text-gray-500 uppercase text-[9px] tracking-wider min-w-[100px]">Lương/Trợ cấp</th>
                                            <th className="p-3 text-right font-bold text-amber-600 uppercase text-[9px] tracking-wider min-w-[90px]">Đảng phí</th>
                                            <th className="p-3 text-center font-bold text-gray-500 uppercase text-[9px] tracking-wider w-20">Trạng thái</th>
                                            <th className="p-3 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredMembers.map(m => {
                                            const isPaidThisMonth = !!monthlyPaidMap[m.id];
                                            return (
                                                <tr key={m.id} className={`hover:bg-amber-50/30 transition-colors ${isPaidThisMonth ? 'bg-green-50/30' : ''}`}>
                                                    <td className="p-3 text-gray-400 font-mono">{m.stt}</td>
                                                    <td className="p-3">
                                                        <input
                                                            value={m.hoTen}
                                                            onChange={e => updateMember(m.id, { hoTen: e.target.value })}
                                                            placeholder="Nhập họ tên"
                                                            className="w-full bg-transparent border-0 outline-none text-xs font-medium text-gray-800 placeholder:text-gray-300 focus:bg-amber-50 focus:px-2 rounded transition-all"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            value={m.chucVu}
                                                            onChange={e => updateMember(m.id, { chucVu: e.target.value })}
                                                            placeholder="Chức vụ"
                                                            className="w-full bg-transparent border-0 outline-none text-xs text-gray-600 placeholder:text-gray-300 focus:bg-amber-50 focus:px-2 rounded transition-all"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <select
                                                            value={m.memberType}
                                                            onChange={async e => {
                                                                const newType = e.target.value as MemberType;
                                                                const newLabel = MEMBER_TYPES.find(t => t.key === newType)?.label || newType;
                                                                const ok = await showConfirm(
                                                                    `Đổi đối tượng của "${m.hoTen || 'ĐV'}" sang "${newLabel}"?`,
                                                                    'Thay đổi đối tượng'
                                                                );
                                                                if (!ok) {
                                                                    e.target.value = m.memberType; return;
                                                                }
                                                                updateMember(m.id, { memberType: newType });
                                                            }}
                                                            className="w-full bg-transparent border border-gray-200 rounded-lg text-[11px] p-1.5 outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 cursor-pointer"
                                                        >
                                                            {MEMBER_TYPES.map(t => (
                                                                <option key={t.key} value={t.key}>{t.label}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${m.memberType === 'mien'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {getRateLabel(m.memberType)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        {m.memberType !== 'mien' && m.memberType !== 'hoc_sinh_sv' && (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    key={`salary-${m.id}-${m.salary}`}
                                                                    type="number"
                                                                    defaultValue={m.salary || ''}
                                                                    onBlur={e => {
                                                                        const newSalary = parseFloat(e.target.value) || 0;
                                                                        if (newSalary !== m.salary && newSalary > 0) {
                                                                            setSalaryModal({
                                                                                open: true,
                                                                                memberId: m.id,
                                                                                memberName: m.hoTen || 'ĐV',
                                                                                oldSalary: m.salary,
                                                                                newSalary,
                                                                                effectiveMonth: new Date().getMonth() + 1,
                                                                                effectiveYear: new Date().getFullYear(),
                                                                                reason: ''
                                                                            });
                                                                            // Revert input until confirmed
                                                                            e.target.value = String(m.salary || '');
                                                                        }
                                                                    }}
                                                                    placeholder="0"
                                                                    className="w-full bg-transparent border border-gray-200 rounded-lg text-xs p-1.5 text-right outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                                                                />
                                                                <button
                                                                    onClick={async () => {
                                                                        const entries = await salaryHistoryService.fetchSalaryHistory(m.id);
                                                                        setSalaryHistoryPopup({ open: true, memberId: m.id, memberName: m.hoTen || 'ĐV', entries });
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-amber-600 transition-colors rounded"
                                                                    title="Lịch sử điều chỉnh lương"
                                                                >
                                                                    <History className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {m.memberType === 'hoc_sinh_sv' && (
                                                            <span className="text-[10px] text-gray-400 italic">Cố định</span>
                                                        )}
                                                        {m.memberType === 'mien' && (
                                                            <span className="text-[10px] text-green-500 italic">Miễn đóng</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <span className={`font-bold ${m.feeAmount === 0 ? 'text-green-600' : 'text-amber-700'}`}>
                                                            {formatCurrency(m.feeAmount)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => toggleMonthlyPaid(m.id, m.hoTen, isPaidThisMonth)}
                                                            disabled={paymentsLoading}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isPaidThisMonth
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-red-50 text-red-400 hover:bg-red-100'
                                                                }`}
                                                        >
                                                            {isPaidThisMonth ? <><CheckCircle2 className="w-3 h-3" /> Đã nộp</> : <><Clock className="w-3 h-3" /> Chưa nộp</>}
                                                        </button>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => setQrMember(m)}
                                                                title="Tạo mã QR thanh toán"
                                                                className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                                                                <QrCode className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setTransferModal({
                                                                    open: true,
                                                                    type: 'leave',
                                                                    memberId: m.id,
                                                                    memberName: m.hoTen,
                                                                    month: selectedMonth,
                                                                    year: selectedYear,
                                                                    reason: ''
                                                                })}
                                                                title="Chuyển đi / Chuyển sinh hoạt"
                                                                className="text-orange-400 hover:text-orange-600 transition-colors p-1 rounded hover:bg-orange-50">
                                                                <LogOut className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => removeMember(m.id)}
                                                                title="Xóa vĩnh viễn"
                                                                className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {/* Total row */}
                                    <tfoot>
                                        <tr className="bg-amber-50 border-t-2 border-amber-200 font-bold">
                                            <td colSpan={6} className="p-3 text-right text-xs text-amber-800 uppercase tracking-wider">
                                                Tổng cộng ({filteredMembers.length} đảng viên) — T{String(selectedMonth).padStart(2, '0')}/{selectedYear}:
                                            </td>
                                            <td className="p-3 text-right text-amber-800 text-sm font-black">
                                                {formatCurrency(filteredMembers.reduce((s, m) => s + m.feeAmount, 0))}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${filteredMembers.filter(m => monthlyPaidMap[m.id]).length === filteredMembers.filter(m => m.feeAmount > 0).length && filteredMembers.length > 0
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-600'
                                                    }`}>
                                                    {filteredMembers.filter(m => monthlyPaidMap[m.id]).length}/{filteredMembers.filter(m => m.feeAmount > 0).length}
                                                </span>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* ── Inactive / Transferred members ── */}
                            {inactiveMembers.length > 0 && (
                                <div className="mx-4 mt-4 mb-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-4 py-2 bg-gray-100 flex items-center gap-2">
                                        <ArrowRightLeft className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                            ĐV đã chuyển đi / Không sinh hoạt — T{String(selectedMonth).padStart(2, '0')}/{selectedYear}
                                        </span>
                                        <span className="ml-auto text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                            {inactiveMembers.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {inactiveMembers.map(m => (
                                            <div key={m.id} className="px-4 py-2 flex items-center gap-3 text-xs">
                                                <span className="font-bold text-gray-500 min-w-[140px]">{m.hoTen}</span>
                                                <span className="text-gray-400 text-[10px]">{m.chucVu}</span>
                                                <button
                                                    onClick={() => setTransferModal({
                                                        open: true,
                                                        type: 'join',
                                                        memberId: m.id,
                                                        memberName: m.hoTen,
                                                        month: selectedMonth,
                                                        year: selectedYear,
                                                        reason: ''
                                                    })}
                                                    className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold transition-colors"
                                                >
                                                    <LogIn className="w-3 h-3" /> Tiếp nhận lại
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Monthly Salary Changes Summary */}
                            {monthlySalaryChanges.length > 0 && (
                                <div className="mx-4 mt-4 mb-2 bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
                                    <div className="px-4 py-2 bg-blue-100 flex items-center gap-2">
                                        <History className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                                            Điều chỉnh lương trong kỳ — T{String(selectedMonth).padStart(2, '0')}/{selectedYear}
                                        </span>
                                        <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">
                                            {monthlySalaryChanges.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-blue-100">
                                        {monthlySalaryChanges.map((ch, i) => {
                                            const memberName = members.find(m => m.id === ch.member_id)?.hoTen || 'ĐV';
                                            return (
                                                <div key={ch.id || i} className="px-4 py-2 flex items-center gap-3 text-xs">
                                                    <span className="font-bold text-gray-700 min-w-[120px]">{memberName}</span>
                                                    <span className="text-gray-400">{ch.old_salary.toLocaleString('vi-VN')}đ</span>
                                                    <span className="text-gray-300">→</span>
                                                    <span className={`font-bold ${ch.new_salary > ch.old_salary ? 'text-green-600' : 'text-red-600'}`}>
                                                        {ch.new_salary.toLocaleString('vi-VN')}đ
                                                    </span>
                                                    {ch.reason && <span className="text-gray-400 italic text-[10px] ml-auto">{ch.reason}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>) : (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-400">Chưa có đảng viên nào</p>
                                <p className="text-xs text-gray-300 mt-1">Nhấn "Dán từ Excel" hoặc "Thêm 1 ĐV" để bắt đầu</p>
                            </div>
                        )}
                    </div>

                    {/* Summary card */}
                    {members.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-600 to-yellow-700 rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 text-white">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wallet className="w-5 h-5" />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Tổng hợp đảng phí chi bộ</h3>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200">Số đảng viên</p>
                                        <p className="text-3xl font-black mt-1">{memberSummary.count}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200">Tổng/tháng</p>
                                        <p className="text-2xl font-black mt-1">{formatCurrency(memberSummary.total)}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200">Chi bộ giữ ({RETENTION_RATES.chiBoGiu}%)</p>
                                        <p className="text-xl font-black mt-1">{formatCurrency(memberSummary.retention.chiBoGiu)}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200">Nộp cấp trên ({RETENTION_RATES.nopCapTren}%)</p>
                                        <p className="text-xl font-black mt-1">{formatCurrency(memberSummary.retention.nopCapTren)}</p>
                                    </div>
                                </div>

                                {/* Breakdown by type */}
                                {Object.keys(memberSummary.byType).length > 0 && (
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200 mb-2">Phân loại theo đối tượng</p>
                                        <div className="space-y-1.5">
                                            {(Object.entries(memberSummary.byType) as [string, { count: number; fee: number }][]).map(([label, data]) => (
                                                <div key={label} className="flex items-center justify-between text-xs">
                                                    <span className="text-amber-100">{label} ({data.count} người)</span>
                                                    <span className="font-bold">{formatCurrency(data.fee)}/tháng</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )
            }

            {/* ─── REPORT TAB ───────────────────────────── */}
            {
                tabMode === 'report' && (
                    <div className="space-y-4">
                        {/* Controls */}
                        <div className="bg-white border-2 border-amber-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-gray-700">Kỳ báo cáo:</label>
                                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
                                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {String(i + 1).padStart(2, '0')}</option>)}
                                    </select>
                                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
                                        {Array.from({ length: 5 }, (_, i) => { const y = new Date().getFullYear() - 1 + i; return <option key={y} value={y}>{y}</option>; })}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { window.print(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                                    >
                                        <Printer className="w-3.5 h-3.5" /> In báo cáo
                                    </button>
                                    <button
                                        onClick={() => {
                                            const totalMembers = members.length;
                                            const totalFee = members.reduce((s, m) => s + m.feeAmount, 0);
                                            const chiBoGiu = Math.round(totalFee * RETENTION_RATES.chiBoGiu / 100);
                                            const nopCapTren = totalFee - chiBoGiu;
                                            const mm = String(selectedMonth).padStart(2, '0');

                                            /* ── Build worksheet data ── */
                                            const wsData: (string | number | null)[][] = [
                                                /* Row 0: Header left */
                                                [settings.superior_party || 'ĐẢNG BỘ PHƯỜNG ……………', null, null, null, null, null, 'ĐẢNG CỘNG SẢN VIỆT NAM'],
                                                [settings.branch_name || 'CHI BỘ ……………', null, null, null, null, null, `……………, ngày …… tháng ${mm} năm ${selectedYear}`],
                                                ['*'],
                                                [],
                                                /* Row 3-4: Title */
                                                [null, null, null, 'BÁO CÁO THU, NỘP ĐẢNG PHÍ'],
                                                [null, null, null, `(Tháng ${mm} năm ${selectedYear})`],
                                                [],
                                                /* Row 7: Table header */
                                                ['TT', 'Chỉ tiêu', 'Đơn vị tính', 'Mã số', 'Đảng bộ xã, phường', 'Đảng bộ doanh nghiệp', 'Đảng bộ khác', 'Cộng', 'Ghi chú'],
                                                /* Row I */
                                                ['I', 'Tổng số đảng viên đến cuối kỳ báo cáo', 'Người', '01', totalMembers || null, null, null, totalMembers || null, null],
                                                /* Row II */
                                                ['II', 'Đảng phí đã thu được từ chi bộ của cấp báo cáo', null, null, null, null, null, null, null],
                                                [null, '1. Kỳ báo cáo', 'Đồng', '02', totalFee || null, null, null, totalFee || null, null],
                                                [null, '2. Từ đầu năm đến cuối kỳ báo cáo', 'Đồng', '03', ytdTotals.grandTotal || null, null, null, ytdTotals.grandTotal || null, null],
                                                /* Row III */
                                                ['III', 'Đảng phí trích giữ lại ở các cấp', null, null, null, null, null, null, null],
                                                [null, '1. Kỳ báo cáo (05+06+07)', 'Đồng', '04', chiBoGiu || null, null, null, chiBoGiu || null, `(${RETENTION_RATES.chiBoGiu}%)`],
                                                [null, '1.1 Chi bộ, đảng bộ bộ phận', 'Đồng', '05', chiBoGiu || null, null, null, chiBoGiu || null, null],
                                                [null, '1.2 Tổ chức cơ sở đảng', 'Đồng', '06', null, null, null, null, null],
                                                [null, '1.3 Cấp trên cơ sở', 'Đồng', '07', null, null, null, null, null],
                                                [null, '2. Từ đầu năm đến cuối kỳ báo cáo (09+10+11)', 'Đồng', '08', Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100) || null, null, null, Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100) || null, null],
                                                [null, '2.1 Chi bộ, đảng bộ bộ phận', 'Đồng', '09', Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100) || null, null, null, Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100) || null, null],
                                                [null, '2.2 Tổ chức cơ sở đảng', 'Đồng', '10', null, null, null, null, null],
                                                [null, '2.3 Cấp trên cơ sở', 'Đồng', '11', null, null, null, null, null],
                                                /* Row IV */
                                                ['IV', 'Đảng phí nộp cấp trên của cấp báo cáo', null, null, null, null, null, null, null],
                                                [null, '1. Số phải nộp kỳ báo cáo (02–04)', 'Đồng', '12', nopCapTren || null, null, null, nopCapTren || null, `(${RETENTION_RATES.nopCapTren}%)`],
                                                [null, '2. Từ đầu năm đến cuối kỳ báo cáo (03–08)', 'Đồng', '13', (ytdTotals.grandTotal - Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100)) || null, null, null, (ytdTotals.grandTotal - Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100)) || null, null],
                                                [null, '3. Số còn nợ chưa nộp cấp trên đến cuối kỳ báo cáo', 'Đồng', '14', null, null, null, null, null],
                                                [],
                                                /* Footer */
                                                ['Người lập', null, null, null, null, null, `……………, ngày …… tháng …… năm ${selectedYear}`],
                                                [null, null, null, null, null, null, 'T/M cấp ủy'],
                                            ];

                                            const wb = XLSX.utils.book_new();
                                            const ws = XLSX.utils.aoa_to_sheet(wsData);

                                            /* ── Column widths ── */
                                            ws['!cols'] = [
                                                { wch: 5 },   // TT
                                                { wch: 48 },  // Chỉ tiêu
                                                { wch: 12 },  // Đơn vị tính
                                                { wch: 6 },   // Mã số
                                                { wch: 22 },  // Đảng bộ xã, phường
                                                { wch: 22 },  // Đảng bộ doanh nghiệp
                                                { wch: 16 },  // Đảng bộ khác
                                                { wch: 16 },  // Cộng
                                                { wch: 10 },  // Ghi chú
                                            ];

                                            /* ── Merge cells for header ── */
                                            ws['!merges'] = [
                                                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // ĐẢNG BỘ PHƯỜNG
                                                { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } },  // ĐẢNG CỘNG SẢN VN
                                                { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },  // CHI BỘ
                                                { s: { r: 1, c: 6 }, e: { r: 1, c: 8 } },  // Ngày tháng
                                                { s: { r: 4, c: 1 }, e: { r: 4, c: 7 } },  // BÁO CÁO title
                                                { s: { r: 5, c: 1 }, e: { r: 5, c: 7 } },  // Tháng subtitle
                                                { s: { r: 9, c: 1 }, e: { r: 9, c: 8 } },  // Section II header
                                                { s: { r: 12, c: 1 }, e: { r: 12, c: 8 } }, // Section III header
                                                { s: { r: 22, c: 1 }, e: { r: 22, c: 8 } }, // Section IV header
                                            ];

                                            XLSX.utils.book_append_sheet(wb, ws, `T${mm}-${selectedYear}`);
                                            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url; a.download = `BaoCao_DangPhi_T${mm}_${selectedYear}.xlsx`;
                                            a.click(); URL.revokeObjectURL(url);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ─── THỐNG KÊ & DASHBOARD ─────────── */}
                        {(() => {
                            const totalMembers = members.length;
                            const totalFee = members.reduce((s, m) => s + m.feeAmount, 0);
                            const chiBoGiu = Math.round(totalFee * RETENTION_RATES.chiBoGiu / 100);
                            const nopCapTren = totalFee - chiBoGiu;
                            const fmt = (n: number) => n === 0 ? '-' : n.toLocaleString('vi-VN') + ' đ';
                            const exemptCount = members.filter(m => m.memberType === 'mien').length;
                            const paidCount = members.filter(m => m.feeAmount > 0).length;
                            const complianceRate = totalMembers > 0 ? Math.round(((paidCount + exemptCount) / totalMembers) * 100) : 0;

                            // Group by type for statistics
                            const typeStats = MEMBER_TYPES.map(t => {
                                const group = members.filter(m => m.memberType === t.key);
                                const totalGroupFee = group.reduce((s, m) => s + m.feeAmount, 0);
                                return { key: t.key, label: t.label, count: group.length, totalFee: totalGroupFee };
                            }).filter(s => s.count > 0);

                            // Generate text report
                            const generateTextReport = () => {
                                const typeRows = typeStats.map((s, i) =>
                                    `${i + 1}. ${s.label}: ${s.count} đồng chí — Tổng đảng phí: ${s.totalFee.toLocaleString('vi-VN')}đ/tháng`
                                ).join('\n');
                                return `${settings.superior_party || 'ĐẢNG BỘ PHƯỜNG ……………'}                    ĐẢNG CỘNG SẢN VIỆT NAM\n${settings.branch_name || 'CHI BỘ ……………'}\n                                              ……………, ngày …… tháng ${String(selectedMonth).padStart(2, '0')} năm ${selectedYear}\n\nBÁO CÁO\nVề tình hình thực hiện đóng đảng phí theo Quy định số 01-QĐ/TW\nngày 03/02/2026 của Bộ Chính trị\n(Tháng ${String(selectedMonth).padStart(2, '0')} năm ${selectedYear})\n-----\n\nKính gửi: Đảng ủy ${settings.superior_party?.replace(/ĐẢNG BỘ /i, '') || 'phường ……………'}\n\nThực hiện Quy định số 01-QĐ/TW ngày 03/02/2026 của Bộ Chính trị về chế độ đảng phí (có hiệu lực từ ngày 01/02/2026), ${settings.branch_name || 'Chi bộ ……………'} xin báo cáo tình hình triển khai thực hiện như sau:\n\nI. THỐNG KÊ TÌNH HÌNH THỰC HIỆN ĐÓNG ĐẢNG PHÍ\n\n1. Tổng số đảng viên chi bộ: ${totalMembers} đồng chí\n   - Đã hoàn thành nghĩa vụ đảng phí: ${paidCount} đồng chí (${totalMembers > 0 ? Math.round(paidCount / totalMembers * 100) : 0}%)\n   - Được miễn đóng đảng phí: ${exemptCount} đồng chí\n\n2. Thống kê theo nhóm đối tượng:\n${typeRows}\n\nTỔNG ĐẢNG PHÍ THU ĐƯỢC KỲ BÁO CÁO: ${totalFee.toLocaleString('vi-VN')}đ\n\nII. TÌNH HÌNH TRÍCH NỘP\n\n- Tổng đảng phí đã thu kỳ báo cáo (mã 02): ${totalFee.toLocaleString('vi-VN')}đ\n- Trích giữ lại chi bộ ${RETENTION_RATES.chiBoGiu}% (mã 04): ${chiBoGiu.toLocaleString('vi-VN')}đ\n- Nộp cấp trên ${RETENTION_RATES.nopCapTren}% (mã 12): ${nopCapTren.toLocaleString('vi-VN')}đ\n- Lũy kế từ đầu năm (mã 03): ${(ytdTotals.grandTotal).toLocaleString('vi-VN')}đ\n\nIII. ĐÁNH GIÁ VIỆC ÁP DỤNG CÔNG NGHỆ SỐ\n\n- Tỷ lệ sử dụng Sổ tay đảng viên điện tử: ……%\n- Tỷ lệ đăng ký Cổng Dịch vụ công Quốc gia: ……%\n\nIV. KHÓ KHĂN, VƯỚNG MẮC VÀ KIẾN NGHỊ\n\n1. Khó khăn: (nêu cụ thể)\n2. Kiến nghị: (nêu cụ thể)\n\nV. CAM KẾT THỰC HIỆN NGUYÊN TẮC \"3Đ\"\n\n- ĐÚNG mức đóng theo QĐ 01-QĐ/TW\n- ĐỦ số lượng đảng viên (${totalMembers}/${totalMembers} = ${complianceRate}%)\n- ĐỀU đặn thu nộp hàng tháng, đúng hạn\n\nTrên đây là báo cáo tình hình thực hiện đóng đảng phí. Kính đề nghị Đảng ủy ${settings.superior_party?.replace(/ĐẢNG BỘ /i, '') || 'phường'} xem xét, chỉ đạo./.\n\nNơi nhận:                                          T/M ${settings.branch_name?.split(' ')[0] || 'CHI BỘ'}\n- Đảng ủy ${settings.superior_party?.replace(/ĐẢNG BỘ /i, '') || 'phường'} (báo cáo);                           BÍ THƯ\n- Ban chi ủy;\n- Lưu Chi bộ.`;
                            };

                            const handleCopyReport = () => {
                                navigator.clipboard.writeText(generateTextReport());
                                setReportCopied(true);
                                setTimeout(() => setReportCopied(false), 2000);
                            };

                            return (<>
                                {/* ── 3Đ Compliance Dashboard ── */}
                                {totalMembers > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* ĐÚNG */}
                                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white shadow-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-5 h-5" />
                                                <span className="text-xs font-black uppercase tracking-wider">ĐÚNG</span>
                                            </div>
                                            <p className="text-2xl font-black">{complianceRate}%</p>
                                            <p className="text-emerald-200 text-[10px] mt-1">Đúng mức đóng theo QĐ 01-QĐ/TW</p>
                                            <div className="mt-2 bg-white/20 rounded-full h-2">
                                                <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${complianceRate}%` }} />
                                            </div>
                                            <p className="text-emerald-100 text-[9px] mt-1">{paidCount + exemptCount}/{totalMembers} đảng viên</p>
                                        </div>
                                        {/* ĐỦ */}
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-4 text-white shadow-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Shield className="w-5 h-5" />
                                                <span className="text-xs font-black uppercase tracking-wider">ĐỦ</span>
                                            </div>
                                            <p className="text-2xl font-black">{totalMembers}</p>
                                            <p className="text-blue-200 text-[10px] mt-1">Đủ số lượng ĐV quản lý</p>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex justify-between text-[9px]">
                                                    <span>Đóng phí: {paidCount}</span>
                                                    <span>Miễn: {exemptCount}</span>
                                                </div>
                                            </div>
                                            <p className="text-blue-100 text-[9px] mt-1">Không bỏ sót trường hợp miễn/giảm</p>
                                        </div>
                                        {/* ĐỀU */}
                                        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-4 text-white shadow-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-5 h-5" />
                                                <span className="text-xs font-black uppercase tracking-wider">ĐỀU</span>
                                            </div>
                                            <p className="text-2xl font-black">T{String(selectedMonth).padStart(2, '0')}/{selectedYear}</p>
                                            <p className="text-amber-200 text-[10px] mt-1">Nộp đều đặn hàng tháng</p>
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                                                <span className="text-[9px] text-amber-100">Thu: {fmt(totalFee)}</span>
                                            </div>
                                            <p className="text-amber-100 text-[9px] mt-1">Lũy kế: {fmt(ytdTotals.grandTotal)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Thống kê chi tiết theo đối tượng ── */}
                                {totalMembers > 0 && (
                                    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                                            <BarChart3 className="w-4 h-4 text-amber-600" />
                                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Thống kê theo nhóm đối tượng</h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="border-b border-gray-200 px-3 py-2 text-left">STT</th>
                                                        <th className="border-b border-gray-200 px-3 py-2 text-left">Nhóm đối tượng</th>
                                                        <th className="border-b border-gray-200 px-3 py-2 text-center">Số lượng</th>
                                                        <th className="border-b border-gray-200 px-3 py-2 text-center">Tỷ lệ</th>
                                                        <th className="border-b border-gray-200 px-3 py-2 text-right">Tổng ĐP/tháng</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {typeStats.map((s, i) => (
                                                        <tr key={s.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                                            <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-500">{i + 1}</td>
                                                            <td className="border-b border-gray-100 px-3 py-2 font-medium">{s.label}</td>
                                                            <td className="border-b border-gray-100 px-3 py-2 text-center">
                                                                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{s.count}</span>
                                                            </td>
                                                            <td className="border-b border-gray-100 px-3 py-2 text-center">{getRateLabel(s.key as MemberType)}</td>
                                                            <td className="border-b border-gray-100 px-3 py-2 text-right font-bold">{s.totalFee.toLocaleString('vi-VN')}đ</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-amber-50 font-bold">
                                                        <td className="px-3 py-2" colSpan={2}>TỔNG CỘNG</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-[10px]">{totalMembers}</span>
                                                        </td>
                                                        <td className="px-3 py-2"></td>
                                                        <td className="px-3 py-2 text-right text-amber-700">{totalFee.toLocaleString('vi-VN')}đ</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* ── Xuất báo cáo văn bản ── */}
                                {totalMembers > 0 && (
                                    <div className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden">
                                        <div className="px-4 py-3 flex items-center justify-between border-b border-amber-200 bg-amber-50">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-amber-600" />
                                                <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">Báo cáo văn bản</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setShowTextReport(!showTextReport)}
                                                    className="text-xs px-3 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold transition-colors"
                                                >
                                                    {showTextReport ? 'Ẩn' : 'Xem bản nháp'}
                                                </button>
                                                <button
                                                    onClick={handleCopyReport}
                                                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-bold transition-all ${reportCopied ? 'bg-green-500 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'
                                                        }`}
                                                >
                                                    {reportCopied ? <><ClipboardCheck className="w-3 h-3" /> Đã copy!</> : <><Copy className="w-3 h-3" /> Copy báo cáo</>}
                                                </button>
                                            </div>
                                        </div>
                                        {showTextReport && (
                                            <div className="p-4">
                                                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto leading-relaxed">
                                                    {generateTextReport()}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Bảng báo cáo tài chính ── */}
                                <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden print:border-black" id="party-fee-report">
                                    {/* Report header */}
                                    <div className="p-6 text-center space-y-1 print:py-4">
                                        <div className="flex justify-between items-start px-4">
                                            <div className="text-left">
                                                <p className="text-xs font-bold">{settings.superior_party || 'ĐẢNG BỘ PHƯỜNG ……………'}</p>
                                                <p className="text-sm font-black">{settings.branch_name || 'CHI BỘ ……………'}</p>
                                                <p className="text-xs">*</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold">ĐẢNG CỘNG SẢN VIỆT NAM</p>
                                                <p className="text-xs italic">……………, ngày …… tháng {String(selectedMonth).padStart(2, '0')} năm {selectedYear}</p>
                                            </div>
                                        </div>
                                        <div className="pt-3">
                                            <h3 className="text-sm font-black uppercase">BÁO CÁO THU, NỘP ĐẢNG PHÍ</h3>
                                            <p className="text-xs">(Tháng {String(selectedMonth).padStart(2, '0')} năm {selectedYear})</p>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto px-4 pb-6">
                                        <table className="w-full border-collapse text-xs print:text-[10px]">
                                            <thead>
                                                <tr className="bg-gray-100 print:bg-gray-200">
                                                    <th className="border border-gray-400 px-2 py-2 text-center w-8">TT</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-left min-w-[200px]">Chỉ tiêu</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-center w-16">Đơn vị tính</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-center w-10">Mã số</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-center">Đảng bộ xã, phường</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-center">Đảng bộ doanh nghiệp</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-center">Đảng bộ khác</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-center">Cộng</th>
                                                    <th className="border border-gray-400 px-2 py-2 text-center w-16">Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* I. Tổng số đảng viên */}
                                                <tr className="font-bold bg-amber-50">
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">I</td>
                                                    <td className="border border-gray-400 px-2 py-1.5">Tổng số đảng viên đến cuối kỳ báo cáo</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Người</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">01</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{totalMembers || ''}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{totalMembers || ''}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                {/* II. Đảng phí đã thu */}
                                                <tr className="font-bold bg-amber-50">
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">II</td>
                                                    <td className="border border-gray-400 px-2 py-1.5" colSpan={8}>Đảng phí đã thu được từ chi bộ của cấp báo cáo</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-4">1. Kỳ báo cáo</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">02</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(totalFee)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(totalFee)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-4">2. Từ đầu năm đến cuối kỳ báo cáo</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">03</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ytdTotals.grandTotal)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(ytdTotals.grandTotal)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                {/* III. Đảng phí trích giữ lại (30%) */}
                                                <tr className="font-bold bg-amber-50">
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">III</td>
                                                    <td className="border border-gray-400 px-2 py-1.5" colSpan={8}>Đảng phí trích giữ lại ở các cấp</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-4">1. Kỳ báo cáo (05+06+07)</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">04</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(chiBoGiu)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(chiBoGiu)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">({RETENTION_RATES.chiBoGiu}%)</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-6">1.1 Chi bộ, đảng bộ bộ phận</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">05</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(chiBoGiu)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(chiBoGiu)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-6">1.2 Tổ chức cơ sở đảng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">06</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-6">1.3 Cấp trên cơ sở</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">07</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-4">2. Từ đầu năm đến cuối kỳ báo cáo (09+10+11)</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">08</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100))}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100))}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-6">2.1 Chi bộ, đảng bộ bộ phận</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">09</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100))}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100))}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-6">2.2 Tổ chức cơ sở đảng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">10</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-6">2.3 Cấp trên cơ sở</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">11</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">-</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                {/* IV. Đảng phí nộp cấp trên (70%) */}
                                                <tr className="font-bold bg-amber-50">
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">IV</td>
                                                    <td className="border border-gray-400 px-2 py-1.5" colSpan={8}>Đảng phí nộp cấp trên của cấp báo cáo</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-4">1. Số phải nộp kỳ báo cáo (02–04)</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">12</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(nopCapTren)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(nopCapTren)}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">({RETENTION_RATES.nopCapTren}%)</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-4">2. Từ đầu năm đến cuối kỳ báo cáo (03–08)</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">13</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt((ytdTotals.grandTotal - Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100)))}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt((ytdTotals.grandTotal - Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100)))}</td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 pl-4">3. Số còn nợ chưa nộp cấp trên đến cuối kỳ báo cáo</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-center">14</td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                    <td className="border border-gray-400 px-2 py-1.5"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 pb-6">
                                        <div className="flex justify-between items-end mt-4">
                                            <div className="text-center">
                                                <p className="text-xs font-bold underline">Người lập</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs italic">……………, ngày …… tháng …… năm {selectedYear}</p>
                                                <p className="text-xs font-bold">T/M cấp ủy</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>);
                        })()}

                        {/* ─── BÁO CÁO TÌNH HÌNH KINH PHÍ HOẠT ĐỘNG ─────────── */}
                        {(() => {
                            const totalMembers = members.length;
                            const totalFee = members.reduce((s, m) => s + m.feeAmount, 0);
                            const autoDP = Math.round(totalFee * RETENTION_RATES.chiBoGiu / 100);
                            // Finance data for report period
                            const manualThuKPCapTren = financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.thu_kinh_phi_cap_tren || 0), 0);
                            const manualThuKhac = financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.thu_khac || 0), 0);
                            const totalChi = financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.chi_bao_tap_chi || 0) + (e.chi_dai_hoi || 0) + (e.chi_khen_thuong || 0) + (e.chi_ho_tro || 0) + (e.chi_phu_cap_cap_uy || 0) + (e.chi_khac || 0), 0);

                            // Mã numbers
                            const ma01 = financeOpeningBalance; // Số dư kỳ trước chuyển sang
                            const ma03 = autoDP;                // Thu đảng phí (70%)
                            const ma04 = manualThuKPCapTren;    // KP cấp trên cấp
                            const ma05 = manualThuKhac;         // Thu khác
                            const ma02 = ma03 + ma04 + ma05;    // KP phát sinh
                            const ma06 = ma01 + ma02;           // Tổng KP sử dụng
                            const ma07 = totalChi;              // KP đã chi
                            const ma08 = ma06 - ma07;           // KP còn lại

                            // Cumulative (from beginning of year)
                            const allYearEntries = financeEntries.filter(e => e.year === selectedYear && e.month <= selectedMonth);
                            const cumDP = Math.round(ytdTotals.grandTotal * RETENTION_RATES.chiBoGiu / 100); // actual YTD retention from payments
                            const cumKPCapTren = allYearEntries.reduce((s, e) => s + (e.thu_kinh_phi_cap_tren || 0), 0);
                            const cumThuKhac = allYearEntries.reduce((s, e) => s + (e.thu_khac || 0), 0);
                            const cumChi = allYearEntries.reduce((s, e) => s + (e.chi_bao_tap_chi || 0) + (e.chi_dai_hoi || 0) + (e.chi_khen_thuong || 0) + (e.chi_ho_tro || 0) + (e.chi_phu_cap_cap_uy || 0) + (e.chi_khac || 0), 0);
                            const cumMa02 = cumDP + cumKPCapTren + cumThuKhac;
                            const cumMa06 = ma01 + cumMa02; // opening of year + cumulative income
                            const cumMa08 = cumMa06 - cumChi;

                            // Expense breakdown for Phần III
                            const chiBreakdown = [
                                { muc: '1', label: 'Mua báo, tạp chí', ky: financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.chi_bao_tap_chi || 0), 0), luyKe: allYearEntries.reduce((s, e) => s + (e.chi_bao_tap_chi || 0), 0) },
                                { muc: '2', label: 'Chi đại hội, hội nghị', ky: financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.chi_dai_hoi || 0), 0), luyKe: allYearEntries.reduce((s, e) => s + (e.chi_dai_hoi || 0), 0) },
                                { muc: '3', label: 'Khen thưởng', ky: financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.chi_khen_thuong || 0), 0), luyKe: allYearEntries.reduce((s, e) => s + (e.chi_khen_thuong || 0), 0) },
                                { muc: '4', label: 'Chi hỗ trợ, thăm hỏi', ky: financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.chi_ho_tro || 0), 0), luyKe: allYearEntries.reduce((s, e) => s + (e.chi_ho_tro || 0), 0) },
                                { muc: '5', label: 'Phụ cấp cấp ủy', ky: financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.chi_phu_cap_cap_uy || 0), 0), luyKe: allYearEntries.reduce((s, e) => s + (e.chi_phu_cap_cap_uy || 0), 0) },
                                { muc: '6', label: 'Chi khác', ky: financeEntries.filter(e => e.month === selectedMonth && e.year === selectedYear).reduce((s, e) => s + (e.chi_khac || 0), 0), luyKe: allYearEntries.reduce((s, e) => s + (e.chi_khac || 0), 0) },
                            ];

                            const fmt = (n: number) => n === 0 ? '' : n.toLocaleString('vi-VN');
                            const mm = String(selectedMonth).padStart(2, '0');

                            return (<>
                                {/* Divider */}
                                <div className="border-t-4 border-dashed border-amber-200 my-2"></div>

                                {/* Report 2: BÁO CÁO TÌNH HÌNH KINH PHÍ HOẠT ĐỘNG */}
                                <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden print:shadow-none">
                                    {/* Header */}
                                    <div className="px-6 pt-6 pb-2">
                                        <div className="flex justify-between items-start text-xs">
                                            <div>
                                                <p className="font-bold uppercase">{settings.superior_party || 'ĐẢNG ỦY PHƯỜNG ……………'}</p>
                                                <p className="font-bold uppercase">{settings.branch_name || 'CHI BỘ ……………'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">ĐẢNG CỘNG SẢN VIỆT NAM</p>
                                                <p>─────────</p>
                                            </div>
                                        </div>
                                        <div className="text-center mt-4 mb-2">
                                            <p className="text-sm font-black uppercase">BÁO CÁO TÌNH HÌNH KINH PHÍ HOẠT ĐỘNG CỦA CHI BỘ</p>
                                            <p className="text-xs italic mt-1">Tháng {mm} năm {selectedYear}</p>
                                        </div>
                                    </div>

                                    {/* Phần I */}
                                    <div className="px-6 py-2">
                                        <p className="text-xs font-bold underline mb-1">Phần I - Tình hình tổ chức đảng, tiền lương</p>
                                        <p className="text-xs">1- Tổng số đảng viên: <strong>{totalMembers}</strong> đồng chí</p>
                                        <p className="text-xs">2- Số cấp ủy viên: <strong>……</strong> đồng chí</p>
                                    </div>

                                    {/* Phần II */}
                                    <div className="px-6 py-2">
                                        <p className="text-xs font-bold underline mb-1">Phần II - Tình hình thu, chi</p>
                                        <p className="text-[10px] italic text-gray-500 mb-2">Đơn vị tính: đồng</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-400 px-2 py-1.5 text-center w-[40px]">TT</th>
                                                        <th className="border border-gray-400 px-2 py-1.5 text-left">Chỉ tiêu</th>
                                                        <th className="border border-gray-400 px-2 py-1.5 text-center w-[40px]">Mã số</th>
                                                        <th className="border border-gray-400 px-2 py-1.5 text-center w-[110px]">Kỳ này</th>
                                                        <th className="border border-gray-400 px-2 py-1.5 text-center w-[110px]">Lũy kế</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="font-bold bg-amber-50">
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">I</td>
                                                        <td className="border border-gray-400 px-2 py-1.5" colSpan={4}>Nguồn Kinh phí</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">1</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 pl-4">Số dư KP kỳ trước chuyển sang</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">01</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ma01)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ma01)}</td>
                                                    </tr>
                                                    <tr className="font-semibold">
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">2</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 pl-4">Kinh phí phát sinh (03+04+05)</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">02</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ma02)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(cumMa02)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">2.1</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 pl-6">Thu đảng phí</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">03</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ma03)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(cumDP)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">2.2</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 pl-6">Kinh phí được cấp trên cấp</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">04</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ma04)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(cumKPCapTren)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">2.3</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 pl-6">Thu khác</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">05</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ma05)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(cumThuKhac)}</td>
                                                    </tr>
                                                    <tr className="font-bold bg-amber-50">
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">3</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 pl-4">Tổng kinh phí được sử dụng (01+02)</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">06</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(ma06)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(cumMa06)}</td>
                                                    </tr>
                                                    <tr className="font-bold bg-red-50">
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">II</td>
                                                        <td className="border border-gray-400 px-2 py-1.5">Kinh phí đã chi</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">07</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right text-red-700">{fmt(ma07)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right text-red-700">{fmt(cumChi)}</td>
                                                    </tr>
                                                    <tr className="font-bold bg-blue-50">
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">III</td>
                                                        <td className="border border-gray-400 px-2 py-1.5">Kinh phí còn lại chuyển kỳ sau (06-07)</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-center">08</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right text-blue-700">{fmt(ma08)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right text-blue-700">{fmt(cumMa08)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Phần III */}
                                    <div className="px-6 py-2 pb-4">
                                        <p className="text-xs font-bold underline mb-1">Phần III - Phân tích kinh phí đã chi</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-400 px-2 py-1.5 text-center w-[40px]">Mục</th>
                                                        <th className="border border-gray-400 px-2 py-1.5 text-left">Nội dung chi</th>
                                                        <th className="border border-gray-400 px-2 py-1.5 text-center w-[110px]">Kỳ này</th>
                                                        <th className="border border-gray-400 px-2 py-1.5 text-center w-[110px]">Lũy kế</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {chiBreakdown.map(item => (
                                                        <tr key={item.muc}>
                                                            <td className="border border-gray-400 px-2 py-1.5 text-center">{item.muc}</td>
                                                            <td className="border border-gray-400 px-2 py-1.5">{item.label}</td>
                                                            <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(item.ky)}</td>
                                                            <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(item.luyKe)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="font-bold bg-red-50">
                                                        <td className="border border-gray-400 px-2 py-1.5"></td>
                                                        <td className="border border-gray-400 px-2 py-1.5">Tổng cộng</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right text-red-700">{fmt(ma07)}</td>
                                                        <td className="border border-gray-400 px-2 py-1.5 text-right text-red-700">{fmt(cumChi)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 pb-4">
                                        <div className="flex justify-between items-end mt-4">
                                            <div className="text-center">
                                                <p className="text-xs font-bold underline">Người lập</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs italic">……………, ngày …… tháng …… năm {selectedYear}</p>
                                                <p className="text-xs font-bold">T/M cấp ủy</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Export Excel button */}
                                    <div className="px-6 pb-4 flex justify-end">
                                        <button onClick={() => {
                                            const wsData: (string | number | null)[][] = [
                                                [settings.superior_party || 'ĐẢNG ỦY PHƯỜNG ……………', null, null, null, 'ĐẢNG CỘNG SẢN VIỆT NAM'],
                                                [settings.branch_name || 'CHI BỘ ……………', null, null, null, '─────────'],
                                                [],
                                                [null, 'BÁO CÁO TÌNH HÌNH KINH PHÍ HOẠT ĐỘNG CỦA CHI BỘ'],
                                                [null, null, `Tháng ${mm} năm ${selectedYear}`],
                                                [],
                                                ['Phần I - Tình hình tổ chức đảng, tiền lương'],
                                                [`1- Tổng số đảng viên: ${totalMembers} đồng chí`],
                                                ['2- Số cấp ủy viên: …… đồng chí'],
                                                [],
                                                ['Phần II - Tình hình thu, chi'],
                                                ['Đơn vị tính: đồng'],
                                                ['TT', 'Chỉ tiêu', 'Mã số', 'Kỳ này', 'Lũy kế'],
                                                ['I', 'Nguồn Kinh phí'],
                                                [1, 'Số dư KP kỳ trước chuyển sang', '01', ma01 || null, ma01 || null],
                                                [2, 'Kinh phí phát sinh (03+04+05)', '02', ma02 || null, cumMa02 || null],
                                                ['2.1', '   Thu đảng phí', '03', ma03 || null, cumDP || null],
                                                ['2.2', '   Kinh phí được cấp trên cấp', '04', ma04 || null, cumKPCapTren || null],
                                                ['2.3', '   Thu khác', '05', ma05 || null, cumThuKhac || null],
                                                [3, 'Tổng kinh phí được sử dụng (01+02)', '06', ma06 || null, cumMa06 || null],
                                                ['II', 'Kinh phí đã chi', '07', ma07 || null, cumChi || null],
                                                ['III', 'Kinh phí còn lại chuyển kỳ sau (06-07)', '08', ma08, cumMa08],
                                                [],
                                                ['Phần III - Phân tích kinh phí đã chi'],
                                                ['Mục', 'Nội dung chi', null, 'Kỳ này', 'Lũy kế'],
                                            ];
                                            chiBreakdown.forEach(item => {
                                                wsData.push([item.muc, item.label, null, item.ky || null, item.luyKe || null]);
                                            });
                                            wsData.push([null, 'Tổng cộng', null, ma07 || null, cumChi || null]);

                                            const wb = XLSX.utils.book_new();
                                            const ws = XLSX.utils.aoa_to_sheet(wsData);
                                            ws['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 8 }, { wch: 16 }, { wch: 16 }];
                                            ws['!merges'] = [
                                                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
                                                { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
                                                { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } },
                                            ];
                                            XLSX.utils.book_append_sheet(wb, ws, `KinhPhi_T${mm}`);
                                            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url; a.download = `BaoCao_KinhPhi_T${mm}_${selectedYear}.xlsx`;
                                            a.click(); URL.revokeObjectURL(url);
                                        }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                                        >
                                            <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel
                                        </button>
                                    </div>
                                </div>
                            </>);
                        })()}

                    </div>
                )
            }

            {/* ═══════════════ TAB: FINANCE (SỔ THU, CHI) ═══════════════ */}
            {
                tabMode === 'finance' && (() => {
                    // ── Auto party fee calculation (70% chi bộ giữ) ──
                    const paidMembers = members.filter(m => monthlyPaidMap[m.id] && m.feeAmount > 0);
                    const totalCollectedDP = paidMembers.reduce((s, m) => s + m.feeAmount, 0);
                    const autoPartyFeeAmount = Math.round(totalCollectedDP * RETENTION_RATES.chiBoGiu / 100);

                    // ── Build virtual auto entry ──
                    const autoEntry: FinanceEntry = {
                        id: '__auto_dp__',
                        entry_date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
                        ref_number: '',
                        description: `Đảng phí T${String(selectedMonth).padStart(2, '0')}/${selectedYear} — ${paidMembers.length}/${members.filter(m => m.feeAmount > 0).length} ĐV`,
                        entry_type: 'auto_dang_phi',
                        thu_dang_phi: autoPartyFeeAmount,
                        thu_kinh_phi_cap_tren: 0, thu_khac: 0,
                        chi_bao_tap_chi: 0, chi_dai_hoi: 0, chi_khen_thuong: 0,
                        chi_ho_tro: 0, chi_phu_cap_cap_uy: 0, chi_khac: 0,
                        month: selectedMonth, year: selectedYear,
                    };

                    // ── All entries = auto + manual ──
                    const allEntries = [autoEntry, ...financeEntries];

                    // ── Totals ──
                    const sumIncome = allEntries.reduce((s, e) => s + calcTotalIncome(e), 0);
                    const sumExpense = allEntries.reduce((s, e) => s + calcTotalExpense(e), 0);
                    const closingBalance = financeOpeningBalance + sumIncome - sumExpense;

                    const fmt = (n: number) => n === 0 ? '-' : n.toLocaleString('vi-VN');

                    // ── Load finance data ──
                    const loadFinanceData = async () => {
                        setFinanceLoading(true);
                        try {
                            const [entries, opening] = await Promise.all([
                                fetchFinanceEntries(selectedMonth, selectedYear),
                                calculateOpeningBalance(selectedMonth, selectedYear)
                            ]);
                            setFinanceEntries(entries.filter(e => e.entry_type !== 'auto_dang_phi'));
                            setFinanceOpeningBalance(opening);
                        } catch { console.warn('Failed to load finance data'); }
                        setFinanceLoading(false);
                    };

                    // ── Save entry (new or edit) ──
                    const handleSaveEntry = async (entry: FinanceEntry) => {
                        if (editingFinanceEntry?.id) {
                            await updateFinanceEntry(editingFinanceEntry.id, entry);
                        } else {
                            await createFinanceEntry(entry);
                        }
                        setShowFinanceForm(false);
                        setEditingFinanceEntry(null);
                        loadFinanceData();
                    };

                    // ── Delete entry ──
                    const handleDeleteEntry = async (id: string) => {
                        const confirmed = await showConfirm('Xóa giao dịch này?', 'Xác nhận xóa', 'warning');
                        if (!confirmed) return;
                        await deleteFinanceEntry(id);
                        loadFinanceData();
                    };

                    return (
                        <div className="space-y-4">
                            {/* Controls */}
                            <div className="bg-white border-2 border-teal-200 rounded-2xl p-4">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-4 h-4 text-teal-600" />
                                        <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Sổ thu, chi tài chính Chi bộ</span>
                                        <div className="flex items-center gap-2">
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
                                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {String(i + 1).padStart(2, '0')}</option>)}
                                            </select>
                                            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
                                                {Array.from({ length: 5 }, (_, i) => { const y = new Date().getFullYear() - 1 + i; return <option key={y} value={y}>{y}</option>; })}
                                            </select>
                                            <button onClick={loadFinanceData} className="p-1.5 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors" title="Tải lại">
                                                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${financeLoading ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => {
                                            const mm = String(selectedMonth).padStart(2, '0');
                                            const wsData: (string | number | null)[][] = [
                                                [settings.superior_party || 'ĐẢNG BỘ PHƯỜNG ……………', null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                                                [settings.branch_name || 'CHI BỘ ……………', null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                                                [],
                                                [null, null, null, null, 'SỔ THU, CHI TÀI CHÍNH CỦA CHI BỘ'],
                                                [null, null, null, null, null, `Đơn vị tính: đồng`],
                                                [null, null, null, null, null, `Tháng ${mm} năm ${selectedYear}`],
                                                [],
                                                ['Ngày tháng', 'Số hiệu', 'Diễn giải', 'Đảng phí (1)', 'KP cấp trên cấp (2)', 'Thu khác (3)', 'Tổng thu (4)', 'Báo, tạp chí (5)', 'Đại hội (6)', 'Khen thưởng (7)', 'Chi hỗ trợ (8)', 'Phụ cấp cấp ủy (9)', 'Chi khác (10)', 'Tổng Chi (11)', 'Tồn quỹ (12)'],
                                                // Opening balance
                                                [null, null, 'Số dư đầu kỳ', null, null, null, null, null, null, null, null, null, null, null, financeOpeningBalance || null],
                                            ];
                                            let runBal = financeOpeningBalance;
                                            allEntries.forEach(e => {
                                                const inc = calcTotalIncome(e);
                                                const exp = calcTotalExpense(e);
                                                runBal += inc - exp;
                                                wsData.push([
                                                    e.entry_date?.slice(5) || '', e.ref_number || '', e.description || '',
                                                    e.thu_dang_phi || null, e.thu_kinh_phi_cap_tren || null, e.thu_khac || null, inc || null,
                                                    e.chi_bao_tap_chi || null, e.chi_dai_hoi || null, e.chi_khen_thuong || null,
                                                    e.chi_ho_tro || null, e.chi_phu_cap_cap_uy || null, e.chi_khac || null, exp || null,
                                                    runBal
                                                ]);
                                            });
                                            // Period totals
                                            wsData.push([
                                                null, null, 'Cộng phát trong kỳ',
                                                allEntries.reduce((s, e) => s + e.thu_dang_phi, 0) || null,
                                                allEntries.reduce((s, e) => s + e.thu_kinh_phi_cap_tren, 0) || null,
                                                allEntries.reduce((s, e) => s + e.thu_khac, 0) || null,
                                                sumIncome || null,
                                                allEntries.reduce((s, e) => s + e.chi_bao_tap_chi, 0) || null,
                                                allEntries.reduce((s, e) => s + e.chi_dai_hoi, 0) || null,
                                                allEntries.reduce((s, e) => s + e.chi_khen_thuong, 0) || null,
                                                allEntries.reduce((s, e) => s + e.chi_ho_tro, 0) || null,
                                                allEntries.reduce((s, e) => s + e.chi_phu_cap_cap_uy, 0) || null,
                                                allEntries.reduce((s, e) => s + e.chi_khac, 0) || null,
                                                sumExpense || null,
                                                closingBalance
                                            ]);

                                            const wb = XLSX.utils.book_new();
                                            const ws = XLSX.utils.aoa_to_sheet(wsData);
                                            ws['!cols'] = [
                                                { wch: 12 }, { wch: 8 }, { wch: 30 },
                                                { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
                                                { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
                                            ];
                                            ws['!merges'] = [
                                                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
                                                { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
                                                { s: { r: 3, c: 3 }, e: { r: 3, c: 12 } },
                                            ];
                                            XLSX.utils.book_append_sheet(wb, ws, `ThuChi_T${mm}`);
                                            const wbout2 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                            const blob2 = new Blob([wbout2], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                            const url2 = URL.createObjectURL(blob2);
                                            const a2 = document.createElement('a');
                                            a2.href = url2; a2.download = `SoThuChi_T${mm}_${selectedYear}.xlsx`;
                                            a2.click(); URL.revokeObjectURL(url2);
                                        }}
                                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
                                            <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel
                                        </button>
                                        <button onClick={() => { setEditingFinanceEntry(null); setShowFinanceForm(true); }}
                                            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
                                            <PlusCircle className="w-3.5 h-3.5" /> Thêm giao dịch
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Auto DP Banner */}
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                <div className="bg-amber-200 p-2 rounded-xl flex-shrink-0">
                                    <Wallet className="w-5 h-5 text-amber-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-amber-800">
                                        Đảng phí T{String(selectedMonth).padStart(2, '0')}/{selectedYear}: Thu {totalCollectedDP.toLocaleString('vi-VN')}đ từ {paidMembers.length} ĐV
                                        → Chi bộ giữ {RETENTION_RATES.chiBoGiu}% = <span className="text-base">{autoPartyFeeAmount.toLocaleString('vi-VN')}đ</span>
                                    </p>
                                    <p className="text-[10px] text-amber-600 mt-0.5">Tự động liên kết từ tab "Danh sách ĐV" • 30% ({Math.round(totalCollectedDP * RETENTION_RATES.nopCapTren / 100).toLocaleString('vi-VN')}đ) nộp cấp trên</p>
                                </div>
                            </div>

                            {/* Dashboard Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tồn đầu kỳ</p>
                                    <p className={`text-xl font-black mt-1 ${financeOpeningBalance >= 0 ? 'text-gray-700' : 'text-red-600'}`}>{fmt(financeOpeningBalance)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-center text-white shadow-lg">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Tổng thu</p>
                                    <p className="text-xl font-black mt-1">{fmt(sumIncome)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-4 text-center text-white shadow-lg">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-red-200">Tổng chi</p>
                                    <p className="text-xl font-black mt-1">{fmt(sumExpense)}</p>
                                </div>
                                <div className={`bg-gradient-to-br ${closingBalance >= 0 ? 'from-blue-500 to-blue-700' : 'from-orange-500 to-red-600'} rounded-2xl p-4 text-center text-white shadow-lg`}>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200">Tồn cuối kỳ</p>
                                    <p className="text-xl font-black mt-1">{fmt(closingBalance)}</p>
                                </div>
                            </div>

                            {/* Ledger Table */}
                            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
                                <div className="bg-teal-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                                    <Table2 className="w-4 h-4 text-teal-600" />
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Sổ thu, chi tài chính</h4>
                                    <span className="text-[10px] text-gray-500 ml-2">Đơn vị: đồng</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px] border-collapse min-w-[1100px]">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-center font-bold w-[80px]">Ngày<br />tháng</th>
                                                <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-center font-bold w-[60px]">Số<br />hiệu</th>
                                                <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-center font-bold w-[140px]">Diễn giải</th>
                                                <th colSpan={4} className="border border-gray-300 px-2 py-1 text-center font-bold bg-emerald-50 text-emerald-800">Phần thu</th>
                                                <th colSpan={7} className="border border-gray-300 px-2 py-1 text-center font-bold bg-red-50 text-red-800">Phần chi</th>
                                                <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-center font-bold bg-blue-50 text-blue-800 w-[85px]">Tồn quỹ<br />(12)</th>
                                                <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-center font-bold w-[30px]"></th>
                                            </tr>
                                            <tr className="bg-gray-50 text-[10px]">
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-emerald-50">Đảng phí<br />(1)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-emerald-50">KP cấp<br />trên cấp<br />(2)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-emerald-50">Thu<br />khác<br />(3)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-emerald-50 font-bold">Tổng thu<br />(4)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-red-50">Báo,<br />tạp chí<br />(5)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-red-50">Đại<br />hội<br />(6)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-red-50">Khen<br />thưởng<br />(7)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-red-50">Chi hỗ<br />trợ<br />(8)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-red-50">Phụ cấp<br />cấp ủy<br />(9)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-red-50">Chi<br />khác<br />(10)</th>
                                                <th className="border border-gray-300 px-1 py-1 text-center bg-red-50 font-bold">Tổng<br />Chi<br />(11)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Opening balance row */}
                                            <tr className="bg-blue-50/50 font-bold">
                                                <td className="border border-gray-300 px-2 py-1.5"></td>
                                                <td className="border border-gray-300 px-2 py-1.5"></td>
                                                <td className="border border-gray-300 px-2 py-1.5 italic text-blue-700">Số dư đầu kỳ</td>
                                                <td colSpan={11} className="border border-gray-300"></td>
                                                <td className="border border-gray-300 px-2 py-1.5 text-right text-blue-700">{fmt(financeOpeningBalance)}</td>
                                                <td className="border border-gray-300"></td>
                                            </tr>

                                            {/* Data rows */}
                                            {allEntries.map((entry, idx) => {
                                                const inc = calcTotalIncome(entry);
                                                const exp = calcTotalExpense(entry);
                                                // Running balance
                                                let runBal = financeOpeningBalance;
                                                for (let i = 0; i <= idx; i++) {
                                                    runBal += calcTotalIncome(allEntries[i]) - calcTotalExpense(allEntries[i]);
                                                }
                                                const isAuto = entry.entry_type === 'auto_dang_phi';
                                                return (
                                                    <tr key={entry.id || idx} className={`${isAuto ? 'bg-amber-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-100/50`}>
                                                        <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">{entry.entry_date?.slice(5) || ''}</td>
                                                        <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-500 font-mono">{entry.ref_number}</td>
                                                        <td className="border border-gray-300 px-2 py-1.5">
                                                            <span className="text-gray-800">{entry.description}</span>
                                                            {isAuto && <span className="ml-1 inline-block bg-amber-200 text-amber-800 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase">Tự động</span>}
                                                        </td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-emerald-700">{fmt(entry.thu_dang_phi)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-emerald-700">{fmt(entry.thu_kinh_phi_cap_tren)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-emerald-700">{fmt(entry.thu_khac)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right font-bold text-emerald-800">{fmt(inc)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{fmt(entry.chi_bao_tap_chi)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{fmt(entry.chi_dai_hoi)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{fmt(entry.chi_khen_thuong)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{fmt(entry.chi_ho_tro)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{fmt(entry.chi_phu_cap_cap_uy)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{fmt(entry.chi_khac)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-right font-bold text-red-800">{fmt(exp)}</td>
                                                        <td className={`border border-gray-300 px-2 py-1.5 text-right font-bold ${runBal >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{fmt(runBal)}</td>
                                                        <td className="border border-gray-300 px-1 py-1.5 text-center">
                                                            {!isAuto && (
                                                                <div className="flex items-center gap-0.5 justify-center">
                                                                    <button onClick={() => { setEditingFinanceEntry(entry); setShowFinanceForm(true); }} className="p-0.5 hover:bg-blue-100 rounded transition-colors" title="Sửa">
                                                                        <Pencil className="w-3 h-3 text-blue-500" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteEntry(entry.id!)} className="p-0.5 hover:bg-red-100 rounded transition-colors" title="Xóa">
                                                                        <Trash2 className="w-3 h-3 text-red-400" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Period totals row */}
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                                <td className="border border-gray-300 px-2 py-2"></td>
                                                <td className="border border-gray-300 px-2 py-2"></td>
                                                <td className="border border-gray-300 px-2 py-2 text-gray-800 uppercase text-[10px]">Cộng phát trong kỳ</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-emerald-800">{fmt(allEntries.reduce((s, e) => s + e.thu_dang_phi, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-emerald-800">{fmt(allEntries.reduce((s, e) => s + e.thu_kinh_phi_cap_tren, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-emerald-800">{fmt(allEntries.reduce((s, e) => s + e.thu_khac, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-emerald-900 text-sm">{fmt(sumIncome)}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-red-800">{fmt(allEntries.reduce((s, e) => s + e.chi_bao_tap_chi, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-red-800">{fmt(allEntries.reduce((s, e) => s + e.chi_dai_hoi, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-red-800">{fmt(allEntries.reduce((s, e) => s + e.chi_khen_thuong, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-red-800">{fmt(allEntries.reduce((s, e) => s + e.chi_ho_tro, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-red-800">{fmt(allEntries.reduce((s, e) => s + e.chi_phu_cap_cap_uy, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-red-800">{fmt(allEntries.reduce((s, e) => s + e.chi_khac, 0))}</td>
                                                <td className="border border-gray-300 px-1 py-2 text-right text-red-900 text-sm">{fmt(sumExpense)}</td>
                                                <td className={`border border-gray-300 px-2 py-2 text-right text-sm ${closingBalance >= 0 ? 'text-blue-800' : 'text-red-700'}`}>{fmt(closingBalance)}</td>
                                                <td className="border border-gray-300"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {financeEntries.length === 0 && (
                                    <div className="p-8 text-center">
                                        <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                        <p className="text-xs text-gray-400">Chưa có giao dịch thủ công nào. Nhấn "Thêm giao dịch" để bắt đầu.</p>
                                        <button onClick={loadFinanceData} className="mt-2 px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold hover:bg-teal-200 transition-colors">
                                            <RefreshCw className="w-3 h-3 inline mr-1" /> Tải dữ liệu
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ─── ADD/EDIT FINANCE ENTRY MODAL ── */}
                            {showFinanceForm && (() => {
                                const isEdit = !!editingFinanceEntry?.id && editingFinanceEntry.id !== '__auto_dp__';
                                const initial = isEdit ? editingFinanceEntry! : emptyEntry(selectedMonth, selectedYear);
                                return (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowFinanceForm(false); setEditingFinanceEntry(null); }}>
                                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
                                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                                    {isEdit ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                                                    {isEdit ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
                                                </span>
                                                <button onClick={() => { setShowFinanceForm(false); setEditingFinanceEntry(null); }} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                                            </div>
                                            <form onSubmit={async (ev) => {
                                                ev.preventDefault();
                                                const fd = new FormData(ev.currentTarget);
                                                const entry: FinanceEntry = {
                                                    ...initial,
                                                    entry_date: fd.get('entry_date') as string || initial.entry_date,
                                                    ref_number: fd.get('ref_number') as string || '',
                                                    description: fd.get('description') as string || '',
                                                    entry_type: 'manual',
                                                    thu_dang_phi: 0,
                                                    thu_kinh_phi_cap_tren: Number(fd.get('thu_kinh_phi_cap_tren')) || 0,
                                                    thu_khac: Number(fd.get('thu_khac')) || 0,
                                                    chi_bao_tap_chi: Number(fd.get('chi_bao_tap_chi')) || 0,
                                                    chi_dai_hoi: Number(fd.get('chi_dai_hoi')) || 0,
                                                    chi_khen_thuong: Number(fd.get('chi_khen_thuong')) || 0,
                                                    chi_ho_tro: Number(fd.get('chi_ho_tro')) || 0,
                                                    chi_phu_cap_cap_uy: Number(fd.get('chi_phu_cap_cap_uy')) || 0,
                                                    chi_khac: Number(fd.get('chi_khac')) || 0,
                                                    month: selectedMonth,
                                                    year: selectedYear,
                                                };
                                                await handleSaveEntry(entry);
                                            }} className="overflow-y-auto flex-1 p-5 space-y-4">
                                                {/* Basic info */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày</label>
                                                        <input type="date" name="entry_date" defaultValue={initial.entry_date}
                                                            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-teal-400 focus:ring-0" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số hiệu</label>
                                                        <input type="text" name="ref_number" defaultValue={initial.ref_number} placeholder="Số CT"
                                                            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-teal-400 focus:ring-0" />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Diễn giải</label>
                                                        <input type="text" name="description" defaultValue={initial.description} placeholder="Nội dung"
                                                            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-teal-400 focus:ring-0" />
                                                    </div>
                                                </div>

                                                {/* Income section */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">Phần thu</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">KP cấp trên cấp (2)</label>
                                                            <input type="number" name="thu_kinh_phi_cap_tren" defaultValue={initial.thu_kinh_phi_cap_tren || ''}
                                                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-emerald-400" placeholder="0" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Thu khác (3)</label>
                                                            <input type="number" name="thu_khac" defaultValue={initial.thu_khac || ''}
                                                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-emerald-400" placeholder="0" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 mt-1 italic">* Đảng phí (1) tự động lấy từ danh sách đóng ĐP × 70%</p>
                                                </div>

                                                {/* Expense section */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-red-700 uppercase tracking-wider mb-2 border-b border-red-100 pb-1">Phần chi</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {EXPENSE_FIELDS.map(f => (
                                                            <div key={f.key}>
                                                                <label className="block text-[10px] font-bold text-gray-500 mb-1">{f.label} ({f.code})</label>
                                                                <input type="number" name={f.key} defaultValue={(initial as any)[f.key] || ''}
                                                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-red-400" placeholder="0" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                                    <button type="button" onClick={() => { setShowFinanceForm(false); setEditingFinanceEntry(null); }}
                                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                                                    <button type="submit"
                                                        className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm">
                                                        {isEdit ? 'Cập nhật' : 'Thêm mới'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })()
            }


            {/* ─── SETTINGS TAB ──────────────────────────── */}
            {
                tabMode === 'settings' && (
                    <div className="space-y-6">
                        <div className="bg-white border-2 border-amber-200 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-amber-100 p-2 rounded-xl">
                                    <Settings className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Cấu hình Chi bộ & Ngân hàng</h3>
                                    <p className="text-[10px] text-gray-500">Thông tin này dùng để xuất báo cáo và tạo mã QR đóng đảng phí</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Branch Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest border-b border-amber-100 pb-2">Thông tin tổ chức</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên Chi bộ</label>
                                            <input
                                                type="text"
                                                value={settings.branch_name}
                                                onChange={e => setSettings({ ...settings, branch_name: e.target.value })}
                                                placeholder="Ví dụ: CHI BỘ 1"
                                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:ring-0 transition-all font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đảng bộ cấp trên</label>
                                            <input
                                                type="text"
                                                value={settings.superior_party}
                                                onChange={e => setSettings({ ...settings, superior_party: e.target.value })}
                                                placeholder="Ví dụ: ĐẢNG BỘ PHƯỜNG THUẬN AN"
                                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:ring-0 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest border-b border-amber-100 pb-2">Tài khoản nhận Đảng phí</h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngân hàng (VietQR ID)</label>
                                                <input
                                                    type="text"
                                                    value={settings.bank_name}
                                                    onChange={e => setSettings({ ...settings, bank_name: e.target.value })}
                                                    placeholder="Ví dụ: MB, VCB, ICB"
                                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:ring-0 transition-all font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số tài khoản</label>
                                                <input
                                                    type="text"
                                                    value={settings.bank_account_number}
                                                    onChange={e => setSettings({ ...settings, bank_account_number: e.target.value })}
                                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-400 focus:ring-0 transition-all font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chủ tài khoản (Tiếng Việt không dấu)</label>
                                            <input
                                                type="text"
                                                value={settings.account_holder_name}
                                                onChange={e => setSettings({ ...settings, account_holder_name: e.target.value })}
                                                placeholder="Ví dụ: NGUYEN VAN A"
                                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:ring-0 transition-all uppercase font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SePay API Key (Tùy chọn - Để tự động đối soát CK)</label>
                                            <input
                                                type="password"
                                                value={settings.sepay_api_key}
                                                onChange={e => setSettings({ ...settings, sepay_api_key: e.target.value })}
                                                placeholder="Nhập API Key từ SePay.vn (Nếu có)"
                                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:ring-0 transition-all font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {settingsSaved && (
                                        <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-pulse">
                                            <CheckCircle2 className="w-4 h-4" /> Đã lưu thành công!
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        setSettingsLoading(true);
                                        const success = await upsertPartySettings(settings);
                                        if (success) {
                                            setSettingsSaved(true);
                                            setTimeout(() => setSettingsSaved(false), 3000);
                                        }
                                        setSettingsLoading(false);
                                    }}
                                    disabled={settingsLoading}
                                    className="px-6 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                                >
                                    {settingsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                                    Lưu cấu hình
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-[10px] text-blue-700 leading-relaxed">
                                <p className="font-bold uppercase mb-1 underline">Lưu ý quan trọng:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>Mã ngân hàng:</strong> Sử dụng mã định danh VietQR (Ví dụ: MB, VCB, VBA, ICB, v.v.).</li>
                                    <li><strong>Đối soát tự động (SePay):</strong> Đây là tính năng **Tùy chọn**. Nếu không có API Key, bạn vẫn có thể nộp và nộp thủ công bình thường.</li>
                                    <li><strong>Tính riêng tư:</strong> Thông tin này là riêng biệt cho từng tài khoản chi bộ.</li>
                                    <li><strong>Mã QR:</strong> Sau khi lưu, mã QR đóng đảng phí sẽ tự động cập nhật theo số tài khoản này.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reference notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-[10px] text-gray-500 space-y-1">
                    <p><strong>Căn cứ pháp lý:</strong> Quy định số 01-QĐ/TW ngày 03/02/2026 của Bộ Chính trị về chế độ đảng phí.</p>
                    <p><strong>Thay thế:</strong> Quyết định 342-QĐ/TW ngày 28/12/2010 của Bộ Chính trị.</p>
                    <p><strong>Hình thức nộp:</strong> Cổng Dịch vụ công Quốc gia hoặc tiền mặt trực tiếp cho chi bộ.</p>
                </div>
            </div>

            {/* ─── SEPAY RESULTS MODAL ──────────────── */}
            {
                showSepayModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSepayModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2 text-white">
                                    <Landmark className="w-5 h-5" />
                                    <span className="text-sm font-bold">Kết quả kiểm tra SePay</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">T{String(selectedMonth).padStart(2, '0')}/{selectedYear}</span>
                                </div>
                                <button onClick={() => setShowSepayModal(false)} className="text-white/70 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto flex-1 p-5 space-y-3">
                                {sepayError && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-red-700">Lỗi kết nối SePay</p>
                                            <p className="text-[10px] text-red-600 mt-0.5">{sepayError}</p>
                                        </div>
                                    </div>
                                )}

                                {sepayResults && sepayResults.length === 0 && !sepayError && (
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
                                        <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-gray-500">Không tìm thấy giao dịch</p>
                                        <p className="text-[10px] text-gray-400 mt-1">Không có chuyển khoản nào trong tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}</p>
                                    </div>
                                )}

                                {sepayResults && sepayResults.length > 0 && (
                                    <>
                                        {/* Summary */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                                <p className="text-lg font-black text-green-700">{sepayResults.filter(r => r.confidence === 'exact').length}</p>
                                                <p className="text-[9px] font-bold text-green-600 uppercase">Khớp chính xác</p>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                                <p className="text-lg font-black text-amber-700">{sepayResults.filter(r => r.confidence === 'partial').length}</p>
                                                <p className="text-[9px] font-bold text-amber-600 uppercase">Khớp gần đúng</p>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                                                <p className="text-lg font-black text-red-700">{sepayResults.filter(r => r.confidence === 'none').length}</p>
                                                <p className="text-[9px] font-bold text-red-600 uppercase">Không khớp</p>
                                            </div>
                                        </div>

                                        {/* Matched transactions */}
                                        {sepayResults.filter(r => r.confidence !== 'none').length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-black text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Giao dịch đã khớp — tự động đánh dấu "Đã nộp"
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {sepayResults.filter(r => r.confidence !== 'none').map((r, i) => (
                                                        <div key={i} className={`rounded-lg p-2.5 text-xs border ${r.confidence === 'exact' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-gray-800">{r.memberName}</span>
                                                                <span className="font-bold text-green-700">{r.transaction.transfer_amount.toLocaleString('vi-VN')}đ</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">{r.matchedBy}</p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono truncate">CK: {r.transaction.transaction_content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Unmatched transactions */}
                                        {sepayResults.filter(r => r.confidence === 'none').length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-black text-red-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> Giao dịch chưa khớp
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {sepayResults.filter(r => r.confidence === 'none').map((r, i) => (
                                                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-mono text-gray-600 truncate flex-1">{r.transaction.transaction_content}</span>
                                                                <span className="font-bold text-gray-700 ml-2">{r.transaction.transfer_amount.toLocaleString('vi-VN')}đ</span>
                                                            </div>
                                                            <p className="text-[10px] text-red-500 mt-0.5">{r.matchedBy}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-gray-400">Nguồn: SePay.vn • TK: {settings.bank_account_number || BANK_CONFIG.accountNo}</p>
                                    <button
                                        onClick={() => setShowSepayModal(false)}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ─── QR PAYMENT MODAL ─────────────────── */}
            {
                qrMember && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setQrMember(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Modal header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-white">
                                    <QrCode className="w-5 h-5" />
                                    <span className="text-sm font-bold">Mã QR đóng đảng phí</span>
                                </div>
                                <button onClick={() => setQrMember(null)} className="text-white/70 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Member info */}
                            <div className="px-5 pt-4 pb-2">
                                <p className="text-sm font-bold text-gray-800">{qrMember.hoTen || 'Chưa có tên'}</p>
                                <p className="text-xs text-gray-500">{qrMember.chucVu || 'Đảng viên'} • {MEMBER_TYPES.find(t => t.key === qrMember.memberType)?.label}</p>
                                <div className="mt-2 flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                                    <span className="text-xs text-amber-700 font-medium">Đảng phí tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}</span>
                                    <span className="text-lg font-black text-amber-800">{formatCurrency(qrMember.feeAmount)}</span>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="px-5 py-3 flex justify-center">
                                {qrMember.feeAmount > 0 ? (
                                    <img
                                        src={getVietQRUrl(qrMember.feeAmount, qrMember.hoTen, selectedMonth, selectedYear, {
                                            bankId: settings.bank_name,
                                            accountNo: settings.bank_account_number,
                                            accountName: settings.account_holder_name
                                        })}
                                        alt={`QR thanh toán ${qrMember.hoTen}`}
                                        className="w-64 h-64 object-contain rounded-lg border border-gray-100"
                                    />
                                ) : (
                                    <div className="w-64 h-64 flex items-center justify-center bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                                        <div className="text-center">
                                            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-green-600">Miễn đóng</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bank info */}
                            <div className="px-5 pb-3">
                                <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1 text-xs text-gray-600">
                                    <div className="flex justify-between"><span>Ngân hàng:</span><span className="font-bold">{settings.bank_name || BANK_CONFIG.bankId}</span></div>
                                    <div className="flex justify-between"><span>Số TK:</span><span className="font-bold font-mono">{settings.bank_account_number || BANK_CONFIG.accountNo}</span></div>
                                    <div className="flex justify-between"><span>Tên TK:</span><span className="font-bold">{settings.account_holder_name || BANK_CONFIG.accountName}</span></div>
                                    <div className="flex justify-between"><span>Nội dung CK:</span><span className="font-bold text-blue-600">DP T{String(selectedMonth).padStart(2, '0')}/{selectedYear} {qrMember.hoTen}</span></div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => {
                                        const url = getVietQRUrl(qrMember.feeAmount, qrMember.hoTen, selectedMonth, selectedYear, {
                                            bankId: settings.bank_name,
                                            accountNo: settings.bank_account_number,
                                            accountName: settings.account_holder_name
                                        });
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `QR_${qrMember.hoTen.replace(/\s/g, '_')}_T${String(selectedMonth).padStart(2, '0')}_${selectedYear}.png`;
                                        a.target = '_blank';
                                        a.click();
                                    }}
                                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">Tải QR</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const url = getVietQRUrl(qrMember.feeAmount, qrMember.hoTen, selectedMonth, selectedYear, {
                                            bankId: settings.bank_name,
                                            accountNo: settings.bank_account_number,
                                            accountName: settings.account_holder_name
                                        });
                                        navigator.clipboard.writeText(url);
                                    }}
                                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">Copy link</span>
                                </button>
                                <button
                                    onClick={() => {
                                        updateMember(qrMember.id, { paid: true });
                                        setQrMember(null);
                                    }}
                                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-600"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">Đã nộp</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ─── Salary Adjustment Modal ─── */}
            {
                salaryModal.open && (
                    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setSalaryModal(s => ({ ...s, open: false }))}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                                <h3 className="text-white text-sm font-bold flex items-center gap-2">
                                    <Pencil className="w-4 h-4" /> Điều chỉnh Lương / Trợ cấp
                                </h3>
                                <p className="text-white/80 text-xs mt-1">Đảng viên: <span className="font-bold text-white">{salaryModal.memberName}</span></p>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Current → New */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Lương hiện tại</label>
                                        <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 text-right">
                                            {salaryModal.oldSalary.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Lương mới</label>
                                        <input
                                            type="number"
                                            value={salaryModal.newSalary || ''}
                                            onChange={e => setSalaryModal(s => ({ ...s, newSalary: parseFloat(e.target.value) || 0 }))}
                                            className="w-full bg-amber-50 border-2 border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-amber-800 text-right outline-none focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                </div>
                                {/* Change indicator */}
                                {salaryModal.newSalary !== salaryModal.oldSalary && (
                                    <div className={`text-center text-xs font-bold py-1 rounded-lg ${salaryModal.newSalary > salaryModal.oldSalary ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {salaryModal.newSalary > salaryModal.oldSalary ? '▲' : '▼'} {salaryModal.newSalary > salaryModal.oldSalary ? '+' : ''}{((salaryModal.newSalary - salaryModal.oldSalary)).toLocaleString('vi-VN')}đ
                                        ({salaryModal.oldSalary > 0 ? ((salaryModal.newSalary - salaryModal.oldSalary) / salaryModal.oldSalary * 100).toFixed(1) : '∞'}%)
                                    </div>
                                )}
                                {/* Effective date */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Tháng hiệu lực</label>
                                        <select
                                            value={salaryModal.effectiveMonth}
                                            onChange={e => setSalaryModal(s => ({ ...s, effectiveMonth: parseInt(e.target.value) }))}
                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Năm hiệu lực</label>
                                        <select
                                            value={salaryModal.effectiveYear}
                                            onChange={e => setSalaryModal(s => ({ ...s, effectiveYear: parseInt(e.target.value) }))}
                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                                        >
                                            {Array.from({ length: 5 }, (_, i) => { const y = new Date().getFullYear() - 1 + i; return <option key={y} value={y}>{y}</option>; })}
                                        </select>
                                    </div>
                                </div>
                                {/* Reason */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Lý do điều chỉnh (tùy chọn)</label>
                                    <input
                                        type="text"
                                        value={salaryModal.reason}
                                        onChange={e => setSalaryModal(s => ({ ...s, reason: e.target.value }))}
                                        placeholder="VD: Tăng lương định kỳ, Điều chỉnh trợ cấp..."
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                                    />
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="px-6 pb-5 flex gap-2 justify-end">
                                <button onClick={() => setSalaryModal(s => ({ ...s, open: false }))} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                    Hủy
                                </button>
                                <button
                                    onClick={async () => {
                                        if (salaryModal.newSalary <= 0) return;
                                        // Save to history
                                        await salaryHistoryService.createSalaryChange({
                                            member_id: salaryModal.memberId,
                                            old_salary: salaryModal.oldSalary,
                                            new_salary: salaryModal.newSalary,
                                            effective_month: salaryModal.effectiveMonth,
                                            effective_year: salaryModal.effectiveYear,
                                            reason: salaryModal.reason
                                        });
                                        // Update member salary
                                        updateMember(salaryModal.memberId, { salary: salaryModal.newSalary });
                                        // Refresh monthly changes
                                        const [newChanges, newEffSals] = await Promise.all([
                                            salaryHistoryService.fetchMonthlySalaryChanges(selectedMonth, selectedYear),
                                            salaryHistoryService.fetchAllSalariesForMonth(selectedMonth, selectedYear)
                                        ]);
                                        setMonthlySalaryChanges(newChanges);
                                        setEffectiveSalaries(newEffSals);
                                        setSalaryModal(s => ({ ...s, open: false }));
                                    }}
                                    disabled={salaryModal.newSalary <= 0 || salaryModal.newSalary === salaryModal.oldSalary}
                                    className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Xác nhận điều chỉnh
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ─── Salary History Popup ─── */}
            {
                salaryHistoryPopup.open && (
                    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setSalaryHistoryPopup(s => ({ ...s, open: false }))}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-white text-sm font-bold flex items-center gap-2">
                                        <History className="w-4 h-4" /> Lịch sử điều chỉnh lương
                                    </h3>
                                    <p className="text-white/80 text-xs mt-1">{salaryHistoryPopup.memberName}</p>
                                </div>
                                <button onClick={() => setSalaryHistoryPopup(s => ({ ...s, open: false }))} className="text-white/60 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 max-h-[400px] overflow-y-auto">
                                {salaryHistoryPopup.entries.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-400 font-medium">Chưa có lịch sử điều chỉnh</p>
                                        <p className="text-[10px] text-gray-300 mt-1">Lương hiện tại sẽ được áp dụng cho tất cả các tháng</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {salaryHistoryPopup.entries.map((entry, idx) => (
                                            <div key={entry.id || idx} className="relative pl-6 pb-3 border-l-2 border-blue-200 last:border-l-transparent">
                                                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow" />
                                                <div className="bg-gray-50 rounded-xl p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-blue-600 uppercase">
                                                            Tháng {entry.effective_month}/{entry.effective_year}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400">
                                                            {entry.created_at ? new Date(entry.created_at).toLocaleDateString('vi-VN') : ''}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-gray-500">{entry.old_salary.toLocaleString('vi-VN')}đ</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className={`font-bold ${entry.new_salary > entry.old_salary ? 'text-green-600' : 'text-red-600'}`}>
                                                            {entry.new_salary.toLocaleString('vi-VN')}đ
                                                        </span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${entry.new_salary > entry.old_salary ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {entry.new_salary > entry.old_salary ? '+' : ''}{((entry.new_salary - entry.old_salary)).toLocaleString('vi-VN')}đ
                                                        </span>
                                                    </div>
                                                    {entry.reason && (
                                                        <p className="text-[10px] text-gray-400 mt-1 italic">📝 {entry.reason}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ═══════════ Transfer Modal ═══════════ */}
            {transferModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95">
                        <div className={`px-6 py-4 rounded-t-2xl ${transferModal.type === 'leave' ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}>
                            <div className="flex items-center gap-3 text-white">
                                {transferModal.type === 'leave'
                                    ? <LogOut className="w-5 h-5" />
                                    : <LogIn className="w-5 h-5" />}
                                <h3 className="text-sm font-black uppercase tracking-wider">
                                    {transferModal.type === 'leave' ? 'Chuyển đi / Rời chi bộ' : 'Tiếp nhận đảng viên'}
                                </h3>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 block mb-1">Đảng viên</label>
                                <p className="text-sm font-bold text-gray-900">{transferModal.memberName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-1">Tháng hiệu lực</label>
                                    <select
                                        value={transferModal.month}
                                        onChange={e => setTransferModal(prev => ({ ...prev, month: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {String(i + 1).padStart(2, '0')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-1">Năm</label>
                                    <select
                                        value={transferModal.year}
                                        onChange={e => setTransferModal(prev => ({ ...prev, year: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => { const y = new Date().getFullYear() - 1 + i; return <option key={y} value={y}>{y}</option>; })}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 block mb-1">Lý do</label>
                                <input
                                    type="text"
                                    value={transferModal.reason}
                                    onChange={e => setTransferModal(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder={transferModal.type === 'leave' ? 'Chuyển sinh hoạt, Xin nghỉ...' : 'Chuyển đến, Kết nạp mới...'}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                                />
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setTransferModal(prev => ({ ...prev, open: false }))}
                                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >Hủy</button>
                            <button
                                onClick={handleTransferConfirm}
                                className={`px-4 py-2 text-xs font-bold text-white rounded-lg ${transferModal.type === 'leave' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {transferModal.type === 'leave' ? 'Xác nhận chuyển đi' : 'Xác nhận tiếp nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Modal */}
            <ConfirmModal
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={() => handleConfirmResult(true)}
                onCancel={() => handleConfirmResult(false)}
            />
        </div >
    );
};

export default PartyFeeAssistant;
