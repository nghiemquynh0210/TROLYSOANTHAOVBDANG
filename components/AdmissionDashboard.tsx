
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AdmissionWorkflowVisual from './AdmissionWorkflowVisual';
import { AdmissionStep, ADMISSION_STEP_ORDER, AdmissionTracking, MemberProfile, DocType } from '../types';
import { admissionService } from '../services/admissionService';
import { profileService } from '../services/profileService';
import {
    Users, GraduationCap, SearchCheck, FileCheck, Clock, Award,
    ChevronRight, Search, Trash2, History, X, FileText, ClipboardList,
    ChevronDown, UserPlus, CheckCircle2, FilePlus2, LayoutGrid, GitBranch
} from 'lucide-react';
import { useConfirm } from './ConfirmProvider';

// ─── Template mapping per step ───────────────────────
interface FormTemplate {
    docType: DocType;
    code: string;
    title: string;
}

const STEP_TEMPLATES: Record<AdmissionStep, FormTemplate[]> = {
    [AdmissionStep.QUAN_CHUNG]: [
        { docType: DocType.KN_MAU_1, code: 'Mẫu 1-KNĐ', title: 'Đơn xin vào Đảng' },
    ],
    [AdmissionStep.HOC_CAM_TINH]: [
        { docType: DocType.KN_MAU_2, code: 'Mẫu 2-KNĐ', title: 'Lý lịch người vào Đảng' },
    ],
    [AdmissionStep.THAM_TRA]: [
        { docType: DocType.KN_MAU_3, code: 'Mẫu 3-KNĐ', title: 'Giấy giới thiệu người vào Đảng' },
        { docType: DocType.KN_MAU_4, code: 'Mẫu 4-KNĐ', title: 'Nhận xét của đoàn thể' },
        { docType: DocType.KN_MAU_5, code: 'Mẫu 5-KNĐ', title: 'Ý kiến chi ủy nơi cư trú' },
    ],
    [AdmissionStep.KET_NAP]: [
        { docType: DocType.KN_MAU_6, code: 'Mẫu 6-KNĐ', title: 'Nghị quyết chi bộ kết nạp' },
        { docType: DocType.KN_MAU_7, code: 'Mẫu 7-KNĐ', title: 'Báo cáo chi ủy về hồ sơ' },
        { docType: DocType.KN_MAU_8, code: 'Mẫu 8-KNĐ', title: 'Nghị quyết Đảng ủy cơ sở' },
        { docType: DocType.KN_MAU_9, code: 'Mẫu 9-KNĐ', title: 'Quyết định kết nạp' },
    ],
    [AdmissionStep.DU_BI]: [
        { docType: DocType.CT_MAU_10, code: 'Mẫu 10-KNĐ', title: 'Kiểm điểm dự bị' },
        { docType: DocType.CT_MAU_11, code: 'Mẫu 11-KNĐ', title: 'Nhận xét người giúp đỡ' },
        { docType: DocType.CT_MAU_12, code: 'Mẫu 12-KNĐ', title: 'Nhận xét đoàn thể' },
        { docType: DocType.CT_MAU_13, code: 'Mẫu 13-KNĐ', title: 'Ý kiến nơi cư trú' },
    ],
    [AdmissionStep.CHINH_THUC]: [
        { docType: DocType.CT_MAU_14, code: 'Mẫu 14-KNĐ', title: 'Nghị quyết công nhận chính thức' },
        { docType: DocType.CT_MAU_15, code: 'Mẫu 15-KNĐ', title: 'Báo cáo chi ủy hồ sơ chính thức' },
        { docType: DocType.CT_MAU_16, code: 'Mẫu 16-KNĐ', title: 'Quyết định công nhận chính thức' },
    ],
};

const STEP_CONFIG: Record<AdmissionStep, { color: string; bgLight: string; border: string; icon: React.ReactNode }> = {
    [AdmissionStep.QUAN_CHUNG]: { color: 'bg-slate-600', bgLight: 'bg-slate-50', border: 'border-slate-300', icon: <Users className="w-4 h-4" /> },
    [AdmissionStep.HOC_CAM_TINH]: { color: 'bg-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-300', icon: <GraduationCap className="w-4 h-4" /> },
    [AdmissionStep.THAM_TRA]: { color: 'bg-amber-600', bgLight: 'bg-amber-50', border: 'border-amber-300', icon: <SearchCheck className="w-4 h-4" /> },
    [AdmissionStep.KET_NAP]: { color: 'bg-purple-600', bgLight: 'bg-purple-50', border: 'border-purple-300', icon: <FileCheck className="w-4 h-4" /> },
    [AdmissionStep.DU_BI]: { color: 'bg-orange-600', bgLight: 'bg-orange-50', border: 'border-orange-300', icon: <Clock className="w-4 h-4" /> },
    [AdmissionStep.CHINH_THUC]: { color: 'bg-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-300', icon: <Award className="w-4 h-4" /> },
};

