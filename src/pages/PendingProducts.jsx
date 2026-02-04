import React, { useState } from 'react';
import { Search, Clock, Trash2, Barcode, Filter } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

const PendingProducts = () => {
    const { products, deleteProduct, markQRGenerated } = useProduct();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('none'); // 'none', 'name', 'category'
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Treat 'Inactive' products as 'Pending'
    const pendingProducts = products
        .filter(product =>
            (product.status === 'Inactive' || product.status === 'Pending') &&
            (product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sn?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortOption === 'name') {
                return (a.productName || '').localeCompare(b.productName || '');
            } else if (sortOption === 'category') {
                return (a.category || '').localeCompare(b.category || '');
            }
            return 0;
        });

    return (
        <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="flex bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 items-center gap-2">
                    <Clock size={18} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">{pendingProducts.length} items awaiting action</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 shrink-0 z-20 relative">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search pending products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-light-blue-500 bg-white shadow-sm"
                    />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm min-w-[160px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Filter size={18} />
                            <span className="text-sm font-medium">
                                {sortOption === 'name' ? 'Name (A-Z)' : sortOption === 'category' ? 'Category (A-Z)' : 'Sort By'}
                            </span>
                        </div>
                    </button>

                    {isSortOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={() => { setSortOption('name'); setIsSortOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${sortOption === 'name' ? 'text-light-blue-600 font-medium bg-light-blue-50/50' : 'text-slate-600'}`}
                            >
                                Item Name (A-Z)
                            </button>
                            <button
                                onClick={() => { setSortOption('category'); setIsSortOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${sortOption === 'category' ? 'text-light-blue-600 font-medium bg-light-blue-50/50' : 'text-slate-600'}`}
                            >
                                Item Category (A-Z)
                            </button>
                            {sortOption !== 'none' && (
                                <button
                                    onClick={() => { setSortOption('none'); setIsSortOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
                                >
                                    Clear Sort
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Serial No</th>
                            <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Category</th>
                            <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Product Name</th>
                            <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200">Code / SKU</th>
                            <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200">Barcode</th>
                            <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200">Delete</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pendingProducts.length > 0 ? (
                            pendingProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-light-blue-700">{product.sn}</td>
                                    <td className="px-4 py-3 text-slate-600">{product.category}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium">{product.productName}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
                                        {product.sku || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => markQRGenerated(product.id)}
                                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                                                title="Generate Barcode"
                                            >
                                                <Barcode size={18} />
                                                <span className="text-xs font-medium">Generate</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Product"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                                    No pending products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PendingProducts;
