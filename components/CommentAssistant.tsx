
import React, { useState, useRef } from 'react';
import { transformComment, CommentType, COMMENT_TYPE_LABELS } from '../services/commentService';
import {
    MessageSquareText, ThumbsUp, ThumbsDown, FileText, AlertCircle,
    Lightbulb, Copy, Check, Loader2, Sparkles, RotateCcw, ChevronDown
} from 'lucide-react';

const TYPE_CONFIG: Record<CommentType, { icon: React.ReactNode; color: string; bgColor: string }> = {
    uu_diem: { icon: <ThumbsUp className="w-3.5 h-3.5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
    khuyet_diem: { icon: <ThumbsDown className="w-3.5 h-3.5" />, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
    nhan_xet_chung: { icon: <FileText className="w-3.5 h-3.5" />, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
    phe_binh: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200 hover:bg-red-100' },
    de_xuat: { icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
};

const EXAMPLES: { input: string; type: CommentType }[] = [
    { input: 'Đồng chí A làm việc chăm chỉ, hay giúp đỡ mọi người, đôi khi còn đi muộn.', type: 'nhan_xet_chung' },
    { input: 'Anh B rất nhiệt tình, tham gia đầy đủ các buổi sinh hoạt, đóng đảng phí đúng hạn.', type: 'uu_diem' },
    { input: 'Chị C hay vắng họp, không nộp báo cáo đúng hạn, cần nhắc nhở nhiều lần.', type: 'khuyet_diem' },
];

interface Props {
    onInsertToEditor?: (text: string) => void;
}

const CommentAssistant: React.FC<Props> = ({ onInsertToEditor }) => {
    const [rawInput, setRawInput] = useState('');
    const [commentType, setCommentType] = useState<CommentType>('nhan_xet_chung');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleTransform = async () => {
        if (!rawInput.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');
        try {
            const output = await transformComment(rawInput, commentType);
            setResult(output);
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi chuyển đổi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInsert = () => {
        onInsertToEditor?.(result);
    };

    const handleUseExample = (example: typeof EXAMPLES[0]) => {
        setRawInput(example.input);
        setCommentType(example.type);
        setResult('');
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-5 py-4 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <MessageSquareText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wide">Trợ lý Nhận xét</h2>
                        <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-widest">
                            Chuyển đổi nhận xét thô → Văn phong Đảng chuẩn
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Input */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Nhập nhận xét thô</p>
                    </div>

                    {/* Comment type selector */}
                    <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-gray-50">
                        {(Object.keys(TYPE_CONFIG) as CommentType[]).map(type => {
                            const cfg = TYPE_CONFIG[type];
                            const isActive = commentType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setCommentType(type)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${isActive
                                            ? `${cfg.bgColor} ${cfg.color} border-current ring-1 ring-current/20`
                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {cfg.icon}
                                    {COMMENT_TYPE_LABELS[type]}
                                </button>
                            );
                        })}
                    </div>

                    {/* Input textarea */}
                    <div className="p-4">
                        <textarea
                            ref={textareaRef}
                            className="w-full min-h-[140px] p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none leading-relaxed bg-gray-50/50"
                            placeholder="Nhập nhận xét theo ngôn ngữ tự nhiên... VD: &quot;Đồng chí A làm việc chăm chỉ, hay giúp đỡ mọi người&quot;"
                            value={rawInput}
                            onChange={e => setRawInput(e.target.value)}
                        />

                        <button
                            onClick={handleTransform}
                            disabled={isLoading || !rawInput.trim()}
                            className="w-full mt-3 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Đang chuyển đổi...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Chuyển đổi văn phong</>
                            )}
                        </button>
                    </div>

                    {/* Examples */}
                    <div className="px-4 pb-4">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ví dụ nhanh:</p>
                        <div className="space-y-1.5">
                            {EXAMPLES.map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleUseExample(ex)}
                                    className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-all group"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-black uppercase ${TYPE_CONFIG[ex.type].color}`}>
                                            {COMMENT_TYPE_LABELS[ex.type]}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-gray-500 group-hover:text-indigo-700 italic mt-0.5 line-clamp-1">"{ex.input}"</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Output */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-500" /> Kết quả văn phong Đảng
                        </p>
                        {result && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-[9px] font-bold text-gray-500 transition-all"
                                >
                                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Đã copy' : 'Copy'}
                                </button>
                                {onInsertToEditor && (
                                    <button
                                        onClick={handleInsert}
                                        className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[9px] font-bold text-indigo-600 transition-all"
                                    >
                                        <FileText className="w-3 h-3" /> Chèn vào soạn thảo
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-4">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400">AI đang chuyển đổi văn phong...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-xs font-bold text-red-600">Lỗi</p>
                                </div>
                                <p className="text-[10px] text-red-500">{error}</p>
                            </div>
                        )}

                        {result && !isLoading && (
                            <div className="bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border border-indigo-100 rounded-xl p-4">
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{result}</p>
                            </div>
                        )}

                        {!result && !isLoading && !error && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <MessageSquareText className="w-8 h-8 text-gray-200" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-300 text-center">
                                    Nhập nhận xét bên trái → Nhấn "Chuyển đổi"
                                    <br />AI sẽ chuyển thành văn phong Đảng chuẩn mực
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Before/After comparison if available */}
                    {result && rawInput && !isLoading && (
                        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-2">So sánh trước / sau</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-red-50/50 rounded-lg p-2 border border-red-100">
                                    <p className="text-[8px] font-bold text-red-400 uppercase mb-1">Trước</p>
                                    <p className="text-[9px] text-gray-600 line-clamp-3 italic">{rawInput}</p>
                                </div>
                                <div className="bg-green-50/50 rounded-lg p-2 border border-green-100">
                                    <p className="text-[8px] font-bold text-green-500 uppercase mb-1">Sau</p>
                                    <p className="text-[9px] text-gray-600 line-clamp-3">{result}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentAssistant;
