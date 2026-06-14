import { useState, useEffect } from 'react';
import { Truck, Search, CheckCircle, Package } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function SalesDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedDlv, setSelectedDlv] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [dlvRes, custRes] = await Promise.all([
        api.get('/sales-deliveries'),
        api.get('/customers')
      ]);
      const list = dlvRes.data || [];
      setDeliveries(list);
      setCustomers(custRes.data || []);
      if (list.length > 0) {
        setSelectedDlv(prev => {
          if (prev) {
            const updated = list.find(d => d.id === prev.id);
            return updated || list[0];
          }
          return list[0];
        });
      } else {
        setSelectedDlv(null);
      }
    } catch (err) {
      console.error('Failed to load deliveries data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectDlv = (d) => {
    setSelectedDlv(d);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/sales-deliveries/${id}/status`, { status });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update delivery status');
    }
  };

  const filtered = deliveries.filter(d => 
    (d.delivery_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.sales_order?.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <Truck size={22} style={{ color: 'var(--color-primary)' }} />
              Delivery Management
            </h2>
            <p className="sales-sub">Pack goods, schedule carrier dispatches, and log physical delivery turnarounds.</p>
          </div>
        </div>

        <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
          {/* Deliveries list */}
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search deliveries..."
                  className="purchase-input"
                  style={{ paddingLeft: '36px' }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {filtered.map(d => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDlv(d)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: selectedDlv?.id === d.id ? 'var(--surface-low)' : 'var(--color-canvas)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: selectedDlv?.id === d.id ? '4px solid var(--color-primary)' : '1px solid var(--color-outline-variant)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>{d.delivery_number}</span>
                    <span className={`purchase-badge purchase-badge--${
                      d.status === 'Delivered' ? 'success' :
                      d.status === 'Dispatched' || d.status === 'Packed' ? 'warning' : 'outline'
                    }`} style={{ fontSize: '10px' }}>
                      {d.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>SO Reference: {d.sales_order?.order_number}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                    Client: {d.customer?.name || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details pane */}
          {selectedDlv && (
            <div className="purchase-panel">
              <div className="purchase-panel-header">
                <div>
                  <h3 className="purchase-panel-title">Shipment Details — {selectedDlv.delivery_number}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Ref Order: {selectedDlv.sales_order?.order_number}</span>
                </div>
              </div>

              {/* Delivery info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-lg)', fontSize: '13px' }}>
                <div>Client Account: <strong>{selectedDlv.customer?.name}</strong></div>
                <div>Shipping Target: <strong>{selectedDlv.shipping_address}</strong></div>
                <div>Commitment Date: <strong>{new Date(selectedDlv.delivery_date).toLocaleDateString()}</strong></div>
                <div>Carrier Dispatch Date: <strong>{selectedDlv.dispatch_date ? new Date(selectedDlv.dispatch_date).toLocaleDateString() : '-'}</strong></div>
              </div>

              {/* Items */}
              <div>
                <h4 style={{ margin: '14px 0 8px 0', fontSize: '13px' }}>Items to Ship</h4>
                <table className="purchase-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDlv.lines?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown'}</td>
                        <td style={{ fontWeight: 700 }}>{Number(item.qty)} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Fulfillment Actions */}
              <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px' }}>Fulfillment Status Transition</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedDlv.status === 'Pending' && (
                    <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => handleUpdateStatus(selectedDlv.id, 'Packed')}>
                      <Package size={14} /> Pack Items
                    </button>
                  )}
                  {selectedDlv.status === 'Packed' && (
                    <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => handleUpdateStatus(selectedDlv.id, 'Dispatched')}>
                      <Truck size={14} /> Dispatch shipment
                    </button>
                  )}
                  {selectedDlv.status === 'Dispatched' && (
                    <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => handleUpdateStatus(selectedDlv.id, 'Delivered')}>
                      <CheckCircle size={14} /> Log Delivery Completed
                    </button>
                  )}
                  {selectedDlv.status === 'Delivered' && (
                    <div style={{ color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <CheckCircle size={16} /> Shipment delivered and transaction finalized.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
