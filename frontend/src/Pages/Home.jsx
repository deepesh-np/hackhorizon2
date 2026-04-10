import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../services/api';
import { VendorDashboard } from '../vendor/pages/index'

function Home() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    // Patient Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Vendor Inventory State
    const [inventory, setInventory] = useState([]);

    // Vendor Add/Edit Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalForm, setModalForm] = useState({ medicineId: '', price: '', mrp: '', discount: '', stock: '', expiryDate: '', batchNumber: '' });
    const [modalError, setModalError] = useState(null);
    const [modalSaving, setModalSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (user?.role === 'vendor') {
            fetchInventory();
        }
    }, [user]);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/vendor/inventory');
            if (res.data.success) {
                setInventory(res.data.inventory || []);
            }
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        }
    };

    const handleSearch = async (e, directQuery = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const query = directQuery || searchQuery;
        if (!query.trim()) return;

        if (directQuery) setSearchQuery(directQuery); // update input field visually

        setIsSearching(true);
        try {
            const res = await api.get(`/medicines/search?q=${query}`);
            if (res.data.success) {
                setSearchResults(res.data.medicines || []);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    // ── Vendor CRUD Handlers ──

    const openAddModal = () => {
        setEditingItem(null);
        setModalForm({ medicineId: '', price: '', mrp: '', discount: '', stock: '', expiryDate: '', batchNumber: '' });
        setModalError(null);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setModalForm({
            medicineId: item.medicine?._id || '',
            price: item.price || '',
            mrp: item.mrp || '',
            discount: item.discount || '',
            stock: item.stock || '',
            expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
            batchNumber: item.batchNumber || ''
        });
        setModalError(null);
        setShowModal(true);
    };

    // POST /vendor/inventory
    const handleAddInventory = async () => {
        setModalSaving(true);
        setModalError(null);
        try {
            const res = await api.post('/vendor/inventory', {
                medicineId: modalForm.medicineId,
                price: parseFloat(modalForm.price),
                mrp: modalForm.mrp ? parseFloat(modalForm.mrp) : undefined,
                discount: modalForm.discount ? parseFloat(modalForm.discount) : undefined,
                stock: modalForm.stock ? parseInt(modalForm.stock) : undefined,
                expiryDate: modalForm.expiryDate || undefined,
                batchNumber: modalForm.batchNumber || undefined,
            });
            if (res.data.success) {
                setShowModal(false);
                fetchInventory();
            }
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to add inventory');
        } finally {
            setModalSaving(false);
        }
    };

    // PUT /vendor/inventory/:id
    const handleUpdateInventory = async () => {
        setModalSaving(true);
        setModalError(null);
        try {
            const res = await api.put(`/vendor/inventory/${editingItem._id}`, {
                price: parseFloat(modalForm.price),
                mrp: modalForm.mrp ? parseFloat(modalForm.mrp) : undefined,
                discount: modalForm.discount ? parseFloat(modalForm.discount) : undefined,
                stock: modalForm.stock ? parseInt(modalForm.stock) : undefined,
                expiryDate: modalForm.expiryDate || undefined,
                batchNumber: modalForm.batchNumber || undefined,
            });
            if (res.data.success) {
                setShowModal(false);
                fetchInventory();
            }
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to update inventory');
        } finally {
            setModalSaving(false);
        }
    };

    // DELETE /vendor/inventory/:id
    const handleDeleteInventory = async (itemId) => {
        if (!window.confirm('Remove this medicine from your inventory?')) return;
        try {
            const res = await api.delete(`/vendor/inventory/${itemId}`);
            if (res.data.success) {
                fetchInventory();
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            handleUpdateInventory();
        } else {
            handleAddInventory();
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-body text-secondary">Loading intelligence dashboard...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pt-28 pb-20 relative overflow-hidden">
            {/* High-Visibility Branded Background */}
            <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background z-10"></div>
                <img src="/vitality-bg.png" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-20">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-on-background tracking-tighter flex items-center gap-4">
                            Welcome, {user.name.split(' ')[0]}
                            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-bold tracking-widest uppercase border border-primary/20">
                                {user.role}
                            </span>
                        </h1>
                        <p className="text-on-surface-variant font-medium mt-3 text-lg max-w-2xl">
                            {user.role === 'vendor' ? 'Optimize your pharmacy operations with real-time intelligence.' : 'Discover clinically-mapped alternatives and save on healthcare.'}
                        </p>
                        {user.role !== 'vendor' && (
                            <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl shadow-sm">
                                <span className="material-symbols-outlined text-primary text-sm">verified</span>
                                <p className="text-sm font-black text-primary italic tracking-tight italic">
                                    "Same active salt, different brand name; the healing power stays exactly the same."
                                </p>
                            </div>
                        )}
                    </div>
                </header>

            {user.role === 'user' || user.role === 'admin' ? (
                <main className="space-y-12">
                    {/* Patient / Admin View */}
                    <section className="relative overflow-hidden">
                        <div className="max-w-4xl">
                            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Intelligence Engine</h2>
                            <h3 className="text-4xl font-black text-on-background tracking-tighter mb-8">What are you searching for today?</h3>

                            <form onSubmit={(e) => handleSearch(e)} className="relative group">
                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-2xl">search</span>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search medicine brand or generic name..."
                                    className="w-full pl-16 pr-40 py-6 rounded-3xl bg-white border border-outline shadow-xl shadow-on-background/5 focus:outline-none focus:ring-4 focus:ring-primary/10 text-xl font-body text-on-background transition-all placeholder:text-on-surface-variant/50"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="absolute right-3 top-3 bottom-3 px-8 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                                >
                                    {isSearching ? 'Processing...' : 'Search'}
                                </button>
                            </form>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">trending_up</span> Trends:
                                </span>
                                {['Paracetamol', 'Dolo 650', 'Amoxicillin', 'Azithromycin'].map((med) => (
                                    <button
                                        key={med}
                                        type="button"
                                        onClick={() => handleSearch(null, med)}
                                        className="px-5 py-2 bg-surface-container border border-outline rounded-xl text-sm font-bold text-on-surface hover:bg-white hover:border-primary/50 hover:text-primary transition-all shadow-sm"
                                    >
                                        {med}
                                    </button>
                                ))}
                            </div>

                            {/* Home UI Enrichment: Quick Actions */}
                            <div className="mt-20">
                                <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-6">Expert Services</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { title: 'Interaction Checker', desc: 'Scan drug safety profiles', icon: 'shield_lock', color: 'bg-emerald-500' },
                                        { title: 'Cheap Alternatives', desc: 'Save up to 70% on meds', icon: 'savings', color: 'bg-blue-500' },
                                        { title: 'Pharmacy Locator', desc: 'Find certified vendors', icon: 'location_on', color: 'bg-orange-500' },
                                        { title: 'Clinical Analytics', desc: 'Market pricing trends', icon: 'monitoring', color: 'bg-purple-500' }
                                    ].map((action, i) => (
                                        <div key={i} className="card-premium p-6 group hover:border-primary/30 transition-all cursor-pointer">
                                            <div className={`${action.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${action.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                                                <span className="material-symbols-outlined">{action.icon}</span>
                                            </div>
                                            <h4 className="text-lg font-black text-on-background mb-2">{action.title}</h4>
                                            <p className="text-sm text-on-surface-variant leading-relaxed">{action.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {searchResults.length === 0 && !isSearching && searchQuery.length > 0 && (
                            <div className="mt-8 p-6 bg-white/50 backdrop-blur rounded-xl border border-outline-variant/30 text-secondary relative z-10">
                                No medicines found matching "{searchQuery}".
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className="mt-20">
                                <div className="flex justify-between items-end mb-10">
                                    <h3 className="text-2xl font-black text-on-background tracking-tight">Intelligence Results ({searchResults.length})</h3>
                                    <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Pricing Updated 2m ago</p>
                                </div>
                                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {searchResults.map(med => (
                                        <Link to={`/medicine/${med._id}`} key={med._id} className="card-premium p-8 group relative flex flex-col">
                                            <div className="absolute top-6 right-6 p-2 rounded-xl bg-surface group-hover:bg-primary/10 transition-colors">
                                                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">arrow_outward</span>
                                            </div>
                                            
                                            <div className="mb-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    {med.isBranded && (
                                                        <span className="text-[10px] font-black uppercase tracking-wider bg-on-background text-white px-2 py-0.5 rounded">Branded</span>
                                                    )}
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-surface-container text-on-surface-variant px-2 py-0.5 rounded border border-outline">
                                                        {med.dosageForm || 'Generic'}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black text-on-background tracking-tight group-hover:text-primary transition-colors">{med.name}</h3>
                                                <p className="text-on-surface-variant text-sm font-medium mt-1 uppercase tracking-wide">{med.genericName}</p>
                                            </div>

                                            <div className="mt-auto pt-8 border-t border-outline/50 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Market Avg</p>
                                                    <div className="text-3xl font-black text-primary tracking-tighter">₹{med.lowestPrice || med.averagePrice || '--'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Manufacturer</p>
                                                    <p className="text-xs font-bold text-on-surface line-clamp-1">{med.manufacturer}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchResults.length === 0 && !isSearching && searchQuery.length === 0 && (
                            <div className="mt-28">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black text-on-background tracking-tighter">Clinical Categories</h3>
                                    <button className="text-sm font-bold text-primary hover:underline">View Intelligence Network</button>
                                </div>
                                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide no-scrollbar">
                                    {[
                                        { name: 'Cardiology', icon: 'cardiology', count: 124 },
                                        { name: 'Antibiotics', icon: 'pill', count: 86 },
                                        { name: 'Gastric Care', icon: 'stomach', count: 42 },
                                        { name: 'Vitamins', icon: 'medication', count: 95 },
                                        { name: 'Pain Relief', icon: 'psychology', count: 110 },
                                        { name: 'Dermatology', icon: 'vaccines', count: 70 }
                                    ].map((cat, i) => (
                                        <div key={i} className="flex-shrink-0 w-44 card-premium p-6 text-center group cursor-pointer hover:bg-primary hover:text-white transition-all">
                                            <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors">
                                                <span className="material-symbols-outlined text-primary group-hover:text-white">{cat.icon}</span>
                                            </div>
                                            <h4 className="font-bold text-sm tracking-tight">{cat.name}</h4>
                                            <p className="text-[10px] uppercase font-black tracking-widest mt-1 opacity-50">{cat.count} Medicines</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Expert Safety Corner */}
                                <div className="mt-28 p-12 rounded-[40px] bg-on-background text-white relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 grayscale invert pointer-events-none">
                                        <img src="/med-bg.png" alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="relative z-10 max-w-2xl">
                                        <span className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4 block">Expert Clinical Tip</span>
                                        <h2 className="text-4xl font-black tracking-tighter mb-6 leading-[1.1]">Always verify dosage info with your medical practitioner.</h2>
                                        <p className="text-white/60 text-lg mb-8 leading-relaxed">Vitality 2.0 uses AI-driven intelligence to map generics, but professional consultation is the final step for healthcare safety.</p>
                                        <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black hover:shadow-xl hover:shadow-primary/30 transition-all uppercase tracking-widest text-xs">Access Expert Network</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            ) : (
                <main>
                    <VendorDashboard />
                </main>
            )}

            {/* ── Add/Edit Inventory Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h2 className="text-2xl font-headline font-bold text-on-surface mb-6">
                            {editingItem ? 'Update Inventory' : 'Add to Inventory'}
                        </h2>

                        {modalError && (
                            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm font-bold">{modalError}</div>
                        )}

                        <form onSubmit={handleModalSubmit} className="space-y-4">
                            {!editingItem && (
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Medicine ID</label>
                                    <input
                                        type="text"
                                        value={modalForm.medicineId}
                                        onChange={(e) => setModalForm({ ...modalForm, medicineId: e.target.value })}
                                        required
                                        placeholder="Paste medicine ObjectId from DB"
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm"
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Price (₹)</label>
                                    <input type="number" step="0.01" value={modalForm.price} onChange={(e) => setModalForm({ ...modalForm, price: e.target.value })} required
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">MRP (₹)</label>
                                    <input type="number" step="0.01" value={modalForm.mrp} onChange={(e) => setModalForm({ ...modalForm, mrp: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Discount (%)</label>
                                    <input type="number" value={modalForm.discount} onChange={(e) => setModalForm({ ...modalForm, discount: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Stock Qty</label>
                                    <input type="number" value={modalForm.stock} onChange={(e) => setModalForm({ ...modalForm, stock: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Expiry Date</label>
                                    <input type="date" value={modalForm.expiryDate} onChange={(e) => setModalForm({ ...modalForm, expiryDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Batch No.</label>
                                    <input type="text" value={modalForm.batchNumber} onChange={(e) => setModalForm({ ...modalForm, batchNumber: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:outline-none font-body text-sm" />
                                </div>
                            </div>
                            <button type="submit" disabled={modalSaving}
                                className="w-full mt-4 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50 text-lg">
                                {modalSaving ? 'Saving...' : editingItem ? 'Update Inventory' : 'Add to Inventory'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default Home;