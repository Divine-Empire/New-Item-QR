import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext(null);

// Realistic dummy data with proper product names
const generateDummyProducts = () => {
    const realProducts = [
        { name: 'GI TRAY-600X450X50MM', category: 'Lab Equipment', brand: 'Devine', model: 'LAB10846', type: 'Asset' },
        { name: 'Dell Latitude 5540 Laptop', category: 'IT', brand: 'Dell', model: 'Latitude 5540', type: 'Asset' },
        { name: 'HP LaserJet Pro MFP M428', category: 'IT', brand: 'HP', model: 'M428fdw', type: 'Asset' },
        { name: 'Cisco IP Phone 8845', category: 'Electronics', brand: 'Cisco', model: '8845', type: 'Asset' },
        { name: 'Samsung 27" Monitor', category: 'IT', brand: 'Samsung', model: 'S27R350', type: 'Asset' },
        { name: 'Bosch Power Drill GSB 600', category: 'Tools', brand: 'Bosch', model: 'GSB 600', type: 'Non-Consumable' },
        { name: 'Herman Miller Aeron Chair', category: 'Furniture', brand: 'Herman Miller', model: 'Aeron', type: 'Asset' },
        { name: 'Canon EOS 90D Camera', category: 'Electronics', brand: 'Canon', model: 'EOS 90D', type: 'Asset' },
        { name: 'Epson EcoTank L3250 Printer', category: 'IT', brand: 'Epson', model: 'L3250', type: 'Asset' },
        { name: 'Godrej Steel Almirah', category: 'Furniture', brand: 'Godrej', model: 'Storwel', type: 'Asset' },
        { name: 'DeWalt Angle Grinder DWE4010', category: 'Tools', brand: 'DeWalt', model: 'DWE4010', type: 'Non-Consumable' },
        { name: 'Lenovo ThinkPad X1 Carbon', category: 'IT', brand: 'Lenovo', model: 'X1 Carbon Gen 11', type: 'Asset' },
        { name: 'Havells Industrial Fan', category: 'Machinery', brand: 'Havells', model: 'Swing 600mm', type: 'Asset' },
        { name: 'Logitech MX Master 3S Mouse', category: 'IT', brand: 'Logitech', model: 'MX Master 3S', type: 'Consumable' },
        { name: 'Kirloskar Water Pump', category: 'Machinery', brand: 'Kirloskar', model: 'KDS-314', type: 'Asset' },
        { name: 'Godrej Office Table Executive', category: 'Furniture', brand: 'Godrej', model: 'OT-5016', type: 'Asset' },
        { name: 'Stanley Mechanics Tool Set', category: 'Tools', brand: 'Stanley', model: 'STMT74393', type: 'Non-Consumable' },
        { name: 'Apple MacBook Pro 14"', category: 'IT', brand: 'Apple', model: 'MacBook Pro M3', type: 'Asset' },
        { name: 'Brother Industrial Sewing Machine', category: 'Machinery', brand: 'Brother', model: 'S-7250A', type: 'Asset' },
        { name: 'Zebronics Keyboard & Mouse Combo', category: 'IT', brand: 'Zebronics', model: 'Zeb-Companion 110', type: 'Consumable' },
        { name: 'Tata Steel Filing Cabinet', category: 'Furniture', brand: 'Tata Steel', model: 'FC-4D', type: 'Asset' },
    ];

    const locations = ['Warehouse A', 'Office Block B', 'Plant Floor 1', 'IT Server Room', 'Admin Building'];
    const departments = ['IT', 'Production', 'Admin', 'Finance', 'HR'];
    const employees = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Singh', 'Vikram Joshi', 'Anjali Gupta'];
    const suppliers = ['Tech World Pvt Ltd', 'Industrial Supplies Co', 'Office Solutions India', 'Machinery Mart', 'Digital Hub'];
    const paymentModes = ['Cash', 'Online', 'Credit'];
    const priorities = ['Low', 'Medium', 'High'];
    const frequencies = ['Monthly', 'Quarterly', 'Yearly'];
    const depMethods = ['Straight Line', 'WDV'];
    const origins = ['India', 'China', 'USA', 'Germany', 'Japan'];

    const products = [];
    for (let i = 0; i < 100; i++) {
        const prod = realProducts[i % realProducts.length];
        // Make numbers deterministic based on index `i`
        // Base cost: 5000 + (val based on i)
        const deterministicRandom = ((i * 123456) % 100) / 100;
        const baseCost = 5000 + Math.floor(deterministicRandom * 95000);

        // Deterministic dates
        const month = (i % 12) + 1;
        const day = (i % 28) + 1;
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');

        products.push({
            id: i + 1,
            sn: `SN-${String(i + 1).padStart(4, '0')}`,
            // Section 1: Basic Product Information
            productName: prod.name,
            category: prod.category,
            type: prod.type,
            brand: prod.brand,
            model: prod.model,
            // Deterministic serial no
            serialNo: `SR2025${String(i * 789).padStart(6, '0')}`,
            sku: `SKU-${prod.category.substring(0, 2).toUpperCase()}${1000 + i}`,
            mfgDate: `2024-${monthStr}-${dayStr}`,
            origin: origins[i % origins.length],
            status: i % 3 === 0 ? 'Inactive' : 'Active',
            // Section 2: Asset Information
            assetDate: `2025-01-${dayStr}`,
            invoiceNo: `INV-2025-${String(1000 + i).padStart(5, '0')}`,
            cost: String(baseCost),
            salePrice: String(Math.floor(baseCost * 1.4)), // Added revenue-generating price
            quantity: String((i % 5) + 1),
            supplierName: suppliers[i % suppliers.length],
            supplierPhone: `98${String(10000000 + i * 12345).slice(0, 8)}`,
            supplierEmail: `sales@${suppliers[i % suppliers.length].toLowerCase().replace(/\s+/g, '')}.com`,
            paymentMode: paymentModes[i % paymentModes.length],
            // Section 3: Location & Ownership
            location: locations[i % locations.length],
            department: departments[i % departments.length],
            assignedTo: employees[i % employees.length],
            usageType: i % 2 === 0 ? 'Internal' : 'External',
            storageLoc: `Rack ${String.fromCharCode(65 + (i % 5))}-${Math.floor(i / 5) + 1}`,
            responsiblePerson: employees[(i + 2) % employees.length],
            // Section 4: Warranty & Service Details
            warrantyAvailable: i % 4 === 0 ? 'No' : 'Yes',
            warrantyProvider: i % 4 === 0 ? '' : (i % 2 === 0 ? 'Manufacturer' : 'Vendor'),
            warrantyStart: i % 4 === 0 ? '' : '2025-01-01',
            warrantyEnd: i % 4 === 0 ? '' : '2027-01-01',
            amc: i % 3 === 0 ? 'Yes' : 'No',
            amcProvider: i % 3 === 0 ? `${prod.brand} Service Center` : '',
            amcStart: i % 3 === 0 ? '2025-01-01' : '',
            amcEnd: i % 3 === 0 ? '2026-01-01' : '',
            serviceContact: `1800-${100 + i}-${1000 + i}`,
            // Section 5: Maintenance Configuration
            maintenanceRequired: i % 2 === 0 ? 'Yes' : 'No',
            maintenanceType: i % 2 === 0 ? (i % 4 === 0 ? 'Breakdown' : 'Preventive') : '',
            frequency: i % 2 === 0 ? frequencies[i % frequencies.length] : '',
            nextService: i % 2 === 0 ? '2025-04-01' : '',
            priority: i % 2 === 0 ? priorities[i % priorities.length] : '',
            technician: i % 2 === 0 ? `Tech ${employees[i % employees.length].split(' ')[0]}` : '',
            maintenanceNotes: i % 2 === 0 ? 'Regular preventive maintenance required' : '',
            // Section 7: Technical Specifications
            specs: [
                { name: 'Weight', value: `${((i * 1.5) % 10 + 0.5).toFixed(1)} kg` },
                { name: 'Dimensions', value: `${50 + (i % 10)}x${40 + (i % 5)}x${10 + (i % 5)} cm` }
            ],
            // Section 8: Financial & Depreciation
            assetValue: String(baseCost),
            depMethod: depMethods[i % depMethods.length],
            depRate: String((i % 15) + 5),
            assetLife: String((i % 7) + 3),
            residualValue: String(Math.floor(baseCost * 0.1)),
            // Section 9: Notes & Remarks
            internalNotes: `Asset registered for ${departments[i % departments.length]} department`,
            usageRemarks: 'In regular use',
            condition: i % 5 === 0 ? 'Fair' : 'Good',
            // Section 10: System Information
            createdBy: 'admin',
            // Use fixed date for demo consistency
            createdDate: '2025-01-01T10:00:00.000Z',
            updatedBy: 'admin',
            updatedDate: '2025-01-01T10:00:00.000Z',
        });
    }
    return products;
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);

    // Load from local storage on mount
    useEffect(() => {
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
            const parsed = JSON.parse(storedProducts);
            // Check if it's old format data (Product 1, Product 2 pattern)
            const isOldData = parsed.length > 0 && parsed[0].productName && /^Product \d+$/.test(parsed[0].productName);
            if (isOldData) {
                // Replace with new realistic data
                const dummyData = generateDummyProducts();
                setProducts(dummyData);
                localStorage.setItem('products', JSON.stringify(dummyData));
            } else {
                setProducts(parsed);
            }
        } else {
            // Generate and save dummy data
            const dummyData = generateDummyProducts();
            setProducts(dummyData);
            localStorage.setItem('products', JSON.stringify(dummyData));
        }
    }, []);

    const addProduct = (productData) => {
        // Find the actual highest SN number in the current list
        let maxSnNum = 0;
        if (products.length > 0) {
            products.forEach(p => {
                if (p.sn && p.sn.startsWith('SN-')) {
                    const num = parseInt(p.sn.split('-')[1]);
                    if (!isNaN(num) && num > maxSnNum) {
                        maxSnNum = num;
                    }
                }
            });
        }

        const newSn = `SN-${String(maxSnNum + 1).padStart(4, '0')}`;

        const newProduct = {
            ...productData,
            id: Date.now(),
            sn: newSn,
            createdBy: 'admin',
            createdDate: new Date().toISOString(),
            updatedBy: 'admin',
            updatedDate: new Date().toISOString(),
        };

        // Add to beginning of list (Top-down)
        const updatedProducts = [newProduct, ...products];
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        return newProduct;
    };

    const clearAndReloadDummy = () => {
        const dummyData = generateDummyProducts();
        setProducts(dummyData);
        localStorage.setItem('products', JSON.stringify(dummyData));
    };

    const recordHistory = (productId, type, details) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newHistoryItem = {
            id: `evt-${Date.now()}`,
            productId,
            type, // 'CR', 'QR', 'ED', 'AP'
            details,
            user: 'Admin',
            date: new Date().toISOString()
        };

        const currentHistory = JSON.parse(localStorage.getItem('product_history') || '[]');
        const updatedHistory = [newHistoryItem, ...currentHistory].slice(0, 100);
        localStorage.setItem('product_history', JSON.stringify(updatedHistory));
        return newHistoryItem;
    };

    const markQRGenerated = (productId, batchCount = 1) => {
        const product = products.find(p => p.id === productId);
        if (!product || product.qrGenerated) return;

        const updatedProducts = products.map(p =>
            p.id === productId ? { ...p, qrGenerated: true, batchCount: batchCount, qrGeneratedDate: new Date().toISOString() } : p
        );
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));

        recordHistory(productId, 'QR', `QR Code Generated (Batch: ${batchCount})`);
    };

    const markBulkQRGenerated = (productIds, batchCount = 1) => {
        const count = Number(batchCount) || 1;
        const updatedProducts = products.map(p =>
            productIds.includes(p.id) ? { ...p, qrGenerated: true, batchCount: count, qrGeneratedDate: new Date().toISOString() } : p
        );
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));

        productIds.forEach(id => {
            recordHistory(id, 'QR', `Bulk QR Generated (Batch: ${count})`);
        });
    };

    const deleteProduct = (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));

        recordHistory(productId, 'DL', `Product Deleted: ${product.productName}`);
    };

    const updateProduct = (updatedProduct) => {
        const updatedProducts = products.map(p =>
            p.id === updatedProduct.id ? updatedProduct : p
        );
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
    };

    return (
        <ProductContext.Provider value={{
            products,
            addProduct,
            updateProduct,
            clearAndReloadDummy,
            markQRGenerated,
            markBulkQRGenerated,
            deleteProduct,
            recordHistory
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProduct = () => useContext(ProductContext);
