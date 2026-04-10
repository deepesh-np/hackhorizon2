import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function LowStockAlerts({ refreshTrigger }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLowStock = async () => {
            setLoading(true);
            try {
                const res = await api.get('/vendor/inventory', { params: { limit: 100 } });
                const items = res.data.inventory || [];
                const lowStockItems = items
                    .filter(i => !i.inStock || (i.stock >= 0 && i.stock <= 10))
                    .map(i => ({
                        name: i.medicine?.name || 'Unknown',
                        qty: i.stock === 0 || !i.inStock ? 'Out of stock!' : `Only ${i.stock} units left`,
                        critical: i.stock === 0 || !i.inStock
                    }));
                setAlerts(lowStockItems);
            } catch (error) {
                console.error("Error fetching low stock:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLowStock();
    }, [refreshTrigger]);

    return (
        <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden min-h-[150px]">
            <div className="flex items-center justify-between p-3 px-3.5 border-b border-[#D5E8DC]">
                <span className="text-[13px] font-medium text-[#1a1a1a]">Low stock alerts</span>
                <span className="text-[10px] text-[#C0392B] font-medium">{alerts.length} items</span>
            </div>
            <div className="flex flex-col gap-2 p-3 px-3.5 max-h-[200px] overflow-y-auto">
                {loading ? (
                    <div className="text-[11px] text-[#9ab0a0] text-center p-2">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                    <div className="flex items-center gap-2 p-2 text-[11px] text-[#27AE60]">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[13px] h-[13px]">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        All stock levels are healthy!
                    </div>
                ) : alerts.map((alert, idx) => (
                    <div
                        key={`${alert.name}-${idx}`}
                        className={`flex items-center gap-2.5 p-2 px-3 rounded-lg border-l-[3px] ${alert.critical
                            ? 'bg-[#FFF5F5] border-l-[#922B21]'
                            : 'bg-[#FFF9F9] border-l-[#C0392B]'
                            }`}
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#FDEDEC]">
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className={`w-[13px] h-[13px] ${alert.critical ? 'text-[#922B21]' : 'text-[#C0392B]'}`}
                            >
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-[#1a1a1a] truncate">{alert.name}</div>
                            <div className={`text-[10px] ${alert.critical ? 'text-[#922B21]' : 'text-[#C0392B]'}`}>
                                {alert.qty}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
