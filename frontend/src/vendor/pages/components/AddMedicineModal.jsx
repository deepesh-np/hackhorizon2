import { useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function AddMedicineModal({ onClose, onSuccess }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMed, setSelectedMed] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE}/medicines/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectMedicine = (med) => {
        setSelectedMed(med);
        setSearchQuery(med.name);
        setSearchResults([]);
    };

    const handleSave = async () => {
        if (!selectedMed || !price || !stock) {
            alert('Please select a medicine and enter price and stock.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/vendor/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    medicineId: selectedMed._id,
                    price: Number(price),
                    stock: Number(stock),
                    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Mock 1yr expiry
                })
            });

            if (res.ok) {
                if (onSuccess) onSuccess();
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Failed to add medicine');
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("Error connecting to server");
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/35 flex items-center justify-center z-[100]"
        >
            <div className="bg-white rounded-2xl border border-[#C8DDD0] w-[420px] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-3.5 px-4 border-b border-[#D5E8DC] bg-[#E8F5ED]">
                    <span className="text-sm font-medium text-[#145C2C]">Add new medicine</span>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-md border border-[#C8DDD0] bg-white cursor-pointer flex items-center justify-center text-sm text-[#5a7060] hover:bg-[#f0f0f0]"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-3.5 px-4 flex flex-col gap-2.5 relative">
                    <div className="p-2 px-2.5 bg-[#D5F5E3] rounded-lg flex items-center gap-1.5 text-[10px] text-[#1B7B3A]">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[13px] h-[13px]">
                            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                        </svg>
                        Search AMIA catalog to auto-fill details
                    </div>

                    {/* Medicine name / Search */}
                    <FormGroup label="Search Medicine catalog">
                        <input
                            type="text"
                            placeholder="Type to search..."
                            className="form-input"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        {searchResults.length > 0 && !selectedMed && (
                            <div className="absolute top-[105px] left-4 right-4 bg-white border border-[#D5E8DC] rounded-lg shadow-xl z-50 max-h-[150px] overflow-y-auto">
                                {searchResults.map(m => (
                                    <div
                                        key={m._id}
                                        className="p-2 text-[11px] border-b border-[#EEF5F1] cursor-pointer hover:bg-[#F7FAF8] flex flex-col"
                                        onClick={() => selectMedicine(m)}
                                    >
                                        <span className="font-medium text-[#1a1a1a]">{m.name}</span>
                                        <span className="text-[9px] text-[#6b7c72]">{m.genericName} - {m.brand} • Avg ₹{m.averagePrice}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormGroup>

                    {selectedMed && (
                        <>
                            <div className="grid grid-cols-2 gap-2.5">
                                <FormGroup label="Active ingredient">
                                    <input type="text" className="form-input bg-gray-50" readOnly value={selectedMed.genericName || ''} />
                                </FormGroup>
                                <FormGroup label="Dosage Form">
                                    <input type="text" className="form-input bg-gray-50" readOnly value={selectedMed.dosageForm || ''} />
                                </FormGroup>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <FormGroup label="Type">
                                    <input type="text" className="form-input bg-gray-50" readOnly value={selectedMed.isBranded ? 'Brand' : 'Generic'} />
                                </FormGroup>
                                <FormGroup label="Brand">
                                    <input type="text" className="form-input bg-gray-50" readOnly value={selectedMed.brand || ''} />
                                </FormGroup>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                        <FormGroup label="Your price (₹)">
                            <input type="number" placeholder={selectedMed ? `Avg: ${selectedMed.averagePrice}` : '0'} className="form-input" value={price} onChange={e => setPrice(e.target.value)} />
                        </FormGroup>
                        <FormGroup label="Quantity in stock">
                            <input type="number" placeholder="0" className="form-input" value={stock} onChange={e => setStock(e.target.value)} />
                        </FormGroup>
                    </div>

                    <button
                        onClick={handleSave}
                        className="py-2.5 bg-[#1B7B3A] text-white border-none rounded-lg text-[13px] font-medium cursor-pointer w-full hover:bg-[#145C2C] mt-2">
                        Save to inventory
                    </button>
                </div>
            </div>
        </div>
    );
}

function FormGroup({ label, children }) {
    return (
        <div className="flex flex-col gap-1 relative">
            <span className="text-[10px] font-medium text-[#6b7c72] uppercase tracking-wider">{label}</span>
            {children}
        </div>
    );
}
