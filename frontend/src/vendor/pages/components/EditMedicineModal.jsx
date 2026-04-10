import { useState } from 'react';
import api from '../../../services/api';

export default function EditMedicineModal({ item, onClose, onSuccess }) {
    const med = item.medicine || {};
    const [price, setPrice] = useState(item.price?.toString() || '');
    const [mrp, setMrp] = useState(item.mrp?.toString() || '');
    const [discount, setDiscount] = useState(item.discount?.toString() || '0');
    const [stock, setStock] = useState(item.stock?.toString() || '');
    const [batchNumber, setBatchNumber] = useState(item.batchNumber || '');
    const [expiryDate, setExpiryDate] = useState(
        item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
    );
    const [saving, setSaving] = useState(false);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleSave = async () => {
        if (!price || !stock) {
            alert('Price and stock are required.');
            return;
        }

        setSaving(true);
        try {
            await api.put(`/vendor/inventory/${item._id}`, {
                price: Number(price),
                mrp: mrp ? Number(mrp) : undefined,
                discount: discount ? Number(discount) : 0,
                stock: Number(stock),
                batchNumber: batchNumber || undefined,
                expiryDate: expiryDate || undefined,
            });

            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Update error:", err);
            alert(err.response?.data?.message || 'Failed to update medicine');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/35 flex items-center justify-center z-[100]"
        >
            <div className="bg-white rounded-2xl border border-[#C8DDD0] w-[420px] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-3.5 px-4 border-b border-[#D5E8DC] bg-[#E8F5ED]">
                    <span className="text-sm font-medium text-[#145C2C]">Edit inventory item</span>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-md border border-[#C8DDD0] bg-white cursor-pointer flex items-center justify-center text-sm text-[#5a7060] hover:bg-[#f0f0f0]"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-3.5 px-4 flex flex-col gap-2.5">
                    {/* Medicine info (read-only) */}
                    <div className="p-2.5 px-3 bg-[#F7FAF8] rounded-lg border border-[#EEF5F1]">
                        <div className="text-[12px] font-medium text-[#1a1a1a]">{med.name || 'Unknown Medicine'}</div>
                        <div className="text-[10px] text-[#6b7c72] mt-0.5">
                            {med.genericName || '-'} • {med.dosageForm || '-'} • {med.brand || '-'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <FormGroup label="Your price (₹)">
                            <input
                                type="number"
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
                                className="form-input"
                                value={mrp}
                                onChange={e => setMrp(e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="Optional"
                            />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <FormGroup label="Discount (%)">
                            <input
                                type="number"
                                className="form-input"
                                value={discount}
                                onChange={e => setDiscount(e.target.value)}
                                min="0"
                                max="100"
                            />
                        </FormGroup>
                        <FormGroup label="Stock quantity">
                            <input
                                type="number"
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
                                className="form-input"
                                value={batchNumber}
                                onChange={e => setBatchNumber(e.target.value)}
                                placeholder="Optional"
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
                        {saving ? 'Saving...' : 'Update inventory'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FormGroup({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#6b7c72] uppercase tracking-wider">{label}</span>
            {children}
        </div>
    );
}
