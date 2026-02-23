import React, { useState } from 'react';
import {
    ShieldCheck, Mail, Lock, User, Eye, EyeOff,
    LogIn, UserPlus, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { signIn, signUp } from '../services/authService';

interface Props {
    onAuthSuccess: () => void;
}

const AuthPage: React.FC<Props> = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                await signIn(email, password);
                onAuthSuccess();
            } else {
                if (password.length < 6) {
                    throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
                }
                await signUp(email, password, fullName);
                setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
                setMode('login');
            }
        } catch (err: any) {
            const msg = err?.message || 'Đã xảy ra lỗi';
            if (msg.includes('Invalid login')) {
                setError('Email hoặc mật khẩu không đúng');
            } else if (msg.includes('already registered')) {
                setError('Email này đã được đăng ký');
            } else if (msg.includes('valid email')) {
                setError('Vui lòng nhập email hợp lệ');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-800/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl shadow-red-500/30 mb-4 border border-red-500/20">
                        <ShieldCheck className="w-10 h-10 text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
                        Trợ lý Bí thư Chi bộ
                    </h1>
                    <p className="text-sm text-white/50 font-medium">
                        Hệ thống Soạn thảo Văn bản Đảng
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* Tab Switcher */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${mode === 'login'
                                    ? 'text-white bg-white/10 border-b-2 border-yellow-500'
                                    : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            <LogIn className="w-4 h-4" />
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${mode === 'register'
                                    ? 'text-white bg-white/10 border-b-2 border-yellow-500'
                                    : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Đăng ký
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Success message */}
                        {success && (
                            <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-green-300">{success}</p>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Full name (register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                    Họ và tên
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {mode === 'register' && (
                                <p className="text-[10px] text-white/30 mt-1.5 ml-1">Tối thiểu 6 ký tự</p>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] border border-red-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : mode === 'login' ? (
                                <LogIn className="w-4 h-4" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-[10px] text-white/30">
                        © 2026 Trợ lý Bí thư Chi bộ • Phát triển bởi AI
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
