
import React, { useState, useEffect } from 'react';
import { complianceService, ComplianceRecord, ComplianceCheck } from '../services/complianceService';
import { WORKFLOWS } from '../data/workflows';
import {
    ShieldCheck, Plus, Trash2, CheckCircle2, AlertTriangle,
    Circle, ChevronDown, ChevronUp, X
} from 'lucide-react';

const PROCESS_TYPES = Object.keys(WORKFLOWS);

const CompliancePanel: React.FC = () => {
    const [records, setRecords] = useState<ComplianceRecord[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newProcess, setNewProcess] = useState(PROCESS_TYPES[0]);
    const [newCaseName, setNewCaseName] = useState('');

    const load = () => setRecords(complianceService.getAll());
    useEffect(() => { load(); }, []);

    const handleCreate = () => {
        if (!newCaseName.trim()) { alert('Nhập tên vụ việc!'); return; }
        complianceService.create(newProcess, newCaseName.trim());
        setNewCaseName('');
        setShowAdd(false);
        load();
    };

    const handleToggleDoc = (caseId: string, docType: string, isCompleted: boolean) => {
        if (isCompleted) complianceService.unmarkCompleted(caseId, docType);
        else complianceService.markCompleted(caseId, docType);
        load();
    };

    const handleDelete = (caseId: string, name: string) => {
        if (confirm(`Xóa theo dõi "${name}"?`)) { complianceService.remove(caseId); load(); }
    };

    const getStatusIcon = (status: ComplianceCheck['status']) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'missing_required': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default: return <Circle className="w-4 h-4 text-gray-300" />;
        }
    };

    const getProgress = (rec: ComplianceRecord) => {
        const wf = WORKFLOWS[rec.processType];
        if (!wf) return 0;
        return Math.round((rec.completedDocs.length / wf.steps.length) * 100);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl px-6 py-5 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wide">Kiểm tra Tuân thủ</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                Theo dõi hoàn thành quy trình hồ sơ
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-2 border border-white/20"
                    >
                        <Plus className="w-4 h-4" /> Thêm vụ việc
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xs font-bold text-gray-600 uppercase">Thêm vụ việc mới</h3>
                        <button onClick={() => setShowAdd(false)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                            className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                            value={newProcess}
                            onChange={e => setNewProcess(e.target.value)}
                        >
                            {PROCESS_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input
                            type="text"
                            placeholder="Tên vụ việc (VD: Kiểm tra đ/c Nguyễn Văn A)"
                            className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 md:col-span-1"
                            value={newCaseName}
                            onChange={e => setNewCaseName(e.target.value)}
                        />
                        <button
                            onClick={handleCreate}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                            Tạo
                        </button>
                    </div>
                </div>
            )}

            {/* Records */}
            {records.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 py-16 text-center">
                    <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-bold">Chưa theo dõi vụ việc nào</p>
                    <p className="text-xs text-gray-300 mt-1">Nhấn "Thêm vụ việc" để bắt đầu</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {records.map(rec => {
                        const isExpanded = expandedId === rec.caseId;
                        const checks = complianceService.checkCompliance(rec.processType, rec.caseId);
                        const progress = getProgress(rec);
                        const warnings = checks.filter(c => c.status === 'missing_required').length;

                        return (
                            <div key={rec.caseId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Summary row */}
                                <div
                                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : rec.caseId)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                            <ShieldCheck className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sm text-gray-800">{rec.caseName}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{rec.processType}</span>
                                                <span className="text-[10px] text-gray-400">{rec.completedDocs.length}/{checks.length} văn bản</span>
                                                {warnings > 0 && <span className="text-[9px] font-bold text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {warnings} thiếu</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{progress}%</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded checklist */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-6 py-4 space-y-1">
                                            {checks.map(check => (
                                                <div
                                                    key={check.docType}
                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${check.status === 'missing_required' ? 'bg-red-50/50' : ''}`}
                                                    onClick={() => handleToggleDoc(rec.caseId, check.docType, check.status === 'completed')}
                                                >
                                                    {getStatusIcon(check.status)}
                                                    <div className="flex-1">
                                                        <span className={`text-xs font-bold ${check.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                            {check.docType}. {check.title}
                                                        </span>
                                                        {check.message && (
                                                            <p className="text-[10px] text-red-500 font-medium mt-0.5">{check.message}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-gray-300 font-mono">Bước {check.number}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
                                            <button
                                                onClick={() => handleDelete(rec.caseId, rec.caseName)}
                                                className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Xóa vụ việc
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CompliancePanel;
