import { useState, useEffect } from 'react';
import api from '../../../services/api';

const filters = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

const badgeStyles = {
    green: 'bg-[#D5F5E3] text-[#1B7B3A]',
    red: 'bg-[#FDEDEC] text-[#922B21]',
    olive: 'bg-[#EAF4EC] text-[#2E7D4F]',
    orange: 'bg-[#FEF9E7] text-[#B7770D]',
    gray: 'bg-[#F0F0F0] text-[#888]',
};

export default function InventoryTable({ refreshTrigger, onEdit, onDelete }) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            setLoading(true);
            try {
                const params = {
                    limit: 50,
                    ...(activeFilter === 'In Stock' ? { inStock: true } : {}),
                };

                const res = await api.get('/vendor/inventory', { params });
                const data = res.data;
                let items = data.inventory || [];

                if (activeFilter === 'Low Stock') {
                    items = items.filter(i => i.stock > 0 && i.stock <= 10);
                } else if (activeFilter === 'Out of Stock') {
                    items = items.filter(i => i.stock === 0 || !i.inStock);
                }
                setInventory(items);
            } catch (error) {
                console.error("Error fetching inventory:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, [activeFilter, refreshTrigger]);

    const getStatusInfo = (item) => {
        if (!item.inStock || item.stock === 0) return { label: 'Out of stock', badge: 'gray' };
        if (item.stock <= 10) return { label: 'Low stock', badge: 'orange' };
        return { label: 'In stock', badge: 'green' };
    };

    return (
        <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden min-h-[300px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 px-3.5 border-b border-[#D5E8DC]">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#1a1a1a]">Medicine Inventory</span>
                    <span className="text-[9px] font-medium py-0.5 px-2 rounded-[20px] bg-[#E8F5ED] text-[#1B7B3A]">
                        {inventory.length} items
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 p-2.5 px-3.5 border-b border-[#EEF5F1] flex-wrap">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`py-1 px-2.5 rounded-[20px] border text-[10px] cursor-pointer transition-colors
              ${activeFilter === f
                                ? 'bg-[#E8F5ED] text-[#1B7B3A] border-[#1B7B3A]'
                                : 'bg-transparent text-[#5a7060] border-[#C8DDD0] hover:bg-[#F0FAF4]'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse text-[11px]">
                    <thead>
                        <tr>
                            {['Medicine name', 'Active ingredient', 'Dosage', 'Type', 'Price', 'Qty', 'Status', 'Actions'].map((h) => (
                                <th
                                    key={h}
                                    className="py-2 px-2.5 text-left text-[9px] font-medium text-[#9ab0a0] uppercase tracking-wider border-b border-[#D5E8DC] bg-[#F7FAF8]"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" className="text-center py-6 text-[#9ab0a0]">Loading inventory...</td></tr>
                        ) : inventory.length === 0 ? (
                            <tr><td colSpan="8" className="text-center py-6 text-[#9ab0a0]">No medicines found.</td></tr>
                        ) : (
                            inventory.map((item) => {
                                const med = item.medicine || {};
                                const status = getStatusInfo(item);
                                const isBranded = med.isBranded ? 'Brand' : 'Generic';

                                return (
                                    <tr key={item._id} className="hover:bg-[#F7FAF8] [&:last-child>td]:border-b-0">
                                        <td className="py-2 px-2.5 border-b border-[#EEF5F1] font-medium text-[#1a1a1a]">
                                            {med.name || 'Unknown'}
                                        </td>
                                        <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#5a7060]">
                                            {med.genericName || '-'}
                                        </td>
                                        <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#5a7060]">
                                            {med.dosageForm || '-'}
                                        </td>
                                        <td className="py-2 px-2.5 border-b border-[#EEF5F1]">
                                            <span className={`inline-flex items-center py-0.5 px-2 rounded-[20px] text-[9px] font-medium ${isBranded === 'Brand' ? badgeStyles.orange : badgeStyles.olive}`}>
                                                {isBranded}
                                            </span>
                                        </td>
                                        <td className={`py-2 px-2.5 border-b border-[#EEF5F1] text-[#1B7B3A] font-medium`}>
                                            ₹{item.price}
                                        </td>
                                        <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#5a7060]">
                                            {item.stock}
                                        </td>
                                        <td className="py-2 px-2.5 border-b border-[#EEF5F1]">
                                            <span className={`inline-flex items-center py-0.5 px-2 rounded-[20px] text-[9px] font-medium ${badgeStyles[status.badge]}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2.5 border-b border-[#EEF5F1]">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onEdit && onEdit(item)}
                                                    className="py-[3px] px-2.5 rounded-md border border-[#C8DDD0] bg-transparent text-[10px] text-[#5a7060] cursor-pointer hover:bg-[#F0FAF4] hover:text-[#1B7B3A] transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => onDelete && onDelete(item._id)}
                                                    className="py-[3px] px-2 rounded-md border border-[#FDEDEC] bg-transparent text-[10px] text-[#C0392B] cursor-pointer hover:bg-[#FDEDEC] transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
