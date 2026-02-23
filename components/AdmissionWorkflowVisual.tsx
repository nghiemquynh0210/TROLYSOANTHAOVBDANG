
import React, { useState, useEffect, useMemo } from 'react';
import { AdmissionStep, ADMISSION_STEP_ORDER, AdmissionTracking, MemberProfile, DocType } from '../types';
import { admissionService } from '../services/admissionService';
import { profileService } from '../services/profileService';
import {
    Users, GraduationCap, SearchCheck, FileCheck, Clock, Award,
    ChevronRight, AlertTriangle, FileText, User
} from 'lucide-react';

// ─── Step config ─────────────────────────────────────
const STEP_META: Record<AdmissionStep, {
    icon: React.ReactNode;
    color: string;
    bgLight: string;
    borderColor: string;
    forms: string[];
}> = {
    [AdmissionStep.QUAN_CHUNG]: {
        icon: <Users className="w-5 h-5" />,
        color: 'from-slate-500 to-slate-700',
        bgLight: 'bg-slate-50',
        borderColor: 'border-slate-300',
        forms: ['Mẫu 1'],
    },
    [AdmissionStep.HOC_CAM_TINH]: {
        icon: <GraduationCap className="w-5 h-5" />,
        color: 'from-blue-500 to-blue-700',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-300',
        forms: ['Mẫu 2'],
    },
    [AdmissionStep.THAM_TRA]: {
        icon: <SearchCheck className="w-5 h-5" />,
        color: 'from-amber-500 to-amber-700',
        bgLight: 'bg-amber-50',
        borderColor: 'border-amber-300',
        forms: ['Mẫu 3', 'Mẫu 4', 'Mẫu 5'],
    },
    [AdmissionStep.KET_NAP]: {
        icon: <FileCheck className="w-5 h-5" />,
        color: 'from-purple-500 to-purple-700',
        bgLight: 'bg-purple-50',
        borderColor: 'border-purple-300',
        forms: ['Mẫu 6', 'Mẫu 7', 'Mẫu 8', 'Mẫu 9'],
    },
    [AdmissionStep.DU_BI]: {
        icon: <Clock className="w-5 h-5" />,
        color: 'from-orange-500 to-orange-700',
        bgLight: 'bg-orange-50',
        borderColor: 'border-orange-300',
        forms: ['Mẫu 10', 'Mẫu 11', 'Mẫu 12', 'Mẫu 13'],
    },
    [AdmissionStep.CHINH_THUC]: {
        icon: <Award className="w-5 h-5" />,
        color: 'from-emerald-500 to-emerald-700',
        bgLight: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        forms: ['Mẫu 14', 'Mẫu 15', 'Mẫu 16'],
    },
};

interface Props {
    onDraftFromProfile?: (profile: MemberProfile, docType?: DocType) => void;
}

