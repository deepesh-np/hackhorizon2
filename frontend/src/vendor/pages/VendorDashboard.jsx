import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StatsRow from './components/StatsRow';
import InventoryTable from './components/InventoryTable';
// import LowStockAlerts from './components/LowStockAlerts';
import PriceInsight from './components/PriceInsight';
import OrdersTable from './components/OrdersTable';
import DemandHeatmap from './components/DemandHeatmap';
import AddMedicineModal from './components/AddMedicineModal';
import api from '../../services/api';

export default function VendorDashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [demand, setDemand] = useState({ list: [], alert: null });
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger to re-fetch on updates

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get('/vendor/stats');
        setStats(statsRes.data.stats);

        const ordersRes = await api.get('/orders/vendor');
        setOrders(ordersRes.data.orders || []);

        const demandRes = await api.get('/vendor/demand');
        setDemand({ list: demandRes.data.demand, alert: demandRes.data.alert });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchDashboardData();
  }, [refreshTrigger]);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="flex h-screen min-h-[600px] bg-[#F7FAF8] text-[13px] font-sans relative">
      <Sidebar onAddMedicine={() => setModalOpen(true)} pendingOrders={orders.filter(o => o.status === 'Pending').length} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onAddMedicine={() => setModalOpen(true)} />

        <div className="flex-1 overflow-y-auto p-4 px-5 flex flex-col gap-3.5">
          <StatsRow stats={stats} />

          <div className="grid grid-cols-[2fr_1fr] gap-3.5">
            <InventoryTable refreshTrigger={refreshTrigger} />
            <div className="flex flex-col gap-3.5">
              {/* <LowStockAlerts refreshTrigger={refreshTrigger} /> */}
              <PriceInsight />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <OrdersTable orders={orders} />
            <DemandHeatmap data={demand} />
          </div>
        </div>
      </div>

      {modalOpen && (
        <AddMedicineModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            triggerRefresh(); // Refresh inventory and stats
          }}
        />
      )}
    </div>
  );
}
