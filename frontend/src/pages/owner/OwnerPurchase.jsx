import { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, Layers } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerPurchase() {
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPurchaseData = () => {
    setLoading(true);
    setTimeout(() => {
      setPos(purchaseApi.getPOs());
      setVendors(purchaseApi.getVendors());
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadPurchaseData();
  }, []);

  const totalProcurementValue = pos.reduce((sum, p) => sum + p.totalValue, 0);
  const pendingPOs = pos.filter(p => p.status === 'Confirmed' || p.status === 'Draft').length;

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} />
              Procurement & Vendor Outlays
            </h2>
            <p className="owner-sub">Consolidated oversight of replenishment schedules, purchase orders, and supplier outstanding balances.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadPurchaseData}>
            <RefreshCw size={14} /> Refresh Procurement
          </button>
        </div>

        {/* Purchase KPIs */}
        <div className="owner-card-grid">
          <div className="owner-card">
            <span className="purchase-kpi-label">Cumulative Purchase Value</span>
            <h3 className="purchase-kpi-val" style={{ color: 'var(--color-amber)' }}>
              ₹{totalProcurementValue.toLocaleString()}
            </h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Active Suppliers</span>
            <h3 className="purchase-kpi-val">{vendors.length}</h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Open Purchase Orders</span>
            <h3 className="purchase-kpi-val">{pendingPOs} Pending</h3>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Auditing purchase ledgers...</div>
          </div>
        ) : (
          <div className="purchase-split-grid">
            {/* Purchase Orders List */}
            <div className="purchase-panel" style={{ flex: 1.5 }}>
              <div className="purchase-panel-header">
                <h3 className="purchase-panel-title">Purchase Order Tracker</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="purchase-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>PO Ref</th>
                      <th>Order Date</th>
                      <th>Items</th>
                      <th>Total Outlay</th>
                      <th>Receipt Status</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map(po => (
                      <tr key={po.id}>
                        <td style={{ fontWeight: 'bold' }}>{po.id}</td>
                        <td>{po.orderDate}</td>
                        <td style={{ fontSize: '12px' }}>
                          {po.items.map(item => `${item.name} (x${item.qty})`).join(', ')}
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{po.totalValue.toLocaleString()}</td>
                        <td>{po.receiptStatus}</td>
                        <td>
                          <span className={`health-chip ${po.status === 'Closed' ? 'health-chip--green' : po.status === 'Confirmed' ? 'health-chip--amber' : 'health-chip--red'}`}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vendor Roster Balances */}
            <div className="purchase-panel" style={{ flex: 1 }}>
              <div className="purchase-panel-header">
                <h3 className="purchase-panel-title">Vendor Accounts Outstanding</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vendors.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{v.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Rating: {v.rating} ★ | Contact: {v.contact}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: v.balance > 0 ? 'var(--color-amber)' : 'var(--color-success)' }}>
                      ₹{v.balance.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
