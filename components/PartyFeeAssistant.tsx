
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    MEMBER_TYPES, MINIMUM_WAGES, calculatePartyFee, calculateRetention,
    MemberType, RETENTION_RATES, BANK_CONFIG, getVietQRUrl
} from '../data/partyFee';
import {
    Calculator, Wallet, Info, AlertTriangle, ChevronUp,
    Users, CheckCircle2, HelpCircle, FileText, ClipboardPaste,
    Trash2, Download, Plus, UserPlus, X, Printer, Table2,
    Copy, ClipboardCheck, BarChart3, Shield, Clock, Target, FileSpreadsheet,
    QrCode, Share2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    fetchMembers as fetchDbMembers, syncAllMembers,
    upsertMember, deleteMember as deleteDbMember,
    recordPayment, dbToAppMember, appToDbMember
} from '../services/paymentService';

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

type TabMode = 'calculator' | 'memberlist' | 'report';

// ─── localStorage helpers ────────────────────────────
const STORAGE_KEY = 'party_fee_members';
function loadMembers(): PartyMember[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}
function saveMembers(list: PartyMember[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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
    const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
    const [reportYear, setReportYear] = useState(now.getFullYear());
    const [reportCopied, setReportCopied] = useState(false);
    const [showTextReport, setShowTextReport] = useState(false);

    // Member list state
    const [members, setMembers] = useState<PartyMember[]>(loadMembers);
    const [supabaseSynced, setSupabaseSynced] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [showPasteArea, setShowPasteArea] = useState(false);
    const [defaultRegion, setDefaultRegion] = useState('Vùng I');
    const [qrMember, setQrMember] = useState<PartyMember | null>(null);
    const [defaultType, setDefaultType] = useState<MemberType>('bhxh');

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
        saveMembers(list);
        // Async sync to Supabase
        syncAllMembers(list.map(appToDbMember)).then(ok => {
            if (ok) setSupabaseSynced(true);
        });
    }, []);

    // Load from Supabase on mount
    useEffect(() => {
        fetchDbMembers().then(dbList => {
            if (dbList.length > 0) {
                const appList = dbList.map(dbToAppMember) as PartyMember[];
                setMembers(appList);
                saveMembers(appList);
                setSupabaseSynced(true);
            } else {
                // If Supabase is empty but localStorage has data, push to Supabase
                const local = loadMembers();
                if (local.length > 0) {
                    syncAllMembers(local.map(appToDbMember)).then(ok => {
                        if (ok) setSupabaseSynced(true);
                    });
                }
            }
        }).catch(() => {
            console.warn('Supabase unavailable, using localStorage');
        });
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

    const handleAddOne = useCallback(() => {
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
    }, [members, defaultType, defaultRegion, recalcFee, persistMembers]);

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

    const clearAll = useCallback(() => {
        persistMembers([]);
    }, [persistMembers]);

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
                                onClick={() => setTabMode('report')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${tabMode === 'report' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white/90'
                                    }`}
                            >
                                <Table2 className="w-3.5 h-3.5" /> Báo cáo
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
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
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
                        {members.length > 0 ? (
                            <div className="overflow-x-auto">
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
                                        {members.map(m => (
                                            <tr key={m.id} className="hover:bg-amber-50/30 transition-colors">
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
                                                        onChange={e => updateMember(m.id, { memberType: e.target.value as MemberType })}
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
                                                        <input
                                                            type="number"
                                                            value={m.salary || ''}
                                                            onChange={e => updateMember(m.id, { salary: parseFloat(e.target.value) || 0 })}
                                                            placeholder="0"
                                                            className="w-full bg-transparent border border-gray-200 rounded-lg text-xs p-1.5 text-right outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                                                        />
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
                                                        onClick={() => updateMember(m.id, { paid: !m.paid })}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${m.paid
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-50 text-red-400 hover:bg-red-100'
                                                            }`}
                                                    >
                                                        {m.paid ? <><CheckCircle2 className="w-3 h-3" /> Đã nộp</> : <><Clock className="w-3 h-3" /> Chưa nộp</>}
                                                    </button>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => setQrMember(m)}
                                                            title="Tạo mã QR thanh toán"
                                                            className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50">
                                                            <QrCode className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => removeMember(m.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Total row */}
                                    <tfoot>
                                        <tr className="bg-amber-50 border-t-2 border-amber-200 font-bold">
                                            <td colSpan={6} className="p-3 text-right text-xs text-amber-800 uppercase tracking-wider">
                                                Tổng cộng ({members.length} đảng viên):
                                            </td>
                                            <td className="p-3 text-right text-amber-800 text-sm font-black">
                                                {formatCurrency(memberSummary.total)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${members.filter(m => m.paid).length === members.length && members.length > 0
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-600'
                                                    }`}>
                                                    {members.filter(m => m.paid).length}/{members.length}
                                                </span>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
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
            )}

            {/* ─── REPORT TAB ───────────────────────────── */}
            {tabMode === 'report' && (
                <div className="space-y-4">
                    {/* Controls */}
                    <div className="bg-white border-2 border-amber-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-gray-700">Kỳ báo cáo:</label>
                                <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
                                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {String(i + 1).padStart(2, '0')}</option>)}
                                </select>
                                <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
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
                                        const mm = String(reportMonth).padStart(2, '0');

                                        /* ── Build worksheet data ── */
                                        const wsData: (string | number | null)[][] = [
                                            /* Row 0: Header left */
                                            ['ĐẢNG BỘ PHƯỜNG ……………', null, null, null, null, null, 'ĐẢNG CỘNG SẢN VIỆT NAM'],
                                            ['CHI BỘ ……………', null, null, null, null, null, `……………, ngày …… tháng ${mm} năm ${reportYear}`],
                                            ['*'],
                                            [],
                                            /* Row 3-4: Title */
                                            [null, null, null, 'BÁO CÁO THU, NỘP ĐẢNG PHÍ'],
                                            [null, null, null, `(Tháng ${mm} năm ${reportYear})`],
                                            [],
                                            /* Row 7: Table header */
                                            ['TT', 'Chỉ tiêu', 'Đơn vị tính', 'Mã số', 'Đảng bộ xã, phường', 'Đảng bộ doanh nghiệp', 'Đảng bộ khác', 'Cộng', 'Ghi chú'],
                                            /* Row I */
                                            ['I', 'Tổng số đảng viên đến cuối kỳ báo cáo', 'Người', '01', totalMembers || null, null, null, totalMembers || null, null],
                                            /* Row II */
                                            ['II', 'Đảng phí đã thu được từ chi bộ của cấp báo cáo', null, null, null, null, null, null, null],
                                            [null, '1. Kỳ báo cáo', 'Đồng', '02', totalFee || null, null, null, totalFee || null, null],
                                            [null, '2. Từ đầu năm đến cuối kỳ báo cáo', 'Đồng', '03', totalFee * reportMonth || null, null, null, totalFee * reportMonth || null, null],
                                            /* Row III */
                                            ['III', 'Đảng phí trích giữ lại ở các cấp', null, null, null, null, null, null, null],
                                            [null, '1. Kỳ báo cáo (05+06+07)', 'Đồng', '04', chiBoGiu || null, null, null, chiBoGiu || null, `(${RETENTION_RATES.chiBoGiu}%)`],
                                            [null, '1.1 Chi bộ, đảng bộ bộ phận', 'Đồng', '05', chiBoGiu || null, null, null, chiBoGiu || null, null],
                                            [null, '1.2 Tổ chức cơ sở đảng', 'Đồng', '06', null, null, null, null, null],
                                            [null, '1.3 Cấp trên cơ sở', 'Đồng', '07', null, null, null, null, null],
                                            [null, '2. Từ đầu năm đến cuối kỳ báo cáo (09+10+11)', 'Đồng', '08', chiBoGiu * reportMonth || null, null, null, chiBoGiu * reportMonth || null, null],
                                            [null, '2.1 Chi bộ, đảng bộ bộ phận', 'Đồng', '09', chiBoGiu * reportMonth || null, null, null, chiBoGiu * reportMonth || null, null],
                                            [null, '2.2 Tổ chức cơ sở đảng', 'Đồng', '10', null, null, null, null, null],
                                            [null, '2.3 Cấp trên cơ sở', 'Đồng', '11', null, null, null, null, null],
                                            /* Row IV */
                                            ['IV', 'Đảng phí nộp cấp trên của cấp báo cáo', null, null, null, null, null, null, null],
                                            [null, '1. Số phải nộp kỳ báo cáo (02–04)', 'Đồng', '12', nopCapTren || null, null, null, nopCapTren || null, `(${RETENTION_RATES.nopCapTren}%)`],
                                            [null, '2. Từ đầu năm đến cuối kỳ báo cáo (03–08)', 'Đồng', '13', nopCapTren * reportMonth || null, null, null, nopCapTren * reportMonth || null, null],
                                            [null, '3. Số còn nợ chưa nộp cấp trên đến cuối kỳ báo cáo', 'Đồng', '14', null, null, null, null, null],
                                            [],
                                            /* Footer */
                                            ['Người lập', null, null, null, null, null, `……………, ngày …… tháng …… năm ${reportYear}`],
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

                                        XLSX.utils.book_append_sheet(wb, ws, `T${mm}-${reportYear}`);
                                        XLSX.writeFile(wb, `BaoCao_DangPhi_T${mm}_${reportYear}.xlsx`);
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
                            return `ĐẢNG BỘ PHƯỜNG ……………                    ĐẢNG CỘNG SẢN VIỆT NAM\nCHI BỘ ……………\n                                              ……………, ngày …… tháng ${String(reportMonth).padStart(2, '0')} năm ${reportYear}\n\nBÁO CÁO\nVề tình hình thực hiện đóng đảng phí theo Quy định số 01-QĐ/TW\nngày 03/02/2026 của Bộ Chính trị\n(Tháng ${String(reportMonth).padStart(2, '0')} năm ${reportYear})\n-----\n\nKính gửi: Đảng ủy phường ……………\n\nThực hiện Quy định số 01-QĐ/TW ngày 03/02/2026 của Bộ Chính trị về chế độ đảng phí (có hiệu lực từ ngày 01/02/2026), Chi bộ …………… xin báo cáo tình hình triển khai thực hiện như sau:\n\nI. THỐNG KÊ TÌNH HÌNH THỰC HIỆN ĐÓNG ĐẢNG PHÍ\n\n1. Tổng số đảng viên chi bộ: ${totalMembers} đồng chí\n   - Đã hoàn thành nghĩa vụ đảng phí: ${paidCount} đồng chí (${totalMembers > 0 ? Math.round(paidCount / totalMembers * 100) : 0}%)\n   - Được miễn đóng đảng phí: ${exemptCount} đồng chí\n\n2. Thống kê theo nhóm đối tượng:\n${typeRows}\n\nTỔNG ĐẢNG PHÍ THU ĐƯỢC KỲ BÁO CÁO: ${totalFee.toLocaleString('vi-VN')}đ\n\nII. TÌNH HÌNH TRÍCH NỘP\n\n- Tổng đảng phí đã thu kỳ báo cáo (mã 02): ${totalFee.toLocaleString('vi-VN')}đ\n- Trích giữ lại chi bộ ${RETENTION_RATES.chiBoGiu}% (mã 04): ${chiBoGiu.toLocaleString('vi-VN')}đ\n- Nộp cấp trên ${RETENTION_RATES.nopCapTren}% (mã 12): ${nopCapTren.toLocaleString('vi-VN')}đ\n- Lũy kế từ đầu năm (mã 03): ${(totalFee * reportMonth).toLocaleString('vi-VN')}đ\n\nIII. ĐÁNH GIÁ VIỆC ÁP DỤNG CÔNG NGHỆ SỐ\n\n- Tỷ lệ sử dụng Sổ tay đảng viên điện tử: ……%\n- Tỷ lệ đăng ký Cổng Dịch vụ công Quốc gia: ……%\n\nIV. KHÓ KHĂN, VƯỚNG MẮC VÀ KIẾN NGHỊ\n\n1. Khó khăn: (nêu cụ thể)\n2. Kiến nghị: (nêu cụ thể)\n\nV. CAM KẾT THỰC HIỆN NGUYÊN TẮC \"3Đ\"\n\n- ĐÚNG mức đóng theo QĐ 01-QĐ/TW\n- ĐỦ số lượng đảng viên (${totalMembers}/${totalMembers} = ${complianceRate}%)\n- ĐỀU đặn thu nộp hàng tháng, đúng hạn\n\nTrên đây là báo cáo tình hình thực hiện đóng đảng phí. Kính đề nghị Đảng ủy phường xem xét, chỉ đạo./.\n\nNơi nhận:                                          T/M CHI BỘ\n- Đảng ủy phường (báo cáo);                           BÍ THƯ\n- Ban chi ủy;\n- Lưu Chi bộ.`;
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
                                        <p className="text-2xl font-black">T{String(reportMonth).padStart(2, '0')}/{reportYear}</p>
                                        <p className="text-amber-200 text-[10px] mt-1">Nộp đều đặn hàng tháng</p>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                                            <span className="text-[9px] text-amber-100">Thu: {fmt(totalFee)}</span>
                                        </div>
                                        <p className="text-amber-100 text-[9px] mt-1">Lũy kế: {fmt(totalFee * reportMonth)}</p>
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
                                            <p className="text-xs font-bold">ĐẢNG BỘ PHƯỜNG ……………</p>
                                            <p className="text-sm font-black">CHI BỘ ……………</p>
                                            <p className="text-xs">*</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold">ĐẢNG CỘNG SẢN VIỆT NAM</p>
                                            <p className="text-xs italic">……………, ngày …… tháng {String(reportMonth).padStart(2, '0')} năm {reportYear}</p>
                                        </div>
                                    </div>
                                    <div className="pt-3">
                                        <h3 className="text-sm font-black uppercase">BÁO CÁO THU, NỘP ĐẢNG PHÍ</h3>
                                        <p className="text-xs">(Tháng {String(reportMonth).padStart(2, '0')} năm {reportYear})</p>
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
                                                <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(totalFee * reportMonth)}</td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(totalFee * reportMonth)}</td>
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
                                                <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(chiBoGiu * reportMonth)}</td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(chiBoGiu * reportMonth)}</td>
                                                <td className="border border-gray-400 px-2 py-1.5"></td>
                                            </tr>
                                            <tr>
                                                <td className="border border-gray-400 px-2 py-1.5 text-center"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 pl-6">2.1 Chi bộ, đảng bộ bộ phận</td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-center">Đồng</td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-center">09</td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(chiBoGiu * reportMonth)}</td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(chiBoGiu * reportMonth)}</td>
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
                                                <td className="border border-gray-400 px-2 py-1.5 text-right">{fmt(nopCapTren * reportMonth)}</td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right"></td>
                                                <td className="border border-gray-400 px-2 py-1.5 text-right font-bold">{fmt(nopCapTren * reportMonth)}</td>
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
                                            <p className="text-xs italic">……………, ngày …… tháng …… năm {reportYear}</p>
                                            <p className="text-xs font-bold">T/M cấp ủy</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>);
                    })()}

                    {members.length === 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-center gap-2 text-xs text-yellow-700">
                            <AlertTriangle className="w-4 h-4" />
                            Chưa có danh sách đảng viên. Vui lòng vào tab <strong className="mx-1">"Danh sách ĐV"</strong> để nhập trước khi xuất báo cáo.
                        </div>
                    )}
                </div>
            )}

            {/* Reference notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-[10px] text-gray-500 space-y-1">
                    <p><strong>Căn cứ pháp lý:</strong> Quy định số 01-QĐ/TW ngày 03/02/2026 của Bộ Chính trị về chế độ đảng phí.</p>
                    <p><strong>Thay thế:</strong> Quyết định 342-QĐ/TW ngày 28/12/2010 của Bộ Chính trị.</p>
                    <p><strong>Hình thức nộp:</strong> Cổng Dịch vụ công Quốc gia hoặc tiền mặt trực tiếp cho chi bộ.</p>
                </div>
            </div>

            {/* ─── QR PAYMENT MODAL ─────────────────── */}
            {qrMember && (
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
                                <span className="text-xs text-amber-700 font-medium">Đảng phí tháng {String(reportMonth).padStart(2, '0')}/{reportYear}</span>
                                <span className="text-lg font-black text-amber-800">{formatCurrency(qrMember.feeAmount)}</span>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="px-5 py-3 flex justify-center">
                            {qrMember.feeAmount > 0 ? (
                                <img
                                    src={getVietQRUrl(qrMember.feeAmount, qrMember.hoTen, reportMonth, reportYear)}
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
                                <div className="flex justify-between"><span>Ngân hàng:</span><span className="font-bold">{BANK_CONFIG.bankId} - CN Nam Bình Dương</span></div>
                                <div className="flex justify-between"><span>Số TK:</span><span className="font-bold font-mono">{BANK_CONFIG.accountNo}</span></div>
                                <div className="flex justify-between"><span>Tên TK:</span><span className="font-bold">{BANK_CONFIG.accountName}</span></div>
                                <div className="flex justify-between"><span>Nội dung CK:</span><span className="font-bold text-blue-600">DP T{String(reportMonth).padStart(2, '0')}/{reportYear} {qrMember.hoTen}</span></div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                            <button
                                onClick={() => {
                                    const url = getVietQRUrl(qrMember.feeAmount, qrMember.hoTen, reportMonth, reportYear);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `QR_${qrMember.hoTen.replace(/\s/g, '_')}_T${String(reportMonth).padStart(2, '0')}_${reportYear}.png`;
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
                                    const url = getVietQRUrl(qrMember.feeAmount, qrMember.hoTen, reportMonth, reportYear);
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
            )}
        </div>
    );
};

export default PartyFeeAssistant;
