import React, { useState } from 'react';
import { Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

const PendingProducts = () => {
    const { products } = useProduct();
    const [searchTerm, setSearchTerm] = useState('');

    // Treat 'Inactive' products as 'Pending'
    const pendingProducts = products.filter(product =>
        (product.status === 'Inactive' || product.status === 'Pending') &&
        (product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sn?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="flex bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 items-center gap-2">
                    <Clock size={18} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">{pendingProducts.length} items awaiting action</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
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
            </div>

            {/* Desktop Table View */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Serial No</th>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3 text-center">Date Added</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pendingProducts.length > 0 ? (
                            pendingProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-light-blue-700">{product.sn}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium">{product.productName}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">
                                        {product.assetDate || '2025-01-01'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            Pending
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-4 py-12 text-center text-slate-500">
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
