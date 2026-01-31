import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className={`p-4 flex items-center justify-between ${isDanger ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100' : 'bg-slate-200'}`}>
                            <AlertTriangle size={18} className={isDanger ? 'text-red-600' : 'text-slate-600'} />
                        </div>
                        <h3 className="font-bold text-lg">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-full transition-colors ${isDanger ? 'hover:bg-red-100 text-red-500' : 'hover:bg-slate-200 text-slate-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-600 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all transform active:scale-95 ${isDanger
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
