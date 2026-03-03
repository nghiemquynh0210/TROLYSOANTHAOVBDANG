import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Search, Trash2, Eye, Download, Clock,
    Filter, ChevronDown, ChevronUp, X, Files, RefreshCw,
    Calendar, Tag, FileDown, Printer
} from 'lucide-react';
import {
    getDocuments, deleteDocument, syncFromSupabase,
    SavedDocument
} from '../services/documentService';
import { exportToPdf } from '../services/pdfService';
import { exportToDocx } from '../services/wordService';
import { useConfirm } from './ConfirmProvider';

interface Props {
    onOpenInEditor?: (content: string, docType: string) => void;
}

const DocumentDashboard: React.FC<Props> = ({ onOpenInEditor }) => {
    const { showConfirm } = useConfirm();
    const [documents, setDocuments] = useState<SavedDocument[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Load documents
    const loadDocs = () => {
        setDocuments(getDocuments());
    };

    useEffect(() => {
        loadDocs();
        // Sync from Supabase
        syncFromSupabase().then(() => loadDocs());
    }, []);

    // Get unique doc types for filter
    const docTypes = useMemo(() => {
        const types = new Set(documents.map(d => d.docType));
        return Array.from(types).sort();
    }, [documents]);

    // Filter and search
    const filteredDocs = useMemo(() => {
        let result = documents;
        if (filterType) {
            result = result.filter(d => d.docType === filterType);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.title.toLowerCase().includes(q) ||
                d.content.toLowerCase().includes(q) ||
                d.docType.toLowerCase().includes(q)
            );
        }
        if (sortOrder === 'oldest') {
            result = [...result].reverse();
        }
        return result;
    }, [documents, filterType, searchQuery, sortOrder]);

    const handleDelete = async (id: string) => {
        if (await showConfirm('Xóa văn bản này?', 'Xóa văn bản', 'warning')) {
            deleteDocument(id);
            loadDocs();
            if (previewDoc?.id === id) setPreviewDoc(null);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        await syncFromSupabase();
        loadDocs();
        setSyncing(false);
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getDocTypeColor = (docType: string) => {
        if (docType.includes('NGHỊ QUYẾT')) return 'bg-red-100 text-red-700';
        if (docType.includes('BÁO CÁO')) return 'bg-blue-100 text-blue-700';
        if (docType.includes('BIÊN BẢN')) return 'bg-green-100 text-green-700';
        if (docType.includes('KẾ HOẠCH')) return 'bg-purple-100 text-purple-700';
        if (docType.includes('CHƯƠNG TRÌNH')) return 'bg-amber-100 text-amber-700';
        if (docType.includes('GIÁM SÁT') || docType.includes('KIỂM TRA')) return 'bg-slate-100 text-slate-700';
        if (docType.includes('KẾT NẠP') || docType.includes('MẪU')) return 'bg-indigo-100 text-indigo-700';
        return 'bg-gray-100 text-gray-700';
    };

    const truncateContent = (html: string, maxLen = 150) => {
        const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-xl">
                                <Files className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black">Kho Văn bản đã Soạn thảo</h2>
                                <p className="text-xs text-white/80 mt-0.5">
                                    {documents.length} văn bản • Tự động lưu khi soạn thảo AI
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ'}
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm văn bản..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${filterType ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                {filterType || 'Lọc loại'}
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showFilter && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-64 max-h-72 overflow-y-auto">
                                    <button
                                        onClick={() => { setFilterType(''); setShowFilter(false); }}
                                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 font-bold text-gray-500 border-b border-gray-100"
                                    >
                                        Tất cả loại văn bản
                                    </button>
                                    {docTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => { setFilterType(type); setShowFilter(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${filterType === type ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-700'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-gray-300 transition-all"
                        >
                            <Clock className="w-3.5 h-3.5" />
                            {sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
                            {sortOrder === 'newest' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Grid */}
            {filteredDocs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-400 mb-2">
                        {searchQuery || filterType ? 'Không tìm thấy kết quả' : 'Chưa có văn bản nào'}
                    </h3>
                    <p className="text-sm text-gray-400">
                        {searchQuery || filterType
                            ? 'Thử thay đổi từ khóa hoặc bộ lọc'
                            : 'Văn bản sẽ tự động lưu khi bạn soạn thảo qua AI tại tab "Soạn thảo"'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredDocs.map(doc => (
                        <div
                            key={doc.id}
                            className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden group cursor-pointer"
                            onClick={() => setPreviewDoc(doc)}
                        >
                            {/* Card header */}
                            <div className="px-5 pt-4 pb-2">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${getDocTypeColor(doc.docType)}`}>
                                        <Tag className="w-2.5 h-2.5" />
                                        {doc.docType.length > 30 ? doc.docType.slice(0, 30) + '…' : doc.docType}
                                    </span>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 mb-1">
                                    {doc.title}
                                </h3>
                            </div>

                            {/* Card body - preview */}
                            <div className="px-5 pb-3">
                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                                    {truncateContent(doc.content)}
                                </p>
                            </div>

                            {/* Card footer */}
                            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(doc.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={e => { e.stopPropagation(); setPreviewDoc(doc); }}
                                        className="text-gray-400 hover:text-emerald-600 p-1 rounded-lg hover:bg-emerald-50 transition-all"
                                        title="Xem chi tiết"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    {onOpenInEditor && (
                                        <button
                                            onClick={e => { e.stopPropagation(); onOpenInEditor(doc.content, doc.docType); }}
                                            className="text-gray-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-all"
                                            title="Mở trong trình soạn thảo"
                                        >
                                            <FileDown className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3 text-white min-w-0">
                                <FileText className="w-5 h-5 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold truncate">{previewDoc.title}</h3>
                                    <p className="text-[10px] text-white/70">{formatDate(previewDoc.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {onOpenInEditor && (
                                    <button
                                        onClick={() => { onOpenInEditor(previewDoc.content, previewDoc.docType); setPreviewDoc(null); }}
                                        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                                    >
                                        <FileDown className="w-3.5 h-3.5" />
                                        Mở trong Editor
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const printWindow = window.open('', '_blank');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                                <html><head><title>${previewDoc.title}</title>
                                                <style>body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;max-width:800px;margin:40px auto;padding:0 20px;}</style>
                                                </head><body>${previewDoc.content}</body></html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.print();
                                        }
                                    }}
                                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    In
                                </button>
                                <button onClick={() => setPreviewDoc(null)} className="text-white/70 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${getDocTypeColor(previewDoc.docType)}`}>
                                    <Tag className="w-3 h-3" />
                                    {previewDoc.docType}
                                </span>
                                {previewDoc.docLevel && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">
                                        {previewDoc.docLevel}
                                    </span>
                                )}
                            </div>
                            <div
                                className="prose prose-sm max-w-none"
                                style={{ fontFamily: "'Times New Roman', serif", fontSize: '14px', lineHeight: '1.6' }}
                                dangerouslySetInnerHTML={{ __html: previewDoc.content }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentDashboard;
