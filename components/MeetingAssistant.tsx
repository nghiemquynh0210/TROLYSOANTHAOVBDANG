
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, FileText, Loader2, Copy, Download, AlertCircle, Trash2 } from 'lucide-react';

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface Props {
    apiKey: string;
    onSendToEditor?: (text: string) => void;
}

const MeetingAssistant: React.FC<Props> = ({ apiKey, onSendToEditor }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [error, setError] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) setIsSupported(false);
    }, []);

    const startRecording = useCallback(() => {
        setError('');
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { setError('Trình duyệt không hỗ trợ. Vui lòng dùng Chrome hoặc Edge.'); return; }

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (e: SpeechRecognitionEvent) => {
            let final = '';
            let interim = '';
            for (let i = 0; i < e.results.length; i++) {
                const result = e.results[i];
                if (result.isFinal) {
                    final += result[0].transcript + ' ';
                } else {
                    interim += result[0].transcript;
                }
            }
            if (final) setTranscript(prev => prev + final);
            setInterimText(interim);
        };

        recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
            if (e.error !== 'no-speech') setError(`Lỗi ghi âm: ${e.error}`);
        };

        recognition.onend = () => {
            setIsRecording(false);
            setInterimText('');
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    }, []);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);
        setInterimText('');
    }, []);

    const handleSummarize = async () => {
        if (!transcript.trim()) { setError('Chưa có nội dung để tóm tắt.'); return; }
        if (!apiKey) { setError('Chưa có API Key. Vui lòng cấu hình trong Cài đặt.'); return; }

        setIsSummarizing(true);
        setError('');
        try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `Bạn là thư ký chi bộ Đảng. Hãy tóm tắt nội dung cuộc họp chi bộ dưới đây thành DỰ THẢO NGHỊ QUYẾT CHI BỘ theo đúng mẫu form:

NGHỊ QUYẾT
HỘI NGHỊ CHI BỘ THÁNG __/__/____

I. ĐÁNH GIÁ TÌNH HÌNH THỰC HIỆN NGHỊ QUYẾT THÁNG TRƯỚC
(Tóm tắt kết quả thực hiện)

II. PHƯƠNG HƯỚNG, NHIỆM VỤ THÁNG TỚI
(Liệt kê các nhiệm vụ chính)

III. BIỂU QUYẾT
- Số đảng viên tham dự: __
- Số phiếu đồng ý: __
- Nghị quyết được thông qua

---
NỘI DUNG CUỘC HỌP (Bản ghi):
${transcript}

Hãy viết nghị quyết bằng tiếng Việt, ngắn gọn, đúng mẫu.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt
            });

            setSummary(response.text || 'Không thể tạo tóm tắt.');
        } catch (err: any) {
            setError(`Lỗi AI: ${err.message}`);
        } finally {
            setIsSummarizing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-700 to-pink-800 rounded-2xl px-6 py-5 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                        <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wide">Trợ lý Biên bản</h2>
                        <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest">
                            Ghi âm cuộc họp → AI tóm tắt thành Nghị quyết
                        </p>
                    </div>
                </div>
            </div>

            {!isSupported && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-800">Trình duyệt không hỗ trợ</h3>
                        <p className="text-xs text-amber-700 mt-1">
                            Tính năng ghi âm yêu cầu trình duyệt <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong>. Bạn vẫn có thể nhập văn bản thủ công.
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Recording controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center gap-4 mb-5">
                    {isRecording ? (
                        <button
                            onClick={stopRecording}
                            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-3 shadow-lg shadow-red-200 animate-pulse"
                        >
                            <MicOff className="w-5 h-5" /> Dừng ghi
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            disabled={!isSupported}
                            className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-3 shadow-lg shadow-rose-200 disabled:opacity-40"
                        >
                            <Mic className="w-5 h-5" /> Bắt đầu ghi
                        </button>
                    )}
                    <button
                        onClick={handleSummarize}
                        disabled={!transcript.trim() || isSummarizing}
                        className="px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-3 shadow-lg disabled:opacity-40"
                    >
                        {isSummarizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                        {isSummarizing ? 'Đang xử lý...' : 'Tóm tắt AI'}
                    </button>
                </div>

                {isRecording && (
                    <div className="text-center mb-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Đang ghi âm...</span>
                        </div>
                    </div>
                )}

                {/* Transcript area */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nội dung ghi âm</h3>
                        <div className="flex items-center gap-2">
                            {transcript && (
                                <>
                                    <button onClick={() => copyToClipboard(transcript)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition" title="Sao chép">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => { setTranscript(''); setSummary(''); }} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition" title="Xóa">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <textarea
                        className="w-full h-48 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-700 resize-y outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                        placeholder="Nội dung cuộc họp sẽ hiển thị ở đây khi ghi âm, hoặc bạn có thể nhập tay..."
                        value={transcript + (interimText ? `\n[...${interimText}]` : '')}
                        onChange={e => setTranscript(e.target.value)}
                    />
                </div>
            </div>

            {/* AI Summary */}
            {summary && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Dự thảo Nghị quyết (AI)
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => copyToClipboard(summary)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition" title="Sao chép">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                            {onSendToEditor && (
                                <button
                                    onClick={() => onSendToEditor(summary)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                                >
                                    <Download className="w-3 h-3" /> Chuyển sang Soạn thảo
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{summary}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingAssistant;
