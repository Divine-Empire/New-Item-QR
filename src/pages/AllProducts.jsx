import React, { useState } from 'react';
import { Plus, Search, RefreshCw, Barcode as BarcodeIcon, FileText, History as HistoryIcon, Package } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import QRCodeModal from '../components/QRCodeModal';
import BulkQRModal from '../components/BulkQRModal';
import ProductHistory from './ProductHistory';
import ConfirmModal from '../components/ConfirmModal';

const AllProducts = ({ defaultTab = 'pending' }) => {
    const { products, clearAndReloadDummy, deleteProduct } = useProduct();
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

    const handleDeleteProduct = (product) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: `Are you sure you want to permanently delete "${product.productName}"? This action cannot be undone.`,
            isDanger: true,
            confirmText: 'Delete',
            onConfirm: () => {
                deleteProduct(product.id);
                // If it was selected, remove it from selection
                if (selectedProducts.includes(product.id)) {
                    setSelectedProducts(prev => prev.filter(id => id !== product.id));
                }
            }
        });
    };

    const handleReloadDummy = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Reset Data',
            message: 'This will replace all current products with fresh dummy data. All your changes will be lost. Do you want to continue?',
            isDanger: true, // Resetting data is destructive
            confirmText: 'Reset',
            onConfirm: () => {
                clearAndReloadDummy();
                setSelectedProducts([]);
            }
        });
    };

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-6 pt-6">
            <h1 className="text-2xl font-bold text-slate-900">
                {activeTab === 'pending' ? 'Pending Products' : 'Activity History'}
            </h1>
            <div className="flex flex-wrap gap-2">
                {activeTab === 'pending' && (
                    <>
                        <button
                            onClick={handleReloadDummy}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            title="Reload dummy data"
                        >
                            <RefreshCw size={18} />
                        </button>
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
        <div className="px-6 border-b border-slate-200 bg-white">
            <div className="flex gap-8">
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
                        {/* Search & Actions - Sticky Toolbar */}
                        <div className="sticky top-0 z-30 bg-slate-50 p-6 pb-4 space-y-4">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-light-blue-500 bg-white shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Table - Scrollable Container */}
                        <div className="flex-1 overflow-auto px-6 pb-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-20 text-slate-700 font-semibold shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 w-10 bg-slate-50 border-b border-slate-200 first:rounded-tl-xl last:rounded-tr-xl">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-slate-300 text-light-blue-600 focus:ring-light-blue-500"
                                                />
                                            </th>
                                            <th className="px-4 py-3 bg-slate-50">Serial No</th>
                                            <th className="px-4 py-3 bg-slate-50">Product Name</th>
                                            <th className="px-4 py-3 bg-slate-50">Code / SKU</th>
                                            <th className="px-4 py-3 text-center bg-slate-50">Barcode</th>
                                            <th className="px-4 py-3 text-center bg-slate-50">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredProducts.length > 0 ? (
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
                                                    <td className="px-4 py-3 text-slate-900 font-medium">{product.productName}</td>
                                                    <td className="px-4 py-3 text-slate-600 text-[10px] uppercase tracking-wider">{product.sku}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center">
                                                            <button
                                                                onClick={() => handleShowQR(product)}
                                                                className="p-1.5 text-light-blue-600 hover:bg-light-blue-50 rounded-lg transition-colors border border-transparent hover:border-light-blue-100"
                                                            >
                                                                <BarcodeIcon size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDeleteProduct(product)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Product"
                                                        >
                                                            <Plus className="rotate-45" size={18} />
                                                        </button>
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
                        </div>
                    </div>
                )}

                {activeTab === 'history' && <ProductHistory />}
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
