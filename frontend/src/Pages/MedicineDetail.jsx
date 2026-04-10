import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import PharmacyMap from '../Components/PharmacyMap';

function MedicineDetail() {
    const { id } = useParams();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const compareFrom = searchParams.get('compareFrom');

    const [medicine, setMedicine] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [alternatives, setAlternatives] = useState(null);
    const [priceComparison, setPriceComparison] = useState(null);
    const [pharmacies, setPharmacies] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [drugInfo, setDrugInfo] = useState(null);
    const [drugInfoLoading, setDrugInfoLoading] = useState(false);
    const [drugInfoUrl, setDrugInfoUrl] = useState('');
    const [comparison, setComparison] = useState(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchMedicineDetails();
        fetchPriceComparison();
        fetchNearbyPharmacies();
        
        if (compareFrom && compareFrom !== id) {
            fetchComparison(compareFrom, id);
        } else {
            setComparison(null);
        }
    }, [id, compareFrom]);

    const handleAddToCart = async (medicineId, vendorId) => {
        try {
            const res = await api.post('/cart', { medicineId, vendorId, quantity: 1 });
            if(res.data.success) {
                alert('Added to Cart!');
            }
        } catch(error) {
            console.error('Failed to add to cart', error);
            alert('Could not add to cart. Please log in.');
        }
    };

    const fetchComparison = async (fromId, toId) => {
        setComparisonLoading(true);
        try {
            const res = await api.get(`/medicines/${fromId}/compare/${toId}`);
            if (res.data.success && res.data.comparison) {
                setComparison(res.data.comparison);
            }
        } catch (err) {
            console.error("Failed to fetch comparison", err);
        } finally {
            setComparisonLoading(false);
        }
    };

    const fetchMedicineDetails = async () => {
        try {
            const res = await api.get(`/medicines/${id}`);
            if (res.data.success) {
                setMedicine(res.data.medicine);
                setPricing(res.data.pricing);
                setAlternatives(res.data.alternatives || null);
            }
        } catch (err) {
            console.error("Failed to fetch medicine details", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPriceComparison = async () => {
        try {
            const res = await api.get(`/medicines/${id}/prices`);
            if (res.data.success) {
                setPriceComparison(res.data.priceComparison);
            }
        } catch (err) {
            console.error("Failed to fetch price comparison", err);
        }
    };

    const fetchNearbyPharmacies = async () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    const res = await api.get(`/medicines/${id}/pharmacies?lat=${latitude}&lng=${longitude}&radius=50`);
                    if (res.data.success) {
                        setPharmacies(res.data.pharmacies);
                    }
                } catch (err) {
                    console.error("Failed to fetch nearby pharmacies", err);
                }
            },
            () => { console.log("Geolocation permission denied"); }
        );
    };

    // ── GET /medicines/info?url=... (Scrapper proxy) ──
    const fetchDrugInfo = async (url) => {
        if (!url) return;
        setDrugInfoLoading(true);
        setDrugInfo(null);
        try {
            const res = await api.get(`/medicines/info?url=${encodeURIComponent(url)}`);
            if (res.data.success) {
                setDrugInfo(res.data.drugInfo);
            }
        } catch (err) {
            console.error("Failed to fetch drug info from scrapper", err);
            setDrugInfo({ error: err.response?.data?.message || 'Scrapper service unavailable. Make sure the Python scrapper is running on port 8000.' });
        } finally {
            setDrugInfoLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-secondary font-body text-lg animate-pulse">Loading medicine details...</div>
            </div>
        );
    }

    if (!medicine) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
                <span className="material-symbols-outlined text-6xl text-outline">error</span>
                <p className="text-secondary font-body text-lg">Medicine not found.</p>
                <Link to="/home" className="text-primary font-bold hover:underline">← Back to Dashboard</Link>
            </div>
        );
    }

    const tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'alternatives', label: `Alternatives (${alternatives?.totalAlternatives || 0})` },
        { key: 'prices', label: `Price Comparison (${priceComparison?.count || 0})` },
        { key: 'pharmacies', label: `Nearby Pharmacies` },
        { key: 'druginfo', label: 'Drug Info (MedlinePlus)' },
    ];

    return (
        <div className="min-h-[calc(100vh-72px)] bg-surface pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm font-body text-secondary">
                <Link to="/home" className="text-primary hover:underline">Dashboard</Link>
                <span className="mx-2">›</span>
                <span className="text-on-surface font-medium">{medicine.name}</span>
            </nav>



            {/* Header Card */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-[0px_20px_40px_rgba(11,28,48,0.04)] relative overflow-hidden mb-8">
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h1 className="text-4xl font-headline font-bold text-on-surface">{medicine.name}</h1>
                            {medicine.isBranded && (
                                <span className="text-xs uppercase font-bold bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">Branded</span>
                            )}
                            {medicine.prescriptionRequired && (
                                <span className="text-xs uppercase font-bold bg-error-container text-on-error-container px-3 py-1 rounded-full">Rx Required</span>
                            )}
                        </div>
                        <p className="text-secondary text-lg mb-1">{medicine.genericName}</p>
                        <p className="text-outline text-sm mb-4">by {medicine.manufacturer} • {medicine.brand}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-lg">{medicine.dosageForm}</span>
                            <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-lg">{medicine.therapeuticCategory}</span>
                            {medicine.packSize && <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-lg">Pack: {medicine.packSize}</span>}
                        </div>

                        {medicine.activeIngredients?.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2">Active Ingredients</h3>
                                <div className="flex flex-wrap gap-2">
                                    {medicine.activeIngredients.map((ing, i) => (
                                        <span key={i} className="px-3 py-1 bg-primary-fixed/20 text-on-primary-fixed-variant text-xs font-bold rounded-full">
                                            {ing.name} {ing.strength && `(${ing.strength})`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price Summary */}
                    <div className="bg-surface-container-low p-6 rounded-2xl min-w-[220px] text-center flex flex-col justify-center">
                        <div className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2">Price Range</div>
                        {pricing?.minPrice ? (
                            <>
                                <div className="text-primary font-bold text-3xl font-headline mb-1">₹{pricing.minPrice} - ₹{pricing.maxPrice}</div>
                                <div className="text-secondary text-sm">Avg: ₹{pricing.avgPrice}</div>
                                <div className="text-xs text-outline mt-2">Available at {pricing.availableAt} vendor(s)</div>
                            </>
                        ) : (
                            <>
                                <div className="text-primary font-bold text-3xl font-headline mb-1">₹{medicine.averagePrice || '--'}</div>
                                <div className="text-secondary text-sm">Average price</div>
                            </>
                        )}

                        {priceComparison?.vendors?.length > 0 ? (
                            <div className="mt-5 flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1 text-left">
                                <div className="text-[10px] uppercase font-bold text-on-surface-variant flex justify-between items-center px-1 mb-1">
                                    <span>Select Pharmacy</span>
                                    <span>Price</span>
                                </div>
                                {priceComparison.vendors.map((v, i) => (
                                    <div key={v.vendorId} className="flex justify-between items-center p-2.5 rounded-xl bg-surface shadow-sm border border-outline-variant/50 hover:border-primary/50 transition-colors group">
                                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                                            <span className="text-xs font-bold text-on-surface leading-tight truncate" title={v.vendorName}>{v.vendorName || "Verified Pharmacy"}</span>
                                            <span className="text-xs text-primary font-black mt-0.5">₹{v.price}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleAddToCart(medicine._id, v.vendorId)}
                                            className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0"
                                        >
                                            <span className="material-symbols-outlined text-[14px] mr-1">add_shopping_cart</span>
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <button 
                                disabled
                                className="mt-4 w-full bg-surface-container-high text-on-surface-variant font-bold px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[18px]">remove_shopping_cart</span>
                                Out of Stock
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {(medicine.description || medicine.sideEffects?.length > 0 || medicine.warnings?.length > 0) && (
                <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm mb-8">
                    {medicine.description && (
                        <div className="mb-6">
                            <h3 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Description</h3>
                            <p className="text-on-surface font-body">{medicine.description}</p>
                        </div>
                    )}
                    {medicine.sideEffects?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Side Effects</h3>
                            <div className="flex flex-wrap gap-2">
                                {medicine.sideEffects.map((se, i) => (
                                    <span key={i} className="px-3 py-1 bg-error-container/30 text-on-error-container text-xs rounded-full">{se}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {medicine.warnings?.length > 0 && (
                        <div>
                            <h3 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Warnings</h3>
                            <ul className="list-disc pl-5 text-on-surface text-sm space-y-1">
                                {medicine.warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            {comparisonLoading && (
                <div className="bg-white border border-outline-variant/30 p-4 rounded-2xl mb-8 flex gap-4 items-center animate-pulse shadow-sm">
                    <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                    <div>
                        <div className="h-4 bg-primary/20 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-primary/10 rounded w-64"></div>
                    </div>
                </div>
            )}

            {!comparisonLoading && comparison && (
                <div className="mb-8 p-5 rounded-2xl border border-outline-variant/30 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-surface-container-lowest text-on-surface">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="material-symbols-outlined text-2xl text-primary mt-0.5">info</span>
                        <div>
                            <h2 className="text-base font-bold">Factual Comparison</h2>
                            <p className="text-xs font-body text-secondary mt-0.5">{comparison.summary}</p>
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        {comparison.originalComposition && (
                            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20">
                                <h3 className="font-bold text-[10px] uppercase tracking-wider mb-1 text-on-surface-variant">Original Composition</h3>
                                <p className="text-xs leading-relaxed text-secondary">{comparison.originalComposition}</p>
                            </div>
                        )}
                        {comparison.alternativeComposition && (
                            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20">
                                <h3 className="font-bold text-[10px] uppercase tracking-wider mb-1 text-on-surface-variant">Alternative Composition</h3>
                                <p className="text-xs leading-relaxed text-secondary">{comparison.alternativeComposition}</p>
                            </div>
                        )}
                    </div>

                    {comparison.facts?.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-bold text-[10px] uppercase tracking-wider mb-1 text-on-surface-variant">Key Facts</h3>
                            <ul className="list-disc pl-4 text-xs space-y-1 text-secondary">
                                {comparison.facts.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                        </div>
                    )}

                    {(comparison.originalGovLink || comparison.alternativeGovLink) && (
                        <div className="mt-4 flex flex-col md:flex-row gap-3">
                            {comparison.originalGovLink && (
                                <a href={comparison.originalGovLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-surface-container-low border border-primary/10 text-primary p-2 rounded-lg flex gap-2 text-xs font-bold items-center hover:bg-primary/5 transition-colors">
                                    <span className="material-symbols-outlined text-sm">link</span>
                                    <span>Original Medical Description</span>
                                </a>
                            )}
                            {comparison.alternativeGovLink && (
                                <a href={comparison.alternativeGovLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-surface-container-low border border-primary/10 text-primary p-2 rounded-lg flex gap-2 text-xs font-bold items-center hover:bg-primary/5 transition-colors">
                                    <span className="material-symbols-outlined text-sm">link</span>
                                    <span>Alternative Medical Description</span>
                                </a>
                            )}
                        </div>
                    )}
                    
                    {/* Add to Cart directly inside the Comparison banner */}
                    <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col gap-3 bg-surface-container-low p-4 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-on-surface">Ready to switch to this alternative?</p>
                            <p className="text-xs text-secondary mt-0.5">Select a pharmacy below to add it directly to your cart.</p>
                        </div>
                        
                        {priceComparison?.vendors?.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {priceComparison.vendors.slice(0,3).map((v) => (
                                    <button 
                                        key={v.vendorId}
                                        onClick={() => handleAddToCart(medicine._id, v.vendorId)} 
                                        className="bg-surface border border-emerald-500/30 text-emerald-700 hover:bg-emerald-500 hover:text-white font-bold px-4 py-2 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 text-xs flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                                        {v.vendorName || "Verified"} - ₹{v.price}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <button 
                                disabled
                                className="bg-surface-container-high w-fit text-on-surface-variant font-black px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 opacity-60 cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[18px]">block</span>
                                Currently Unavailable
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.key
                                ? 'bg-on-surface text-white shadow-md'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-xl font-headline font-bold text-on-surface mb-4">Storage & Regulatory</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {medicine.storageInstructions && (
                            <div>
                                <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-1">Storage</h4>
                                <p className="text-on-surface">{medicine.storageInstructions}</p>
                            </div>
                        )}
                        {medicine.regulatoryApproval && (
                            <div>
                                <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-1">Regulatory Approval</h4>
                                <p className="text-on-surface">
                                    {medicine.regulatoryApproval.approvedBy || 'N/A'}
                                    {medicine.regulatoryApproval.isApproved && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Approved ✓</span>}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {activeTab === 'alternatives' && alternatives && (
                <section className="space-y-6">

                    {alternatives.generics?.count > 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                            <h2 className="text-xl font-headline font-bold text-on-surface mb-4">
                                Generic Alternatives ({alternatives.generics.count})
                            </h2>
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {alternatives.generics.medicines.map((alt, idx) => {
                                    const Wrapper = alt._id ? Link : 'div';
                                    const wrapperProps = alt._id
                                        ? { to: `/medicine/${alt._id}?compareFrom=${id}`, key: alt._id }
                                        : { key: `ai-gen-${idx}` };
                                    return (
                                        <Wrapper {...wrapperProps} className="bg-surface p-5 rounded-2xl border border-outline-variant/30 hover:shadow-lg hover:-translate-y-0.5 transition-all group relative">
                                            <div className="font-bold text-on-surface group-hover:text-primary transition-colors mb-1">{alt.name}</div>
                                            <div className="text-secondary text-sm mb-1">{alt.genericName}</div>
                                            <div className="text-outline text-xs mb-3">{alt.manufacturer}</div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-primary font-bold text-xl">₹{alt.lowestPrice || alt.averagePrice || '--'}</div>
                                                    {alt.savings > 0 && (
                                                        <div className="text-xs text-primary font-bold mt-1">Save ₹{alt.savings} ({alt.savingsPercent}%)</div>
                                                    )}
                                                    {!alt.isCurrentlyAvailable && (
                                                        <div className="text-[10px] text-error font-bold mt-1.5 uppercase tracking-wider">Currently Not Available</div>
                                                    )}
                                                </div>
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">Generic</span>
                                            </div>
                                        </Wrapper>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {alternatives.brandedAlternatives?.count > 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                            <h2 className="text-xl font-headline font-bold text-on-surface mb-4">
                                Branded Alternatives ({alternatives.brandedAlternatives.count})
                            </h2>
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {alternatives.brandedAlternatives.medicines.map((alt, idx) => {
                                    const Wrapper = alt._id ? Link : 'div';
                                    const wrapperProps = alt._id
                                        ? { to: `/medicine/${alt._id}?compareFrom=${id}`, key: alt._id }
                                        : { key: `ai-brand-${idx}` };
                                    return (
                                        <Wrapper {...wrapperProps} className="bg-surface p-5 rounded-2xl border border-outline-variant/30 hover:shadow-lg hover:-translate-y-0.5 transition-all group relative">
                                            <div className="font-bold text-on-surface group-hover:text-primary transition-colors mb-1">{alt.name}</div>
                                            <div className="text-secondary text-sm mb-1">{alt.manufacturer}</div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-primary font-bold text-xl">₹{alt.lowestPrice || alt.averagePrice || '--'}</div>
                                                    {!alt.isCurrentlyAvailable && (
                                                        <div className="text-[10px] text-error font-bold mt-1.5 uppercase tracking-wider">Currently Not Available</div>
                                                    )}
                                                </div>
                                                <span className="text-xs bg-secondary-container text-on-secondary-container px-2 py-1 rounded font-bold">Branded</span>
                                            </div>
                                        </Wrapper>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {alternatives?.totalAlternatives === 0 && (
                        <div className="bg-white p-10 rounded-3xl border border-outline-variant/30 text-center text-secondary">
                            No alternatives found for this medicine.
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'prices' && (
                <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Price Comparison Across Vendors</h2>
                    {priceComparison?.count > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-outline-variant/30">
                            <table className="w-full text-left font-body min-w-[500px]">
                                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                                    <tr>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Pharmacy</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Price</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">MRP</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Discount</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Stock</th>
                                        <th className="p-4 font-bold text-on-surface-variant text-xs uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priceComparison.vendors.map((v, i) => (
                                        <tr key={i} className={`border-b border-outline-variant/10 hover:bg-surface transition-colors ${i === 0 ? 'bg-primary/5' : ''}`}>
                                            <td className="p-4">
                                                <div className="font-bold text-on-surface">{v.pharmacyName}</div>
                                                {v.address?.city && <div className="text-xs text-secondary">{v.address.city}, {v.address.state}</div>}
                                            </td>
                                            <td className="p-4 font-bold text-primary text-lg">₹{v.price}</td>
                                            <td className="p-4 text-outline line-through">{v.mrp ? `₹${v.mrp}` : '-'}</td>
                                            <td className="p-4">
                                                {v.discount > 0 ? (
                                                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">{v.discount}% off</span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-sm text-on-surface">{v.stock || 'Available'}</td>
                                            <td className="p-4">
                                                <button onClick={() => handleAddToCart(medicine._id, v.vendorId)} className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold shadow hover:shadow-md transition">Add to Cart</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-secondary">No vendor pricing data available for this medicine.</div>
                    )}
                </section>
            )}

            {activeTab === 'pharmacies' && (
                <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Nearby Pharmacies</h2>
                    {pharmacies?.count > 0 ? (
                        <>
                            <PharmacyMap pharmacies={pharmacies.list} userLocation={userLocation} />
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-6">
                                {pharmacies.list.map((ph, i) => (
                                    <div key={i} className="bg-surface p-5 rounded-2xl border border-outline-variant/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-on-surface">{ph.pharmacyName}</div>
                                            {ph.distance && <span className="text-xs bg-surface-container-high px-2 py-1 rounded font-bold text-on-surface-variant">{ph.distance} km</span>}
                                        </div>
                                        {ph.address?.street && <div className="text-sm text-secondary mb-2">{ph.address.street}, {ph.address.city}</div>}
                                        {ph.phone && <div className="text-sm text-secondary">📞 {ph.phone}</div>}
                                        <div className="mt-3 flex justify-between items-center">
                                            <div className="text-primary font-bold text-lg">₹{ph.price || '--'}</div>
                                            <span className="text-xs text-secondary">Stock: {ph.stock || 'Unknown'}</span>
                                        </div>
                                        <div className="mt-4 border-t border-outline-variant/20 pt-4">
                                            <button onClick={() => handleAddToCart(medicine._id, ph.vendorId)} className="w-full bg-primary text-on-primary font-bold px-4 py-2 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all text-sm">Add to Cart</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-secondary">
                            <p className="mb-2">No nearby pharmacies found stocking this medicine.</p>
                            <p className="text-xs text-outline">Make sure location permission is enabled in your browser.</p>
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'druginfo' && (
                <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                    <h2 className="text-xl font-headline font-bold text-on-surface mb-2">External Drug Information</h2>
                    <p className="text-secondary text-sm mb-6">Fetch detailed drug data from MedlinePlus via the scrapper service.</p>

                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <input
                            type="url"
                            value={drugInfoUrl}
                            onChange={(e) => setDrugInfoUrl(e.target.value)}
                            placeholder="https://medlineplus.gov/druginfo/meds/a682159.html"
                            className="flex-1 px-5 py-3 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:border-primary font-body text-sm"
                        />
                        <button
                            onClick={() => fetchDrugInfo(drugInfoUrl)}
                            disabled={drugInfoLoading || !drugInfoUrl.trim()}
                            className="px-6 py-3 bg-on-surface text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-40"
                        >
                            {drugInfoLoading ? 'Fetching...' : 'Fetch Drug Info'}
                        </button>
                    </div>

                    {drugInfo?.error && (
                        <div className="p-4 bg-error-container/50 text-on-error-container rounded-xl text-sm mb-4">{drugInfo.error}</div>
                    )}

                    {drugInfo && !drugInfo.error && (
                        <div className="space-y-6">
                            <div className="bg-surface-container-low p-5 rounded-2xl">
                                <h3 className="text-2xl font-headline font-bold text-on-surface mb-1">{drugInfo.drug}</h3>
                                {drugInfo.source_url && <a href={drugInfo.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View on MedlinePlus →</a>}
                            </div>

                            {drugInfo.uses && (
                                <div>
                                    <h4 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Uses</h4>
                                    <p className="text-on-surface text-sm leading-relaxed">{drugInfo.uses}</p>
                                </div>
                            )}

                            {drugInfo.how_to_use && (
                                <div>
                                    <h4 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">How to Use</h4>
                                    <p className="text-on-surface text-sm leading-relaxed">{drugInfo.how_to_use}</p>
                                </div>
                            )}

                            {drugInfo.side_effects && (
                                <div>
                                    <h4 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Side Effects</h4>
                                    <p className="text-on-surface text-sm leading-relaxed">{drugInfo.side_effects}</p>
                                </div>
                            )}

                            {drugInfo.precautions && (
                                <div>
                                    <h4 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Precautions</h4>
                                    <p className="text-on-surface text-sm leading-relaxed">{drugInfo.precautions}</p>
                                </div>
                            )}

                            {drugInfo.storage && (
                                <div>
                                    <h4 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Storage</h4>
                                    <p className="text-on-surface text-sm">{drugInfo.storage}</p>
                                </div>
                            )}

                            {drugInfo.overdose && (
                                <div>
                                    <h4 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Overdose Information</h4>
                                    <p className="text-on-surface text-sm">{drugInfo.overdose}</p>
                                </div>
                            )}

                            {drugInfo.brand_names && (
                                <div>
                                    <h4 className="text-sm uppercase font-bold text-on-surface-variant tracking-wider mb-2">Brand Names</h4>
                                    <p className="text-on-surface text-sm">{drugInfo.brand_names}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {!drugInfo && !drugInfoLoading && (
                        <div className="text-center py-12 text-secondary flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-5xl text-outline opacity-50">science</span>
                            <p className="font-bold text-on-surface-variant">Paste a MedlinePlus drug URL above</p>
                            <p className="text-sm max-w-md">Example: https://medlineplus.gov/druginfo/meds/a682659.html</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default MedicineDetail;
