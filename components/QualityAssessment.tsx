import React, { useState, useRef, useMemo } from 'react';
import {
    CheckCircle2, XCircle, Printer, FileDown, AlertTriangle,
    ChevronDown, ChevronUp, Award, TrendingDown, Info, Sparkles, RefreshCw,
    Zap, Target
} from 'lucide-react';
import {
    QUALITY_CRITERIA, getClassification, MAX_TOTAL,
    type Criterion, type SubCriterion
} from '../data/qualityAssessmentData';
import { DocMetadata } from '../services/geminiService';

interface QualityAssessmentProps {
    metadata: DocMetadata;
}

const QualityAssessment: React.FC<QualityAssessmentProps> = ({ metadata }) => {
    // Scores: key = subCriterion.id, value = selected score
    const [scores, setScores] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {};
        QUALITY_CRITERIA.forEach(c => {
            c.subCriteria.forEach(sub => {
                init[sub.id] = sub.type === 'toggle' ? sub.maxScore : (sub.options?.[0]?.value ?? sub.maxScore);
            });
        });
        return init;
    });

    const [expandedCriteria, setExpandedCriteria] = useState<Set<number>>(() => new Set(QUALITY_CRITERIA.map(c => c.id)));
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [targetInput, setTargetInput] = useState<string>('');
    const [showQuickScore, setShowQuickScore] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate scores per criterion and total
    const criterionScores = useMemo(() => {
        const result: Record<number, number> = {};
        QUALITY_CRITERIA.forEach(c => {
            result[c.id] = c.subCriteria.reduce((sum, sub) => sum + (scores[sub.id] ?? 0), 0);
        });
        return result;
    }, [scores]);

    const totalScore = useMemo(() =>
        Object.values(criterionScores).reduce((s: number, v: number) => s + v, 0),
        [criterionScores]
    );

    const classification = getClassification(totalScore);

    // Deductions: criteria where score < max
    const deductions = useMemo(() => {
        const result: { criterion: string; sub: string; lost: number; note?: string }[] = [];
        QUALITY_CRITERIA.forEach(c => {
            c.subCriteria.forEach(sub => {
                const got = scores[sub.id] ?? 0;
                const lost = sub.maxScore - got;
                if (lost > 0) {
                    result.push({
                        criterion: `${c.id}. ${c.title}`,
                        sub: sub.label,
                        lost,
                        note: notes[sub.id]
                    });
                }
            });
        });
        return result;
    }, [scores, notes]);

    const totalDeducted = deductions.reduce((s, d) => s + d.lost, 0);

    const setScore = (subId: string, value: number) => {
        setScores(prev => ({ ...prev, [subId]: value }));
    };

    const toggleCriterion = (id: number) => {
        setExpandedCriteria(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // === QUICK SCORE AUTO-FILL ===
    const autoFillScores = (target: number) => {
        const clamped = Math.max(0, Math.min(MAX_TOTAL, target));
        let deductNeeded = MAX_TOTAL - clamped;

        // Start with all max scores
        const newScores: Record<string, number> = {};
        QUALITY_CRITERIA.forEach(c => {
            c.subCriteria.forEach(sub => {
                newScores[sub.id] = sub.type === 'toggle' ? sub.maxScore : (sub.options?.[0]?.value ?? sub.maxScore);
            });
        });

        if (deductNeeded <= 0) {
            setScores(newScores);
            return;
        }

        // Build deductible items sorted by priority:
        // 1. Toggle items first (easier to justify), smallest first
        // 2. Radio items second (step down from max), smallest deduction first
        type DeductItem = { id: string; subId: string; amount: number; apply: () => void };
        const items: DeductItem[] = [];

        QUALITY_CRITERIA.forEach(c => {
            c.subCriteria.forEach(sub => {
                if (sub.type === 'toggle') {
                    items.push({
                        id: sub.id,
                        subId: sub.id,
                        amount: sub.maxScore,
                        apply: () => { newScores[sub.id] = 0; }
                    });
                } else if (sub.options && sub.options.length > 1) {
                    const maxVal = sub.options[0].value;
                    for (let i = 1; i < sub.options.length; i++) {
                        const opt = sub.options[i];
                        const diff = maxVal - opt.value;
                        items.push({
                            id: sub.id + '_' + i,
                            subId: sub.id,
                            amount: diff,
                            apply: () => { newScores[sub.id] = opt.value; }
                        });
                    }
                }
            });
        });

        // Sort: smallest deductions first for fine-grained control
        items.sort((a, b) => a.amount - b.amount);

        // Greedy: pick items that don't overshoot, then allow overshoot for last
        // Track by sub-criterion id (not criterion prefix!) so multiple sub-criteria
        // within the same criterion can be deducted independently.
        // Radio items with suffix (_1, _2) share the same subId to avoid picking
        // multiple options for the same radio control.
        const usedSubs = new Set<string>();
        // First pass: exact or under
        for (const item of items) {
            if (usedSubs.has(item.subId)) continue;
            if (item.amount <= deductNeeded) {
                item.apply();
                deductNeeded -= item.amount;
                usedSubs.add(item.subId);
                if (deductNeeded <= 0) break;
            }
        }
        // Second pass: if still need to deduct, pick closest
        if (deductNeeded > 0) {
            for (const item of items) {
                if (usedSubs.has(item.subId)) continue;
                item.apply();
                deductNeeded -= item.amount;
                usedSubs.add(item.subId);
                if (deductNeeded <= 0) break;
            }
        }

        setScores(newScores);
    };

    const handleQuickScore = () => {
        const num = parseInt(targetInput, 10);
        if (!isNaN(num) && num >= 0 && num <= MAX_TOTAL) {
            autoFillScores(num);
        }
    };

    // Print / Export
    const handlePrint = () => {
        setShowPrintPreview(true);
        setTimeout(() => window.print(), 300);
    };

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const el = printRef.current;
            if (!el) return;
            el.style.display = 'block';
            await html2pdf().set({
                margin: [5, 5, 5, 10],
                filename: `Phieu_danh_gia_CB_thang_${String(currentMonth).padStart(2, '0')}_${currentYear}.pdf`,
                html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 750 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            }).from(el).save();
            el.style.display = 'none';
        } catch (err) {
            console.error('PDF export error:', err);
        }
        setIsExporting(false);
    };

    const renderSubCriterion = (sub: SubCriterion, criterion: Criterion) => {
        const currentScore = scores[sub.id] ?? 0;
        const isDeducted = currentScore < sub.maxScore;

        return (
            <div key={sub.id} className={`p-3 rounded-xl border transition-all ${isDeducted ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-start gap-2 mb-2">
                    {isDeducted
                        ? <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        : <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    }
                    <div className="flex-1">
                        <p className="text-[11px] font-bold text-gray-700 leading-relaxed">{sub.label}</p>
                        {sub.note && (
                            <p className="text-[9px] text-gray-400 mt-1 flex items-start gap-1">
                                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" /> {sub.note}
                            </p>
                        )}
                    </div>
                    <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-black ${isDeducted ? 'text-red-600' : 'text-green-600'}`}>
                            {currentScore}
                        </span>
                        <span className="text-[9px] text-gray-400">/{sub.maxScore}</span>
                    </div>
                </div>

                {sub.type === 'radio' && sub.options && (
                    <div className="ml-6 space-y-1">
                        {sub.options.map(opt => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all text-[10px] ${scores[sub.id] === opt.value ? 'bg-white shadow-sm border border-gray-200 font-bold text-gray-800' : 'text-gray-500 hover:bg-white/50'}`}
                            >
                                <input
                                    type="radio"
                                    name={sub.id}
                                    checked={scores[sub.id] === opt.value}
                                    onChange={() => setScore(sub.id, opt.value)}
                                    className="w-3 h-3 accent-emerald-600"
                                />
                                <span className="flex-1">{opt.label}</span>
                                <span className="font-black text-xs">{opt.value}đ</span>
                            </label>
                        ))}
                    </div>
                )}

                {sub.type === 'toggle' && (
                    <div className="ml-6 flex gap-2">
                        <button
                            onClick={() => setScore(sub.id, sub.maxScore)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${currentScore === sub.maxScore ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                            <CheckCircle2 className="w-3 h-3" /> Đạt ({sub.maxScore}đ)
                        </button>
                        <button
                            onClick={() => setScore(sub.id, 0)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${currentScore === 0 ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                            <XCircle className="w-3 h-3" /> Không (0đ)
                        </button>
                    </div>
                )}

                {/* Note input for deducted items */}
                {isDeducted && (
                    <div className="ml-6 mt-2">
                        <input
                            type="text"
                            placeholder="Ghi chú lý do trừ điểm..."
                            className="w-full p-1.5 border border-red-200 rounded-lg text-[10px] bg-white outline-none focus:ring-2 focus:ring-red-100"
                            value={notes[sub.id] || ''}
                            onChange={e => setNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        />
                    </div>
                )}
            </div>
        );
    };

    // Build print content rows for the table — includes radio option detail rows like template
    const buildPrintRows = () => {
        type PrintRow = {
            stt: string;
            title: string;
            maxScore: string;
            score: string;
            note: string;
            isMain: boolean;
            isSub?: boolean;
            isOption?: boolean;
        };
        const rows: PrintRow[] = [];
        QUALITY_CRITERIA.forEach(c => {
            // Main criterion row
            rows.push({
                stt: String(c.id),
                title: c.title,
                maxScore: String(c.maxScore),
                score: String(criterionScores[c.id]),
                note: '',
                isMain: true
            });
            c.subCriteria.forEach(sub => {
                const got = scores[sub.id] ?? 0;
                // Sub-criterion row
                rows.push({
                    stt: '',
                    title: sub.label,
                    maxScore: String(sub.maxScore),
                    score: String(got),
                    note: got < sub.maxScore ? (notes[sub.id] || '') : '',
                    isMain: false,
                    isSub: true
                });
                // For radio items: show each option as a detail row like the original template
                if (sub.type === 'radio' && sub.options) {
                    sub.options.forEach(opt => {
                        rows.push({
                            stt: '',
                            title: (got === opt.value ? '● ' : '+ ') + opt.label,
                            maxScore: String(opt.value),
                            score: got === opt.value ? String(opt.value) : '',
                            note: sub.note && opt === sub.options![0] ? sub.note : '',
                            isMain: false,
                            isOption: true
                        });
                    });
                }
            });
        });
        return rows;
    };

    // Shared cell styles — compact to fit 3 A4 pages
    const cellBase: React.CSSProperties = {
        border: '1px solid #000',
        padding: '3px 4px 7px 4px',
        verticalAlign: 'top',
        lineHeight: '1.5',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-emerald-200 text-[9px] font-bold uppercase tracking-widest">Phiếu đánh giá chất lượng</p>
                        <h2 className="text-lg font-black mt-0.5">Sinh hoạt Chi bộ tháng {String(currentMonth).padStart(2, '0')}/{currentYear}</h2>
                        <p className="text-emerald-100 text-[10px] mt-1 opacity-80">{metadata.superiorParty} • {metadata.branchName}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-black ${totalScore >= 70 ? 'text-white' : 'text-red-300'}`}>{totalScore}</div>
                        <div className="text-[10px] font-bold text-emerald-200">/{MAX_TOTAL} điểm</div>
                        <div className={`mt-1 px-3 py-0.5 rounded-full text-[10px] font-black inline-block ${totalScore >= 90 ? 'bg-green-400 text-green-900' : totalScore >= 70 ? 'bg-blue-400 text-blue-900' : totalScore >= 50 ? 'bg-amber-400 text-amber-900' : 'bg-red-400 text-red-900'}`}>
                            {classification.label}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-emerald-900/30 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${totalScore >= 90 ? 'bg-green-400' : totalScore >= 70 ? 'bg-blue-400' : totalScore >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${totalScore}%` }}
                    />
                </div>
            </div>

            {/* Quick Score - Lazy Mode */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                <button
                    onClick={() => setShowQuickScore(!showQuickScore)}
                    className="w-full flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <div className="bg-amber-100 p-1.5 rounded-lg">
                            <Zap className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Chấm nhanh</p>
                            <p className="text-[8px] text-amber-500">Nhập số điểm mong muốn → tự động phân bổ</p>
                        </div>
                    </div>
                    {showQuickScore ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
                </button>

                {showQuickScore && (
                    <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                                <input
                                    type="number"
                                    min={0}
                                    max={MAX_TOTAL}
                                    value={targetInput}
                                    onChange={e => setTargetInput(e.target.value)}
                                    placeholder="Nhập điểm mong muốn..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-black text-center outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                                    onKeyDown={e => { if (e.key === 'Enter') handleQuickScore(); }}
                                />
                            </div>
                            <button
                                onClick={handleQuickScore}
                                disabled={!targetInput || isNaN(parseInt(targetInput))}
                                className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-amber-700 transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                <Zap className="w-3.5 h-3.5" /> Tự động chấm
                            </button>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                            {[95, 90, 85, 80, 75, 70].map(preset => {
                                const cls = getClassification(preset);
                                return (
                                    <button
                                        key={preset}
                                        onClick={() => { setTargetInput(String(preset)); autoFillScores(preset); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all active:scale-95 ${preset >= 90 ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                            : preset >= 70 ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                            }`}
                                    >
                                        {preset}đ · {cls.label}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-[8px] text-amber-400 italic">
                            💡 Chọn mức điểm → hệ thống tự trừ các tiêu chí phù hợp. Bạn vẫn có thể chỉnh tay sau.
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-slate-900 transition-all active:scale-95"
                >
                    {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} In phiếu PDF
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl text-[10px] font-black uppercase shadow-sm border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                >
                    <Printer className="w-3.5 h-3.5" /> In trực tiếp
                </button>
            </div>

            {/* Deduction summary */}
            {deductions.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <h3 className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> Các mục bị trừ điểm ({totalDeducted} điểm)
                    </h3>
                    <div className="space-y-1.5">
                        {deductions.map((d, i) => (
                            <div key={i} className="flex items-start gap-2 text-[10px]">
                                <span className="text-red-500 font-black flex-shrink-0">-{d.lost}đ</span>
                                <span className="text-red-800">{d.sub}</span>
                                {d.note && <span className="text-red-400 italic">({d.note})</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Scoring Panels */}
            <div className="space-y-3">
                {QUALITY_CRITERIA.map(criterion => {
                    const isExpanded = expandedCriteria.has(criterion.id);
                    const cScore = criterionScores[criterion.id];
                    const isFullScore = cScore === criterion.maxScore;

                    return (
                        <div key={criterion.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => toggleCriterion(criterion.id)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isFullScore ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {criterion.id}
                                    </span>
                                    <div className="text-left">
                                        <p className="text-[11px] font-bold text-gray-700">{criterion.title}</p>
                                        {criterion.note && (
                                            <p className="text-[8px] text-gray-400 mt-0.5">{criterion.note}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className={`text-sm font-black ${isFullScore ? 'text-green-600' : 'text-red-600'}`}>{cScore}</span>
                                        <span className="text-[9px] text-gray-400">/{criterion.maxScore}</span>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                                    {criterion.subCriteria.map(sub => renderSubCriterion(sub, criterion))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Classification summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Award className={`w-8 h-8 ${classification.color}`} />
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Xếp loại chất lượng sinh hoạt</p>
                            <p className={`text-xl font-black ${classification.color}`}>{classification.label}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-gray-800">{totalScore}<span className="text-lg text-gray-400">/{MAX_TOTAL}</span></p>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[8px] font-bold uppercase">
                    <div className={`py-1.5 rounded-lg ${totalScore >= 90 ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-gray-50 text-gray-400'}`}>Tốt (≥90)</div>
                    <div className={`py-1.5 rounded-lg ${totalScore >= 70 && totalScore < 90 ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-50 text-gray-400'}`}>Khá (70-89)</div>
                    <div className={`py-1.5 rounded-lg ${totalScore >= 50 && totalScore < 70 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500' : 'bg-gray-50 text-gray-400'}`}>TB (50-69)</div>
                    <div className={`py-1.5 rounded-lg ${totalScore < 50 ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-gray-50 text-gray-400'}`}>Kém (&lt;50)</div>
                </div>
            </div>

            {/* Hidden Print Preview */}
            <div ref={printRef} style={{ display: 'none', fontFamily: 'Times New Roman, serif', fontSize: '11px', color: '#000', padding: '5mm 5mm 5mm 10mm', width: '750px', boxSizing: 'border-box' }} className="print-template">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '0' }}>{metadata.superiorParty || 'ĐẢNG BỘ PHƯỜNG AN PHÚ'}</p>
                        <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '0' }}>{metadata.branchName || 'CHI BỘ KHU PHỐ 3'}</p>
                        <p style={{ fontSize: '14px', margin: '0' }}>*</p>
                    </div>
                    <div style={{ textAlign: 'center', width: '55%' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '0' }}>ĐẢNG CỘNG SẢN VIỆT NAM</p>
                        <p style={{ fontSize: '10px', fontStyle: 'italic', margin: '0' }}>{metadata.locationDate || `An Phú, ngày ... tháng ${String(currentMonth).padStart(2, '0')} năm ${currentYear}`}</p>
                    </div>
                </div>

                <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', margin: '3mm 0 1mm 0' }}>PHIẾU ĐÁNH GIÁ</h2>
                <p style={{ textAlign: 'center', fontSize: '11px', marginBottom: '2mm' }}>Chất lượng sinh hoạt Chi bộ tháng {String(currentMonth).padStart(2, '0')} năm {currentYear}</p>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            <th style={{ ...cellBase, width: '5%', fontWeight: 'bold', textAlign: 'center', fontSize: '10px' }}>STT</th>
                            <th style={{ ...cellBase, width: '50%', fontWeight: 'bold', textAlign: 'center', fontSize: '10px' }}>TIÊU CHÍ ĐÁNH GIÁ</th>
                            <th style={{ ...cellBase, width: '9%', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>Thang điểm</th>
                            <th style={{ ...cellBase, width: '9%', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>Điểm tự chấm</th>
                            <th style={{ ...cellBase, width: '27%', fontWeight: 'bold', textAlign: 'center', fontSize: '10px' }}>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buildPrintRows().map((row, i) => (
                            <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                                <td style={{ ...cellBase, textAlign: 'center', fontWeight: row.isMain ? 'bold' : 'normal' }}>{row.stt}</td>
                                <td style={{
                                    ...cellBase,
                                    fontWeight: row.isMain ? 'bold' : 'normal',
                                    paddingLeft: row.isOption ? '18px' : row.isSub ? '8px' : '4px',
                                    fontSize: row.isOption ? '9px' : row.isSub ? '9.5px' : '10px',
                                    textAlign: 'left'
                                }}>{row.title}</td>
                                <td style={{ ...cellBase, textAlign: 'center', fontSize: '10px' }}>{row.maxScore}</td>
                                <td style={{ ...cellBase, textAlign: 'center', fontWeight: row.isMain ? 'bold' : 'normal', fontSize: '10px' }}>{row.score}</td>
                                <td style={{ ...cellBase, fontSize: '9px', textAlign: 'left', paddingLeft: '4px' }}>{row.note}</td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={2} style={{ ...cellBase, fontWeight: 'bold', textAlign: 'center', fontSize: '11px' }}>TỔNG ĐIỂM</td>
                            <td style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>{MAX_TOTAL}</td>
                            <td style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>{totalScore}</td>
                            <td style={{ ...cellBase }}></td>
                        </tr>
                    </tbody>
                </table>

                <p style={{ marginTop: '2mm', fontSize: '11px' }}>
                    Xếp loại chất lượng sinh hoạt chi bộ tháng {String(currentMonth).padStart(2, '0')} năm {currentYear}: <b>{classification.label}</b>
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8mm' }}>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '0' }}>T/M BAN CHI ỦY</p>
                        <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '0' }}>BÍ THƯ</p>
                        <p style={{ marginTop: '20mm' }}>&nbsp;</p>
                    </div>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '0' }}>CẤP ỦY CẤP TRÊN PHỤ TRÁCH</p>
                        <p style={{ marginTop: '20mm' }}>&nbsp;</p>
                    </div>
                </div>

                <div style={{ marginTop: '5mm', fontSize: '9px' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 1px 0' }}>Các mức xếp loại chất lượng sinh hoạt chi bộ hàng tháng</p>
                    <p style={{ margin: '0' }}>+ Chi bộ xếp loại Tốt, đạt từ 90 điểm trở lên.</p>
                    <p style={{ margin: '0' }}>+ Chi bộ xếp loại Khá, đạt từ 70 đến dưới 90 điểm.</p>
                    <p style={{ margin: '0' }}>+ Chi bộ xếp loại Trung bình: Đạt từ 50 đến dưới 70 điểm.</p>
                    <p style={{ margin: '0' }}>+ Chi bộ xếp loại Kém: Dưới 50 điểm.</p>
                </div>
            </div>
        </div>
    );
};

export default QualityAssessment;
