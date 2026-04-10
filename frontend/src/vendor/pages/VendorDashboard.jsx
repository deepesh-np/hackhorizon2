import { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StatsRow from './components/StatsRow';
import InventoryTable from './components/InventoryTable';
import LowStockAlerts from './components/LowStockAlerts';
import PriceInsight from './components/PriceInsight';
import OrdersTable from './components/OrdersTable';
import DemandHeatmap from './components/DemandHeatmap';
import AddMedicineModal from './components/AddMedicineModal';
import EditMedicineModal from './components/EditMedicineModal';
import api from '../../services/api';

export default function VendorDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [demand, setDemand] = useState({ list: [], alert: null });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect if not a vendor
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'vendor')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'vendor') return;

    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes, demandRes] = await Promise.allSettled([
          api.get('/vendor/stats'),
          api.get('/orders/vendor'),
          api.get('/vendor/demand'),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.stats);
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.orders || []);
        if (demandRes.status === 'fulfilled') {
          setDemand({ list: demandRes.value.data.demand, alert: demandRes.value.data.alert });
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchDashboardData();
  }, [refreshTrigger, user]);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/vendor/${orderId}/status`, { status: newStatus });
      triggerRefresh();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleDeleteInventory = async (itemId) => {
    if (!confirm('Are you sure you want to remove this medicine from your inventory?')) return;
    try {
      await api.delete(`/vendor/inventory/${itemId}`);
      triggerRefresh();
    } catch (err) {
      console.error("Error deleting inventory:", err);
      alert(err.response?.data?.message || 'Failed to remove medicine');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7FAF8]">
        <div className="text-[#1B7B3A] text-sm font-medium animate-pulse">Loading vendor portal...</div>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') return null;

  // Render the main content area based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'inventory':
        return (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Medicine Inventory</h2>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 py-[7px] px-3.5 bg-[#1B7B3A] text-white rounded-lg text-xs font-medium cursor-pointer border-none hover:bg-[#145C2C] transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
                Add Medicine
              </button>
            </div>
            <InventoryTable
              refreshTrigger={refreshTrigger}
              onEdit={(item) => setEditModal({ open: true, item })}
              onDelete={handleDeleteInventory}
            />
            <div className="grid grid-cols-2 gap-3.5">
              <LowStockAlerts refreshTrigger={refreshTrigger} />
              <PriceInsight />
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="flex flex-col gap-3.5">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Orders & Requests</h2>
            <OrdersTable orders={orders} onStatusUpdate={handleOrderStatusUpdate} />
          </div>
        );

      case 'analytics':
        return (
          <div className="flex flex-col gap-3.5">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Analytics & Insights</h2>
            <StatsRow stats={stats} />
            <div className="grid grid-cols-2 gap-3.5">
              <PriceInsight />
              <DemandHeatmap data={demand} />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <LowStockAlerts refreshTrigger={refreshTrigger} />
              <OrdersTable orders={orders} onStatusUpdate={handleOrderStatusUpdate} />
            </div>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <>
            <StatsRow stats={stats} />
            <div className="grid grid-cols-[2fr_1fr] gap-3.5">
              <InventoryTable
                refreshTrigger={refreshTrigger}
                onEdit={(item) => setEditModal({ open: true, item })}
                onDelete={handleDeleteInventory}
              />
              <div className="flex flex-col gap-3.5">
                <LowStockAlerts refreshTrigger={refreshTrigger} />
                <PriceInsight />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <OrdersTable orders={orders} onStatusUpdate={handleOrderStatusUpdate} />
              <DemandHeatmap data={demand} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen min-h-[600px] bg-[#F7FAF8] text-[13px] font-sans relative">
      <Sidebar
        user={user}
        activeView={activeView}
        onViewChange={setActiveView}
        onAddMedicine={() => setModalOpen(true)}
        pendingOrders={orders.filter(o => o.status === 'Pending').length}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} activeView={activeView} onAddMedicine={() => setModalOpen(true)} />

        <div className="flex-1 overflow-y-auto p-4 px-5 flex flex-col gap-3.5">
          {renderContent()}
        </div>
      </div>

      {modalOpen && (
        <AddMedicineModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            triggerRefresh();
          }}
        />
      )}

      {editModal.open && editModal.item && (
        <EditMedicineModal
          item={editModal.item}
          onClose={() => setEditModal({ open: false, item: null })}
          onSuccess={() => {
            setEditModal({ open: false, item: null });
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}
