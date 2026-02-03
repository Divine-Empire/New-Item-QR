import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Initialize from localStorage immediately to prevent logout on refresh
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (id, password) => {
        setIsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_WEB_API;
            const response = await fetch(`${apiUrl}?sheet=Login Master`);
            const result = await response.json();

            if (result.success && result.data) {
                const rows = result.data.slice(1); // Skip header
                // Column mapping based on user request:
                // E = ID (index 4)
                // F = Pass (index 5)
                // G = Role (index 6)
                // H = Status (index 7)
                // I = Page Access (index 8)
                // C = Name (index 2) - keeping for display
                // B = Serial No (index 1) - keeping for reference

                const foundUser = rows.find(row =>
                    row[4]?.toString().toLowerCase() === id.toString().toLowerCase() &&
                    row[5]?.toString() === password
                );

                if (foundUser) {
                    const status = foundUser[7];
                    if (status !== 'Active') {
                        return { success: false, message: 'Account is Inactive. Please contact admin.' };
                    }

                    const userData = {
                        sn: foundUser[1],
                        name: foundUser[2],
                        id: foundUser[4],
                        role: foundUser[6],
                        status: foundUser[7],
                        pageAccess: foundUser[8] // Comma separated string
                    };

                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                    return { success: true };
                } else {
                    return { success: false, message: 'Invalid ID or Password' };
                }
            } else {
                return { success: false, message: 'Failed to connect to authentication server' };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: 'An error occurred during login' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
