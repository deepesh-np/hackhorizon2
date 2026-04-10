export default function Topbar({ user, activeView, onAddMedicine }) {
    const pharmacyName = user?.vendorDetails?.pharmacyName || user?.name || 'Vendor';
    const initials = pharmacyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const viewTitles = {
        dashboard: 'Dashboard',
        inventory: 'Medicine Inventory',
        orders: 'Orders & Requests',
        analytics: 'Analytics & Insights',
    };

    return (
        <div className="bg-white border-b border-[#D5E8DC] px-5 h-[52px] flex items-center gap-3 shrink-0">
            <div className="text-sm font-medium text-[#1a1a1a]">{viewTitles[activeView] || 'Dashboard'}</div>

            {/* Search */}
            <div className="flex-1 max-w-[300px] relative">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-[#9ab0a0]"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    placeholder="Search medicines, brands..."
                    className="w-full py-1.5 pl-[30px] pr-2.5 border border-[#C8DDD0] rounded-lg bg-[#F7FAF8] text-xs text-[#1a1a1a] outline-none focus:border-[#1B7B3A] placeholder:text-[#9ab0a0]"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
                {/* Verified badge */}
                {user?.vendorDetails?.isVerified && (
                    <div className="flex items-center gap-1 py-1 px-2.5 rounded-full bg-[#D5F5E3] text-[#1B7B3A] text-[10px] font-medium">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        Verified
                    </div>
                )}

                {/* Bell */}
                <div className="w-8 h-8 rounded-lg border border-[#C8DDD0] bg-[#F7FAF8] flex items-center justify-center cursor-pointer relative">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-3.5 h-3.5 text-[#5a7060]"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <div className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full bg-[#C0392B] border-[1.5px] border-white" />
                </div>

                {/* User avatar */}
                <div className="w-8 h-8 rounded-lg border border-[#C8DDD0] bg-[#E8F5ED] flex items-center justify-center cursor-pointer text-[10px] font-medium text-[#1B7B3A]">
                    {initials}
                </div>

                {/* Add Medicine */}
                <button
                    onClick={onAddMedicine}
                    className="flex items-center gap-1.5 py-[7px] px-3.5 bg-[#1B7B3A] text-white rounded-lg text-xs font-medium cursor-pointer border-none hover:bg-[#145C2C] transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
                    Add Medicine
                </button>
            </div>
        </div>
    );
}
