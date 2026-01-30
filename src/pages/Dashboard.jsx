import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useProduct } from '../context/ProductContext';
import { Package, TrendingUp, AlertCircle, CheckCircle, Calendar, ArrowRight, Barcode as BarcodeIcon, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, colorLight }) => (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-20 h-20 ${colorLight} rounded-bl-full opacity-50`}></div>
        <div className="relative flex items-start justify-between">
            <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{value}</h3>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const { products } = useProduct();

    // Calculate real stats from products data based on Pending and History
    const totalProducts = products.length;
    const pendingRegistration = products.filter(p => !p.qrGenerated).length;
    const registeredHistory = products.filter(p => p.qrGenerated).length;

    const stats = [
        { title: 'Total Products', value: totalProducts, icon: Package, color: 'bg-light-blue-500', colorLight: 'bg-light-blue-100' },
        { title: 'Pending Items', value: pendingRegistration, icon: AlertCircle, color: 'bg-amber-500', colorLight: 'bg-amber-100' },
        { title: 'Registered Items', value: registeredHistory, icon: CheckCircle, color: 'bg-green-500', colorLight: 'bg-green-100' },
    ];

    return (
        <div className="space-y-6 h-full overflow-y-auto pr-2 p-4 lg:p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-light-blue-500 to-light-blue-600 rounded-2xl p-4 sm:p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-xl font-bold">{user?.name?.charAt(0) || 'U'}</span>
                    </div>
                    <div>
                        <p className="text-white/80 text-sm">Welcome back,</p>
                        <h1 className="text-xl sm:text-2xl font-bold">{user?.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm mt-3">
                    <Calendar size={14} />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid - 2x2 on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Quick Actions - Mobile First */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Link to="/products" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-light-blue-200 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-light-blue-100 flex items-center justify-center mb-3 group-hover:bg-light-blue-500 transition-colors">
                        <Package size={24} className="text-light-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">Products</h4>
                    <p className="text-xs text-slate-500">Manage all items</p>
                </Link>
                <Link to="/products?tab=pending" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-500 transition-colors">
                        <BarcodeIcon size={24} className="text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">Register New</h4>
                    <p className="text-xs text-slate-500">{pendingRegistration} pending barcodes</p>
                </Link>
                <Link to="/products?tab=history" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-green-200 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-500 transition-colors">
                        <History size={24} className="text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">View History</h4>
                    <p className="text-xs text-slate-500">Download registered barcodes</p>
                </Link>
            </div>

            {/* Removed Quick Stats Summary */}

            {/* Recent Items - Barcode Style */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Recently Added</h3>
                    <Link to="/products" className="text-light-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {products.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {products.slice(-5).reverse().map((product) => (
                            <div key={product.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{product.sku}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-light-blue-600 font-mono bg-light-blue-50 px-2 py-0.5 rounded">{product.sn}</span>
                                            <span className="text-xs text-slate-500 truncate">{product.productName}</span>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.qrGenerated ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {product.qrGenerated ? 'Registered' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <Package size={40} className="mx-auto mb-3 text-slate-300" />
                        <p>No products found.</p>
                        <Link to="/products" className="text-light-blue-600 text-sm hover:underline mt-2 inline-block">Add your first product</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
