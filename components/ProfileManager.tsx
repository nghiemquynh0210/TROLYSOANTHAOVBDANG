import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { MemberProfile, DocType, DocLevel } from '../types';
import { profileService } from '../services/profileService';
import { admissionService } from '../services/admissionService';
import ProfileFormModal from './ProfileFormModal';
import {
    ChevronRight, Search, Trash2, Edit3, UserPlus, GraduationCap,
    FileText, User, ChevronUp, ChevronDown, ClipboardList, SearchCheck, MapPin,
    Zap, Sparkles, X, CheckCircle2, FileCheck, FilePlus2, Users, Briefcase, ArrowRight
} from 'lucide-react';

// ─── Template definitions ────────────────────────────
interface FormTemplate {
    docType: DocType;
    code: string;
    title: string;
    shortTitle: string;
}

const KET_NAP_TEMPLATES: FormTemplate[] = [
    { docType: DocType.KN_MAU_1, code: 'Mẫu 1-KNĐ', title: 'Đơn xin vào Đảng', shortTitle: 'Đơn xin vào Đảng' },
    { docType: DocType.KN_MAU_2, code: 'Mẫu 2-KNĐ', title: 'Lý lịch người vào Đảng', shortTitle: 'Lý lịch' },
    { docType: DocType.KN_MAU_3, code: 'Mẫu 3-KNĐ', title: 'Giấy giới thiệu người vào Đảng', shortTitle: 'Giới thiệu' },
    { docType: DocType.KN_MAU_4, code: 'Mẫu 4-KNĐ', title: 'Nhận xét của đoàn thể', shortTitle: 'NX đoàn thể' },
    { docType: DocType.KN_MAU_5, code: 'Mẫu 5-KNĐ', title: 'Ý kiến chi ủy nơi cư trú', shortTitle: 'Ý kiến nơi cư trú' },
    { docType: DocType.KN_MAU_6, code: 'Mẫu 6-KNĐ', title: 'Nghị quyết chi bộ kết nạp', shortTitle: 'NQ chi bộ KN' },
    { docType: DocType.KN_MAU_7, code: 'Mẫu 7-KNĐ', title: 'Báo cáo chi ủy về hồ sơ', shortTitle: 'BC chi ủy hồ sơ' },
    { docType: DocType.KN_MAU_8, code: 'Mẫu 8-KNĐ', title: 'Nghị quyết Đảng ủy cơ sở', shortTitle: 'NQ Đảng ủy' },
    { docType: DocType.KN_MAU_9, code: 'Mẫu 9-KNĐ', title: 'Quyết định kết nạp', shortTitle: 'QĐ kết nạp' },
];

const CHINH_THUC_TEMPLATES: FormTemplate[] = [
    { docType: DocType.CT_MAU_10, code: 'Mẫu 10-KNĐ', title: 'Kiểm điểm dự bị', shortTitle: 'Kiểm điểm dự bị' },
    { docType: DocType.CT_MAU_11, code: 'Mẫu 11-KNĐ', title: 'Nhận xét người giúp đỡ', shortTitle: 'NX người giúp đỡ' },
    { docType: DocType.CT_MAU_12, code: 'Mẫu 12-KNĐ', title: 'Nhận xét đoàn thể', shortTitle: 'NX đoàn thể (CT)' },
    { docType: DocType.CT_MAU_13, code: 'Mẫu 13-KNĐ', title: 'Ý kiến nơi cư trú', shortTitle: 'Ý kiến cư trú (CT)' },
    { docType: DocType.CT_MAU_14, code: 'Mẫu 14-KNĐ', title: 'Nghị quyết công nhận chính thức', shortTitle: 'NQ công nhận CT' },
    { docType: DocType.CT_MAU_15, code: 'Mẫu 15-KNĐ', title: 'Báo cáo chi ủy hồ sơ chính thức', shortTitle: 'BC chi ủy (CT)' },
    { docType: DocType.CT_MAU_16, code: 'Mẫu 16-KNĐ', title: 'Quyết định công nhận chính thức', shortTitle: 'QĐ chính thức' },
];

