import { useState, useEffect } from 'react';
import { Truck, Search, CheckCircle, Package, ArrowRight } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Purchase.css';

export default function SalesDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedDlv, setSelectedDlv] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = () => {
    const list = salesApi.getDeliveries();
    setDeliveries(list);
    setCustomers(salesApi.getCustomers());
    if (list.length > 0 && !selectedDlv) {
      setSelectedDlv(list[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectDlv = (d) => {
    setSelectedDlv(d);
  };

  const handleUpdateStatus = (id, status) => {
    salesApi.updateDeliveryStatus(id, status);
    loadData();
    // Refresh selected details
    const list = salesApi.getDeliveries();
    const updated = list.find(d => d.id === id);
    if (updated) setSelectedDlv(updated);
  };

  const filtered = deliveries.filter(d => 
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    d.soId.toLowerCase().includes(search.toLowerCase()) ||
    (customers.find(c => c.id === d.customerId)?.name || '').toLowerCase().includes(search.toLowerCase())
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
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>{d.id}</span>
                    <span className={`purchase-badge purchase-badge--${
                      d.status === 'Delivered' ? 'success' :
                      d.status === 'Dispatched' || d.status === 'Packed' ? 'warning' : 'outline'
                    }`} style={{ fontSize: '10px' }}>
                      {d.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>SO Reference: {d.soId}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                    Client: {customers.find(c => c.id === d.customerId)?.name || d.customerId}
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
                  <h3 className="purchase-panel-title">Shipment Details — {selectedDlv.id}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Ref Order: {selectedDlv.soId}</span>
                </div>
              </div>

              {/* Delivery info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-lg)', fontSize: '13px' }}>
                <div>Client Account: <strong>{customers.find(c => c.id === selectedDlv.customerId)?.name}</strong></div>
                <div>Shipping Target: <strong>{selectedDlv.shippingAddress}</strong></div>
                <div>Commitment Date: <strong>{selectedDlv.deliveryDate}</strong></div>
                <div>Carrier Dispatch Date: <strong>{selectedDlv.dispatchDate}</strong></div>
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
                    {selectedDlv.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td style={{ fontWeight: 700 }}>{item.qty} units</td>
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
