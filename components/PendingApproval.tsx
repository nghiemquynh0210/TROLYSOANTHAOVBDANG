import React from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { signOut } from '../services/authService';

interface Props {
    email: string;
    onRefresh: () => void;
}

const PendingApproval: React.FC<Props> = ({ email, onRefresh }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4 text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-2xl shadow-amber-500/30 mb-6 border border-amber-400/20">
                    <Clock className="w-12 h-12 text-white animate-pulse" />
                </div>

                {/* Content Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                        <h1 className="text-xl font-black text-white tracking-tight">
                            Chờ phê duyệt
                        </h1>
                    </div>

                    <p className="text-sm text-white/60 mb-6 leading-relaxed">
                        Tài khoản <span className="text-amber-400 font-bold">{email}</span> đã đăng ký thành công.
                        <br />Vui lòng chờ <span className="text-white font-semibold">quản trị viên</span> phê duyệt để sử dụng hệ thống.
                    </p>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
                        <p className="text-[11px] text-amber-300 font-medium">
                            ⏳ Thông thường tài khoản sẽ được phê duyệt trong vòng 24 giờ
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onRefresh}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all active:scale-95 border border-white/10"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Kiểm tra lại
                        </button>
                        <button
                            onClick={() => signOut()}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-xl font-bold text-sm transition-all active:scale-95 border border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất
                        </button>
                    </div>
                </div>

                <p className="text-[10px] text-white/30 mt-6">
                    © 2026 Trợ lý Bí thư Chi bộ
                </p>
            </div>
        </div>
    );
};

export default PendingApproval;
