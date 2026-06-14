import { useState, useEffect } from 'react';
import { Layers, Search, Edit2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function PurchaseMaterials() {
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMat, setSelectedMat] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ reorderLevel: 0, preferredVendor: '', price: 0 });

  const loadData = async () => {
    try {
      const [prodRes, vendRes] = await Promise.all([
        api.get('/products'),
        api.get('/vendors')
      ]);
      const list = (prodRes.data || []).filter(p => p.type === 'RAW_MATERIAL');
      setMaterials(list);
      setVendors(vendRes.data || []);
      if (list.length > 0) {
        const current = selectedMat ? list.find(m => m.id === selectedMat.id) || list[0] : list[0];
        setSelectedMat(current);
      }
    } catch (err) {
      console.error('Failed to load raw materials data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (m) => {
    setForm({ 
      reorderLevel: m.inventory?.reorder_level || 0, 
      preferredVendor: m.vendor_id || '', 
      price: m.cost_price || 0 
    });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/products/${selectedMat.id}`, {
        reorder_level: Number(form.reorderLevel),
        vendor_id: form.preferredVendor || null,
        cost_price: Number(form.price)
      });
      setShowEdit(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update material settings');
    }
  };

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.sku || '').toLowerCase().includes(search.toLowerCase()) ||
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
                const isLow = (m.inventory?.on_hand_qty || 0) <= (m.inventory?.reorder_level || 0);
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
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-secondary)' }}>{m.sku || 'SKU N/A'}</span>
                      <span className={`purchase-badge purchase-badge--${isLow ? 'error' : 'success'}`} style={{ fontSize: '10px' }}>
                        {isLow ? 'Low Stock' : 'Stable'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{m.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-secondary)', marginTop: '6px' }}>
                      <span>Stock: <strong>{m.inventory?.on_hand_qty || 0} units</strong></span>
                      <span>Min: {m.inventory?.reorder_level || 0} units</span>
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
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{selectedMat.sku || 'SKU N/A'} • Stock & Configuration</span>
                </div>
                <button className="btn btn--secondary" style={{ gap: '4px', padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenEdit(selectedMat)}>
                  <Edit2 size={12} /> Maintenance
                </button>
              </div>

              {/* Stock Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>CURRENT STOCK</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{selectedMat.inventory?.on_hand_qty || 0} units</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>RESERVED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{selectedMat.inventory?.reserved_qty || 0} units</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>AVAILABLE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--color-success)' }}>
                    {selectedMat.free_qty || 0} units
                  </div>
                </div>
              </div>

              {/* Parameters List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--color-outline-variant)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Reorder Threshold Level:</span>
                  <span style={{ fontWeight: 700 }}>{selectedMat.inventory?.reorder_level || 0} units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Preferred Vendor:</span>
                  <span style={{ fontWeight: 700 }}>
                    {vendors.find(v => v.id === selectedMat.vendor_id)?.name || 'Not Assigned'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Standard Cost per Unit:</span>
                  <span style={{ fontWeight: 700 }}>₹{Number(selectedMat.cost_price).toLocaleString()}</span>
                </div>
              </div>

              {/* Stock Ledger Note */}
              <div>
                <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px' }}>Stock & Adjustment Logs</h4>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-secondary)', textAlign: 'center' }}>
                  View full stock movement history in the <strong>Inventory Ledger</strong> section for this product.
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
                  <label className="purchase-label">Reorder Level (units)</label>
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
