import React, { useState } from 'react';
import { Search, History as HistoryIcon, Download, CheckSquare, Square, Barcode as BarcodeIcon } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';

const ProductHistory = () => {
    const { products, markQRGenerated } = useProduct();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const filteredProducts = products.filter(product =>
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const downloadable = filteredProducts.filter(p => !p.qrGenerated);
        if (selectedIds.length === downloadable.length && downloadable.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(downloadable.map(p => p.id));
        }
    };

    const handleBulkDownload = async () => {
        if (selectedIds.length === 0) return;

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

        for (const id of selectedIds) {
            const product = products.find(p => p.id === id);
            if (!product) continue;

            const elementId = `barcode-hidden-${product.id}`;
            const hiddenContainer = document.getElementById(elementId);
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

                    markQRGenerated(product.id);
                    resolve();
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });
        }

        pdf.save('product-barcodes.pdf');
        setSelectedIds([]);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar - Fixed Action at Top */}
            <div className="sticky top-0 z-30 bg-slate-50 p-6 pb-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-100 focus:outline-none focus:ring-2 focus:ring-light-blue-500 bg-slate-50 text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in zoom-in duration-200">
                                <span className="text-xs font-bold text-slate-600 truncate">{selectedIds.length} Selected</span>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 ml-2 border-l border-slate-200 pl-2 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                        <button
                            onClick={handleBulkDownload}
                            disabled={selectedIds.length === 0}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${selectedIds.length > 0
                                ? 'bg-light-blue-600 text-white shadow-lg shadow-light-blue-100 hover:bg-light-blue-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                        >
                            <Download size={18} />
                            Download Barcodes
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Container - Scrollable area */}
            <div className="flex-1 overflow-auto px-6 pb-6">
                {/* Hidden Assets for PDF Generation */}
                <div className="hidden">
                    {products.map(p => (
                        <div key={`assets-${p.id}`} id={`barcode-hidden-${p.id}`}>
                            <Barcode
                                value={p.model || p.sku || p.sn}
                                format="CODE128"
                                width={2}
                                height={100}
                                displayValue={false}
                            />
                        </div>
                    ))}
                </div>

                {/* Table View */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20 text-slate-700 font-semibold shadow-sm">
                            <tr>
                                <th className="w-12 px-4 py-3 bg-slate-50 border-b border-slate-200 first:rounded-tl-xl">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-slate-400 hover:text-light-blue-600 transition-colors"
                                    >
                                        {selectedIds.length > 0 && selectedIds.length === filteredProducts.filter(p => !p.qrGenerated).length ? (
                                            <CheckSquare size={20} className="text-light-blue-600" />
                                        ) : (
                                            <Square size={20} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Serial No</th>
                                <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Product Name</th>
                                <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Code / SKU</th>
                                <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200 last:rounded-tr-xl">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(product.id) ? 'bg-light-blue-50/30' : ''}`}>
                                        <td className="px-4 py-3">
                                            {!product.qrGenerated ? (
                                                <button
                                                    onClick={() => toggleSelect(product.id)}
                                                    className="text-slate-400 hover:text-light-blue-600 transition-colors"
                                                >
                                                    {selectedIds.includes(product.id) ? (
                                                        <CheckSquare size={20} className="text-light-blue-600" />
                                                    ) : (
                                                        <Square size={20} />
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="w-5 h-5 flex items-center justify-center text-green-600 opacity-20">
                                                    <HistoryIcon size={18} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-light-blue-700">{product.sn}</td>
                                        <td className="px-4 py-3 text-slate-900 font-medium">{product.productName}</td>
                                        <td className="px-4 py-3 text-slate-600 text-[10px] uppercase tracking-wider">{product.sku}</td>
                                        <td className="px-4 py-3 text-center">
                                            {product.qrGenerated ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Generated
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <HistoryIcon size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium">No results found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductHistory;
