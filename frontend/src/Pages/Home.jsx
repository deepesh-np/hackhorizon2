import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../services/api';

function Home() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    
    // Patient Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Vendor Inventory State
    const [inventory, setInventory] = useState([]);

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
                setInventory(res.data.data.inventory || []);
            }
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const res = await api.get(`/medicines/search?q=${searchQuery}`);
            if (res.data.success) {
                setSearchResults(res.data.data.medicines);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-body text-secondary">Loading your intelligence dashboard...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-surface p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-headline font-bold text-on-surface">
                        Welcome, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-secondary font-body mt-2">
                        {user.role === 'vendor' ? 'Manage your pharmacy inventory' : 'Compare medicines & upload prescriptions'}
                    </p>
                </div>
                <button 
                    onClick={logout}
                    className="px-6 py-2 bg-error text-on-error rounded-full font-bold hover:opacity-90 transition-opacity font-body text-sm"
                >
                    Sign Out
                </button>
            </header>

            {user.role === 'user' ? (
                <main className="space-y-12">
                    {/* Patient View */}
                    <section className="bg-surface-container-highest p-8 rounded-2xl shadow-sm">
                        <h2 className="text-2xl font-headline font-bold text-on-surface mb-6">Search Medicines</h2>
                        
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for Paracetamol, Dolo 650..." 
                                className="flex-1 px-6 py-4 rounded-full bg-surface text-on-surface border border-outline-variant focus:outline-none focus:border-primary font-body"
                            />
                            <button 
                                type="submit" 
                                disabled={isSearching}
                                className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold hover:shadow-[0_10px_20px_rgba(0,110,47,0.2)] transition-shadow disabled:opacity-50"
                            >
                                {isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {searchResults.map(med => (
                                    <div key={med._id} className="bg-surface p-6 rounded-xl border border-outline-variant/50">
                                        <h3 className="font-bold text-lg text-on-surface mb-1">{med.name}</h3>
                                        <p className="text-secondary text-sm mb-4">{med.manufacturer}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-primary font-bold">₹{med.prices[0]?.price || 'N/A'}</span>
                                            <span className="text-xs bg-surface-container-high px-2 py-1 rounded text-on-surface-variant font-bold">
                                                {med.type || 'Tablet'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            ) : (
                <main>
                    {/* Vendor View */}
                    <section className="bg-surface-container-highest p-8 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-headline font-bold text-on-surface">Your Inventory</h2>
                            <button className="px-6 py-2 bg-primary text-on-primary rounded-full font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors font-body text-sm">
                                + Add Medicine
                            </button>
                        </div>
                        
                        {inventory.length === 0 ? (
                            <div className="text-center py-12 bg-surface rounded-xl border border-outline-variant/30 text-secondary">
                                You don't have any medicines in your inventory yet.
                            </div>
                        ) : (
                            <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
                                <table className="w-full text-left font-body">
                                    <thead className="bg-surface-container-low border-b border-outline-variant/30">
                                        <tr>
                                            <th className="p-4 font-bold text-on-surface-variant">Medicine Name</th>
                                            <th className="p-4 font-bold text-on-surface-variant">Price (₹)</th>
                                            <th className="p-4 font-bold text-on-surface-variant">Stock Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.map(item => (
                                            <tr key={item._id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-lowest/50">
                                                <td className="p-4 font-medium text-on-surface">{item.medicine?.name || 'Unknown'}</td>
                                                <td className="p-4 text-on-surface">₹{item.price}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${item.stockQuantity > 10 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                                                        {item.stockQuantity}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </main>
            )}
        </div>
    );
}

export default Home;