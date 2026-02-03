import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Eye, EyeOff, Plus, Edit2, Loader2, RefreshCw, Save, X, ChevronDown, Check, LayoutDashboard } from 'lucide-react';

const MultiSelectDropdown = ({ options, value, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Convert comma-separated string to array
    const selectedValues = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option) => {
        let newValues;
        if (selectedValues.includes(option)) {
            newValues = selectedValues.filter(v => v !== option);
        } else {
            newValues = [...selectedValues, option];
        }
        onChange(newValues.join(', '));
    };

    return (
        <div className="relative group" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500
                    flex items-center justify-between transition-all duration-200 shadow-sm hover:border-slate-300
                    ${isOpen ? 'ring-2 ring-light-blue-100 border-light-blue-500' : ''}
                `}
            >
                <span className={`block truncate font-medium ${selectedValues.length === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                    {selectedValues.length > 0 ? selectedValues.join(', ') : placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-light-blue-500' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1 space-y-0.5">
                        {/* Custom Values */}
                        {selectedValues.filter(v => !options.includes(v)).map((option, index) => (
                            <div
                                key={`custom-${index}`}
                                onClick={() => toggleOption(option)}
                                className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group/item transition-colors"
                            >
                                <div className={`
                                    w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-all duration-200
                                    ${selectedValues.includes(option)
                                        ? 'bg-light-blue-600 border-light-blue-600 shadow-sm shadow-light-blue-200'
                                        : 'border-slate-300 group-hover/item:border-light-blue-400'}
                                `}>
                                    {selectedValues.includes(option) && <Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                                <span className="text-sm font-medium text-slate-700 flex-1">{option}</span>
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Current</span>
                            </div>
                        ))}

                        {/* Standard Options */}
                        {options.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => toggleOption(option)}
                                className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group/item transition-colors"
                            >
                                <div className={`
                                    w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-all duration-200
                                    ${selectedValues.includes(option)
                                        ? 'bg-light-blue-600 border-light-blue-600 shadow-sm shadow-light-blue-200'
                                        : 'border-slate-300 group-hover/item:border-light-blue-400'}
                                `}>
                                    {selectedValues.includes(option) && <Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{option}</span>
                            </div>
                        ))}
                    </div>

                    {options.length === 0 && selectedValues.length === 0 && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm font-medium text-slate-500">No access levels available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);
    const [pageAccessOptions, setPageAccessOptions] = useState([]);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showProfilePassword, setShowProfilePassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Profile form state (for logged-in user)
    const [profileForm, setProfileForm] = useState({
        sn: '',
        name: '',
        number: '',
        id: '',
        password: '',
        pageAccess: ''
    });

    // Add user form state
    const [addForm, setAddForm] = useState({
        name: '',
        number: '',
        id: '',
        password: '',
        role: 'User',
        status: 'Active',
        pageAccess: ''
    });

    const apiUrl = import.meta.env.VITE_WEB_API;
    const sheetName = "Login Master";

    // Fetch users and page access options from Google Sheet
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}?sheet=${sheetName}`);
            const result = await response.json();

            if (result.success && result.data) {
                const rows = result.data;
                const dataRows = rows.slice(1);

                // Map users from sheet data
                const mappedUsers = dataRows.map((row, index) => ({
                    rowIndex: index + 2, // 1-indexed, +1 for header
                    timestamp: row[0] || '',
                    sn: row[1] || '',
                    name: row[2] || '',
                    number: row[3] || '',
                    id: row[4] || '',
                    password: row[5] || '',
                    role: row[6] || 'User',
                    status: row[7] || 'Active',
                    pageAccess: row[8] || ''
                })).filter(u => u.sn);

                setUsers(mappedUsers);

                // Extract page access options from Column J (index 9)
                const options = dataRows
                    .map(row => row[9])
                    .filter(opt => opt && opt.toString().trim() !== '');
                setPageAccessOptions([...new Set(options)]);

                // Set profile form with current user's data
                const currentUser = mappedUsers.find(u => u.id === user?.id);
                if (currentUser) {
                    setProfileForm({
                        sn: currentUser.sn,
                        name: currentUser.name,
                        number: currentUser.number,
                        id: currentUser.id,
                        password: currentUser.password,
                        pageAccess: currentUser.pageAccess
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (apiUrl) {
            fetchData();
        }
    }, [apiUrl]);

    // Update a cell in the sheet
    const updateCell = async (rowIndex, columnIndex, value) => {
        const formData = new URLSearchParams();
        formData.append('action', 'updateCell');
        formData.append('sheetName', sheetName);
        formData.append('rowIndex', rowIndex.toString());
        formData.append('columnIndex', columnIndex.toString());
        formData.append('value', value);

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            const currentUser = users.find(u => u.sn === profileForm.sn);
            if (!currentUser) {
                setError('User not found');
                return;
            }

            const rowIndex = currentUser.rowIndex;

            await updateCell(rowIndex, 3, profileForm.name);
            await updateCell(rowIndex, 4, profileForm.number);
            await updateCell(rowIndex, 5, profileForm.id);
            await updateCell(rowIndex, 6, profileForm.password);
            await updateCell(rowIndex, 9, profileForm.pageAccess);

            setSuccessMessage('Profile updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchData();
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    // Update a user in the table (inline edit)
    const handleUpdateUser = async (userToUpdate) => {
        setSaving(true);
        try {
            const rowIndex = userToUpdate.rowIndex;

            await updateCell(rowIndex, 3, userToUpdate.name);
            await updateCell(rowIndex, 4, userToUpdate.number);
            await updateCell(rowIndex, 5, userToUpdate.id);
            await updateCell(rowIndex, 6, userToUpdate.password);
            await updateCell(rowIndex, 7, userToUpdate.role);
            await updateCell(rowIndex, 8, userToUpdate.status);
            await updateCell(rowIndex, 9, userToUpdate.pageAccess);

            setEditingUserId(null);
            setSuccessMessage('User updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchData();
        } catch (err) {
            console.error('Error updating user:', err);
            setError('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    // Add new user
    const handleAddUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            // Generate serial number
            let maxSnNum = 0;
            users.forEach(u => {
                if (u.sn && u.sn.startsWith('SN-')) {
                    const num = parseInt(u.sn.split('-')[1]);
                    if (!isNaN(num) && num > maxSnNum) maxSnNum = num;
                }
            });
            const newSn = `SN-${String(maxSnNum + 1).padStart(3, '0')}`;

            // Generate timestamp
            const now = new Date();
            const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            // Prepare row data
            const rowData = [
                timestamp,           // A
                newSn,              // B
                addForm.name,       // C
                addForm.number,     // D
                addForm.id,         // E
                addForm.password,   // F
                addForm.role,       // G
                addForm.status,     // H
                addForm.pageAccess  // I
            ];

            // Insert into sheet
            const formData = new URLSearchParams();
            formData.append('action', 'insert');
            formData.append('sheetName', sheetName);
            formData.append('rowData', JSON.stringify(rowData));

            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success || result.message === "Data inserted successfully") {
                setIsAddUserOpen(false);
                setAddForm({
                    name: '',
                    number: '',
                    id: '',
                    password: '',
                    role: 'User',
                    status: 'Active',
                    pageAccess: ''
                });
                setSuccessMessage('User added successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
                await fetchData();
            } else {
                setError('Failed to add user');
            }
        } catch (err) {
            console.error('Error adding user:', err);
            setError('Failed to add user');
        } finally {
            setSaving(false);
        }
    };

    const handleUserFieldChange = (sn, field, value) => {
        setUsers(prev => prev.map(u =>
            u.sn === sn ? { ...u, [field]: value } : u
        ));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 size={48} className="animate-spin text-light-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50/50 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto p-6 space-y-8 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-50/50 backdrop-blur-sm py-2 -my-2 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage your profile and system preferences</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh Data
                    </button>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-3" />
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                        {successMessage}
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-visible">
                    <div className="relative rounded-t-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-light-blue-600 to-indigo-600 opacity-90" />
                        <div className="relative px-8 py-8 flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner">
                                <span className="text-4xl font-bold text-white">{profileForm.name?.charAt(0) || 'U'}</span>
                            </div>
                            <div className="flex-1 text-white">
                                <h2 className="text-2xl font-bold">My Profile</h2>
                                <div className="flex items-center gap-3 mt-1 opacity-90">
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm uppercase tracking-wide">
                                        {user?.role} Account
                                    </span>
                                    <span className="text-sm font-medium opacity-80">{profileForm.sn}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {/* Serial No */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Serial Number</label>
                                <input
                                    type="text"
                                    value={profileForm.sn}
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-sm cursor-not-allowed shadow-inner"
                                />
                            </div>

                            {/* User Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">User Name</label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 transition-all shadow-sm"
                                    placeholder="Enter your name"
                                />
                            </div>

                            {/* Number */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={profileForm.number}
                                    onChange={(e) => setProfileForm({ ...profileForm, number: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 transition-all shadow-sm"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            {/* ID */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">User ID</label>
                                <input
                                    type="text"
                                    value={profileForm.id}
                                    onChange={(e) => setProfileForm({ ...profileForm, id: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 transition-all shadow-sm"
                                    placeholder="Enter system ID"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                                <div className="relative group">
                                    <input
                                        type={showProfilePassword ? 'text' : 'password'}
                                        value={profileForm.password}
                                        onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 transition-all shadow-sm pr-12"
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowProfilePassword(!showProfilePassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-light-blue-600 transition-colors p-1"
                                    >
                                        {showProfilePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Page Access */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Page Access</label>
                                <MultiSelectDropdown
                                    options={pageAccessOptions}
                                    value={profileForm.pageAccess}
                                    onChange={(value) => setProfileForm({ ...profileForm, pageAccess: value })}
                                    placeholder="Select accessible pages..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="px-8 py-3 bg-gradient-to-r from-light-blue-600 to-indigo-600 hover:from-light-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-light-blue-200 hover:shadow-xl hover:shadow-light-blue-300 transition-all active:scale-[0.98] flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                Save Profile Changes
                            </button>
                        </div>
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-8">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">User Management</h3>
                                    <p className="text-sm text-slate-500 font-medium">Manage permissions & access controls</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddUserOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                                Add New User
                            </button>
                        </div>

                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider">Serial No</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider">Number</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider">System ID</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider w-64">Page Access</th>
                                        <th className="px-6 py-4 text-xs uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {users.map((u) => (
                                        <tr key={u.sn} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold bg-slate-50/30">{u.sn}</td>
                                            <td className="px-6 py-4">
                                                {editingUserId === u.sn ? (
                                                    <input
                                                        type="text"
                                                        value={u.name}
                                                        onChange={(e) => handleUserFieldChange(u.sn, 'name', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-medium text-slate-700">{u.name}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {editingUserId === u.sn ? (
                                                    <input
                                                        type="text"
                                                        value={u.number}
                                                        onChange={(e) => handleUserFieldChange(u.sn, 'number', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    u.number
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingUserId === u.sn ? (
                                                    <input
                                                        type="text"
                                                        value={u.id}
                                                        onChange={(e) => handleUserFieldChange(u.sn, 'id', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">{u.id}</span>
                                                )}
                                            </td>
                                            {/* Pass field removed from table view for security, can add back if needed but usually better to have button to reset */}
                                            <td className="px-6 py-4">
                                                {editingUserId === u.sn ? (
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleUserFieldChange(u.sn, 'role', e.target.value)}
                                                        className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    >
                                                        <option value="Admin">Admin</option>
                                                        <option value="User">User</option>
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'Admin'
                                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingUserId === u.sn ? (
                                                    <select
                                                        value={u.status}
                                                        onChange={(e) => handleUserFieldChange(u.sn, 'status', e.target.value)}
                                                        className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.status === 'Active'
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-red-100 text-red-700 border border-red-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        {u.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingUserId === u.sn ? (
                                                    <div className="w-64">
                                                        <MultiSelectDropdown
                                                            options={pageAccessOptions}
                                                            value={u.pageAccess}
                                                            onChange={(value) => handleUserFieldChange(u.sn, 'pageAccess', value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.pageAccess ? u.pageAccess.split(',').slice(0, 2).map((access, i) => (
                                                            <span key={i} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-md">
                                                                {access.trim()}
                                                            </span>
                                                        )) : <span className="text-slate-400 text-xs italic">No access</span>}
                                                        {u.pageAccess && u.pageAccess.split(',').length > 2 && (
                                                            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-1 rounded-md">
                                                                +{u.pageAccess.split(',').length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {editingUserId === u.sn ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleUpdateUser(u)}
                                                            disabled={saving}
                                                            className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded-lg transition-colors shadow-sm"
                                                            title="Save"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingUserId(null); fetchData(); }}
                                                            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 p-1.5 rounded-lg transition-colors shadow-sm"
                                                            title="Cancel"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingUserId(u.sn)}
                                                        className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg group-hover:visible"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Add User Modal */}
                {isAddUserOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-white/20">
                            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New User</h2>
                                    <p className="text-indigo-200 text-sm mt-0.5">Create a new account for system access</p>
                                </div>
                                <button
                                    onClick={() => setIsAddUserOpen(false)}
                                    className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                {error && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 flex items-center border border-red-100">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2.5"></div>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleAddUser} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={addForm.name}
                                                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={addForm.number}
                                                onChange={(e) => setAddForm({ ...addForm, number: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                placeholder="555-0123"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">System ID</label>
                                        <input
                                            type="text"
                                            value={addForm.id}
                                            onChange={(e) => setAddForm({ ...addForm, id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                                            placeholder="user.id"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={addForm.password}
                                                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-12"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Role</label>
                                            <select
                                                value={addForm.role}
                                                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="User">User</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Status</label>
                                            <select
                                                value={addForm.status}
                                                onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Page Access</label>
                                        <MultiSelectDropdown
                                            options={pageAccessOptions}
                                            value={addForm.pageAccess}
                                            onChange={(value) => setAddForm({ ...addForm, pageAccess: value })}
                                            placeholder="Select pages for access..."
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t border-slate-100 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddUserOpen(false)}
                                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                            Create User
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
