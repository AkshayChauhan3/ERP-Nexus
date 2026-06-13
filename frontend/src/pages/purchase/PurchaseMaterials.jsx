import { useState, useEffect } from 'react';
import { Layers, Search, Edit2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Purchase.css';

export default function PurchaseMaterials() {
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMat, setSelectedMat] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ reorderLevel: 0, preferredVendor: '', price: 0 });

  const loadData = () => {
    const mats = purchaseApi.getMaterials();
    const vends = purchaseApi.getVendors();
    setMaterials(mats);
    setVendors(vends);
    if (mats.length > 0 && !selectedMat) {
      setSelectedMat(mats[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (m) => {
    setForm({ reorderLevel: m.reorderLevel, preferredVendor: m.preferredVendor, price: m.price });
    setShowEdit(true);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    purchaseApi.updateMaterial(selectedMat.id, {
      reorderLevel: Number(form.reorderLevel),
      preferredVendor: form.preferredVendor,
      price: Number(form.price)
    });
    setShowEdit(false);
    loadData();
    // Refresh selected details
    const list = purchaseApi.getMaterials();
    const updated = list.find(m => m.id === selectedMat.id);
    if (updated) setSelectedMat(updated);
  };

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.sku.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <Layers size={22} style={{ color: 'var(--color-primary)' }} />
              Raw Materials Screen
            </h2>
            <p className="purchase-sub">Track active raw material units, stock risk thresholds, and preferred supplier settings.</p>
          </div>
        </div>

        <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.3fr 1.7fr' }}>
          {/* Material list */}
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search materials..."
                  className="purchase-input"
                  style={{ paddingLeft: '36px' }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
              {filtered.map(m => {
                const isLow = m.currentStock <= m.reorderLevel;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMat(m)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-outline-variant)',
                      background: selectedMat?.id === m.id ? 'var(--surface-low)' : 'var(--color-canvas)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: selectedMat?.id === m.id ? '4px solid var(--color-primary)' : '1px solid var(--color-outline-variant)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-secondary)' }}>{m.sku}</span>
                      <span className={`purchase-badge purchase-badge--${isLow ? 'error' : 'success'}`} style={{ fontSize: '10px' }}>
                        {isLow ? 'Low Stock' : 'Stable'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{m.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-secondary)', marginTop: '6px' }}>
                      <span>Stock: <strong>{m.currentStock} {m.unit}</strong></span>
                      <span>Min: {m.reorderLevel} {m.unit}</span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No materials found.</div>
              )}
            </div>
          </div>

          {/* Details & Maintenance */}
          {selectedMat && (
            <div className="purchase-panel">
              <div className="purchase-panel-header" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h3 className="purchase-panel-title">{selectedMat.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{selectedMat.sku} • Stock & Configuration</span>
                </div>
                <button className="btn btn--secondary" style={{ gap: '4px', padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenEdit(selectedMat)}>
                  <Edit2 size={12} /> Maintenance
                </button>
              </div>

              {/* Stock Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>CURRENT STOCK</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{selectedMat.currentStock} {selectedMat.unit}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>RESERVED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{selectedMat.reservedStock} {selectedMat.unit}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>AVAILABLE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--color-success)' }}>
                    {selectedMat.currentStock - selectedMat.reservedStock} {selectedMat.unit}
                  </div>
                </div>
              </div>

              {/* Parameters List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--color-outline-variant)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Reorder Threshold Level:</span>
                  <span style={{ fontWeight: 700 }}>{selectedMat.reorderLevel} {selectedMat.unit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Preferred Vendor:</span>
                  <span style={{ fontWeight: 700 }}>
                    {vendors.find(v => v.id === selectedMat.preferredVendor)?.name || selectedMat.preferredVendor}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Standard Cost per Unit:</span>
                  <span style={{ fontWeight: 700 }}>₹{selectedMat.price}</span>
                </div>
              </div>

              {/* Stock History (Mock log) */}
              <div>
                <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px' }}>Stock & Adjustment Logs</h4>
                <div className="purchase-table-wrapper">
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>Change</th>
                        <th>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2026-06-12 11:20 AM</td>
                        <td>Goods Receipt (GRN-001)</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>+18 {selectedMat.unit}</td>
                        <td>Inventory Manager</td>
                      </tr>
                      <tr>
                        <td>2026-06-10 03:45 PM</td>
                        <td>Manufacturing Draw</td>
                        <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>-4 {selectedMat.unit}</td>
                        <td>mfg@erp-nexus.local</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Maintenance / Edit Modal */}
        {showEdit && (
          <div className="purchase-modal-backdrop" onClick={() => setShowEdit(false)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Material Maintenance</h3>
                <button className="purchase-modal-close" onClick={() => setShowEdit(false)}>&times;</button>
              </div>
              <form onSubmit={handleEdit}>
                <div className="purchase-form-group">
                  <label className="purchase-label">Reorder Level ({selectedMat?.unit})</label>
                  <input
                    type="number"
                    className="purchase-input"
                    required
                    value={form.reorderLevel}
                    onChange={e => setForm({ ...form, reorderLevel: e.target.value })}
                  />
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">Preferred Vendor</label>
                  <select
                    className="purchase-input"
                    value={form.preferredVendor}
                    onChange={e => setForm({ ...form, preferredVendor: e.target.value })}
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="purchase-form-group">
                  <label className="purchase-label">Estimated Price per Unit (₹)</label>
                  <input
                    type="number"
                    className="purchase-input"
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                  />
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
