import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

const AddProductModal = ({ isOpen, onClose }) => {
    const { addProduct, products } = useProduct();
    const [formData, setFormData] = useState({
        productName: '',
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [error, setError] = useState('');
    const dropdownRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleProductNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, productName: value }));

        // When user types, we keep the dropdown open to show matching suggestions
        if (value.trim()) {
            const filtered = products
                .filter(p => p.productName?.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 100); // Show up to 100 filtered suggestions
            setFilteredProducts(filtered);
            setShowDropdown(true);
        } else {
            setFilteredProducts(products.slice(0, 100)); // Show all 100 products
            setShowDropdown(true);
        }
    };

    const handleInputFocus = () => {
        if (!formData.productName.trim()) {
            setFilteredProducts(products.slice(0, 100));
        } else {
            const filtered = products
                .filter(p => p.productName?.toLowerCase().includes(formData.productName.toLowerCase()))
                .slice(0, 100);
            setFilteredProducts(filtered);
        }
        setShowDropdown(true);
    };

    const handleToggleProduct = (product) => {
        setSelectedIds(prev => {
            if (prev.includes(product.id)) {
                return prev.filter(id => id !== product.id);
            } else {
                return [...prev, product.id];
            }
        });
        // We stay in the dropdown to allow multiple selections
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate
        if (!formData.productName.trim() && selectedIds.length === 0) {
            setError('Please enter a product name or select from suggestions');
            return;
        }

        // If items are selected from suggestions, add those with ALL their attributes
        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                const product = products.find(p => p.id === id);
                if (product) {
                    // Pass the whole product object (it will get its own id and sn in addProduct)
                    addProduct({ ...product });
                }
            });
        } else if (formData.productName.trim()) {
            // Otherwise add just the name as a basic product
            addProduct({ productName: formData.productName });
        }

        // Reset form
        setFormData({ productName: '' });
        setSelectedIds([]);
        setFilteredProducts([]);
        setShowDropdown(false);
        setError('');
        onClose();
    };

    const handleClose = () => {
        setFormData({ productName: '' });
        setSelectedIds([]);
        setFilteredProducts([]);
        setShowDropdown(false);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    // ... (rest of functions)

    const selectedCount = selectedIds.length;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                    <h2 className="text-lg font-bold text-gray-800">Add Product</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-white/80 rounded-full transition-colors text-gray-600 hover:text-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex flex-col items-center">
                                {error}
                            </div>
                        )}

                        {/* Product Name with Dropdown */}
                        <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                            <label className="text-xs font-semibold text-gray-700">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.productName}
                                    onChange={handleProductNameChange}
                                    onFocus={handleInputFocus}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder={selectedCount > 0 ? "" : "Search or select product name..."}
                                    required={selectedCount === 0}
                                    autoComplete="off"
                                />

                                {/* Dropdown with existing products */}
                                {showDropdown && filteredProducts.length > 0 && (
                                    <div className="absolute z-10 w-full mb-1 bottom-full bg-white border border-gray-300 rounded-md shadow-xl max-h-64 overflow-y-auto">
                                        <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 z-10 flex justify-between items-center">
                                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                                                Suggestions
                                            </span>
                                            {selectedCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedIds([])}
                                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                        <div className="py-1">
                                            {filteredProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleToggleProduct(product)}
                                                    className="w-full px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-b-0"
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.includes(product.id)
                                                        ? 'bg-blue-600 border-blue-600 scale-110'
                                                        : 'bg-white border-gray-300 rotate-0'
                                                        }`}>
                                                        {selectedIds.includes(product.id) && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-800 truncate text-sm">{product.productName}</div>
                                                        <div className="text-[10px] text-gray-500 font-medium">{product.sn}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {formData.productName && !showDropdown && selectedCount === 0 && (
                                <p className="text-[10px] text-green-600 mt-1 font-medium italic">
                                    ✓ New Product: <span className="font-bold">{formData.productName}</span>
                                </p>
                            )}
                            {selectedCount > 0 && (
                                <div className="mt-1 flex justify-start">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px]">
                                        {selectedCount} selected
                                    </span>
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="product-form"
                        className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-bold shadow-sm transition-all hover:shadow-md active:scale-95"
                    >
                        {selectedCount > 1 ? `Add ${selectedCount} Products` : 'Save Product'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProductModal;
