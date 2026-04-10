import { useState } from 'react';
import api from '../../../services/api';

export default function AddMedicineModal({ onClose, onSuccess }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMed, setSelectedMed] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [price, setPrice] = useState('');
    const [mrp, setMrp] = useState('');
    const [discount, setDiscount] = useState('0');
    const [stock, setStock] = useState('');
    const [batchNumber, setBatchNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [saving, setSaving] = useState(false);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setSelectedMed(null);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await api.get('/medicines/search', { params: { q: query } });
            setSearchResults(res.data.medicines || []);
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

        setSaving(true);
        try {
            await api.post('/vendor/inventory', {
                medicineId: selectedMed._id,
                price: Number(price),
                mrp: mrp ? Number(mrp) : undefined,
                discount: discount ? Number(discount) : 0,
                stock: Number(stock),
                batchNumber: batchNumber || undefined,
                expiryDate: expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            });

            if (onSuccess) onSuccess();
        } catch (err) {
            const errorData = err.response?.data;
            console.error("Save error:", err);
            alert(errorData?.message || 'Failed to add medicine');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/35 flex items-center justify-center z-[100]"
        >
            <div className="bg-white rounded-2xl border border-[#C8DDD0] w-[440px] max-h-[90vh] overflow-y-auto">
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
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
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
                        {isSearching && (
                            <div className="absolute top-[105px] left-4 right-4 bg-white border border-[#D5E8DC] rounded-lg shadow-xl z-50 p-3 text-[11px] text-[#9ab0a0] text-center">
                                Searching...
                            </div>
                        )}
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
                        <FormGroup label="Your price (₹) *">
                            <input
                                type="number"
                                placeholder={selectedMed ? `Avg: ${selectedMed.averagePrice}` : '0'}
                                className="form-input"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </FormGroup>
                        <FormGroup label="MRP (₹)">
                            <input
                                type="number"
                                placeholder="Optional"
                                className="form-input"
                                value={mrp}
                                onChange={e => setMrp(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <FormGroup label="Discount (%)">
                            <input
                                type="number"
                                placeholder="0"
                                className="form-input"
                                value={discount}
                                onChange={e => setDiscount(e.target.value)}
                                min="0"
                                max="100"
                            />
                        </FormGroup>
                        <FormGroup label="Quantity in stock *">
                            <input
                                type="number"
                                placeholder="0"
                                className="form-input"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                                min="0"
                            />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <FormGroup label="Batch number">
                            <input
                                type="text"
                                placeholder="Optional"
                                className="form-input"
                                value={batchNumber}
                                onChange={e => setBatchNumber(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup label="Expiry date">
                            <input
                                type="date"
                                className="form-input"
                                value={expiryDate}
                                onChange={e => setExpiryDate(e.target.value)}
                            />
                        </FormGroup>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="py-2.5 bg-[#1B7B3A] text-white border-none rounded-lg text-[13px] font-medium cursor-pointer w-full hover:bg-[#145C2C] mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save to inventory'}
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
