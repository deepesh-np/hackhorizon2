import { useNavigate } from 'react-router-dom';

export default function Sidebar({ user, activeView, onViewChange, onAddMedicine, pendingOrders, onLogout }) {
    const navigate = useNavigate();
    const pharmacyName = user?.vendorDetails?.pharmacyName || user?.name || 'My Pharmacy';
    const initials = pharmacyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const licenseNumber = user?.vendorDetails?.licenseNumber || 'N/A';

    const mainNav = [
        {
            label: 'Dashboard',
            view: 'dashboard',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
            ),
        },
        {
            label: 'Medicine Inventory',
            view: 'inventory',
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
            label: 'Orders / Requests',
            view: 'orders',
            badge: pendingOrders > 0 ? pendingOrders.toString() : null,
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.54 15.46 0 12.34 0c-1.61 0-3.11.66-4.17 1.82L12 6H6C4.9 6 4 6.9 4 8v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                </svg>
            ),
        },
        {
            label: 'Analytics',
            view: 'analytics',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
            ),
        },
    ];

    const accountNav = [
        {
            label: 'Back to Main Site',
            onClick: () => navigate('/home'),
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
            ),
        },
        {
            label: 'Pharmacy Profile',
            onClick: () => navigate('/profile'),
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
            ),
        },
    ];

    const NavItem = ({ item }) => {
        const isActive = item.view ? activeView === item.view : false;

        return (
            <div
                onClick={() => {
                    if (item.view) onViewChange(item.view);
                    if (item.onClick) item.onClick();
                }}
                className={`flex items-center gap-2.5 py-2 px-4 cursor-pointer transition-colors duration-150
                    ${isActive
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
    };

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
                <div
                    onClick={onLogout}
                    className="flex items-center gap-2.5 py-2 px-4 cursor-pointer text-[#C0392B] [&_svg]:opacity-80 hover:bg-red-50 transition-colors duration-150"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px] shrink-0">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    <span className="text-xs">Logout</span>
                </div>
            </nav>

            {/* Footer - Real user info */}
            <div className="p-3 px-4 border-t border-[#D5E8DC]">
                <div className="flex items-center gap-2">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#E8F5ED] text-[#1B7B3A] flex items-center justify-center text-[11px] font-medium shrink-0">
                        {initials}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-[11px] font-medium text-[#1a1a1a] truncate">{pharmacyName}</div>
                        <div className="text-[9px] text-[#9ab0a0] truncate">Lic: {licenseNumber}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
