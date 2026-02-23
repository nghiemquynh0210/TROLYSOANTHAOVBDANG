
import React, { useState, useEffect, useMemo } from 'react';
import { scheduleService, ScheduleEvent, TYPE_LABELS } from '../services/scheduleService';
import {
    CalendarDays, Plus, Trash2, CheckCircle2, Circle,
    AlertTriangle, Clock, X, Bell
} from 'lucide-react';

const ScheduleReminder: React.FC = () => {
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newType, setNewType] = useState<ScheduleEvent['type']>('sinh_hoat');
    const [newNote, setNewNote] = useState('');
    const [newRecurring, setNewRecurring] = useState(false);
    const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');

    const load = () => setEvents(scheduleService.getAll());
    useEffect(() => { load(); }, []);

    const overdue = useMemo(() => scheduleService.getOverdue(), [events]);
    const upcoming = useMemo(() => scheduleService.getUpcoming(7), [events]);

    const displayed = useMemo(() => {
        if (filter === 'overdue') return overdue;
        if (filter === 'upcoming') return upcoming;
        return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filter, events, overdue, upcoming]);

    const handleCreate = () => {
        if (!newTitle.trim() || !newDate) { alert('Nhập đủ thông tin!'); return; }
        scheduleService.create({
            title: newTitle.trim(),
            date: new Date(newDate).toISOString(),
            type: newType,
            recurring: newRecurring,
            recurDay: newRecurring ? new Date(newDate).getDate() : undefined,
            note: newNote.trim()
        });
        setNewTitle(''); setNewDate(''); setNewNote('');
        setNewRecurring(false); setShowAdd(false);
        load();
    };

    const handleToggle = (id: string) => {
        scheduleService.toggleComplete(id);
        load();
    };

    const handleDelete = (id: string) => {
        scheduleService.remove(id);
        load();
    };

    const formatDate = (iso: string): string => {
        const d = new Date(iso);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hrs = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hrs}:${mins}`;
    };

    const getDaysUntil = (iso: string): string => {
        const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return `Quá hạn ${Math.abs(diff)} ngày`;
        if (diff === 0) return 'Hôm nay';
        if (diff === 1) return 'Ngày mai';
        return `Còn ${diff} ngày`;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'sinh_hoat': return 'bg-blue-100 text-blue-700';
            case 'bao_cao': return 'bg-amber-100 text-amber-700';
            case 'ho_so': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-cyan-800 rounded-2xl px-6 py-5 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md relative">
                            <CalendarDays className="w-6 h-6 text-white" />
                            {(overdue.length > 0) && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white font-black flex items-center justify-center border-2 border-teal-700">{overdue.length}</div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wide">Nhắc Lịch</h2>
                            <p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest">
                                {events.length} sự kiện • {overdue.length} quá hạn • {upcoming.length} sắp tới
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-2 border border-white/20"
                    >
                        <Plus className="w-4 h-4" /> Thêm lịch
                    </button>
                </div>
            </div>

            {/* Overdue alerts */}
            {overdue.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <h3 className="text-xs font-black text-red-700 uppercase tracking-wider">Quá hạn ({overdue.length})</h3>
                    </div>
                    <div className="space-y-2">
                        {overdue.slice(0, 3).map(e => (
                            <div key={e.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-red-100">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{e.title}</p>
                                        <p className="text-[10px] text-red-500 font-medium">{getDaysUntil(e.date)} • {formatDate(e.date)}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleToggle(e.id)} className="text-emerald-500 hover:text-emerald-700 p-1"><CheckCircle2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'upcoming', 'overdue'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2 ${filter === f
                                ? 'bg-teal-700 border-teal-700 text-white'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-teal-300'
                            }`}
                    >
                        {f === 'all' ? `Tất cả (${events.length})` : f === 'upcoming' ? `Sắp tới (${upcoming.length})` : `Quá hạn (${overdue.length})`}
                    </button>
                ))}
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-600 uppercase">Thêm sự kiện mới</h3>
                        <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" placeholder="Tiêu đề" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                            className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-200 md:col-span-2" />
                        <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                            className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-200" />
                        <select value={newType} onChange={e => setNewType(e.target.value as ScheduleEvent['type'])}
                            className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-200">
                            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <input type="text" placeholder="Ghi chú" value={newNote} onChange={e => setNewNote(e.target.value)}
                            className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-200" />
                        <label className="flex items-center gap-2 p-3 cursor-pointer">
                            <input type="checkbox" checked={newRecurring} onChange={e => setNewRecurring(e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
                            <span className="text-xs text-gray-600 font-medium">Lặp lại hàng tháng</span>
                        </label>
                    </div>
                    <button onClick={handleCreate} className="mt-3 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all w-full">
                        Tạo sự kiện
                    </button>
                </div>
            )}

            {/* Events list */}
            <div className="space-y-2">
                {displayed.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 py-12 text-center">
                        <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 font-bold">Không có sự kiện</p>
                    </div>
                ) : (
                    displayed.map(e => {
                        const isOverdue = !e.completed && new Date(e.date) < new Date();
                        return (
                            <div key={e.id} className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 transition-all hover:shadow-md ${e.completed ? 'opacity-50 border-gray-100' : isOverdue ? 'border-red-200' : 'border-gray-200'
                                }`}>
                                <button onClick={() => handleToggle(e.id)} className="flex-shrink-0">
                                    {e.completed
                                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        : <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-400 transition-colors" />
                                    }
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold ${e.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{e.title}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${getTypeColor(e.type)}`}>
                                            {TYPE_LABELS[e.type]}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatDate(e.date)}
                                        </span>
                                        {!e.completed && (
                                            <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-500' : 'text-teal-600'}`}>
                                                {getDaysUntil(e.date)}
                                            </span>
                                        )}
                                        {e.recurring && <span className="text-[9px] text-purple-500 font-bold">🔁 Định kỳ</span>}
                                    </div>
                                    {e.note && <p className="text-[10px] text-gray-400 mt-1 truncate">{e.note}</p>}
                                </div>
                                <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ScheduleReminder;
