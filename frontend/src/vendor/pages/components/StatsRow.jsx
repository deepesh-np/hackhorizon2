export default function StatsRow({ stats }) {
    const dynamicStats = [
        {
            label: 'Total medicines listed',
            value: stats?.totalMedicines || 0,
            trend: '...',
            trendUp: true,
            iconBg: 'bg-[#E8F5ED]',
            iconFill: '#1B7B3A',
            icon: (
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
            ),
        },
        {
            label: 'Medicines in stock',
            value: stats?.inStockCount || 0,
            trend: '...',
            trendUp: true,
            iconBg: 'bg-[#D5F5E3]',
            iconFill: '#27AE60',
            icon: (
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            ),
        },
        {
            label: 'Low stock alerts',
            value: stats?.lowStockCount || 0,
            trend: '...',
            trendUp: false,
            iconBg: 'bg-[#FDEDEC]',
            iconFill: '#C0392B',
            icon: (
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            ),
        },
        {
            label: 'Total orders today',
            value: stats?.totalOrdersToday || 0,
            trend: '...',
            trendUp: true,
            iconBg: 'bg-[#E8F5ED]',
            iconFill: '#1B7B3A',
            icon: (
                <path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.54 15.46 0 12.34 0c-1.61 0-3.11.66-4.17 1.82L12 6H6C4.9 6 4 6.9 4 8v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
            ),
        },
        {
            label: 'Revenue today',
            value: `₹${Math.round(stats?.revenueToday || 0)}`,
            trend: '...',
            trendUp: true,
            iconBg: 'bg-[#D5F5E3]',
            iconFill: '#27AE60',
            highlight: true,
            icon: (
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            ),
        },
    ];

    return (
        <div className="grid grid-cols-5 gap-2.5">
            {dynamicStats.map((stat) => (
                <div
                    key={stat.label}
                    className={`bg-white border border-[#D5E8DC] rounded-xl p-3 px-3.5 ${stat.highlight ? 'border-t-[3px] border-t-[#1B7B3A]' : ''
                        }`}
                >
                    <div className="flex items-start justify-between mb-1.5">
                        <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                            <svg viewBox="0 0 24 24" fill={stat.iconFill} className="w-3.5 h-3.5">
                                {stat.icon}
                            </svg>
                        </div>
                        <span
                            className={`text-[10px] font-medium flex items-center gap-0.5 ${stat.trendUp ? 'text-[#27AE60]' : 'text-[#C0392B]'
                                }`}
                        >
                            {stat.trend}
                        </span>
                    </div>
                    <div className={`text-xl font-medium mb-0.5 ${stat.highlight ? 'text-[#1B7B3A]' : 'text-[#1a1a1a]'}`}>
                        {stat.value}
                    </div>
                    <div className="text-[10px] text-[#6b7c72]">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
