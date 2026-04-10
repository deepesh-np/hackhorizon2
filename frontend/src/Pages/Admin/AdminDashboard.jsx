import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import api from '../../services/api';

function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('users');

    // Users state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [roleFilter, setRoleFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Pending vendors state
    const [pendingVendors, setPendingVendors] = useState([]);
    const [vendorsLoading, setVendorsLoading] = useState(false);

    // Action feedback
    const [actionMsg, setActionMsg] = useState(null);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            navigate('/home');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user?.role === 'admin') {
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'vendors') fetchPendingVendors();
        }
    }, [activeTab, user, roleFilter]);

    // ── GET /admin/users ──
    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const params = new URLSearchParams();
            if (roleFilter) params.append('role', roleFilter);
            if (searchQuery) params.append('search', searchQuery);
            const res = await api.get(`/admin/users?${params.toString()}`);
            if (res.data.success) {
                setUsers(res.data.users || []);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setUsersLoading(false);
        }
    };

    // ── GET /admin/vendors/pending ──
    const fetchPendingVendors = async () => {
        setVendorsLoading(true);
        try {
            const res = await api.get('/admin/vendors/pending');
            if (res.data.success) {
                setPendingVendors(res.data.vendors || []);
            }
        } catch (err) {
            console.error("Failed to fetch pending vendors", err);
        } finally {
            setVendorsLoading(false);
        }
    };

    // ── PUT /admin/vendors/:id/verify ──
    const handleVerifyVendor = async (vendorId, approve) => {
        try {
            const res = await api.put(`/admin/vendors/${vendorId}/verify`, { approve });
            if (res.data.success) {
                setActionMsg({ type: 'success', text: res.data.message });
                fetchPendingVendors();
            }
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        }
    };

    // ── PUT /admin/users/:id/toggle-status ──
    const handleToggleStatus = async (userId) => {
        try {
            const res = await api.put(`/admin/users/${userId}/toggle-status`);
            if (res.data.success) {
                setActionMsg({ type: 'success', text: res.data.message });
                fetchUsers();
            }
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        }
    };

    // ── DELETE /admin/users/:id ──
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            const res = await api.delete(`/admin/users/${userId}`);
            if (res.data.success) {
                setActionMsg({ type: 'success', text: res.data.message });
                fetchUsers();
            }
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center text-secondary">Loading...</div>;
    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-[calc(100vh-72px)] bg-surface pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight flex items-center gap-3">
                        Admin Dashboard
                        <span className="text-xs px-3 py-1 bg-error text-on-error rounded-full font-label font-bold tracking-widest uppercase">Admin</span>
                    </h1>
                    <p className="text-secondary font-body mt-2 text-lg">Manage users, vendors, and platform settings</p>
                </div>
            </header>

            {/* Feedback */}
            {actionMsg && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex justify-between items-center ${
                    actionMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container'
                }`}>
                    {actionMsg.text}
                    <button onClick={() => setActionMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'users' ? 'bg-on-surface text-white shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">group</span> All Users
                </button>
                <button
                    onClick={() => setActiveTab('vendors')}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'vendors' ? 'bg-on-surface text-white shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">storefront</span> Pending Vendors
                    {pendingVendors.length > 0 && (
                        <span className="bg-error text-on-error text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{pendingVendors.length}</span>
                    )}
                </button>
            </div>

            {/* ── Users Tab ── */}
            {activeTab === 'users' && (
                <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:border-primary text-sm font-body"
                            />
                            <button type="submit" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold">Search</button>
                        </form>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-sm font-body focus:outline-none focus:border-primary"
                        >
                            <option value="">All Roles</option>
                            <option value="user">Users</option>
                            <option value="vendor">Vendors</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>

                    {usersLoading ? (
                        <div className="text-center py-10 text-secondary animate-pulse">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-outline-variant/30">
                            <table className="w-full text-left font-body min-w-[700px]">
                                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                                    <tr>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">User</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Role</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Status</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Joined</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-on-surface">{u.name}</div>
                                                <div className="text-xs text-secondary">{u.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                                    u.role === 'admin' ? 'bg-error/10 text-error' :
                                                    u.role === 'vendor' ? 'bg-secondary-container text-on-secondary-container' :
                                                    'bg-primary/10 text-primary'
                                                }`}>{u.role}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${u.isActive ? 'text-primary' : 'text-error'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-primary' : 'bg-error'}`}></span>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-secondary">
                                                {new Date(u.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    {u._id !== user._id && (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleStatus(u._id)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                                    u.isActive ? 'bg-surface-container-high text-on-surface-variant hover:bg-error/10 hover:text-error' : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                                }`}
                                                            >
                                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u._id)}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-error/10 text-error hover:bg-error/20 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* ── Pending Vendors Tab ── */}
            {activeTab === 'vendors' && (
                <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Vendors Awaiting Verification</h2>

                    {vendorsLoading ? (
                        <div className="text-center py-10 text-secondary animate-pulse">Loading pending vendors...</div>
                    ) : pendingVendors.length === 0 ? (
                        <div className="text-center py-16 text-secondary flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-5xl text-outline opacity-50">verified</span>
                            <p className="font-bold text-on-surface-variant">All vendors are verified</p>
                            <p className="text-sm">No pending verification requests.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingVendors.map(v => (
                                <div key={v._id} className="p-6 rounded-2xl border border-outline-variant/30 bg-surface hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-on-surface text-lg">{v.name}</h3>
                                            <p className="text-sm text-secondary mb-2">{v.email}</p>
                                            {v.vendorDetails && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                    <div><span className="text-outline">Pharmacy:</span> <span className="text-on-surface font-medium">{v.vendorDetails.pharmacyName}</span></div>
                                                    <div><span className="text-outline">License:</span> <span className="text-on-surface font-medium">{v.vendorDetails.licenseNumber}</span></div>
                                                    {v.vendorDetails.address?.city && (
                                                        <div><span className="text-outline">Location:</span> <span className="text-on-surface font-medium">{v.vendorDetails.address.city}, {v.vendorDetails.address.state}</span></div>
                                                    )}
                                                    {v.phone && <div><span className="text-outline">Phone:</span> <span className="text-on-surface font-medium">{v.phone}</span></div>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleVerifyVendor(v._id, true)}
                                                className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-bold text-sm hover:shadow-lg transition-all"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleVerifyVendor(v._id, false)}
                                                className="px-6 py-2.5 bg-error text-on-error rounded-full font-bold text-sm hover:shadow-lg transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default AdminDashboard;
