import React, { useState } from 'react';
import Barcode from 'react-barcode';
import { X, CheckCircle, AlertCircle, Barcode as BarcodeIcon, Printer } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

const BulkQRModal = ({ isOpen, onClose, products, onComplete }) => {
    const { markBulkQRGenerated } = useProduct();
    const { user } = useAuth(); // Get logged-in user

    const [batchCount, setBatchCount] = useState(1); // Global "Set All" value
    const [counts, setCounts] = useState({}); // Individual counts
    const [isGenerating, setIsGenerating] = useState(false);

    // Initialize individual counts when products change or modal opens
    React.useEffect(() => {
        if (isOpen && products.length > 0) {
            const initialCounts = {};
            products.forEach(p => {
                initialCounts[p.id] = 1;
            });
            setCounts(initialCounts);
            setBatchCount(1);
        }
    }, [isOpen, products]);

    // Update all counts when global batch count changes
    const handleGlobalBatchChange = (value) => {
        const newVal = Math.max(1, Math.min(100, Number(value) || 1));
        setBatchCount(newVal);

        const newCounts = {};
        products.forEach(p => {
            newCounts[p.id] = newVal;
        });
        setCounts(newCounts);
    };

    const handleIndividualCountChange = (id, delta) => {
        setCounts(prev => ({
            ...prev,
            [id]: Math.max(1, Math.min(100, (Number(prev[id]) || 1) + delta))
        }));
    };

    const handleIndividualInput = (id, val) => {
        if (val === '') {
            setCounts(prev => ({ ...prev, [id]: '' }));
        } else {
            setCounts(prev => ({ ...prev, [id]: parseInt(val) }));
        }
    };

    const handleIndividualBlur = (id) => {
        setCounts(prev => {
            let val = Number(prev[id]);
            if (!val || val < 1) val = 1;
            if (val > 100) val = 100;
            return { ...prev, [id]: val };
        });
    };

    if (!isOpen) return null;

    const handlePrint = async () => {
        if (products.length === 0) return;
        setIsGenerating(true);

        try {
            // Flatten products based on individual counts
            const expandedProducts = [];
            products.forEach(p => {
                const count = Number(counts[p.id]) || 1;
                for (let i = 0; i < count; i++) {
                    expandedProducts.push(p);
                }
            });

            const itemsToPrint = [];

            // extract SVG content for each unique product first to save DOM access
            const productSvgs = {};
            for (const p of products) {
                const elementId = `barcode-modal-${p.id}`;
                const container = document.getElementById(elementId);
                if (container) {
                    const svg = container.querySelector('svg');
                    if (svg) {
                        // Clone the SVG node to ensure we get a clean copy
                        productSvgs[p.id] = svg.outerHTML;
                    }
                }
            }

            // Build print content
            for (const product of expandedProducts) {
                const svgContent = productSvgs[product.id];
                if (svgContent) {
                    itemsToPrint.push({
                        ...product,
                        svg: svgContent
                    });
                }
            }

            // Chunk items into pages of 40
            const pages = [];
            const itemsPerPage = 40;
            for (let i = 0; i < itemsToPrint.length; i += itemsPerPage) {
                pages.push(itemsToPrint.slice(i, i + itemsPerPage));
            }

            // Create print window
            const printWindow = window.open('', '', 'width=900,height=800');
            if (!printWindow) {
                alert('Pop-up blocked. Please allow pop-ups to print.');
                setIsGenerating(false);
                return;
            }

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print Barcodes</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                        
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: #f0f0f0; 
                            font-family: 'Inter', sans-serif;
                        }
                        .page { 
                            background: white; 
                            width: 210mm; 
                            height: 297mm; 
                            margin: 10mm auto; 
                            padding: 5mm; 
                            box-sizing: border-box; 
                            display: grid; 
                            grid-template-columns: repeat(4, 1fr); 
                            grid-template-rows: repeat(10, 1fr); 
                            gap: 0px; 
                            page-break-after: always;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        .cell { 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            padding: 2px;
                            overflow: hidden;
                        }
                        .sku {
                            font-size: 8px;
                            font-weight: 900;
                            margin-bottom: 2px;
                            width: 100%;
                            text-align: center;
                            line-height: 1.1;
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            word-break: break-word;
                        }
                        svg {
                            max-width: 100%;
                            height: 50px !important;
                            width: auto !important;
                            display: block;
                            margin: 0 auto;
                        }
                        .caption {
                            font-size: 10px;
                            font-weight: 800;
                            margin-top: 2px;
                            line-height: 1;
                        }
                        @media print { 
                            body { background: white; } 
                            .page { margin: 0; box-shadow: none; border: none; }
                            @page { margin: 0; size: A4; }
                        }
                    </style>
                </head>
                <body>
                    ${pages.map(pageItems => `
                        <div class="page">
                            ${pageItems.map(item => `
                                <div class="cell">
                                    <div class="sku">${item.productName}</div>
                                    ${item.svg}
                                    <div class="caption">${item.sku || item.sn}</div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 500);
                        }
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Register generation in background
            const generatedByName = user?.name || user?.id || 'Unknown';
            const updates = products.map(p => ({
                id: p.id,
                sn: p.sn,
                count: Number(counts[p.id]) || 1,
                generatedBy: generatedByName
            }));

            markBulkQRGenerated(updates);

            if (onComplete) {
                onComplete();
            }
            onClose();

        } catch (error) {
            console.error("Error printing:", error);
            alert("Failed to print. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClose = () => {
        if (!isGenerating) onClose();
    };

    const generatedCount = products.filter(p => p.qrGenerated).length;

    // Calculate total barcodes to be generated
    const totalBarcodes = products.reduce((acc, p) => acc + (Number(counts[p.id]) || 1), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <BarcodeIcon size={24} className="text-light-blue-400" />
                        <div>
                            <h2 className="text-lg font-bold">
                                {products.length === 0 ? 'No Products Selected' : 'Print Barcodes'}
                            </h2>
                            <p className="text-white/60 text-sm">
                                {products.length} {products.length === 1 ? 'product' : 'products'} selected
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white/40 hover:text-white p-2 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">

                    {/* Batch Settings */}
                    {products.length > 0 && (
                        <div className="mb-8 bg-white p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Printer size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Print Settings</h3>
                                    <p className="text-sm text-slate-500">Adjust quantity individually below using +/- buttons</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Preview ({products.length} items × variable copies = {totalBarcodes} total)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {products.map((product) => (
                                <div key={product.id} className={`bg-white p-4 rounded-xl border transition-all relative ${product.qrGenerated ? 'border-green-200 bg-green-50/10' : 'border-slate-200'
                                    } text-center group`} id={`barcode-modal-${product.id}`}>
                                    <div className="relative mx-auto w-fit space-y-2">
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-[7px] font-bold text-slate-800 text-center truncate w-full">
                                                {product.sku} ({product.model || product.sku})
                                            </p>
                                            <Barcode
                                                value={product.sku || product.sn}
                                                format="CODE128"
                                                width={0.8}
                                                height={40}
                                                displayValue={false}
                                            />
                                            <p className="text-[9px] font-black text-slate-900 text-center">
                                                {product.sku || product.sn}
                                            </p>
                                        </div>

                                        {product.qrGenerated && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <CheckCircle size={32} className="text-green-600 bg-white rounded-full p-1 shadow-sm" />
                                            </div>
                                        )}

                                        {/* Individual Quantity Control */}
                                        <div className="absolute -top-3 -right-3 z-10 flex items-center bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden scale-90">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleIndividualCountChange(product.id, -1); }}
                                                className="px-2 py-1 hover:bg-slate-100 border-r border-slate-200 text-slate-600 text-xs font-bold"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={counts[product.id] === undefined ? 1 : counts[product.id]}
                                                onChange={(e) => handleIndividualInput(product.id, e.target.value)}
                                                onBlur={() => handleIndividualBlur(product.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-10 text-center text-xs font-bold text-blue-600 focus:outline-none focus:bg-slate-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleIndividualCountChange(product.id, 1); }}
                                                className="px-2 py-1 hover:bg-slate-100 border-l border-slate-200 text-slate-600 text-xs font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
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
                        onClick={handlePrint}
                        disabled={isGenerating}
                        className={`w-full bg-light-blue-600 hover:bg-light-blue-700 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl shadow-light-blue-100 hover:-translate-y-0.5 ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Printer size={20} />
                                Print Barcodes ({totalBarcodes})
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-3 uppercase tracking-widest font-black">
                        Printed products will move to History
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BulkQRModal;
