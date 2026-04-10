import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function PriceInsight() {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsight = async () => {
            setLoading(true);
            try {
                const res = await api.get('/vendor/price-insight');
                setInsight(res.data.insight);
            } catch (error) {
                console.error("Error fetching price insight:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsight();
    }, []);

    if (loading) {
        return (
            <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden p-4">
                <div className="text-[11px] text-[#9ab0a0] text-center animate-pulse">Loading price insights...</div>
            </div>
        );
    }

    if (!insight) {
        return (
            <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 px-3.5 border-b border-[#D5E8DC]">
                    <span className="text-[13px] font-medium text-[#1a1a1a]">Price comparison insight</span>
                </div>
                <div className="p-4 text-center text-[11px] text-[#9ab0a0]">
                    Add medicines to your inventory to see price comparisons.
                </div>
            </div>
        );
    }

    const maxPrice = Math.max(insight.yourPrice, insight.areaAvg, insight.highestPrice) || 1;

    const priceData = [
        {
            label: 'Your price',
            width: `${(insight.yourPrice / maxPrice) * 100}%`,
            barColor: '#1B7B3A',
            value: `₹${insight.yourPrice}`,
            valueColor: 'text-[#1B7B3A] font-medium',
        },
        {
            label: 'Area avg.',
            width: `${(insight.areaAvg / maxPrice) * 100}%`,
            barColor: '#C8DDD0',
            value: `₹${insight.areaAvg}`,
            valueColor: 'text-[#6b7c72]',
        },
        {
            label: 'Lowest',
            width: `${(insight.lowestPrice / maxPrice) * 100}%`,
            barColor: '#A9DFBF',
            value: `₹${insight.lowestPrice}`,
            valueColor: 'text-[#27AE60]',
        },
    ];

    const isBestPrice = insight.yourPrice <= insight.lowestPrice;
    const isCompetitive = insight.savingsPct > 0;

    return (
        <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 px-3.5 border-b border-[#D5E8DC]">
                <span className="text-[13px] font-medium text-[#1a1a1a]">Price comparison insight</span>
                <span className="text-[10px] text-[#9ab0a0]">{insight.totalVendors} vendors</span>
            </div>
            <div className="p-3 px-3.5">
                <div className="text-[11px] text-[#6b7c72] mb-2">{insight.medicineName}</div>

                {priceData.map((row) => (
                    <div key={row.label} className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-[#9ab0a0] w-[70px]">{row.label}</span>
                        <div className="flex-1 h-1.5 bg-[#EEF5F1] rounded-sm overflow-hidden">
                            <div
                                className="h-full rounded-sm transition-all duration-500"
                                style={{ width: row.width, backgroundColor: row.barColor }}
                            />
                        </div>
                        <span className={`text-[11px] ${row.valueColor}`}>{row.value}</span>
                    </div>
                ))}

                {isBestPrice ? (
                    <div className="inline-flex items-center gap-[5px] py-[5px] px-3 bg-[#D5F5E3] rounded-lg text-[#1B7B3A] text-[11px] font-medium mt-1">
                        <svg viewBox="0 0 24 24" fill="#1B7B3A" className="w-[13px] h-[13px]">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        Best price in area!
                    </div>
                ) : isCompetitive ? (
                    <div className="inline-flex items-center gap-[5px] py-[5px] px-3 bg-[#D5F5E3] rounded-lg text-[#1B7B3A] text-[11px] font-medium mt-1">
                        <svg viewBox="0 0 24 24" fill="#1B7B3A" className="w-[13px] h-[13px]">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        {insight.savingsPct}% below area average
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-[5px] py-[5px] px-3 bg-[#FEF9E7] rounded-lg text-[#B7770D] text-[11px] font-medium mt-1">
                        <svg viewBox="0 0 24 24" fill="#B7770D" className="w-[13px] h-[13px]">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                        {Math.abs(insight.savingsPct)}% above area average
                    </div>
                )}
            </div>
        </div>
    );
}
