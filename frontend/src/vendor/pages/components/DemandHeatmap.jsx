export default function DemandHeatmap({ data }) {
    const heatmapData = data?.list || [];
    const alertMessage = data?.alert || null;

    return (
        <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between p-3 px-3.5 border-b border-[#D5E8DC]">
                <span className="text-[13px] font-medium text-[#1a1a1a]">Nearby demand heatmap</span>
                <span className="text-[10px] text-[#9ab0a0]">Dhanbad area</span>
            </div>

            <div className="px-3.5 pt-2.5 pb-1 text-[10px] text-[#9ab0a0]">
                Most searched medicines in your area this week
            </div>

            <div className="flex flex-col gap-1.5 p-3 px-3.5 flex-1">
                {heatmapData.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#5a7060] w-[90px] shrink-0">{item.label}</span>
                        <div className="flex-1 h-3.5 bg-[#EEF5F1] rounded overflow-hidden">
                            <div className={`h-full rounded ${item.color}`} style={{ width: `${item.pct}%` }} />
                        </div>
                        <span className="text-[10px] text-[#9ab0a0] w-7 text-right">{item.pct}%</span>
                    </div>
                ))}
            </div>

            {alertMessage && (
                <div className="px-3.5 pb-3 text-[10px] text-[#C0392B] flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    {alertMessage}
                </div>
            )}
        </div>
    );
}