const ALL_TEMPLATES = [...KET_NAP_TEMPLATES, ...CHINH_THUC_TEMPLATES];

// ─── Props ───────────────────────────────────────────
interface Props {
    onDraftFromProfile: (profile: MemberProfile, docType?: DocType, extraInfo?: string) => void;
    onNavigateToDashboard?: () => void;
}

// ─── Template Picker Dropdown (Portal-based) ─────────
const TemplatePicker: React.FC<{
    profile: MemberProfile;
    onSelect: (profile: MemberProfile, docType: DocType) => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}> = ({ profile, onSelect, isOpen, onToggle, onClose }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    // Calculate position when opened
    useEffect(() => {
        if (!isOpen || !btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const panelWidth = 380;
        // Position below the button, aligned right
        let left = rect.right - panelWidth;
        if (left < 8) left = 8; // prevent going off-screen left
        let top = rect.bottom + 8;
        // If dropdown would go below viewport, open upward
        const viewportH = window.innerHeight;
        if (top + 480 > viewportH) {
            top = Math.max(8, rect.top - 480 - 8);
        }
        setPos({ top, left });
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    const dropdown = isOpen ? ReactDOM.createPortal(
        <div
            ref={panelRef}
            className="fixed w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ top: pos.top, left: pos.left, zIndex: 9999 }}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FilePlus2 className="w-4 h-4 text-white" />
                    <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">Chọn mẫu văn bản</p>
                        <p className="text-[9px] text-blue-200 font-medium truncate max-w-[240px]">{profile.fullName}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {/* Kết nạp section */}
                <div className="px-3 pt-3 pb-1">
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-3 h-3 text-purple-600" />
                        </div>
                        <h4 className="text-[9px] font-black text-purple-700 uppercase tracking-widest">
                            Kết nạp Đảng viên (Mẫu 1→9)
                        </h4>
                    </div>
                    <div className="space-y-0.5">
                        {KET_NAP_TEMPLATES.map((t, i) => (
                            <button
                                key={t.docType}
                                onClick={() => { onSelect(profile, t.docType); onClose(); }}
                                className="w-full text-left px-3 py-2.5 hover:bg-purple-50 rounded-xl transition-all flex items-center gap-3 group"
                            >
                                <span className="w-7 h-7 bg-purple-100 group-hover:bg-purple-200 text-purple-700 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors">
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-gray-700 group-hover:text-purple-800 transition-colors">{t.code}</p>
                                    <p className="text-[9px] text-gray-400 truncate">{t.title}</p>
                                </div>
                                <FileText className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-500 flex-shrink-0 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="px-5 py-1">
                    <div className="border-t border-gray-100"></div>
                </div>

                {/* Chuyển Đảng chính thức section */}
                <div className="px-3 pb-3 pt-1">
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                        <h4 className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                            Chuyển Đảng chính thức (Mẫu 10→16)
                        </h4>
                    </div>
                    <div className="space-y-0.5">
                        {CHINH_THUC_TEMPLATES.map((t, i) => (
                            <button
                                key={t.docType}
                                onClick={() => { onSelect(profile, t.docType); onClose(); }}
                                className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-3 group"
                            >
                                <span className="w-7 h-7 bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors">
                                    {i + 10}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-gray-700 group-hover:text-emerald-800 transition-colors">{t.code}</p>
                                    <p className="text-[9px] text-gray-400 truncate">{t.title}</p>
                                </div>
                                <FileText className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5">
                <p className="text-[9px] text-gray-400 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    Theo Hướng dẫn 01-HD/TW • 16 mẫu chuẩn
                </p>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button
                ref={btnRef}
                onClick={onToggle}
                title="Chọn mẫu văn bản"
                className={`p-2 rounded-lg transition-all flex items-center gap-1 ${isOpen
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-blue-500 hover:bg-blue-50'
                    }`}
            >
                <ClipboardList className="w-4 h-4" />
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdown}
        </>
    );
};

// ─── Main Component ──────────────────────────────────
const ProfileManager: React.FC<Props> = ({ onDraftFromProfile, onNavigateToDashboard }) => {
    const [profiles, setProfiles] = useState<MemberProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProfile, setEditingProfile] = useState<MemberProfile | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [openPickerId, setOpenPickerId] = useState<string | null>(null);

    const loadProfiles = () => {
        setProfiles(profileService.getAll());
    };

    useEffect(() => { loadProfiles(); }, []);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return profiles;
        return profileService.search(searchQuery);
    }, [profiles, searchQuery]);

    const handleSave = (data: Omit<MemberProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingProfile) {
            profileService.update(editingProfile.id, data);
        } else {
            profileService.create(data);
        }
        setEditingProfile(null);
        loadProfiles();
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ "${name}"?`)) {
            profileService.remove(id);
            admissionService.remove(id);
            loadProfiles();
        }
    };

    const handleAddToTracking = (profileId: string) => {
        admissionService.create(profileId, 'Thêm vào lộ trình theo dõi');
        alert('Đã thêm vào Lộ trình kết nạp!');
    };

    const handleSelectTemplate = useCallback((profile: MemberProfile, docType: DocType) => {
        onDraftFromProfile(profile, docType);
    }, [onDraftFromProfile]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-wide">Kho Hồ sơ</h2>
                                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">
                                    {profiles.length} hồ sơ đảng viên / quần chúng
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setEditingProfile(null); setShowForm(true); }}
                            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-2 border border-white/20"
                        >
                            <UserPlus className="w-4 h-4" /> Thêm hồ sơ
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, đơn vị, địa chỉ..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100 max-h-[65vh] overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-400 font-bold">
                                {searchQuery ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có hồ sơ nào'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => { setEditingProfile(null); setShowForm(true); }}
                                    className="mt-3 text-blue-600 text-xs font-bold underline"
                                >
                                    Thêm hồ sơ đầu tiên
                                </button>
                            )}
                        </div>
                    ) : (
                        filtered.map(p => {
                            const isExpanded = expandedId === p.id;
                            const tracking = admissionService.getByProfileId(p.id);
                            return (
                                <div key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                    {/* Row */}
                                    <div className="px-6 py-4 flex items-center justify-between gap-4">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                                                    {p.fullName.charAt(p.fullName.lastIndexOf(' ') + 1) || 'N'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-sm">{p.fullName}</h3>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        {p.workplace && (
                                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                <Briefcase className="w-3 h-3" /> {p.workplace}
                                                            </span>
                                                        )}
                                                        {p.birthDate && (
                                                            <span className="text-[10px] text-gray-400">
                                                                NS: {p.birthDate}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {tracking ? (
                                                <button
                                                    onClick={() => onNavigateToDashboard?.()}
                                                    title="Xem Lộ trình kết nạp"
                                                    className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <ArrowRight className="w-3 h-3" />
                                                    {tracking.currentStep}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddToTracking(p.id)}
                                                    title="Thêm vào Lộ trình kết nạp"
                                                    className="px-2.5 py-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all text-[9px] font-bold uppercase flex items-center gap-1.5"
                                                >
                                                    <ArrowRight className="w-3 h-3" />
                                                    Lộ trình
                                                </button>
                                            )}
                                            {/* Template Picker */}
                                            <TemplatePicker
                                                profile={p}
                                                onSelect={handleSelectTemplate}
                                                isOpen={openPickerId === p.id}
                                                onToggle={() => setOpenPickerId(openPickerId === p.id ? null : p.id)}
                                                onClose={() => setOpenPickerId(null)}
                                            />
                                            <button
                                                onClick={() => { setEditingProfile(p); setShowForm(true); }}
                                                title="Sửa"
                                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id, p.fullName)}
                                                title="Xóa"
                                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                                className="p-2 text-gray-300 hover:bg-gray-50 rounded-lg transition-all"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className="px-6 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="bg-gray-50 rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs border border-gray-100">
                                                <Detail label="Giới tính" value={p.gender} />
                                                <Detail label="Ngày sinh" value={p.birthDate} />
                                                <Detail label="Nơi sinh" value={p.birthPlace} />
                                                <Detail label="Quê quán" value={p.homeTown} />
                                                <Detail label="Nơi ở" value={p.address} />
                                                <Detail label="Dân tộc" value={p.ethnicity} />
                                                <Detail label="Tôn giáo" value={p.religion} />
                                                <Detail label="Thành phần GĐ" value={p.familyBackground} />
                                                <Detail label="Nghề nghiệp" value={p.profession} />
                                                <Detail label="Đơn vị" value={p.workplace} />
                                                <Detail label="Văn hóa" value={p.educationGeneral} />
                                                <Detail label="Chuyên môn" value={p.educationProfessional} />
                                                <Detail label="Lý luận CT" value={p.politicalTheory} />
                                                <Detail label="Ngoại ngữ" value={p.foreignLanguage} />
                                                <Detail label="Ngày vào Đoàn" value={p.unionAdmissionDate} />
                                                <Detail label="Nơi vào Đoàn" value={p.unionAdmissionPlace} />
                                                {p.workHistory && (
                                                    <div className="col-span-2 md:col-span-3">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Quá trình công tác</span>
                                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{p.workHistory}</p>
                                                    </div>
                                                )}
                                                {p.notes && (
                                                    <div className="col-span-2 md:col-span-3">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Ghi chú</span>
                                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{p.notes}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Smart Verification Suggestions */}
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="bg-amber-100 p-1.5 rounded-lg">
                                                        <SearchCheck className="w-3.5 h-3.5 text-amber-600" />
                                                    </div>
                                                    <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-wider flex items-center gap-1.5">
                                                        Thẩm tra thông minh
                                                        <span className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">AI Gợi ý</span>
                                                    </h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {[
                                                        { label: 'Xác minh Nơi sinh', value: p.birthPlace, icon: <MapPin className="w-3 h-3" /> },
                                                        { label: 'Xác minh Quê quán', value: p.homeTown, icon: <MapPin className="w-3 h-3" /> },
                                                        { label: 'Xác minh Nơi cư trú', value: p.address, icon: <MapPin className="w-3 h-3" /> },
                                                    ].filter((loc, idx, self) =>
                                                        loc.value &&
                                                        loc.value.length > 5 &&
                                                        idx === self.findIndex(t => t.value === loc.value)
                                                    ).map((loc, idx) => (
                                                        <div key={idx} className="bg-white border border-amber-100 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-all group">
                                                            <div className="mb-2">
                                                                <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                                                                    {loc.icon}
                                                                    <span className="text-[9px] font-black uppercase tracking-wider">{loc.label}</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-600 font-bold line-clamp-2">{loc.value}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => onDraftFromProfile(p, DocType.KN_MAU_3, `Thẩm tra lý lịch tại ${loc.label}: ${loc.value}`)}
                                                                className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                                                            >
                                                                <Sparkles className="w-3 h-3" /> Soạn Mẫu 3-KNĐ
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Work History verification suggestion if workplace specified */}
                                                    {p.workplace && p.workplace.length > 5 && (
                                                        <div className="bg-white border border-blue-100 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-all">
                                                            <div className="mb-2">
                                                                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                                                                    <Zap className="w-3 h-3" />
                                                                    <span className="text-[9px] font-black uppercase tracking-wider">Xác minh Đơn vị công tác</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-600 font-bold line-clamp-2">{p.workplace}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => onDraftFromProfile(p, DocType.KN_MAU_3, `Thẩm tra lý lịch tại Đơn vị công tác: ${p.workplace}`)}
                                                                className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                                                            >
                                                                <FileText className="w-3 h-3" /> Soạn Mẫu 3-KNĐ
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <ProfileFormModal
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditingProfile(null); }}
                onSave={handleSave}
                profile={editingProfile}
            />
        </div>
    );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <span className="text-[9px] font-bold text-gray-400 uppercase block">{label}</span>
        <span className="text-gray-700 font-medium">{value || '—'}</span>
    </div>
);

export default ProfileManager;
