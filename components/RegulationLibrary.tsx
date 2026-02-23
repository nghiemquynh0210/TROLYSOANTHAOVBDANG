
import React, { useState, useMemo } from 'react';
import { REGULATIONS, REGULATION_CATEGORIES, Regulation } from '../data/regulations';
import {
    BookOpen, Search, ChevronDown, ChevronUp, Star,
    Calendar, Building, Tag, ArrowRight
} from 'lucide-react';

const RegulationLibrary: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        let items = REGULATIONS;
        if (category !== 'all') items = items.filter(r => r.category === category);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.number.toLowerCase().includes(q) ||
                r.summary.toLowerCase().includes(q)
            );
        }
        return items;
    }, [searchQuery, category]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-2xl px-6 py-5 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wide">Thư viện Quy định</h2>
                        <p className="text-purple-200 text-[10px] font-bold uppercase tracking-widest">
                            {REGULATIONS.length} văn bản quy phạm Đảng
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm quy định, hướng dẫn..."
                        className="w-full pl-11 pr-4 py-3 bg-white/15 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 outline-none focus:bg-white/25 transition-all backdrop-blur-md"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
                {REGULATION_CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setCategory(cat.key)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2 ${category === cat.key
                                ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Regulations list */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 py-12 text-center">
                        <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-bold">Không tìm thấy quy định phù hợp</p>
                    </div>
                ) : (
                    filtered.map(reg => {
                        const isExpanded = expandedId === reg.id;
                        return (
                            <div key={reg.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                {/* Header row */}
                                <div
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg uppercase">
                                                    {reg.number}
                                                </span>
                                                {reg.isNew && (
                                                    <span className="text-[8px] font-black text-white bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 rounded-full uppercase animate-pulse">
                                                        MỚI
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 leading-snug">{reg.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                                                <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {reg.issuedBy}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {reg.issuedDate}</span>
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                                        <div>
                                            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Tóm tắt</h4>
                                            <p className="text-xs text-gray-700 leading-relaxed">{reg.summary}</p>
                                        </div>

                                        <div>
                                            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nội dung chính</h4>
                                            <ul className="space-y-1.5">
                                                {reg.keyPoints.map((pt, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                                        <Star className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                                                        {pt}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {reg.supersedes && (
                                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                                <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                <p className="text-[10px] text-amber-800 font-medium">
                                                    <strong>Thay thế:</strong> {reg.supersedes}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                {REGULATION_CATEGORIES.find(c => c.key === reg.category)?.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RegulationLibrary;
