import React, { useState, useEffect } from 'react';
import {
    Users, ShieldCheck, ShieldX, UserCheck, UserX,
    Crown, Loader2, RefreshCw, Search, ArrowLeft, Trash2
} from 'lucide-react';
import { getAllProfiles, approveUser, rejectUser, setUserRole, deleteUserProfile, type UserProfile } from '../services/userProfileService';
import { useConfirm } from './ConfirmProvider';

interface Props {
    onBack: () => void;
}

const AdminApproval: React.FC<Props> = ({ onBack }) => {
    const { showConfirm } = useConfirm();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [search, setSearch] = useState('');

    const loadProfiles = async () => {
        setLoading(true);
        const data = await getAllProfiles();
        setProfiles(data);
        setLoading(false);
    };

    useEffect(() => { loadProfiles(); }, []);

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        await approveUser(userId);
        await loadProfiles();
        setActionLoading(null);
    };

    const handleReject = async (userId: string) => {
        if (!(await showConfirm('Bạn có chắc muốn từ chối/thu hồi tài khoản này?', 'Thu hồi tài khoản', 'warning'))) return;
        setActionLoading(userId);
        await rejectUser(userId);
        await loadProfiles();
        setActionLoading(null);
    };

    const handleToggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (newRole === 'admin' && !(await showConfirm('Cấp quyền Admin cho tài khoản này?', 'Cấp quyền Admin', 'warning'))) return;
        setActionLoading(userId);
        await setUserRole(userId, newRole);
        await loadProfiles();
        setActionLoading(null);
    };

    const handleDelete = async (userId: string) => {
        if (!(await showConfirm('Xóa tài khoản này? Hành động không thể hoàn tác!', 'Xóa tài khoản', 'warning'))) return;
        setActionLoading(userId);
        await deleteUserProfile(userId);
        await loadProfiles();
        setActionLoading(null);
    };

    const filtered = profiles.filter(p => {
        if (filter === 'pending' && p.approved) return false;
        if (filter === 'approved' && !p.approved) return false;
        if (search) {
            const q = search.toLowerCase();
            return p.email.toLowerCase().includes(q) || (p.full_name || '').toLowerCase().includes(q);
        }
        return true;
    });

    const pendingCount = profiles.filter(p => !p.approved).length;

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Quản lý Tài khoản
                    </h1>
                    <p className="text-xs text-gray-500">
                        {profiles.length} tài khoản • {pendingCount} chờ phê duyệt
                    </p>
                </div>
                <button
                    onClick={loadProfiles}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {([
                        { key: 'all', label: 'Tất cả' },
                        { key: 'pending', label: `Chờ duyệt (${pendingCount})` },
                        { key: 'approved', label: 'Đã duyệt' }
                    ] as const).map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.key
                                ? 'bg-white shadow text-gray-800'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm email hoặc họ tên..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold">Không có tài khoản nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Người dùng</th>
                                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Vai trò</th>
                                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Trạng thái</th>
                                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ngày ĐK</th>
                                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(profile => (
                                <tr key={profile.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-gray-800">{profile.full_name || '—'}</p>
                                        <p className="text-[11px] text-gray-500">{profile.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${profile.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {profile.role === 'admin' && <Crown className="w-3 h-3" />}
                                            {profile.role === 'admin' ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {profile.approved ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                                <ShieldCheck className="w-3 h-3" />
                                                Đã duyệt
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                                                <ShieldX className="w-3 h-3" />
                                                Chờ duyệt
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-[11px] text-gray-500">
                                        {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {actionLoading === profile.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                            ) : (
                                                <>
                                                    {!profile.approved ? (
                                                        <button
                                                            onClick={() => handleApprove(profile.id)}
                                                            className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-all"
                                                            title="Phê duyệt"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReject(profile.id)}
                                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                                                            title="Thu hồi"
                                                        >
                                                            <UserX className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleRole(profile.id, profile.role)}
                                                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-all"
                                                        title={profile.role === 'admin' ? 'Hạ quyền' : 'Nâng Admin'}
                                                    >
                                                        <Crown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(profile.id)}
                                                        className="p-1.5 bg-gray-50 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                                                        title="Xóa tài khoản"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminApproval;
