import React, { useState } from 'react';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import CustomSelect from './CustomSelect';

const AddProductModal = ({ isOpen, onClose }) => {
    // Get products, refreshData AND the preloaded dropdownData
    const { products, refreshData, dropdownData } = useProduct();

    // Destructure preloaded data
    const { categories, itemNames, allData, loading: contextLoading } = dropdownData;

    const [formData, setFormData] = useState({
        category: '',
        productName: [], // Changed to array for multi-select
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [successCount, setSuccessCount] = useState(0);

    // No local useEffect for fetching! Data is already there.

    const handleChange = (e) => {
        const { name, value } = e.target;

        // If category changes, clear selected item names
        if (name === 'category') {
            setFormData(prev => ({ ...prev, category: value, productName: [] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Filter item names based on selected category (using preloaded allData)
    const filteredItemNames = formData.category
        ? itemNames.filter(itemName => {
            // Find all rows matching this item name and check if any match the selected category
            return allData.some(row => row[1] === itemName && row[0] === formData.category);
        })
        : itemNames;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.category) {
            setError('Please select a category');
            return;
        }

        if (!formData.productName || formData.productName.length === 0) {
            setError('Please select at least one item name');
            return;
        }

        setIsSaving(true);


        try {
            const apiUrl = import.meta.env.VITE_WEB_API;
            const sheetName = import.meta.env.VITE_SHEET_QR || "Item QR Code";

            // Removed local maxSnNum calculation to avoid race conditions.
            // Using "Auto-Generated" placeholder so backend handles it atomically.

            // Prepare all products with their serial numbers
            const productsToAdd = formData.productName.map((selectedItem, index) => {
                // Find the corresponding row from the fetched data
                const matchingRow = allData.find(row => row[1] === selectedItem);
                const codeName = matchingRow ? matchingRow[2] : selectedItem;

                return {
                    category: formData.category,
                    productName: selectedItem,
                    sku: codeName,
                    codeName: codeName,
                    sn: 'Auto-Generated'
                };
            });

            // Send each product to Google Sheet (no local storage)
            // Use concurrent requests for saving multiple products too
            const savePromises = productsToAdd.map(product => {
                // Format timestamp as 'YYYY-MM-DD HH:mm:ss'
                const now = new Date();
                const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

                const sheetData = [
                    timestamp,
                    product.sn,
                    product.category,
                    product.productName,
                    product.sku
                ];

                if (!apiUrl) return Promise.resolve({ success: false });

                const formDataToSend = new URLSearchParams();
                formDataToSend.append('action', 'insert');
                formDataToSend.append('sheetName', sheetName);
                formDataToSend.append('rowData', JSON.stringify(sheetData));

                return fetch(apiUrl, {
                    method: 'POST',
                    body: formDataToSend
                }).then(res => res.json());
            });

            // Wait for all saves
            const results = await Promise.all(savePromises);
            const failures = results.filter(r => !r.success && r.message !== "Data inserted successfully");

            if (failures.length > 0) {
                console.warn("Some products failed to save", failures);
                setError('Some products failed to save. Please check the list.');
            } else {
                console.log(`✅ Saved ${productsToAdd.length} products to Google Sheet`);
                // Refresh data from Google Sheet to show new products
                refreshData();

                // Success
                setSuccessCount(productsToAdd.length);
                setFormData({ productName: [], category: '' });
                setError('');
                setShowToast(true);

                // Wait 3 seconds to allow data to refresh and user to see the message
                setTimeout(() => {
                    setShowToast(false);
                    onClose();
                }, 3000);
            }

        } catch (err) {
            console.error("Error saving products:", err);
            setError('Failed to save products. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({ productName: [], category: '' });
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            {/* Removed overflow-hidden from here to allow dropdowns to float out */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col relative">
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

                        {/* Category Dropdown */}
                        <CustomSelect
                            label="Category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            options={categories}
                            disabled={contextLoading}
                            required
                            placeholder={contextLoading ? "Loading..." : "Select Category"}
                        />

                        {/* Item Name Dropdown (Mapped to productName) - Multi-Select */}
                        <CustomSelect
                            label="Item Name (Select Multiple)"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            options={filteredItemNames}
                            disabled={contextLoading || !formData.category}
                            required
                            placeholder={
                                contextLoading
                                    ? "Loading..."
                                    : !formData.category
                                        ? "Select Category First"
                                        : "Select Item Names"
                            }
                            multiSelect={true}
                            selectedValues={formData.productName}
                        />

                        {/* Footer Buttons (Inside Form) */}
                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md font-semibold transition-all flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700'
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Products'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Centered Success Popup Overlay */}
                {showToast && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-300 rounded-lg">
                        <div className="flex flex-col items-center gap-4 p-6 text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 shadow-sm ring-4 ring-green-50">
                                <CheckCircle size={40} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-1">Success!</h3>
                                <p className="text-slate-600 font-medium">{successCount} product(s) added</p>
                            </div>
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-pulse mt-2">
                                <Loader2 size={16} className="animate-spin" />
                                Refreshing data...
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddProductModal;
