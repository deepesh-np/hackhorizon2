const badgeStyles = {
    Delivered: 'bg-[#D5F5E3] text-[#1B7B3A]',
    Confirmed: 'bg-[#EAF4EC] text-[#2E7D4F]',
    Pending: 'bg-[#FEF9E7] text-[#B7770D]',
    Cancelled: 'bg-[#FDEDEC] text-[#922B21]',
};

export default function OrdersTable({ orders = [], onStatusUpdate }) {
    const pendingCount = orders.filter(o => o.status === 'Pending').length;

    return (
        <div className="bg-white border border-[#D5E8DC] rounded-xl overflow-hidden flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between p-3 px-3.5 border-b border-[#D5E8DC]">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#1a1a1a]">Orders / Requests</span>
                    <span className="bg-[#C0392B] text-white rounded-[10px] px-1.5 py-px text-[9px] font-medium">
                        {pendingCount} pending
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse text-[11px]">
                    <thead>
                        <tr>
                            {['Request ID', 'Medicine', 'Customer', 'Qty', 'Total', 'Status', 'Actions'].map((h) => (
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
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-6 text-center text-[#9ab0a0]">No orders found.</td>
                            </tr>
                        ) : orders.map((o) => (
                            <tr key={o._id} className="hover:bg-[#F7FAF8] [&:last-child>td]:border-b-0">
                                <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#1B7B3A] font-medium">
                                    #{o._id.substring(o._id.length - 6).toUpperCase()}
                                </td>
                                <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#5a7060]">
                                    {o.medicine?.name || 'Unknown'}
                                </td>
                                <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#5a7060]">
                                    {o.user?.name || 'Unknown'}
                                </td>
                                <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#5a7060]">
                                    {o.quantity}
                                </td>
                                <td className="py-2 px-2.5 border-b border-[#EEF5F1] text-[#1B7B3A] font-medium">
                                    ₹{Math.floor(o.totalPrice)},
                                </td>
                                <td className="py-2 px-2.5 border-b border-[#EEF5F1]">
                                    <span className={`inline-flex items-center py-0.5 px-2 rounded-[20px] text-[9px] font-medium ${badgeStyles[o.status] || badgeStyles.Pending}`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="py-2 px-2.5 border-b border-[#EEF5F1]">
                                    {o.status === 'Pending' && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => onStatusUpdate && onStatusUpdate(o._id, 'Confirmed')}
                                                className="py-[3px] px-2 rounded-md border border-[#1B7B3A] bg-transparent text-[10px] text-[#1B7B3A] cursor-pointer hover:bg-[#E8F5ED] transition-colors"
                                                title="Accept order"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => onStatusUpdate && onStatusUpdate(o._id, 'Cancelled')}
                                                className="py-[3px] px-2 rounded-md border border-[#C0392B] bg-transparent text-[10px] text-[#C0392B] cursor-pointer hover:bg-[#FDEDEC] transition-colors"
                                                title="Reject order"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    {o.status === 'Confirmed' && (
                                        <button
                                            onClick={() => onStatusUpdate && onStatusUpdate(o._id, 'Delivered')}
                                            className="py-[3px] px-2 rounded-md border border-[#27AE60] bg-transparent text-[10px] text-[#27AE60] cursor-pointer hover:bg-[#D5F5E3] transition-colors"
                                            title="Mark as delivered"
                                        >
                                            Deliver
                                        </button>
                                    )}
                                    {(o.status === 'Delivered' || o.status === 'Cancelled') && (
                                        <span className="text-[10px] text-[#9ab0a0]">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