const AdmissionWorkflowVisual: React.FC<Props> = ({ onDraftFromProfile }) => {
    const [trackingList, setTrackingList] = useState<AdmissionTracking[]>([]);
    const [profilesMap, setProfilesMap] = useState<Record<string, MemberProfile>>({});
    const [expandedStep, setExpandedStep] = useState<AdmissionStep | null>(null);

    useEffect(() => {
        const items = admissionService.getAll();
        setTrackingList(items);
        const pMap: Record<string, MemberProfile> = {};
        profileService.getAll().forEach(p => { pMap[p.id] = p; });
        setProfilesMap(pMap);
    }, []);

    // Group by step
    const stepData = useMemo(() => {
        const result: Record<AdmissionStep, { count: number; items: AdmissionTracking[]; maxDays: number }> = {} as any;
        ADMISSION_STEP_ORDER.forEach(step => { result[step] = { count: 0, items: [], maxDays: 0 }; });
        const now = Date.now();
        trackingList.forEach(t => {
            if (result[t.currentStep]) {
                result[t.currentStep].count++;
                result[t.currentStep].items.push(t);
                const days = Math.floor((now - new Date(t.stepStartDate).getTime()) / 86400000);
                if (days > result[t.currentStep].maxDays) result[t.currentStep].maxDays = days;
            }
        });
        return result;
    }, [trackingList]);

    // Bottleneck detection: step with most people or longest time
    const bottleneckStep = useMemo(() => {
        let worst: AdmissionStep | null = null;
        let worstScore = 0;
        ADMISSION_STEP_ORDER.forEach(step => {
            const d = stepData[step];
            if (d.count === 0) return;
            const score = d.count * 2 + d.maxDays; // weighted
            if (score > worstScore) { worstScore = score; worst = step; }
        });
        return worst;
    }, [stepData]);

    const totalTracking = trackingList.length;

    return (
        <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-gray-800">{totalTracking}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">Tổng theo dõi</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-emerald-600">{stepData[AdmissionStep.CHINH_THUC]?.count || 0}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">Đã chính thức</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                    {bottleneckStep ? (
                        <>
                            <p className="text-2xl font-black text-red-500">{stepData[bottleneckStep].count}</p>
                            <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Tắc nghẽn
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-2xl font-black text-gray-300">—</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">Không tắc nghẽn</p>
                        </>
                    )}
                </div>
            </div>

            {/* Flowchart */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-x-auto">
                <div className="flex items-stretch gap-0 min-w-[900px]">
                    {ADMISSION_STEP_ORDER.map((step, idx) => {
                        const meta = STEP_META[step];
                        const data = stepData[step];
                        const isBottleneck = step === bottleneckStep && data.count > 0;
                        const isExpanded = expandedStep === step;
                        const isLast = idx === ADMISSION_STEP_ORDER.length - 1;

                        return (
                            <React.Fragment key={step}>
                                {/* Step Node */}
                                <div
                                    className={`relative flex-1 min-w-[140px] cursor-pointer transition-all duration-300 ${isExpanded ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                                    onClick={() => setExpandedStep(isExpanded ? null : step)}
                                >
                                    {/* Step card */}
                                    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${isBottleneck ? 'border-red-400 ring-2 ring-red-100' :
                                            isExpanded ? `${meta.borderColor} ring-2 ring-blue-100` :
                                                `${meta.borderColor}`
                                        }`}>
                                        {/* Header */}
                                        <div className={`bg-gradient-to-br ${meta.color} text-white px-3 py-3 flex flex-col items-center gap-1.5`}>
                                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                                {meta.icon}
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-wider text-center leading-tight">
                                                {step}
                                            </span>
                                        </div>

                                        {/* Count badge */}
                                        <div className={`${meta.bgLight} px-3 py-3 flex flex-col items-center`}>
                                            <span className={`text-3xl font-black ${isBottleneck ? 'text-red-500' : 'text-gray-700'}`}>
                                                {data.count}
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-bold uppercase">người</span>

                                            {/* Bottleneck warning */}
                                            {isBottleneck && (
                                                <div className="mt-2 flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-lg">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span className="text-[8px] font-bold">{data.maxDays} ngày</span>
                                                </div>
                                            )}

                                            {/* Form badges */}
                                            <div className="flex flex-wrap gap-1 mt-2 justify-center">
                                                {meta.forms.map(f => (
                                                    <span key={f} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[7px] font-bold text-gray-500">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step number */}
                                    <div className={`absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br ${meta.color} text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg z-10`}>
                                        {idx + 1}
                                    </div>
                                </div>

                                {/* Arrow connector */}
                                {!isLast && (
                                    <div className="flex items-center justify-center px-1 self-center">
                                        <div className="flex items-center">
                                            <div className="w-4 h-0.5 bg-gray-300" />
                                            <ChevronRight className="w-4 h-4 text-gray-300 -ml-1" />
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Expanded Details Panel */}
            {expandedStep && stepData[expandedStep].items.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <div className={`bg-gradient-to-r ${STEP_META[expandedStep].color} text-white px-5 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            {STEP_META[expandedStep].icon}
                            <span className="text-xs font-black uppercase tracking-wider">{expandedStep}</span>
                            <span className="bg-white/30 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {stepData[expandedStep].count} người
                            </span>
                        </div>
                        <button onClick={() => setExpandedStep(null)} className="text-white/70 hover:text-white text-xs font-bold">
                            Đóng ✕
                        </button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                        {stepData[expandedStep].items.map(t => {
                            const profile = profilesMap[t.profileId];
                            if (!profile) return null;
                            const days = Math.floor((Date.now() - new Date(t.stepStartDate).getTime()) / 86400000);
                            return (
                                <div key={t.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3 hover:shadow-sm transition-all">
                                    <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-bold text-gray-800 truncate">{profile.fullName}</h4>
                                        <p className="text-[9px] text-gray-400 truncate">{profile.workplace}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${days > 60 ? 'bg-red-100 text-red-600' : days > 30 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                {days} ngày
                                            </span>
                                            <span className="text-[8px] text-gray-300">
                                                từ {new Date(t.stepStartDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdmissionWorkflowVisual;
