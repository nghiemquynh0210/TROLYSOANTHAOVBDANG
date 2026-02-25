import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'success' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open, title, message, confirmText = 'Xác nhận', cancelText = 'Hủy',
    type = 'warning', onConfirm, onCancel
}) => {
    if (!open) return null;

    const colors = {
        warning: {
            bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500',
            btn: 'bg-amber-600 hover:bg-amber-700', iconBg: 'bg-amber-100'
        },
        success: {
            bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500',
            btn: 'bg-green-600 hover:bg-green-700', iconBg: 'bg-green-100'
        },
        info: {
            bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500',
            btn: 'bg-blue-600 hover:bg-blue-700', iconBg: 'bg-blue-100'
        }
    }[type];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className={`relative w-full max-w-sm ${colors.bg} ${colors.border} border-2 rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]`}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-4 h-4" />
                </button>

                <div className="p-6 text-center space-y-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto`}>
                        {type === 'success'
                            ? <CheckCircle2 className={`w-6 h-6 ${colors.icon}`} />
                            : <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
                        }
                    </div>

                    {/* Title */}
                    {title && (
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">{title}</h3>
                    )}

                    {/* Message */}
                    <p className="text-xs text-gray-600 leading-relaxed">{message}</p>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2.5 ${colors.btn} text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ConfirmModal;
