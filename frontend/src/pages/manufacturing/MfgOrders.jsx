import { useState, useEffect } from 'react';
import { Factory, Plus, X, Eye } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const STATUSES = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const STATUS_CLS = {
  draft: 'info', confirmed: 'primary',
  in_progress: 'warning',
  completed: 'success', cancelled: 'error',
};

const EMPTY_FORM = { product_id: '', qty: '' };

export default function MfgOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewOrder, setViewOrder] = useState(null);

  const loadData = async () => {
    try {
      const [moRes, prodRes, bomRes] = await Promise.all([
        api.get('/manufacturing-orders'),
        api.get('/products'),
        api.get('/boms')
      ]);
      setOrders(moRes.data || []);
      setProducts(prodRes.data || []);
      setBoms(bomRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = orders.filter(o => {
    const pName = o.product?.name || '';
    const matchS = pName.toLowerCase().includes(search.toLowerCase()) || (o.mo_number || '').toLowerCase().includes(search.toLowerCase());
    const matchF = statusFilter === 'all' || o.status === statusFilter;
    return matchS && matchF;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.product_id || !form.qty) return;
    try {
      await api.post('/manufacturing-orders', {
        product_id: form.product_id,
        quantity: Number(form.qty)
      });
      setShowModal(false); 
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create MO');
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/manufacturing-orders/${id}/${action}`);
      setViewOrder(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const availableBOMProducts = products.filter(p => boms.some(b => b.product_id === p.id));

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><Factory size={20} style={{ color: 'var(--color-primary)' }} />Manufacturing Orders</h2>
            <p className="mfg-page-sub">Create and manage production orders through their full lifecycle</p>
          </div>
          <button id="btn-new-mo" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={() => setShowModal(true)}>
            <Plus size={14} /> New MO
          </button>
        </div>

        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <input id="mo-search" className="mfg-search-input" style={{ maxWidth: '260px', flex: 1 }}
            placeholder="Search by product or MO number…" value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['all', ...STATUSES].map(s => (
              <button key={s} id={`mo-filter-${s}`}
                className={`mfg-role-btn ${statusFilter === s ? 'mfg-role-btn--active' : ''}`}
                style={{ fontSize: '11px', textTransform: 'capitalize' }} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-panel" style={{ padding: 0 }}>
          <div className="admin-table-wrapper" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr><th>MO Number</th><th>Product</th><th>Qty</th><th>Status</th><th>Created</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(mo => (
                  <tr key={mo.id}>
                    <td style={{ fontWeight: 700 }}>{mo.mo_number}</td>
                    <td style={{ fontWeight: 600 }}>{mo.product?.name}</td>
                    <td>{Number(mo.quantity)} units</td>
                    <td><span className={`admin-badge admin-badge--${STATUS_CLS[mo.status] || 'info'}`}>{mo.status}</span></td>
                    <td style={{ color: 'var(--color-secondary)' }}>{new Date(mo.created_at).toLocaleDateString()}</td>
                    <td>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => setViewOrder(mo)} title="View Details">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create Manufacturing Order</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <form className="admin-modal-form" onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="mfg-form-label">Product (Must have BOM) *</label>
                    <select id="mo-product" className="mfg-form-input" required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                      <option value="">Select a Product</option>
                      {availableBOMProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mfg-form-label">Quantity *</label>
                    <input id="mo-qty" className="mfg-form-input" required type="number" placeholder="0" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
                  </div>
                </div>

                <div className="admin-modal-actions">
                  <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" id="mo-confirm" className="btn btn--primary">Create MO</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewOrder && (
        <div className="admin-modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{viewOrder.mo_number} — Details</h3>
              <button className="admin-modal-close" onClick={() => setViewOrder(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    ['MO Number', viewOrder.mo_number], ['Product', viewOrder.product?.name],
                    ['Quantity', `${Number(viewOrder.quantity)} units`], ['Status', viewOrder.status],
                    ['Created At', new Date(viewOrder.created_at).toLocaleString()], ['Produced Qty', `${Number(viewOrder.produced_qty)} units`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '10px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Production Progress</p>
                  <div className="mfg-progress-track" style={{ height: '10px' }}>
                    <div className="mfg-progress-fill" style={{
                      width: viewOrder.status === 'completed' ? '100%' : viewOrder.status === 'in_progress' ? '50%' : viewOrder.status === 'confirmed' ? '20%' : '5%',
                      background: viewOrder.status === 'completed' ? 'var(--color-success)' : 'var(--color-primary)'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  {viewOrder.status === 'draft' && (
                    <button className="btn btn--primary" onClick={() => handleAction(viewOrder.id, 'confirm')}>Confirm MO</button>
                  )}
                  {viewOrder.status === 'confirmed' && (
                    <button className="btn btn--success" onClick={() => handleAction(viewOrder.id, 'complete')}>Complete MO</button>
                  )}
                  {(viewOrder.status === 'draft' || viewOrder.status === 'confirmed') && (
                    <button className="btn btn--secondary" style={{ color: 'var(--color-error)' }} onClick={() => handleAction(viewOrder.id, 'cancel')}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
