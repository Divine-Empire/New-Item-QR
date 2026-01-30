import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const Login = () => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (login(id, password)) {
            navigate('/dashboard');
        } else {
            setError('Invalid ID or Password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-light-blue-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-light-blue-100">
                <h2 className="text-3xl font-bold text-center text-light-blue-900 mb-8">Asset Management System</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-light-blue-600 hover:bg-light-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-sm"
                    >
                        Login
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Admin: admin / admin123</p>
                    <p>User: user / user123</p>
                </div>
            </div>
            <div className="absolute bottom-0 w-full">
                <Footer />
            </div>
        </div>
    );
};

export default Login;
