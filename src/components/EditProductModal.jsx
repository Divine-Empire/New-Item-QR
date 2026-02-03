import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

const EditProductModal = ({ isOpen, onClose, product }) => {
    const { updateProduct } = useProduct();
    const [formData, setFormData] = useState({
        productName: '',
        sku: '',
    });

    // Initialize form with product data when modal opens
    useEffect(() => {
        if (product) {
            setFormData({
                productName: product.productName || '',
                sku: product.sku || '',
            });
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const updatedProduct = {
            ...product,
            productName: formData.productName,
            sku: formData.sku,
            updatedBy: 'admin',
            updatedDate: new Date().toISOString(),
        };

        updateProduct(updatedProduct);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
                    <h2 className="text-lg font-bold text-gray-800">Edit Product</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/80 rounded-full transition-colors text-gray-600 hover:text-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Serial Number (Read-only) */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700">
                                Serial Number
                            </label>
                            <input
                                type="text"
                                value={product.sn}
                                disabled
                                className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        {/* Product Name */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.productName}
                                onChange={(e) => handleChange('productName', e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        {/* Product Code (SKU) */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700">
                                Product Code (SKU)
                            </label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => handleChange('sku', e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="Enter product code"
                            />
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-product-form"
                        className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md font-medium shadow-sm transition-all hover:shadow-md"
                    >
                        Update Product
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
