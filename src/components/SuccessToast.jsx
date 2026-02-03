import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const SuccessToast = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 duration-300">
            <div className="bg-white rounded-lg shadow-2xl border border-green-200 p-4 flex items-center gap-3 min-w-[300px]">
                <div className="flex-shrink-0">
                    <CheckCircle size={24} className="text-green-600" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default SuccessToast;
