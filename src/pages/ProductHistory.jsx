import React, { useState } from 'react';
import { Search, History as HistoryIcon, Download, CheckSquare, Square, Barcode as BarcodeIcon, Eye } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import QRCodeModal from '../components/QRCodeModal';

const ProductHistory = () => {
    const { products, markQRGenerated } = useProduct();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const filteredProducts = products
        .filter(product => product.qrGenerated)
        .filter(product =>
            product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.model?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.qrGeneratedDate || 0) - new Date(a.qrGeneratedDate || 0));

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

    const handleShowQR = (product) => {
        setSelectedProduct(product);
        setIsQRModalOpen(true);
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
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-light-blue-500 bg-white shadow-sm"
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

                    </div>
                </div>
            </div>

            {/* Table Container - Scrollable area */}
            <div className="flex-1 overflow-auto px-4 pb-6 md:px-6">
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

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                                <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200">Copies</th>
                                <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200">Time</th>
                                <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200 last:rounded-tr-xl">Action</th>
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
                                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                                {product.batchCount || 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-slate-500 font-medium">
                                            {product.qrGeneratedDate
                                                ? new Date(product.qrGeneratedDate).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleShowQR(product)}
                                                className="p-1.5 text-light-blue-600 hover:bg-light-blue-50 rounded-lg transition-colors border border-transparent hover:border-light-blue-100"
                                                title="View Barcode"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-4 py-20 text-center">
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    <div className="flex items-center justify-end px-1 mb-2">
                        <span className="text-xs text-slate-400">{filteredProducts.length} items</span>
                    </div>

                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 line-clamp-1">{product.productName}</h3>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{product.sku}</p>
                                    </div>
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                        {product.sn}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                    <div className="flex gap-3 text-xs text-slate-500">
                                        <div className="flex items-center gap-1" title="Copies">
                                            <span className="font-bold bg-slate-100 px-1.5 rounded">{product.batchCount || 1}</span>
                                            <span>copies</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Generated Time">
                                            <span>{product.qrGeneratedDate ? new Date(product.qrGeneratedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleShowQR(product)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-light-blue-600 bg-light-blue-50 px-3 py-1.5 rounded-lg active:bg-light-blue-100 ml-auto"
                                    >
                                        <Eye size={14} />
                                        View
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <HistoryIcon size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No history found</p>
                        </div>
                    )}
                </div>
            </div>

            <QRCodeModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                product={selectedProduct}
            />
        </div>
    );
};

export default ProductHistory;
