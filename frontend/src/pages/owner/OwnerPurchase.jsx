import { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerPurchase() {
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPurchaseData = async () => {
    setLoading(true);
    try {
      const [posRes, vendRes, billsRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/vendors'),
        api.get('/purchase/bills')
      ]);
      setPos(posRes.data || []);
      setVendors(vendRes.data || []);
      setBills(billsRes.data || []);
    } catch (err) {
      console.error('Failed to load owner purchase oversight data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseData();
  }, []);

  const totalProcurementValue = pos.reduce((sum, p) => {
    if (p.status === 'draft') return sum;
    const poTotal = p.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
    return sum + poTotal;
  }, 0);

  const pendingPOs = pos.filter(p => p.status === 'confirmed' || p.status === 'partially_received').length;

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
                    {pos.map(po => {
                      const totalOutlay = po.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
                      const orderDate = new Date(po.created_at).toLocaleDateString();
                      const itemsText = po.lines?.map(item => `${item.product?.name || 'Product'} (x${Number(item.ordered_qty)})`).join(', ') || 'None';
                      const receiptStatus = po.status === 'received' ? 'Fully Received' : po.status === 'partially_received' ? 'Partial' : 'Pending';
                      const statusDisplay = po.status.toUpperCase();
                      
                      return (
                        <tr key={po.id}>
                          <td style={{ fontWeight: 'bold' }}>{po.po_number}</td>
                          <td>{orderDate}</td>
                          <td style={{ fontSize: '12px' }}>{itemsText}</td>
                          <td style={{ fontWeight: 600 }}>₹{totalOutlay.toLocaleString()}</td>
                          <td>{receiptStatus}</td>
                          <td>
                            <span className={`health-chip ${po.status === 'received' ? 'health-chip--green' : po.status === 'confirmed' || po.status === 'partially_received' ? 'health-chip--amber' : 'health-chip--red'}`}>
                              {statusDisplay}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {pos.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                          No purchase orders recorded.
                        </td>
                      </tr>
                    )}
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
                {vendors.map(v => {
                  const vendorBills = bills.filter(b => b.vendor_id === v.id && b.status !== 'paid');
                  const balance = vendorBills.reduce((sum, b) => sum + Number(b.total_amount), 0);
                  
                  return (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{v.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Contact Person: {v.contact_person || 'N/A'}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: balance > 0 ? 'var(--color-amber)' : 'var(--color-success)' }}>
                        ₹{balance.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
                {vendors.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-secondary)', fontSize: '12px' }}>
                    No vendor directory found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
