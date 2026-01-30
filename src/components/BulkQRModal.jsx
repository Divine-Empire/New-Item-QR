import React, { useState } from 'react';
import Barcode from 'react-barcode';
import { X, CheckCircle, AlertCircle, Barcode as BarcodeIcon } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

const BulkQRModal = ({ isOpen, onClose, products, onComplete }) => {
    const { markQRGenerated } = useProduct();

    if (!isOpen) return null;

    const handleRegister = () => {
        products.forEach(product => {
            markQRGenerated(product.id);
        });
        if (onComplete) {
            onComplete();
        }
        onClose(); // Close immediately after registration
    };

    const handleClose = () => {
        onClose();
    };

    const generatedCount = products.filter(p => p.qrGenerated).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <BarcodeIcon size={24} className="text-light-blue-400" />
                        <div>
                            <h2 className="text-lg font-bold">
                                {products.length === 0 ? 'No Products Selected' : 'Register Barcodes'}
                            </h2>
                            <p className="text-white/60 text-sm">
                                {products.length} {products.length === 1 ? 'product' : 'products'} in batch
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white/40 hover:text-white p-2 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {products.map((product) => (
                                <div key={product.id} className={`bg-white p-4 rounded-xl border transition-all relative ${product.qrGenerated ? 'border-green-200 bg-green-50/10' : 'border-slate-200'
                                    } text-center group`}>
                                    <div className="relative mx-auto w-fit space-y-2">
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-[7px] font-bold text-slate-800 text-center truncate w-full">
                                                {product.sku} ({product.model || product.sku})
                                            </p>
                                            <Barcode
                                                value={product.model || product.sku || product.sn}
                                                format="CODE128"
                                                width={0.8}
                                                height={40}
                                                displayValue={false}
                                            />
                                            <p className="text-[9px] font-black text-slate-900 text-center">
                                                {product.model || product.sku}
                                            </p>
                                        </div>

                                        {product.qrGenerated && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <CheckCircle size={32} className="text-green-600 bg-white rounded-full p-1 shadow-sm" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-bold text-slate-900 text-[10px] mt-4 truncate">{product.sn}</p>
                                    <p className="text-slate-500 text-[9px] truncate">{product.productName}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    {generatedCount > 0 && (
                        <div className="flex items-center gap-2 justify-center mb-4 text-amber-600 bg-amber-50/50 py-2 px-4 rounded-lg border border-amber-100 text-xs font-semibold">
                            <AlertCircle size={14} />
                            {generatedCount} products already exist in history
                        </div>
                    )}
                    <button
                        onClick={handleRegister}
                        className="w-full bg-light-blue-600 hover:bg-light-blue-700 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl shadow-light-blue-100 hover:-translate-y-0.5"
                    >
                        <BarcodeIcon size={20} />
                        Register & View in History
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-3 uppercase tracking-widest font-black">
                        DOWNLOADS ARE ENABLED ONLY IN THE HISTORY TAB
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BulkQRModal;
