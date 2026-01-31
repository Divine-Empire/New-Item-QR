import React, { useState } from 'react';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import { X, CheckCircle, AlertCircle, Barcode as BarcodeIcon, Download, Printer } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

const BulkQRModal = ({ isOpen, onClose, products, onComplete }) => {
    const { markQRGenerated, markBulkQRGenerated } = useProduct();

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

    const handleDownloadAndRegister = async () => {
        if (products.length === 0) return;
        setIsGenerating(true);

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 15;
            const cols = 4;
            const rowGap = 20;
            const colGap = 5;

            let currentCol = 0;
            let yOffset = margin + 20;

            // Header
            pdf.setFontSize(16);
            pdf.text("Product Barcodes", pageWidth / 2, margin + 5, { align: 'center' });

            // Flatten products based on individual counts
            const expandedProducts = [];
            products.forEach(p => {
                const count = Number(counts[p.id]) || 1;
                for (let i = 0; i < count; i++) {
                    expandedProducts.push(p);
                }
            });

            for (const product of expandedProducts) {
                // We access the DOM element for the *unique* product ID
                // Since duplicates can't share IDs in DOM, we grab the source unique element's SVG
                const elementId = `barcode-modal-${product.id}`;
                const hiddenContainer = document.getElementById(elementId);

                // Fallback if not found (shouldn't happen if rendered)
                if (!hiddenContainer) continue;

                const targetElement = hiddenContainer.querySelector('svg');
                if (!targetElement) continue;

                const svgData = new XMLSerializer().serializeToString(targetElement);
                const img = new Image();

                await new Promise(resolve => {
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 600;
                        canvas.height = 300;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        const imgWidth = canvas.width;
                        const imgHeight = (img.height / img.width) * imgWidth;
                        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

                        const imgData = canvas.toDataURL('image/png');
                        const colWidth = (pageWidth - 2 * margin - (cols - 1) * colGap) / cols;
                        const xPos = margin + currentCol * (colWidth + colGap);

                        const drawWidth = colWidth - 8;
                        const drawHeight = 20;
                        const drawX = xPos + (colWidth - drawWidth) / 2;
                        const unitHeight = drawHeight + 15;

                        if (yOffset + unitHeight > pageHeight - margin) {
                            pdf.addPage();
                            yOffset = margin + 20;
                            currentCol = 0;
                        }

                        pdf.addImage(imgData, 'PNG', drawX, yOffset, drawWidth, drawHeight);

                        // Top text: SKU (Label)
                        pdf.setFontSize(6);
                        const topLabel = `${product.sku} (${product.model || product.sku})`;
                        pdf.text(topLabel, xPos + colWidth / 2, yOffset - 2, { align: 'center', maxWidth: colWidth - 2 });

                        // Bottom text: just the Label
                        pdf.setFontSize(7);
                        pdf.setFont(undefined, 'bold');
                        pdf.text(product.model || product.sku, xPos + colWidth / 2, yOffset + drawHeight + 4, { align: 'center' });
                        pdf.setFont(undefined, 'normal');

                        currentCol++;
                        if (currentCol >= cols) {
                            currentCol = 0;
                            yOffset += unitHeight + 10;
                        }
                        resolve();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                });
            }

            pdf.save(`barcodes-batch-${Date.now()}.pdf`);

            // Mark all unique products as generated with their specific counts
            const updates = products.map(p => ({
                id: p.id,
                count: Number(counts[p.id]) || 1
            }));

            markBulkQRGenerated(updates);

            if (onComplete) {
                onComplete();
            }
            onClose();

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
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
                                {products.length === 0 ? 'No Products Selected' : 'Generate & Download Barcodes'}
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
                                    <p className="text-sm text-slate-500">Set quantity for ALL or adjust individually below</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-slate-700">Set All To:</label>
                                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden w-32">
                                    <button
                                        onClick={() => handleGlobalBatchChange(batchCount - 1)}
                                        className="px-3 py-2 hover:bg-slate-100 border-r border-slate-300 text-slate-600 transition-colors"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={batchCount}
                                        onChange={(e) => handleGlobalBatchChange(e.target.value)}
                                        className="w-full text-center focus:outline-none font-bold text-slate-800"
                                    />
                                    <button
                                        onClick={() => handleGlobalBatchChange(batchCount + 1)}
                                        className="px-3 py-2 hover:bg-slate-100 border-l border-slate-300 text-slate-600 transition-colors"
                                    >
                                        +
                                    </button>
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
                        onClick={handleDownloadAndRegister}
                        disabled={isGenerating}
                        className={`w-full bg-light-blue-600 hover:bg-light-blue-700 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl shadow-light-blue-100 hover:-translate-y-0.5 ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Download Barcodes ({totalBarcodes})
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-3 uppercase tracking-widest font-black">
                        Downloaded products will move to History
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BulkQRModal;
