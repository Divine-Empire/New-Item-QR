import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
    // Generated QR Products state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dropdown Data state (Categories/Items)
    const [dropdownData, setDropdownData] = useState({
        categories: [],
        itemNames: [],
        allData: [],
        loading: false
    });

    // Fetch Generated QR Data (Main List)
    const fetchSheetData = useCallback(async () => {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_WEB_API;
        const sheetName = "Generated Item QR";

        if (!apiUrl) {
            console.error("VITE_WEB_API is not defined");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}?sheet=${sheetName}`);
            const result = await response.json();

            if (result) {
                let rows = [];
                if (Array.isArray(result.data)) {
                    rows = result.data;
                } else if (Array.isArray(result)) {
                    rows = result;
                }

                if (rows.length > 0) {
                    const dataRows = rows.slice(1);
                    const mappedProducts = dataRows.map((row, index) => {
                        const hasColumnF = row[5] && row[5].toString().trim() !== '';
                        return {
                            id: `row-${index}-${row[1] || Date.now()}`,
                            rowIndex: index + 2,
                            sn: row[1] || '',
                            category: row[2] || '',
                            productName: row[3] || '',
                            sku: row[4] || '',
                            qrGeneratedDate: row[5] || null,
                            generatedBy: row[6] || null,
                            batchCount: row[7] ? parseInt(row[7]) || 1 : 1,
                            qrGenerated: hasColumnF,
                            status: hasColumnF ? 'Completed' : 'Pending',
                            createdDate: row[0] || new Date().toISOString(),
                        };
                    }).filter(p => p.sn);

                    mappedProducts.sort((a, b) => {
                        const snA = a.sn ? parseInt(a.sn.replace(/\D/g, '')) : 0;
                        const snB = b.sn ? parseInt(b.sn.replace(/\D/g, '')) : 0;
                        return snB - snA;
                    });

                    setProducts(mappedProducts);
                } else {
                    setProducts([]);
                }
            }
        } catch (error) {
            console.error("Error fetching sheet data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch Dropdown Data (Product Details)
    const fetchDropdowns = useCallback(async () => {
        setDropdownData(prev => ({ ...prev, loading: true }));
        try {
            const apiUrl = import.meta.env.VITE_WEB_API;
            const sheetId = import.meta.env.VITE_SHEET_ID;
            const sheetName = import.meta.env.VITE_SHEET_PRODUCT || "Product Details";

            if (!apiUrl) return;

            const url = new URL(apiUrl);
            url.searchParams.append("sheet", sheetName);
            if (sheetId) url.searchParams.append("spreadsheetId", sheetId);

            const response = await fetch(url.toString());
            const result = await response.json();

            let rows = [];
            if (result && Array.isArray(result.data)) {
                rows = result.data;
            } else if (Array.isArray(result)) {
                rows = result;
            }

            if (rows.length > 1) {
                const dataRows = rows.slice(1);

                // Extract unique Categories (Col A -> Index 0)
                const uniqueCategories = [...new Set(dataRows.map(row => row[0]).filter(Boolean))];
                // Extract unique Item Names (Col B -> Index 1)
                const uniqueItems = [...new Set(dataRows.map(row => row[1]).filter(Boolean))];

                setDropdownData({
                    categories: uniqueCategories.sort(),
                    itemNames: uniqueItems.sort(),
                    allData: dataRows,
                    loading: false
                });
                console.log("✅ Dropdown data preloaded");
            } else {
                setDropdownData(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
            setDropdownData(prev => ({ ...prev, loading: false }));
        }
    }, []);

    // Load ALL data on mount (Parallel Fetching)
    useEffect(() => {
        fetchSheetData();
        fetchDropdowns();
    }, [fetchSheetData, fetchDropdowns]);

    const refreshData = () => {
        fetchSheetData();
        fetchDropdowns();
    };

    // Parallel Update Logic (Optimized)
    const markBulkQRGenerated = async (updates) => {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const apiUrl = import.meta.env.VITE_WEB_API;
        const sheetName = "Generated Item QR";

        if (!apiUrl) return;

        try {
            const fetchResponse = await fetch(`${apiUrl}?sheet=${sheetName}`);
            const fetchResult = await fetchResponse.json();
            if (!fetchResult.success || !fetchResult.data) return;

            const sheetData = fetchResult.data;
            const snToRowIndex = {};
            for (let i = 1; i < sheetData.length; i++) {
                const serialNo = sheetData[i][1];
                if (serialNo) snToRowIndex[serialNo] = i + 1;
            }

            const updatePromises = [];
            for (const update of updates) {
                const rowIndex = snToRowIndex[update.sn];
                if (!rowIndex) continue;

                const createUpdatePromise = (colIndex, value) => {
                    const formData = new URLSearchParams();
                    formData.append('action', 'updateCell');
                    formData.append('sheetName', sheetName);
                    formData.append('rowIndex', rowIndex.toString());
                    formData.append('columnIndex', colIndex.toString());
                    formData.append('value', value);
                    return fetch(apiUrl, { method: 'POST', body: formData }).then(res => res.json()).then(res => ({ success: res.success }));
                };

                updatePromises.push(createUpdatePromise(6, formattedDate));
                updatePromises.push(createUpdatePromise(7, update.generatedBy));
                updatePromises.push(createUpdatePromise(8, update.count.toString()));
            }

            if (updatePromises.length > 0) {
                await Promise.all(updatePromises);
            }
            fetchSheetData(); // Refresh list after update
        } catch (error) {
            console.error("Error updating sheet:", error);
        }
    };

    return (
        <ProductContext.Provider value={{
            products,
            loading,
            dropdownData, // Export dropdown data
            markBulkQRGenerated,
            refreshData
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProduct = () => useContext(ProductContext);
