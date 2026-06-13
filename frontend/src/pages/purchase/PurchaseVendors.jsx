import { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Phone, Mail, MapPin, Award, Trash2 } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function PurchaseVendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedVend, setSelectedVend] = useState(null);
  const [history, setHistory] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', address: '' });

  const loadVendors = async () => {
    try {
      const res = await api.get('/vendors');
      const list = res.data || [];
      setVendors(list);
      if (list.length > 0 && !selectedVend) {
        handleSelectVendor(list[0]);
      }
    } catch (err) {
      console.error('Failed to load vendors', err);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSelectVendor = (v) => {
    setSelectedVend(v);
    const pos = purchaseApi.getPOs().filter(p => p.vendorId === v.id);
    setHistory(pos);
    const mats = purchaseApi.getMaterials().filter(m => m.preferredVendor === v.id);
    setMaterials(mats);
  };

  const handleOpenAdd = () => {
    setForm({ name: '', contact: '', email: '', phone: '', address: '' });
    setShowAdd(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.email) return;
    try {
      await api.post('/vendors', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      setShowAdd(false);
      loadVendors();
    } catch (err) {
      alert(err.message || 'Failed to add vendor');
    }
  };

  const handleOpenEdit = (v) => {
    setForm({ name: v.name, contact: v.contact, email: v.email, phone: v.phone, address: v.address });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.email) return;
    try {
      await api.put(`/vendors/${selectedVend.id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      setShowEdit(false);
      loadVendors();
    } catch (err) {
      alert(err.message || 'Failed to edit vendor');
    }
  };

  const filtered = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.contact.toLowerCase().includes(search.toLowerCase()) ||
    v.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <Users size={22} style={{ color: 'var(--color-primary)' }} />
              Vendor Management
            </h2>
            <p className="purchase-sub">Maintain supply partner databases and review historical fulfillment performance.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={handleOpenAdd}>
            <Plus size={14} /> Add Vendor
          </button>
        </div>

        <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
          {/* Vendor List */}
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  className="purchase-input"
                  style={{ paddingLeft: '36px' }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {filtered.map(v => (
                <div
                  key={v.id}
                  onClick={() => handleSelectVendor(v)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: selectedVend?.id === v.id ? 'var(--surface-low)' : 'var(--color-canvas)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: selectedVend?.id === v.id ? '4px solid var(--color-primary)' : '1px solid var(--color-outline-variant)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>{v.id}</span>
                    <span className="purchase-badge purchase-badge--success" style={{ fontSize: '10px' }}>★ {v.rating}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{v.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>Contact: {v.contact}</div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No vendors found.</div>
              )}
            </div>
          </div>

          {/* Details Pane */}
          {selectedVend && (
            <div className="purchase-panel">
              <div className="purchase-panel-header" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h3 className="purchase-panel-title">{selectedVend.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{selectedVend.id} • Supply Partner Details</span>
                </div>
                <button className="btn btn--secondary" style={{ gap: '4px', padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenEdit(selectedVend)}>
                  <Edit2 size={12} /> Edit Details
                </button>
              </div>

              {/* Vendor Profile Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <Phone size={14} style={{ color: 'var(--color-secondary)' }} />
                    <span>{selectedVend.phone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <Mail size={14} style={{ color: 'var(--color-secondary)' }} />
                    <span>{selectedVend.email}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                    <MapPin size={14} style={{ color: 'var(--color-secondary)', marginTop: '2px' }} />
                    <span>{selectedVend.address}</span>
                  </div>
                </div>
              </div>

              {/* Supplied Materials */}
              <div>
                <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px' }}>Materials Supplied</h4>
                <div className="purchase-table-wrapper">
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>SKU</th>
                        <th>Stock Level</th>
                        <th>Base Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map(m => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{m.sku}</td>
                          <td>{m.currentStock} {m.unit}</td>
                          <td>₹{m.price}</td>
                        </tr>
                      ))}
                      {materials.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-secondary)' }}>No materials linked to this vendor.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px' }}>Purchase Order History</h4>
                <div className="purchase-table-wrapper">
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>PO ID</th>
                        <th>Date</th>
                        <th>Fulfillment</th>
                        <th>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 600 }}>{h.id}</td>
                          <td>{h.orderDate}</td>
                          <td>
                            <span className={`purchase-badge purchase-badge--${h.receiptStatus === 'Fully Received' ? 'success' : 'warning'}`}>
                              {h.receiptStatus}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>₹{h.totalValue.toLocaleString()}</td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-secondary)' }}>No purchase orders for this vendor yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Vendor Modal */}
        {showAdd && (
          <div className="purchase-modal-backdrop" onClick={() => setShowAdd(false)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Add New Vendor</h3>
                <button className="purchase-modal-close" onClick={() => setShowAdd(false)}>&times;</button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="purchase-form-group">
                  <label className="purchase-label">Vendor/Company Name</label>
                  <input type="text" className="purchase-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">Contact Person Name</label>
                  <input type="text" className="purchase-input" required value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                </div>
                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Email</label>
                    <input type="email" className="purchase-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Phone</label>
                    <input type="text" className="purchase-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">Billing Address</label>
                  <textarea className="purchase-input" style={{ minHeight: '80px', fontFamily: 'inherit' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn btn--primary">Save Vendor</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Vendor Modal */}
        {showEdit && (
          <div className="purchase-modal-backdrop" onClick={() => setShowEdit(false)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Edit Vendor Details</h3>
                <button className="purchase-modal-close" onClick={() => setShowEdit(false)}>&times;</button>
              </div>
              <form onSubmit={handleEdit}>
                <div className="purchase-form-group">
                  <label className="purchase-label">Vendor/Company Name</label>
                  <input type="text" className="purchase-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">Contact Person Name</label>
                  <input type="text" className="purchase-input" required value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                </div>
                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Email</label>
                    <input type="email" className="purchase-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Phone</label>
                    <input type="text" className="purchase-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">Billing Address</label>
                  <textarea className="purchase-input" style={{ minHeight: '80px', fontFamily: 'inherit' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowEdit(false)}>Cancel</button>
                  <button type="submit" className="btn btn--primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
