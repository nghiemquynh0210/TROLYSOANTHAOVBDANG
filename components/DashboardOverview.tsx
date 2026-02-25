import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, Wallet, FileText, CalendarDays, AlertTriangle, Clock,
    ChevronRight, TrendingUp, CheckCircle2, XCircle, PenTool,
    Database, ShieldCheck, Mic, BookOpen, Sparkles
} from 'lucide-react';
import { profileService } from '../services/profileService';
import { fetchMembers as fetchDbMembers, fetchPayments } from '../services/paymentService';
import { getDocuments, type SavedDocument } from '../services/documentService';
import { scheduleService, TYPE_LABELS, type ScheduleEvent } from '../services/scheduleService';

interface DashboardOverviewProps {
    onNavigate: (view: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
    const [memberCount, setMemberCount] = useState(0);
    const [feeTotal, setFeeTotal] = useState(0);
    const [feePaid, setFeePaid] = useState(0);
    const [documents, setDocuments] = useState<SavedDocument[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
    const [overdueEvents, setOverdueEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Members from profiles service
                const profiles = profileService.getAll();
                setMemberCount(profiles.length);

                // Party fee data from Supabase
                const members = await fetchDbMembers();
                const feeMembers = members.filter(m => m.fee_amount > 0);
                setFeeTotal(feeMembers.length);

                const payments = await fetchPayments(currentMonth, currentYear);
                const paidIds = new Set(payments.map(p => p.member_id));
                setFeePaid(feeMembers.filter(m => paidIds.has(m.id)).length);

                // Documents
                setDocuments(getDocuments().slice(0, 5));

                // Schedule
                setUpcomingEvents(scheduleService.getUpcoming(14));
                setOverdueEvents(scheduleService.getOverdue());
            } catch (err) {
                console.error('Dashboard load error:', err);
            }
            setLoading(false);
        };
        load();
    }, []);

    const feePercent = feeTotal > 0 ? Math.round((feePaid / feeTotal) * 100) : 0;

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const day = d.getDate().toString().padStart(2, '0');
        const mon = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${mon}`;
    };

    const formatRelative = (iso: string) => {
        const diff = now.getTime() - new Date(iso).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Hôm nay';
        if (days === 1) return 'Hôm qua';
        return `${days} ngày trước`;
    };

    const greeting = (() => {
        const h = now.getHours();
        if (h < 12) return 'Chào buổi sáng';
        if (h < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    })();

    const quickActions = [
        { key: 'editor', icon: <PenTool className="w-4 h-4" />, label: 'Soạn VB', color: 'bg-red-500' },
        { key: 'profiles', icon: <Database className="w-4 h-4" />, label: 'Hồ sơ ĐV', color: 'bg-blue-500' },
        { key: 'partyfee', icon: <Wallet className="w-4 h-4" />, label: 'Đảng phí', color: 'bg-amber-500' },
        { key: 'compliance', icon: <ShieldCheck className="w-4 h-4" />, label: 'Tuân thủ', color: 'bg-slate-600' },
        { key: 'meeting', icon: <Mic className="w-4 h-4" />, label: 'Biên bản', color: 'bg-rose-500' },
        { key: 'schedule', icon: <CalendarDays className="w-4 h-4" />, label: 'Lịch', color: 'bg-teal-500' },
        { key: 'comments', icon: <Sparkles className="w-4 h-4" />, label: 'Nhận xét', color: 'bg-indigo-500' },
        { key: 'regulations', icon: <BookOpen className="w-4 h-4" />, label: 'Quy định', color: 'bg-purple-500' },
    ];

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-20 bg-gray-200 rounded-2xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-200 rounded-2xl" />
                    <div className="h-64 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Greeting Banner */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoMnY0aC0yem0tNiA2di00aDJ2NGgtMnptMC02di00aDJ2NGgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
                <div className="relative">
                    <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest">{greeting}</p>
                    <h1 className="text-2xl font-black mt-1">Tổng quan Chi bộ</h1>
                    <p className="text-emerald-100 text-sm mt-1 opacity-80">
                        Tháng {String(currentMonth).padStart(2, '0')}/{currentYear} • Cập nhật lúc {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Members */}
                <button
                    onClick={() => onNavigate('profiles')}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group text-left"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-3xl font-black text-gray-800">{memberCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Đảng viên</p>
                </button>

                {/* Party Fee */}
                <button
                    onClick={() => onNavigate('partyfee')}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all group text-left"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <Wallet className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${feePercent >= 80 ? 'bg-green-100 text-green-700' : feePercent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {feePercent}%
                        </span>
                    </div>
                    <p className="text-3xl font-black text-gray-800">{feePaid}<span className="text-lg text-gray-400">/{feeTotal}</span></p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Đã nộp T{String(currentMonth).padStart(2, '0')}</p>
                    {/* Micro progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${feePercent >= 80 ? 'bg-green-500' : feePercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${feePercent}%` }}
                        />
                    </div>
                </button>

                {/* Documents */}
                <button
                    onClick={() => onNavigate('docs')}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-cyan-200 transition-all group text-left"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                            <FileText className="w-5 h-5 text-cyan-600" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-3xl font-black text-gray-800">{getDocuments().length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Văn bản đã soạn</p>
                </button>

                {/* Schedule */}
                <button
                    onClick={() => onNavigate('schedule')}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all group text-left"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                            <CalendarDays className="w-5 h-5 text-teal-600" />
                        </div>
                        {overdueEvents.length > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                                {overdueEvents.length} quá hạn
                            </span>
                        )}
                    </div>
                    <p className="text-3xl font-black text-gray-800">{upcomingEvents.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Lịch sắp tới</p>
                </button>
            </div>

            {/* Content Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schedule Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-teal-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Lịch sắp tới</h3>
                        </div>
                        <button onClick={() => onNavigate('schedule')} className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider flex items-center gap-0.5">
                            Xem tất cả <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                        {/* Overdue */}
                        {overdueEvents.map(ev => (
                            <div key={ev.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-red-800 truncate">{ev.title}</p>
                                    <p className="text-[10px] text-red-500 font-semibold">{formatDate(ev.date)} • Quá hạn</p>
                                </div>
                            </div>
                        ))}
                        {/* Upcoming */}
                        {upcomingEvents.map(ev => (
                            <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors">
                                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-4 h-4 text-teal-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">{ev.title}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold">
                                        {formatDate(ev.date)} • {TYPE_LABELS[ev.type] || ev.type}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {upcomingEvents.length === 0 && overdueEvents.length === 0 && (
                            <div className="text-center py-8 text-gray-300">
                                <CalendarDays className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-xs font-bold">Không có lịch sắp tới</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fee Progress Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-amber-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Đảng phí tháng {String(currentMonth).padStart(2, '0')}</h3>
                        </div>
                        <button onClick={() => onNavigate('partyfee')} className="text-[10px] font-bold text-amber-600 hover:text-amber-800 uppercase tracking-wider flex items-center gap-0.5">
                            Chi tiết <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="p-5">
                        {/* Big progress circle */}
                        <div className="flex items-center justify-center mb-5">
                            <div className="relative w-36 h-36">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke={feePercent >= 80 ? '#22c55e' : feePercent >= 50 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${feePercent * 2.64} 264`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-gray-800">{feePercent}%</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Hoàn thành</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="bg-green-50 rounded-xl p-3">
                                <div className="flex items-center justify-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-lg font-black">{feePaid}</span>
                                </div>
                                <p className="text-[9px] font-bold text-green-500 uppercase tracking-wider mt-0.5">Đã nộp</p>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-3">
                                <div className="flex items-center justify-center gap-1 text-orange-600">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span className="text-lg font-black">{feeTotal - feePaid}</span>
                                </div>
                                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider mt-0.5">Chưa nộp</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Documents + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Documents */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Văn bản gần đây</h3>
                        </div>
                        <button onClick={() => onNavigate('docs')} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-800 uppercase tracking-wider flex items-center gap-0.5">
                            Xem tất cả <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {documents.length === 0 ? (
                            <div className="text-center py-10 text-gray-300">
                                <FileText className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-xs font-bold">Chưa có văn bản nào</p>
                                <button onClick={() => onNavigate('editor')} className="mt-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 uppercase">
                                    Soạn thảo ngay →
                                </button>
                            </div>
                        ) : documents.map(doc => (
                            <div key={doc.id} className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3">
                                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-cyan-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">{doc.title || 'Không tiêu đề'}</p>
                                    <p className="text-[10px] text-gray-400">{doc.docType} • {formatRelative(doc.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" /> Truy cập nhanh
                        </h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-2">
                        {quickActions.map(a => (
                            <button
                                key={a.key}
                                onClick={() => onNavigate(a.key)}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all group"
                            >
                                <div className={`w-9 h-9 ${a.color} rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow`}>
                                    {a.icon}
                                </div>
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
