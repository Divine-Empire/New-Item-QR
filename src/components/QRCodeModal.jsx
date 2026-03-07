import React from "react";
import Barcode from "react-barcode";
import { X, Printer } from "lucide-react";

const QRCodeModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  const qty = product.batchCount || 1;

  const handlePrint = () => {
    const barcodeElement = document.getElementById(
      `history-barcode-${product.id}`,
    );
    if (!barcodeElement) return;

    const svg = barcodeElement.querySelector("svg");
    if (!svg) return;

    const svgContent = new XMLSerializer().serializeToString(svg);
    const pages = [];
    const itemsPerPage = 1; // Thermal roll printer size

    // Create an array of items based on quantity
    const itemsToPrint = Array(qty).fill({
      ...product,
      svg: svgContent,
    });

    // Chunk into pages
    for (let i = 0; i < itemsToPrint.length; i += itemsPerPage) {
      pages.push(itemsToPrint.slice(i, i + itemsPerPage));
    }

    const printWindow = window.open("", "", "width=900,height=800");
    if (!printWindow) {
      alert("Pop-up blocked. Please allow pop-ups to print.");
      return;
    }

    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Barcodes</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                    
                    @page { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        size: 55mm 35mm; 
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    html, body { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        background: white; 
                        font-family: 'Inter', sans-serif;
                        width: 100%;
                        height: 100%;
                    }
                    .page { 
                        background: white; 
                        width: 100%; 
                        height: 100%; 
                        margin: 0; 
                        padding: 2mm 3mm; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        page-break-after: always;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                    .sku {
                        font-size: 10px;
                        font-weight: 900;
                        margin-bottom: 2px;
                        width: 100%;
                        text-align: center;
                        line-height: 1.2;
                        flex-shrink: 0;
                        word-break: break-word;
                    }
                    svg {
                        max-width: 100% !important;
                        height: 16mm !important;
                        display: block;
                        margin: 0 auto;
                        flex-shrink: 0;
                        object-fit: contain;
                        flex-grow: 1;
                    }
                    .caption {
                        font-size: 11px;
                        font-weight: 900;
                        margin-top: 2px;
                        flex-shrink: 0;
                        line-height: 1;
                    }
                    @media print { 
                        html, body { 
                            background: white !important; 
                            width: 55mm !important; 
                            height: 35mm !important; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                        } 
                        .page { 
                            margin: 0 !important; 
                            padding: 2mm !important; 
                            box-shadow: none; 
                            border: none; 
                            width: 55mm !important; 
                            height: 35mm !important; 
                        }
                    }
                </style>
            </head>
            <body>
                ${pages
        .map(
          (pageItems) => `
                    ${pageItems
              .map(
                (item) => `
                        <div class="page">
                            <div class="sku">${item.productName}</div>
                            ${item.svg}
                            <div class="caption">${item.sku || item.sn}</div>
                        </div>
                    `,
              )
              .join("")}
                `,
        )
        .join("")}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-light-blue-600 to-light-blue-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Product Barcode</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center">
          {/* Barcode (Line Barcode) */}
          <div
            id={`history-barcode-${product.id}`}
            className="w-full bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-col items-center"
          >
            <p className="text-[10px] font-bold text-slate-800 text-center mb-1">
              {product.sku} ({product.model || product.sku})
            </p>
            <Barcode
              value={product.sku || product.sn}
              format="CODE128"
              width={1.5}
              height={50}
              margin={0}
              displayValue={false}
            />
            <p className="text-[12px] font-black text-slate-900 text-center mt-1">
              {product.sku || product.sn}
            </p>
            <p className="text-[9px] text-center mt-2 font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-2 w-full">
              Line Barcode
            </p>
          </div>

          <div className="text-center mb-6">
            <p className="font-bold text-xl text-slate-900 tracking-tight">
              {product.sn}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              {product.productName}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-50 inline-block px-2 py-1 rounded">
              Quantity: {qty}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-center border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="w-full bg-light-blue-600 hover:bg-light-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <Printer size={18} />
            Print Barcodes ({qty})
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
