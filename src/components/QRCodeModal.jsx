import React from 'react';
import Barcode from 'react-barcode';
import { X, ExternalLink } from 'lucide-react';

const QRCodeModal = ({ isOpen, onClose, product }) => {
    if (!isOpen || !product) return null;

    // Create URL for the product view page
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/#/product/${product.sn}`;

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(productUrl);
        alert('URL copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-light-blue-600 to-light-blue-700 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Product Barcode</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center">
                    {/* Barcode (Line Barcode) */}
                    <div className="w-full bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-col items-center">
                        <p className="text-[10px] font-bold text-slate-800 text-center mb-2">
                            {product.sku} ({product.model || product.sku})
                        </p>
                        <Barcode
                            value={product.model || product.sku || product.sn}
                            format="CODE128"
                            width={1.5}
                            height={60}
                            displayValue={false}
                        />
                        <p className="text-[12px] font-black text-slate-900 text-center mt-2">
                            {product.model || product.sku}
                        </p>
                        <p className="text-[9px] text-center mt-2 font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-2 w-full">Line Barcode</p>
                    </div>

                    <div className="text-center mb-6">
                        <p className="font-bold text-xl text-slate-900 tracking-tight">{product.sn}</p>
                        <p className="text-sm text-slate-500 font-medium">{product.productName}</p>
                    </div>

                    {/* URL Display */}
                    <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Item URL:</p>
                        <div className="flex items-center gap-3">
                            <code className="text-[11px] text-light-blue-600 font-mono flex-1 truncate bg-white px-2 py-1 rounded border border-light-blue-100">{productUrl}</code>
                            <button
                                onClick={handleCopyUrl}
                                className="bg-white text-slate-400 hover:text-light-blue-600 p-2 rounded-lg border border-slate-200 hover:border-light-blue-200 transition-all shadow-sm hover:shadow"
                                title="Copy URL"
                            >
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-center gap-2 border-t border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Active & Ready to Scan
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
