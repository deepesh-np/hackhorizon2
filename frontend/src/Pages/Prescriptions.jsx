import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../services/api';

function Prescriptions() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = useState('scan');

    // Scan state
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);

    // Analyze text state
    const [analyzeText, setAnalyzeText] = useState('');
    const [analyzeResult, setAnalyzeResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // History state
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (activeTab === 'history' && user) {
            fetchHistory();
        }
    }, [activeTab, user]);

    // ── Image Upload Handler ──
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setImageBase64(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // ── POST /prescriptions/scan ──
    const handleScan = async () => {
        if (!imageBase64) return;
        setIsScanning(true);
        setScanError(null);
        setScanResult(null);
        try {
            const res = await api.post('/prescriptions/scan', { image: imageBase64 });
            if (res.data.success) {
                setScanResult(res.data);
            }
        } catch (err) {
            setScanError(err.response?.data?.message || 'Failed to scan prescription');
        } finally {
            setIsScanning(false);
        }
    };

    // ── POST /prescriptions/analyze-text ──
    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!analyzeText.trim()) return;
        setIsAnalyzing(true);
        setAnalyzeResult(null);
        try {
            const res = await api.post('/prescriptions/analyze-text', { text: analyzeText });
            if (res.data.success) {
                setAnalyzeResult(res.data);
            }
        } catch (err) {
            console.error("Analyze failed", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── GET /prescriptions/history ──
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/prescriptions/history');
            if (res.data.success) {
                setHistory(res.data.prescriptions || []);
            }
        } catch (err) {
            console.error("History fetch failed", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // ── GET /prescriptions/:id ──
    const fetchPrescriptionDetail = async (presId) => {
        try {
            const res = await api.get(`/prescriptions/${presId}`);
            if (res.data.success) {
                setSelectedPrescription(res.data.prescription);
            }
        } catch (err) {
            console.error("Prescription detail fetch failed", err);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center text-secondary">Loading...</div>;
    if (!user) return null;

    const tabs = [
        { key: 'scan', label: 'Scan Prescription', icon: 'document_scanner' },
        { key: 'analyze', label: 'Analyze Text', icon: 'text_snippet' },
        { key: 'history', label: 'Scan History', icon: 'history' },
    ];

    return (
        <div className="min-h-[calc(100vh-72px)] bg-surface pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">Prescriptions</h1>
                <p className="text-secondary font-body mt-2 text-lg">Upload, scan, and analyze your medical prescriptions with AI</p>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                            activeTab === tab.key
                                ? 'bg-on-surface text-white shadow-md'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Scan Tab ── */}
            {activeTab === 'scan' && (
                <div className="space-y-6">
                    <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm relative overflow-hidden">
                        <div className="absolute -top-20 -left-20 w-56 h-56 bg-primary-fixed/15 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-headline font-bold text-on-surface mb-6">Upload Prescription Image</h2>

                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Upload Area */}
                                <label className="flex-1 border-2 border-dashed border-outline-variant/50 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Prescription preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="material-symbols-outlined text-5xl text-outline group-hover:text-primary transition-colors">cloud_upload</span>
                                            <p className="text-on-surface-variant font-bold">Click to upload prescription image</p>
                                            <p className="text-xs text-outline">JPG, PNG or WEBP. Max 10MB.</p>
                                        </div>
                                    )}
                                </label>

                                {/* Action */}
                                <div className="flex flex-col justify-center gap-4 min-w-[200px]">
                                    <button
                                        onClick={handleScan}
                                        disabled={!imageBase64 || isScanning}
                                        className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold hover:shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
                                    >
                                        {isScanning ? 'AI Analyzing...' : 'Scan with AI'}
                                    </button>
                                    {imagePreview && (
                                        <button onClick={() => { setImagePreview(null); setImageBase64(null); setScanResult(null); }} className="text-sm text-secondary hover:text-error transition-colors">
                                            Clear image
                                        </button>
                                    )}
                                </div>
                            </div>

                            {scanError && (
                                <div className="mt-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-bold">{scanError}</div>
                            )}
                        </div>
                    </section>

                    {/* Scan Results */}
                    {scanResult && (
                        <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-headline font-bold text-on-surface">Scan Results</h2>
                                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{scanResult.processingTime}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {scanResult.doctorInfo?.name && (
                                    <div className="bg-surface p-4 rounded-xl">
                                        <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2">Doctor</h4>
                                        <p className="text-on-surface font-medium">{scanResult.doctorInfo.name}</p>
                                        {scanResult.doctorInfo.hospital && <p className="text-sm text-secondary">{scanResult.doctorInfo.hospital}</p>}
                                    </div>
                                )}
                                {scanResult.patientInfo?.name && (
                                    <div className="bg-surface p-4 rounded-xl">
                                        <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2">Patient</h4>
                                        <p className="text-on-surface font-medium">{scanResult.patientInfo.name}</p>
                                        {scanResult.patientInfo.diagnosis && <p className="text-sm text-secondary">Diagnosis: {scanResult.patientInfo.diagnosis}</p>}
                                    </div>
                                )}
                            </div>

                            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">
                                Medicines Found ({scanResult.totalMedicinesFound})
                                <span className="text-sm text-secondary font-normal ml-2">({scanResult.matchedInDatabase} matched in database)</span>
                            </h3>

                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                {scanResult.medicines?.map((med, i) => (
                                    <div key={i} className="bg-surface p-5 rounded-2xl border border-outline-variant/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-on-surface text-lg">{med.name}</h4>
                                            {med.matchedMedicine ? (
                                                <Link to={`/medicine/${med.matchedMedicine}`} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold hover:bg-primary/20">View in DB →</Link>
                                            ) : (
                                                <span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-1 rounded font-bold">Not in DB</span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {med.dosage && <div><span className="text-outline">Dosage:</span> <span className="text-on-surface">{med.dosage}</span></div>}
                                            {med.frequency && <div><span className="text-outline">Frequency:</span> <span className="text-on-surface">{med.frequency}</span></div>}
                                            {med.duration && <div><span className="text-outline">Duration:</span> <span className="text-on-surface">{med.duration}</span></div>}
                                            {med.instructions && <div className="col-span-2"><span className="text-outline">Instructions:</span> <span className="text-on-surface">{med.instructions}</span></div>}
                                        </div>
                                        {med.alternativesAvailable > 0 && (
                                            <div className="mt-3 text-xs text-primary font-bold">{med.alternativesAvailable} alternatives available</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* ── Analyze Text Tab ── */}
            {activeTab === 'analyze' && (
                <div className="space-y-6">
                    <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                        <h2 className="text-2xl font-headline font-bold text-on-surface mb-6">Analyze Medicine Text</h2>
                        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={analyzeText}
                                onChange={(e) => setAnalyzeText(e.target.value)}
                                placeholder="Enter medicine name or prescription text..."
                                className="flex-1 px-6 py-4 rounded-2xl bg-surface border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/20 font-body text-on-surface transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isAnalyzing || !analyzeText.trim()}
                                className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-40"
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                            </button>
                        </form>
                    </section>

                    {analyzeResult && (
                        <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-headline font-bold text-on-surface">Analysis Results</h2>
                                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{analyzeResult.processingTime}</span>
                            </div>
                            {analyzeResult.results?.map((result, i) => (
                                <div key={i} className="mb-6 last:mb-0">
                                    <div className="bg-surface p-5 rounded-2xl mb-3">
                                        <h4 className="font-bold text-on-surface text-lg mb-2">{result.aiAnalysis.name}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                            {result.aiAnalysis.genericName && <div><span className="text-outline">Generic:</span> <span className="text-on-surface">{result.aiAnalysis.genericName}</span></div>}
                                            {result.aiAnalysis.therapeuticCategory && <div><span className="text-outline">Category:</span> <span className="text-on-surface">{result.aiAnalysis.therapeuticCategory}</span></div>}
                                            {result.aiAnalysis.dosageForm && <div><span className="text-outline">Form:</span> <span className="text-on-surface">{result.aiAnalysis.dosageForm}</span></div>}
                                            {result.aiAnalysis.commonUses && <div className="col-span-full"><span className="text-outline">Uses:</span> <span className="text-on-surface">{result.aiAnalysis.commonUses}</span></div>}
                                        </div>
                                    </div>
                                    {result.databaseMatches?.length > 0 && (
                                        <div>
                                            <h5 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2 ml-1">Database Matches ({result.matchCount})</h5>
                                            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                                {result.databaseMatches.map(m => (
                                                    <Link to={`/medicine/${m._id}`} key={m._id} className="p-4 rounded-xl border border-outline-variant/30 hover:shadow-md hover:border-primary/30 transition-all group">
                                                        <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{m.name}</div>
                                                        <div className="text-xs text-secondary">{m.manufacturer} • {m.dosageForm}</div>
                                                        <div className="text-primary font-bold mt-1">₹{m.averagePrice || '--'}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    {selectedPrescription ? (
                        <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                            <button onClick={() => setSelectedPrescription(null)} className="text-sm text-primary font-bold mb-4 hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to History
                            </button>
                            <h2 className="text-xl font-headline font-bold text-on-surface mb-4">Scan Details</h2>
                            <div className="text-xs text-secondary mb-6">Scanned on {new Date(selectedPrescription.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>

                            {selectedPrescription.extractedText && (
                                <div className="bg-surface p-4 rounded-xl mb-6">
                                    <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2">Extracted Text</h4>
                                    <p className="text-on-surface text-sm whitespace-pre-wrap">{selectedPrescription.extractedText}</p>
                                </div>
                            )}

                            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Medicines ({selectedPrescription.extractedMedicines?.length || 0})</h3>
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                {selectedPrescription.extractedMedicines?.map((med, i) => (
                                    <div key={i} className="bg-surface p-5 rounded-2xl border border-outline-variant/20">
                                        <div className="font-bold text-on-surface text-lg mb-2">{med.name}</div>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            {med.dosage && <div className="text-secondary">Dosage: <span className="text-on-surface">{med.dosage}</span></div>}
                                            {med.frequency && <div className="text-secondary">Frequency: <span className="text-on-surface">{med.frequency}</span></div>}
                                            {med.duration && <div className="text-secondary">Duration: <span className="text-on-surface">{med.duration}</span></div>}
                                        </div>
                                        {med.matchedMedicine && (
                                            <Link to={`/medicine/${med.matchedMedicine._id || med.matchedMedicine}`} className="text-xs text-primary font-bold mt-2 inline-block hover:underline">
                                                View in Database →
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                            <h2 className="text-2xl font-headline font-bold text-on-surface mb-6">Scan History</h2>
                            {historyLoading ? (
                                <div className="text-center py-12 text-secondary animate-pulse">Loading scan history...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-16 text-secondary flex flex-col items-center gap-3">
                                    <span className="material-symbols-outlined text-5xl text-outline opacity-50">history</span>
                                    <p className="font-bold text-on-surface-variant">No prescriptions scanned yet</p>
                                    <p className="text-sm max-w-md">Upload your first prescription in the "Scan" tab to get started.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map(pres => (
                                        <div
                                            key={pres._id}
                                            onClick={() => fetchPrescriptionDetail(pres._id)}
                                            className="p-5 rounded-2xl border border-outline-variant/30 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
                                                    {pres.extractedMedicines?.length || 0} medicines found
                                                </div>
                                                <div className="text-sm text-secondary">
                                                    {new Date(pres.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                    {' • '}
                                                    <span className={`font-bold ${pres.status === 'completed' ? 'text-primary' : 'text-secondary'}`}>
                                                        {pres.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default Prescriptions;
