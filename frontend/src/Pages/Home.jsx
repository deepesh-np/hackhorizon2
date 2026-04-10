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
        <div className="min-h-[calc(100vh-72px)] bg-surface p-4 md:p-8 pt-24 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight flex items-center gap-3">
                        Welcome, {user.name.split(' ')[0]}
                        <span className="text-sm px-3 py-1 bg-primary-container text-on-primary-container rounded-full font-label font-bold tracking-widest uppercase">
                            {user.role}
                        </span>
                    </h1>
                    <p className="text-secondary font-body mt-2 text-lg">
                        {user.role === 'vendor' ? 'Manage your pharmacy inventory & insights' : 'Compare medicines & upload prescriptions seamlessly'}
                    </p>
                </div>
                <button
                    onClick={logout}
                    className="px-8 py-3 bg-white border border-error/30 text-error rounded-full font-bold shadow-sm hover:bg-error/5 hover:border-error transition-all duration-300 font-body text-sm"
                >
                    Sign Out
                </button>
            </header>

            {user.role === 'user' || user.role === 'admin' ? (
                <main className="space-y-12">
                    {/* Patient / Admin View */}
                    <section className="bg-gradient-to-br from-surface-container-highest to-surface p-8 rounded-3xl shadow-[0px_20px_40px_rgba(11,28,48,0.06)] border border-white relative overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 max-w-3xl">
                            <h2 className="text-3xl font-headline font-bold text-on-surface mb-6">Medical Search Engine</h2>

                            <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-4 relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for Paracetamol, Dolo 650..."
                                    className="flex-1 px-8 py-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20 text-lg font-body text-on-surface transition-all placeholder:text-outline"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="px-10 py-5 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold hover:shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 text-lg"
                                >
                                    {isSearching ? 'Searching...' : 'Search'}
                                </button>
                            </form>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <span className="text-sm font-bold text-on-surface-variant flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">trending_up</span> Frequently Searched:
                                </span>
                                {['Paracetamol', 'Amoxicillin', 'Azithromycin', 'Crocin', 'Pantoprazole'].map((med) => (
                                    <button
                                        key={med}
                                        type="button"
                                        onClick={() => handleSearch(null, med)}
                                        className="px-4 py-1.5 bg-white/60 backdrop-blur-md border border-outline-variant/30 rounded-full text-sm font-bold text-slate-700 hover:bg-white hover:text-primary hover:border-primary/50 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:-translate-y-0.5"
                                    >
                                        {med}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {searchResults.length === 0 && !isSearching && searchQuery.length > 0 && (
                            <div className="mt-8 p-6 bg-white/50 backdrop-blur rounded-xl border border-outline-variant/30 text-secondary relative z-10">
                                No medicines found matching "{searchQuery}".
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className="mt-10 relative z-10">
                                <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Top Results ({searchResults.length})</h3>
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {searchResults.map(med => (
                                        <Link to={`/medicine/${med._id}`} key={med._id} className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-2 transition-all"></div>
                                            <div className="flex justify-between items-start mb-3 pl-3">
                                                <h3 className="font-bold text-xl font-headline text-on-surface leading-tight break-words pr-2">{med.name}</h3>
                                                {med.isBranded && (
                                                    <span className="text-[10px] uppercase font-bold bg-secondary-container text-on-secondary-container px-2 py-1 rounded border border-outline-variant/50 flex-shrink-0">Branded</span>
                                                )}
                                            </div>
                                            <div className="pl-3 mb-6">
                                                <p className="text-secondary text-sm font-medium mb-1 line-clamp-1">{med.genericName}</p>
                                                <p className="text-outline text-xs">Mfr: {med.manufacturer}</p>
                                            </div>
                                            <div className="pl-3 flex justify-between items-end mt-auto">
                                                <div>
                                                    <div className="text-xs text-secondary mb-1">Lowest Price</div>
                                                    <div className="text-primary font-bold text-2xl">₹{med.lowestPrice || med.averagePrice || '--'}</div>
                                                </div>
                                                <span className="text-xs bg-surface-container text-on-surface-variant font-bold px-3 py-1.5 rounded-lg border border-outline-variant/20 shadow-sm">
                                                    {med.dosageForm || 'N/A'}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            ) : (
                <main>
                    <VendorDashboard />
                </main>
                // <main>
                //     {/* Vendor View */}
                //     <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-[0px_20px_40px_rgba(11,28,48,0.04)]">
                //         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                //             <div>
                //                 <h2 className="text-3xl font-headline font-bold text-on-surface">Pharmacy Inventory</h2>
                //                 <p className="text-secondary text-sm mt-1">Manage active listings and stock.</p>
                //             </div>
                //             <button onClick={openAddModal} className="px-6 py-3 bg-on-surface text-white rounded-full font-bold shadow-md hover:bg-black transition-all hover:scale-105 active:scale-95 text-sm flex gap-2 items-center">
                //                 <span className="material-symbols-outlined text-sm">add</span> Add Medication
                //             </button>
                //         </div>

                //         {inventory.length === 0 ? (
                //             <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant text-secondary flex flex-col items-center justify-center">
                //                 <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-50">inventory_2</span>
                //                 <p className="font-bold text-lg text-on-surface-variant mb-2">Zero listings online</p>
                //                 <p className="max-w-md mx-auto text-sm">You haven't listed any medications yet. Add inventory to become visible to patients searching nearby.</p>
                //             </div>
                //         ) : (
                //             <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-x-auto shadow-sm">
                //                 <table className="w-full text-left font-body whitespace-nowrap min-w-[700px]">
                //                     <thead className="bg-surface-container-low border-b border-outline-variant/30">
                //                         <tr>
                //                             <th className="p-5 font-bold text-on-surface-variant uppercase text-xs tracking-wider">Item Details</th>
                //                             <th className="p-5 font-bold text-on-surface-variant uppercase text-xs tracking-wider">Pricing</th>
                //                             <th className="p-5 font-bold text-on-surface-variant uppercase text-xs tracking-wider">Stock</th>
                //                             <th className="p-5 font-bold text-on-surface-variant uppercase text-xs tracking-wider text-right">Actions</th>
                //                         </tr>
                //                     </thead>
                //                     <tbody>
                //                         {inventory.map(item => (
                //                             <tr key={item._id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface transition-colors group">
                //                                 <td className="p-5">
                //                                     <div className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">{item.medicine?.name || 'Unknown'}</div>
                //                                     <div className="text-xs text-secondary mt-1">{item.medicine?.genericName || '-'}</div>
                //                                 </td>
                //                                 <td className="p-5">
                //                                     <div className="text-on-surface font-bold">₹{item.price}</div>
                //                                     {item.mrp && <div className="text-xs line-through text-outline mt-1">MRP: ₹{item.mrp}</div>}
                //                                 </td>
                //                                 <td className="p-5">
                //                                     <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${item.stock > 10 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20'}`}>
                //                                         <span className={`w-1.5 h-1.5 rounded-full ${item.stock > 10 ? 'bg-primary' : 'bg-error'}`}></span>
                //                                         {item.stock} in stock
                //                                     </span>
                //                                 </td>
                //                                 <td className="p-5 text-right">
                //                                     <div className="flex gap-1 justify-end">
                //                                         <button onClick={() => openEditModal(item)} className="p-2 text-secondary hover:text-primary transition-colors rounded-full hover:bg-primary/10" title="Edit">
                //                                             <span className="material-symbols-outlined text-[20px]">edit</span>
                //                                         </button>
                //                                         <button onClick={() => handleDeleteInventory(item._id)} className="p-2 text-secondary hover:text-error transition-colors rounded-full hover:bg-error/10" title="Delete">
                //                                             <span className="material-symbols-outlined text-[20px]">delete</span>
                //                                         </button>
                //                                     </div>
                //                                 </td>
                //                             </tr>
                //                         ))}
                //                     </tbody>
                //                 </table>
                //             </div>
                //         )}
                //     </section>
                // </main>
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
    );
}

export default Home;