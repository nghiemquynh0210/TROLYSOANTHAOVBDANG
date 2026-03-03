import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmModal from './ConfirmModal';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'success' | 'info';
}

interface ConfirmContextType {
    showConfirm: (message: string, title?: string, type?: 'warning' | 'success' | 'info') => Promise<boolean>;
    showAlert: (message: string, title?: string, type?: 'warning' | 'success' | 'info') => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
    return ctx;
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<ConfirmOptions & { open: boolean; isAlert?: boolean }>({
        open: false,
        message: '',
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const showConfirm = useCallback((message: string, title?: string, type?: 'warning' | 'success' | 'info'): Promise<boolean> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setModalState({
                open: true,
                message,
                title,
                type: type || 'warning',
                isAlert: false,
            });
        });
    }, []);

    const showAlert = useCallback((message: string, title?: string, type?: 'warning' | 'success' | 'info'): Promise<void> => {
        return new Promise((resolve) => {
            resolveRef.current = () => { resolve(); return true; };
            setModalState({
                open: true,
                message,
                title,
                type: type || 'info',
                confirmText: 'OK',
                isAlert: true,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setModalState(prev => ({ ...prev, open: false }));
        resolveRef.current?.(true);
        resolveRef.current = null;
    }, []);

    const handleCancel = useCallback(() => {
        setModalState(prev => ({ ...prev, open: false }));
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    return (
        <ConfirmContext.Provider value={{ showConfirm, showAlert }}>
            {children}
            <ConfirmModal
                open={modalState.open}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.isAlert ? undefined : modalState.cancelText}
                type={modalState.type}
                onConfirm={handleConfirm}
                onCancel={modalState.isAlert ? handleConfirm : handleCancel}
            />
        </ConfirmContext.Provider>
    );
};
