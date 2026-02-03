import React, { useState } from 'react';
import { Plus, Search, RefreshCw, Barcode as BarcodeIcon, FileText, History as HistoryIcon, Package, Loader2 } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import QRCodeModal from '../components/QRCodeModal';
import BulkQRModal from '../components/BulkQRModal';
import ProductHistory from './ProductHistory';
import ConfirmModal from '../components/ConfirmModal';

const AllProducts = ({ defaultTab = 'pending' }) => {
    const { products, loading, refreshData } = useProduct();
    const [activeTab, setActiveTab] = useState(defaultTab); // 'pending', 'history'

    // Sync tab with prop if it changes (e.g. via sidebar navigation)
    React.useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [isBulkQROpen, setIsBulkQROpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        isDanger: false,
        onConfirm: () => { }
    });

    const filteredProducts = products
        .filter(product => !product.qrGenerated)
        .filter(product =>
            product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Track if products have been loaded initially
    const hasInitiallyLoaded = React.useRef(false);

    // Clean up stale selections only after products are marked as generated
    React.useEffect(() => {
        // Skip the first load - don't clear selections when data initially loads
        if (!hasInitiallyLoaded.current) {
            if (products.length > 0) {
                hasInitiallyLoaded.current = true;
            }
            return;
        }

        // Only clean up if we have selections and products changed
        if (selectedProducts.length > 0) {
            const validIds = products.filter(p => !p.qrGenerated).map(p => p.id);
            const newSelected = selectedProducts.filter(id => validIds.includes(id));
            // Only update if something actually changed
            if (newSelected.length !== selectedProducts.length) {
                setSelectedProducts(newSelected);
            }
        }
    }, [products]); // Only when products array changes

    const handleShowQR = (product) => {
        setSelectedProduct(product);
        setIsQRModalOpen(true);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(filteredProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const isAllSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;

    const renderHeader = () => (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-4 pt-3 md:px-6 md:pt-6">
            <h1 className="text-2xl font-bold text-slate-900">
                {activeTab === 'pending' ? 'Pending Products' : 'Activity History'}
            </h1>
            <div className="flex flex-wrap gap-2">
                {activeTab === 'pending' && (
                    <>
                        <button
                            onClick={() => setIsBulkQROpen(true)}
                            disabled={selectedProducts.length === 0}
                            className={`${selectedProducts.length === 0
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700'
                                } text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors`}
                        >
                            <BarcodeIcon size={18} />
                            <span className="hidden sm:inline">
                                {selectedProducts.length > 0
                                    ? `Generate Barcode (${selectedProducts.length})`
                                    : 'Generate Barcode'
                                }
                            </span>
                        </button>
                        <button
                            onClick={refreshData}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors border border-slate-200"
                            title="Refresh data from Google Sheet"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-light-blue-600 hover:bg-light-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <Plus size={20} />
                            Add Product
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    const renderTabs = () => (
        <div className="px-4 md:px-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div className="flex gap-8 w-full md:w-auto">
                {[
                    { id: 'pending', label: 'Pending', icon: Package },
                    { id: 'history', label: 'History', icon: HistoryIcon }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 flex items-center gap-2 text-sm font-semibold transition-all relative ${activeTab === tab.id
                            ? 'text-light-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-light-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Search Bar - Shifted Here as per request */}
            <div className="relative max-w-md w-full md:w-80 pb-3 md:pb-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-light-blue-500 bg-slate-50 focus:bg-white shadow-sm transition-colors text-sm"
                />
            </div>
        </div>
    );

    return (
        <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden bg-slate-50">
            {renderHeader()}

            <div className="mt-4">
                {renderTabs()}
            </div>

            <main className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'pending' && (
                    <div className="flex flex-col h-full">
                        {/* Search Bar Removed from here */}

                        {/* Content Container */}
                        <div className="flex-1 overflow-auto px-4 pb-6 md:px-6 pt-6">

                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200">
                                <table className="w-full text-left text-sm border-separate border-spacing-0">
                                    <thead className="text-slate-700 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 w-10 bg-slate-50 border-b border-slate-200 first:rounded-tl-xl last:rounded-tr-xl">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-slate-300 text-light-blue-600 focus:ring-light-blue-500"
                                                />
                                            </th>
                                            <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Serial No</th>
                                            <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Category</th>
                                            <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Product Name</th>
                                            <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200">Code / SKU</th>
                                            <th className="px-4 py-3 text-center bg-slate-50 border-b border-slate-200">Barcode</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading && activeTab === 'pending' ? (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center text-light-blue-600">
                                                        <Loader2 size={48} className="mb-4 animate-spin" />
                                                        <p className="text-lg font-medium text-slate-500">Loading products...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProducts.includes(product.id)}
                                                            onChange={() => handleSelectProduct(product.id)}
                                                            className="rounded border-slate-300 text-light-blue-600 focus:ring-light-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-light-blue-700">{product.sn}</td>
                                                    <td className="px-4 py-3 text-slate-600">{product.category}</td>
                                                    <td className="px-4 py-3 text-slate-900 font-medium">{product.productName}</td>
                                                    <td className="px-4 py-3 text-center text-slate-600 text-[10px] uppercase tracking-wider">{product.sku}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center">
                                                            <button
                                                                onClick={() => handleShowQR(product)}
                                                                className="p-1.5 text-light-blue-600 hover:bg-light-blue-50 rounded-lg transition-colors border border-transparent hover:border-light-blue-100"
                                                                title="Generate/View QR"
                                                            >
                                                                <BarcodeIcon size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                                                    No products found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                <div className="bg-slate-50 py-2 flex items-center justify-between px-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="rounded border-slate-300 text-light-blue-600 focus:ring-light-blue-500 w-4 h-4"
                                            id="mobile-select-all"
                                        />
                                        <label htmlFor="mobile-select-all" className="text-sm font-medium text-slate-600">Select All</label>
                                    </div>
                                    <span className="text-xs text-slate-400">{filteredProducts.length} items</span>
                                </div>

                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <div key={product.id} className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${selectedProducts.includes(product.id) ? 'border-light-blue-300 ring-1 ring-light-blue-100' : 'border-slate-100'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product.id)}
                                                        onChange={() => handleSelectProduct(product.id)}
                                                        className="rounded border-slate-300 text-light-blue-600 focus:ring-light-blue-500 w-5 h-5"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-semibold text-slate-900 truncate pr-2">{product.productName}</h3>
                                                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{product.sn}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{product.sku}</p>

                                                    <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-3 mt-1">
                                                        <button
                                                            onClick={() => handleShowQR(product)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-light-blue-600 bg-light-blue-50 px-3 py-1.5 rounded-lg active:bg-light-blue-100"
                                                        >
                                                            <BarcodeIcon size={14} />
                                                            View QR
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>No products found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && <ProductHistory searchTerm={searchTerm} />}
            </main>

            <AddProductModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedProducts([]);
                }}
            />
            <QRCodeModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                product={selectedProduct}
            />
            <BulkQRModal
                isOpen={isBulkQROpen}
                onClose={() => {
                    setIsBulkQROpen(false);
                    setSelectedProducts([]);
                }}
                products={products.filter(p => selectedProducts.includes(p.id))}
                onComplete={() => setSelectedProducts([])}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
                confirmText={confirmModal.confirmText}
            />
            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                product={selectedProduct}
            />
        </div>
    );
};

export default AllProducts;