// ─── Card Template Dropdown (Portal) ────────────────
const CardTemplatePicker: React.FC<{
    profile: MemberProfile;
    step: AdmissionStep;
    onSelect: (profile: MemberProfile, docType: DocType) => void;
}> = ({ profile, step, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const templates = STEP_TEMPLATES[step];

    useEffect(() => {
        if (!isOpen || !btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const panelWidth = 280;
        let left = rect.left;
        if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - panelWidth - 8;
        if (left < 8) left = 8;
        let top = rect.bottom + 6;
        const estimatedHeight = templates.length * 48 + 50;
        if (top + estimatedHeight > window.innerHeight) {
            top = Math.max(8, rect.top - estimatedHeight - 6);
        }
        setPos({ top, left });
    }, [isOpen, templates.length]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const dropdown = isOpen ? ReactDOM.createPortal(
        <div
            ref={panelRef}
            className="fixed w-[280px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ top: pos.top, left: pos.left, zIndex: 9999 }}
        >
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3 h-3" />
                    Soạn mẫu cho {profile.fullName.split(' ').pop()}
                </p>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="py-1">
                {templates.map((t, i) => (
                    <button
                        key={t.docType}
                        onClick={() => { onSelect(profile, t.docType); setIsOpen(false); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-all flex items-center gap-2.5 group"
                    >
                        <span className="w-6 h-6 bg-blue-100 group-hover:bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-colors">
                            {t.code.match(/\d+/)?.[0]}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-700 group-hover:text-blue-700 transition-colors">{t.code}</p>
                            <p className="text-[8px] text-gray-400 truncate">{t.title}</p>
                        </div>
                        <FileText className="w-3 h-3 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                    </button>
                ))}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button
                ref={btnRef}
                onClick={() => setIsOpen(!isOpen)}
                title="Soạn mẫu văn bản"
                className={`p-1 rounded transition-all ${isOpen ? 'bg-blue-100 text-blue-600' : 'text-blue-400 hover:bg-blue-50'}`}
            >
                <FileText className="w-3.5 h-3.5" />
            </button>
            {dropdown}
        </>
    );
};

// ─── Props ───────────────────────────────────────────
interface Props {
    onDraftFromProfile?: (profile: MemberProfile, docType?: DocType) => void;
}

// ─── Main Component ──────────────────────────────────
const AdmissionDashboard: React.FC<Props> = ({ onDraftFromProfile }) => {
    const { showConfirm } = useConfirm();
    const [viewMode, setViewMode] = useState<'kanban' | 'workflow'>('kanban');
    const [trackingList, setTrackingList] = useState<AdmissionTracking[]>([]);
    const [profilesMap, setProfilesMap] = useState<Record<string, MemberProfile>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [historyModalId, setHistoryModalId] = useState<string | null>(null);

    const loadData = () => {
        const items = admissionService.getAll();
        setTrackingList(items);
        const pMap: Record<string, MemberProfile> = {};
        profileService.getAll().forEach(p => { pMap[p.id] = p; });
        setProfilesMap(pMap);
    };

    useEffect(() => { loadData(); }, []);

    const filteredByStep = useMemo(() => {
        const result: Record<AdmissionStep, AdmissionTracking[]> = {} as any;
        ADMISSION_STEP_ORDER.forEach(step => { result[step] = []; });

        trackingList.forEach(t => {
            const profile = profilesMap[t.profileId];
            if (!profile) return;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!profile.fullName.toLowerCase().includes(q) && !profile.workplace.toLowerCase().includes(q)) return;
            }
            if (result[t.currentStep]) {
                result[t.currentStep].push(t);
            }
        });
        return result;
    }, [trackingList, profilesMap, searchQuery]);

    const handleMoveStep = (profileId: string, direction: 'next' | 'prev') => {
        const tracking = trackingList.find(t => t.profileId === profileId);
        if (!tracking) return;
        const currentIdx = ADMISSION_STEP_ORDER.indexOf(tracking.currentStep);
        const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
        if (newIdx < 0 || newIdx >= ADMISSION_STEP_ORDER.length) return;
        admissionService.updateStep(profileId, ADMISSION_STEP_ORDER[newIdx]);
        loadData();
    };

    const handleRemove = async (profileId: string, name: string) => {
        if (await showConfirm(`Xóa "${name}" khỏi lộ trình theo dõi?`, 'Xóa khỏi lộ trình', 'warning')) {
            admissionService.remove(profileId);
            loadData();
        }
    };

    const handleDraft = useCallback((profile: MemberProfile, docType: DocType) => {
        onDraftFromProfile?.(profile, docType);
    }, [onDraftFromProfile]);

    const totalTracking = trackingList.length;
    const historyItem = historyModalId ? trackingList.find(t => t.profileId === historyModalId) : null;

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return dateStr; }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl px-6 py-5 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wide">Lộ trình Kết nạp</h2>
                            <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">
                                Theo dõi {totalTracking} quần chúng / đảng viên
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/15 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${viewMode === 'kanban' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            <LayoutGrid className="w-3 h-3" /> Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('workflow')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${viewMode === 'workflow' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            <GitBranch className="w-3 h-3" /> Sơ đồ
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-4 relative">
                    <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc đơn vị..."
                        className="w-full pl-11 pr-4 py-3 bg-white/15 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 outline-none focus:bg-white/25 transition-all backdrop-blur-md"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* View mode: Workflow */}
            {viewMode === 'workflow' && (
                <AdmissionWorkflowVisual onDraftFromProfile={onDraftFromProfile} />
            )}

            {/* View mode: Kanban */}
            {viewMode === 'kanban' && totalTracking === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 py-16 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-bold">Chưa có quần chúng nào trong lộ trình</p>
                    <p className="text-xs text-gray-300 mt-1">Vào "Kho hồ sơ" → Nhấn "Lộ trình" → để thêm</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {ADMISSION_STEP_ORDER.map(step => {
                        const config = STEP_CONFIG[step];
                        const items = filteredByStep[step];
                        const templates = STEP_TEMPLATES[step];
                        return (
                            <div key={step} className={`${config.bgLight} rounded-2xl border-2 ${config.border} overflow-hidden flex flex-col min-h-[250px]`}>
                                {/* Column Header */}
                                <div className={`${config.color} text-white px-3 py-3 flex items-center justify-between`}>
                                    <div className="flex items-center gap-2">
                                        {config.icon}
                                        <span className="text-[9px] font-black uppercase tracking-wider leading-tight">{step}</span>
                                    </div>
                                    <span className="bg-white/30 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                                        {items.length}
                                    </span>
                                </div>

                                {/* Template badges under header */}
                                <div className="px-2 pt-2 pb-1 flex flex-wrap gap-1">
                                    {templates.map(t => (
                                        <span
                                            key={t.docType}
                                            className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-500 cursor-default"
                                            title={t.title}
                                        >
                                            {t.code.replace('-KNĐ', '')}
                                        </span>
                                    ))}
                                </div>

                                {/* Cards */}
                                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[350px]">
                                    {items.length === 0 && (
                                        <p className="text-[10px] text-gray-300 text-center italic py-8">Trống</p>
                                    )}
                                    {items.map(t => {
                                        const profile = profilesMap[t.profileId];
                                        if (!profile) return null;
                                        const stepIdx = ADMISSION_STEP_ORDER.indexOf(t.currentStep);
                                        return (
                                            <div key={t.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[11px] font-bold text-gray-800 truncate">{profile.fullName}</h4>
                                                        {profile.workplace && (
                                                            <p className="text-[9px] text-gray-400 truncate mt-0.5">{profile.workplace}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-gray-400 mt-1.5">
                                                    Từ: {formatDate(t.stepStartDate)}
                                                </p>

                                                {/* Template shortcuts for this profile */}
                                                {onDraftFromProfile && (
                                                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-50">
                                                        {templates.map(tmpl => (
                                                            <button
                                                                key={tmpl.docType}
                                                                onClick={() => handleDraft(profile, tmpl.docType)}
                                                                title={`Soạn ${tmpl.code}: ${tmpl.title}`}
                                                                className="px-1.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[8px] font-bold transition-all flex items-center gap-0.5"
                                                            >
                                                                <FileText className="w-2.5 h-2.5" />
                                                                {tmpl.code.replace('-KNĐ', '')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {stepIdx > 0 && (
                                                        <button
                                                            onClick={() => handleMoveStep(t.profileId, 'prev')}
                                                            title="Lùi bước"
                                                            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-all rotate-180"
                                                        >
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {stepIdx < ADMISSION_STEP_ORDER.length - 1 && (
                                                        <button
                                                            onClick={() => handleMoveStep(t.profileId, 'next')}
                                                            title="Tiến bước"
                                                            className={`p-1 text-white ${config.color} hover:opacity-80 rounded transition-all`}
                                                        >
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setHistoryModalId(t.profileId)}
                                                        title="Lịch sử"
                                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-all ml-auto"
                                                    >
                                                        <History className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemove(t.profileId, profile.fullName)}
                                                        title="Xóa"
                                                        className="p-1 text-red-400 hover:bg-red-50 rounded transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* History Modal */}
            {historyItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-white" />
                                <div>
                                    <h3 className="text-sm font-bold text-white">Lịch sử lộ trình</h3>
                                    <p className="text-[10px] text-indigo-200">{profilesMap[historyItem.profileId]?.fullName}</p>
                                </div>
                            </div>
                            <button onClick={() => setHistoryModalId(null)} className="text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto">
                            <div className="relative pl-6">
                                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                                {historyItem.history.map((h, idx) => (
                                    <div key={idx} className="relative mb-5 last:mb-0">
                                        <div className="absolute left-[-18px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow" />
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-xs font-bold text-gray-700">{h.step}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(h.date)}</p>
                                            {h.note && <p className="text-[10px] text-gray-500 mt-1 italic">{h.note}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdmissionDashboard;
