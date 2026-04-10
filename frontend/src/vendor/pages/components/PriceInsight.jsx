const priceData = [
    { label: 'Your price', width: '80%', barColor: 'bg-[#1B7B3A]', value: '₹28', valueColor: 'text-[#1B7B3A] font-medium' },
    { label: 'Area avg.', width: '100%', barColor: 'bg-[#C8DDD0]', value: '₹35', valueColor: 'text-[#6b7c72]' },
    { label: 'Lowest', width: '74%', barColor: 'bg-[#A9DFBF]', value: '₹26', valueColor: 'text-[#27AE60]' },
];

export default function PriceInsight() {
    return (
        <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 px-3.5 border-b border-[#D5E8DC]">
                <span className="text-[13px] font-medium text-[#1a1a1a]">Price comparison insight</span>
                <span className="text-[10px] text-[#1B7B3A] cursor-pointer">Details →</span>
            </div>
            <div className="p-3 px-3.5">
                <div className="text-[11px] text-[#6b7c72] mb-2">Paracetamol 650mg</div>

                {priceData.map((row) => (
                    <div key={row.label} className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-[#9ab0a0] w-[70px]">{row.label}</span>
                        <div className="flex-1 h-1.5 bg-[#EEF5F1] rounded-sm overflow-hidden">
                            <div className={`h-full rounded-sm ${row.barColor}`} style={{ width: row.width }} />
                        </div>
                        <span className={`text-[11px] ${row.valueColor}`}>{row.value}</span>
                    </div>
                ))}

                <div className="inline-flex items-center gap-[5px] py-[5px] px-3 bg-[#D5F5E3] rounded-lg text-[#1B7B3A] text-[11px] font-medium mt-1">
                    <svg viewBox="0 0 24 24" fill="#1B7B3A" className="w-[13px] h-[13px]">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Best price in area — save patients 20%
                </div>

                <div className="mt-2 text-[10px] text-[#9ab0a0]">Auto-suggestion: ₹29 to maintain margin</div>
            </div>
        </div>
    );
}
