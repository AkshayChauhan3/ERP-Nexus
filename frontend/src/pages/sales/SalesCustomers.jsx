import { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, MapPin } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function SalesCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  const [history, setHistory] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  // Store all records locally to filter on selection
  const [allOrders, setAllOrders] = useState([]);
  const [allQuotations, setAllQuotations] = useState([]);
  const [allDeliveries, setAllDeliveries] = useState([]);

  // Form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', gst: '', address: '', city: '', state: '', country: 'India' });

  const loadData = async () => {
    try {
      const [custRes, orderRes, qtnRes, dlvRes] = await Promise.all([
        api.get('/customers'),
        api.get('/sales-orders'),
        api.get('/sales-quotations'),
        api.get('/sales-deliveries')
      ]);
      const custs = custRes.data || [];
      const ords = orderRes.data || [];
      const qtns = qtnRes.data || [];
      const dlvs = dlvRes.data || [];

      setCustomers(custs);
      setAllOrders(ords);
      setAllQuotations(qtns);
      setAllDeliveries(dlvs);

      if (custs.length > 0) {
        const current = selectedCust ? custs.find(c => c.id === selectedCust.id) || custs[0] : custs[0];
        setSelectedCust(current);
        filterCustomerTransactions(current.id, ords, qtns, dlvs);
      }
    } catch (err) {
      console.error('Failed to load customers data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterCustomerTransactions = (custId, ords, qtns, dlvs) => {
    const orders = ords.filter(o => o.customer_id === custId);
    setHistory(orders);
    const quotationsFiltered = qtns.filter(q => q.customer_id === custId);
    setQuotations(quotationsFiltered);
    const deliveriesFiltered = dlvs.filter(d => d.customer_id === custId);
    setDeliveries(deliveriesFiltered);
  };

  const handleSelectCustomer = (c) => {
    setSelectedCust(c);
    filterCustomerTransactions(c.id, allOrders, allQuotations, allDeliveries);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const fullAddress = [form.address, form.city, form.state, form.country].filter(Boolean).join(', ');
      await api.post('/customers', {
        name: form.name,
        email: form.email,
        phone: form.mobile,
        address: fullAddress,
        gst_no: form.gst,
      });
      setShowAdd(false);
      setForm({ name: '', mobile: '', email: '', gst: '', address: '', city: '', state: '', country: 'India' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add customer');
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <Users size={22} style={{ color: 'var(--color-primary)' }} />
              Customer Management
            </h2>
            <p className="sales-sub">Establish and maintain customer accounts, tax registrations, and history records.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Customer
          </button>
        </div>

        <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
          {/* Customer list */}
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="purchase-input"
                  style={{ paddingLeft: '36px' }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: selectedCust?.id === c.id ? 'var(--surface-low)' : 'var(--color-canvas)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: selectedCust?.id === c.id ? '4px solid var(--color-primary)' : '1px solid var(--color-outline-variant)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>{c.customer_code || 'CUSTOMER'}</span>
                    <span className="purchase-badge purchase-badge--success" style={{ fontSize: '10px' }}>{c.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>{c.email || 'No Email'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Details panel */}
          {selectedCust && (
            <div className="purchase-panel">
              <div className="purchase-panel-header">
                <div>
                  <h3 className="purchase-panel-title">{selectedCust.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>ID: {selectedCust.customer_code || selectedCust.id} • Customer Profile</span>
                </div>
              </div>

              {/* Profile Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Phone:</span>
                    <span>{selectedCust.phone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Email:</span>
                    <span>{selectedCust.email || 'N/A'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={14} style={{ color: 'var(--color-secondary)', marginTop: '2px' }} />
                    <span>{selectedCust.address || 'No Address registered'}</span>
                  </div>
                  <div>GSTIN: <strong>{selectedCust.gst_no || 'Unregistered'}</strong></div>
                </div>
              </div>

              {/* Historical transactions */}
              <div>
                <h4 style={{ margin: '16px 0 8px 0', fontSize: '13px' }}>Sales Order History</h4>
                <div className="purchase-table-wrapper">
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => {
                        const amount = h.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
                        return (
                          <tr key={h.id}>
                            <td style={{ fontWeight: 600 }}>{h.order_number}</td>
                            <td>{new Date(h.created_at).toLocaleDateString()}</td>
                            <td>
                              <span className="purchase-badge purchase-badge--success" style={{ textTransform: 'capitalize' }}>{h.status}</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>₹{amount.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                      {history.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-secondary)' }}>No orders placed.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="purchase-modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="purchase-modal" onClick={e => e.stopPropagation()}>
            <div className="purchase-modal-header">
              <h3 className="purchase-modal-title">Add Customer Account</h3>
              <button className="purchase-modal-close" onClick={() => setShowAdd(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="purchase-form-group">
                <label className="purchase-label">Company / Client Name</label>
                <input type="text" className="purchase-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="purchase-form-row">
                <div className="purchase-form-group">
                  <label className="purchase-label">Mobile Number</label>
                  <input type="text" className="purchase-input" required value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">Email</label>
                  <input type="email" className="purchase-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="purchase-form-group">
                <label className="purchase-label">GST Registration Number</label>
                <input type="text" className="purchase-input" placeholder="e.g. 27AAAAA1111A1Z1" value={form.gst} onChange={e => setForm({ ...form, gst: e.target.value })} />
              </div>
              <div className="purchase-form-group">
                <label className="purchase-label">Shipping / Billing Address</label>
                <textarea className="purchase-input" style={{ minHeight: '60px', fontFamily: 'inherit' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="purchase-form-row">
                <div className="purchase-form-group">
                  <label className="purchase-label">City</label>
                  <input type="text" className="purchase-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">State</label>
                  <input type="text" className="purchase-input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
