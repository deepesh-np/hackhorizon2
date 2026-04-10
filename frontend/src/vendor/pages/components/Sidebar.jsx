export default function Sidebar({ onAddMedicine, pendingOrders }) {
    const mainNav = [
        {
            label: 'Dashboard',
            active: true,
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
            ),
        },
        {
            label: 'Medicine Inventory',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
            ),
        },
        {
            label: 'Add Medicine',
            onClick: onAddMedicine,
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
            ),
        },
    ];

    const businessNav = [
        {
            label: 'Price Management',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
            ),
        },
        {
            label: 'Orders / Requests',
            badge: pendingOrders > 0 ? pendingOrders.toString() : null,
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.54 15.46 0 12.34 0c-1.61 0-3.11.66-4.17 1.82L12 6H6C4.9 6 4 6.9 4 8v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                </svg>
            ),
        },
        {
            label: 'Analytics',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
            ),
        },
    ];

    const accountNav = [
        {
            label: 'Notifications',
            badge: '3',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
            ),
        },
        {
            label: 'Pharmacy Profile',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
            ),
        },
    ];

    const NavItem = ({ item }) => (
        <div
            onClick={item.onClick}
            className={`flex items-center gap-2.5 py-2 px-4 cursor-pointer transition-colors duration-150
        ${item.active
                    ? 'bg-[#E8F5ED] text-[#1B7B3A] font-medium [&_svg]:opacity-100'
                    : 'text-[#5a7060] hover:bg-[#F0FAF4] hover:text-[#1B7B3A] [&_svg]:opacity-80'
                }`}
        >
            {item.icon}
            <span className="text-xs">{item.label}</span>
            {item.badge && (
                <span className="ml-auto bg-[#C0392B] text-white rounded-[10px] px-1.5 py-px text-[9px] font-medium">
                    {item.badge}
                </span>
            )}
        </div>
    );

    return (
        <div className="w-[210px] bg-white border-r border-[#D5E8DC] flex flex-col shrink-0 overflow-hidden">
            {/* Brand */}
            <div className="p-4 pb-3 border-b border-[#D5E8DC]">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#1B7B3A] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[#1a1a1a] leading-tight">AMIA Platform</div>
                        <div className="text-[9px] text-[#6b7c72]">Vendor Portal</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-2 overflow-y-auto">
                <div className="px-3 py-2 pb-1 text-[9px] font-medium text-[#9ab0a0] uppercase tracking-wider">Main</div>
                {mainNav.map((item) => (
                    <NavItem key={item.label} item={item} />
                ))}

                <div className="px-3 py-2 pb-1 text-[9px] font-medium text-[#9ab0a0] uppercase tracking-wider">Business</div>
                {businessNav.map((item) => (
                    <NavItem key={item.label} item={item} />
                ))}

                <div className="px-3 py-2 pb-1 text-[9px] font-medium text-[#9ab0a0] uppercase tracking-wider">Account</div>
                {accountNav.map((item) => (
                    <NavItem key={item.label} item={item} />
                ))}

                {/* Logout */}
                <div className="flex items-center gap-2.5 py-2 px-4 cursor-pointer text-[#C0392B] [&_svg]:opacity-80">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    <span className="text-xs">Logout</span>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-3 px-4 border-t border-[#D5E8DC]">
                <div className="flex items-center gap-2">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#E8F5ED] text-[#1B7B3A] flex items-center justify-center text-[11px] font-medium shrink-0">
                        RM
                    </div>
                    <div>
                        <div className="text-[11px] font-medium text-[#1a1a1a]">Ram Medicals</div>
                        <div className="text-[9px] text-[#9ab0a0]">ID: PH-2024-0847</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
