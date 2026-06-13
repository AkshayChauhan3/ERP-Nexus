import { useState } from 'react';
import { Factory, Plus, X, Eye } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const STATUSES = ['Draft', 'Confirmed', 'Reserved', 'In Production', 'Quality Check', 'Completed', 'Cancelled'];
const STATUS_CLS = {
  Draft: 'info', Confirmed: 'info', Reserved: 'warning',
  'In Production': 'warning', 'Quality Check': 'warning',
  Completed: 'success', Cancelled: 'error',
};

const MOCK_MOS = [
  { id: 'MO-4005', product: 'Executive Chair', qty: 20, status: 'In Production', start: '2026-06-12', finish: '2026-06-16', user: 'Rahul K.' },
  { id: 'MO-4004', product: 'Oak Dining Table', qty: 5,  status: 'Confirmed',    start: '2026-06-13', finish: '2026-06-17', user: 'Priya M.' },
  { id: 'MO-4003', product: 'Comfort Sofa',     qty: 8,  status: 'Reserved',     start: '2026-06-14', finish: '2026-06-18', user: 'Rahul K.' },
  { id: 'MO-4002', product: 'Wooden Bookshelf', qty: 12, status: 'Completed',    start: '2026-06-08', finish: '2026-06-11', user: 'Nikhil S.' },
  { id: 'MO-4001', product: 'Swivel Chair',     qty: 15, status: 'Cancelled',    start: '2026-06-05', finish: '2026-06-09', user: 'Rahul K.' },
];

const EMPTY_FORM = { product: '', qty: '', bom: '', start: '', finish: '', priority: 'medium', user: '' };
const COMPONENTS_PREVIEW = [
  { component: 'Foam Padding',   required: 20, available: 35, reserved: 20 },
  { component: 'Steel Frame',    required: 20, available: 12, reserved: 12 },
  { component: 'Fabric Cover',   required: 20, available: 40, reserved: 20 },
  { component: 'Caster Wheels',  required: 100, available: 110, reserved: 100 },
];

export default function MfgOrders() {
  const [orders, setOrders] = useState(MOCK_MOS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewOrder, setViewOrder] = useState(null);

  const filtered = orders.filter(o => {
    const matchS = o.product.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchF = statusFilter === 'all' || o.status === statusFilter;
    return matchS && matchF;
  });

  const handleSave = (asDraft) => {
    if (!form.product || !form.qty) return;
    setOrders(prev => [{
      id: `MO-${4006 + prev.length}`, product: form.product, qty: parseInt(form.qty),
      status: asDraft ? 'Draft' : 'Confirmed',
      start: form.start, finish: form.finish, user: form.user || 'Unassigned'
    }, ...prev]);
    setShowModal(false); setForm(EMPTY_FORM);
  };

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><Factory size={20} style={{ color: 'var(--color-primary)' }} />Manufacturing Orders</h2>
            <p className="mfg-page-sub">Create and manage production orders through their full lifecycle</p>
          </div>
          <button id="btn-new-mo" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={() => setShowModal(true)}>
            <Plus size={14}/> New MO
          </button>
        </div>

        {/* Filters */}
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <input id="mo-search" className="mfg-search-input" style={{ maxWidth: '260px', flex: 1 }}
            placeholder="Search by product or MO number…" value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['all', ...STATUSES].map(s => (
              <button key={s} id={`mo-filter-${s.replace(/\s/g,'').toLowerCase()}`}
                className={`mfg-role-btn ${statusFilter === s ? 'mfg-role-btn--active' : ''}`}
                style={{ fontSize: '11px' }} onClick={() => setStatus(s)}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="admin-panel" style={{ padding: 0 }}>
          <div className="admin-table-wrapper" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr><th>MO Number</th><th>Product</th><th>Qty</th><th>Status</th><th>Planned Start</th><th>Planned Finish</th><th>Assigned To</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(mo => (
                  <tr key={mo.id}>
                    <td style={{ fontWeight: 700 }}>{mo.id}</td>
                    <td style={{ fontWeight: 600 }}>{mo.product}</td>
                    <td>{mo.qty} units</td>
                    <td><span className={`admin-badge admin-badge--${STATUS_CLS[mo.status] || 'info'}`}>{mo.status}</span></td>
                    <td style={{ color: 'var(--color-secondary)' }}>{mo.start}</td>
                    <td style={{ color: 'var(--color-secondary)' }}>{mo.finish}</td>
                    <td>{mo.user}</td>
                    <td>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => setViewOrder(mo)} title="View Details">
                        <Eye size={15}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create MO Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create Manufacturing Order</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="mfg-form-label">Product *</label>
                    <input id="mo-product" className="mfg-form-input" placeholder="e.g. Executive Chair" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mfg-form-label">Quantity *</label>
                    <input id="mo-qty" className="mfg-form-input" type="number" placeholder="0" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mfg-form-label">Bill of Materials</label>
                    <select id="mo-bom" className="mfg-form-input" value={form.bom} onChange={e => setForm(f => ({ ...f, bom: e.target.value }))}>
                      <option value="">Auto-detect from product</option>
                      <option>BOM-001 — Executive Chair v1.2</option>
                      <option>BOM-002 — Oak Dining Table v2.0</option>
                      <option>BOM-003 — Comfort Sofa v1.0</option>
                    </select>
                  </div>
                  <div>
                    <label className="mfg-form-label">Priority</label>
                    <select id="mo-priority" className="mfg-form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="mfg-form-label">Planned Start</label>
                    <input id="mo-start" className="mfg-form-input" type="date" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mfg-form-label">Planned Finish</label>
                    <input id="mo-finish" className="mfg-form-input" type="date" value={form.finish} onChange={e => setForm(f => ({ ...f, finish: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="mfg-form-label">Assigned User</label>
                    <input id="mo-user" className="mfg-form-input" placeholder="e.g. Rahul K." value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} />
                  </div>
                </div>

                {/* Component Preview */}
                {form.product && (
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Component Requirements (Auto-fetched)</p>
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead><tr><th>Component</th><th>Required</th><th>Available</th><th>Reserved</th></tr></thead>
                        <tbody>
                          {COMPONENTS_PREVIEW.map((c, i) => (
                            <tr key={i}>
                              <td>{c.component}</td>
                              <td>{c.required}</td>
                              <td style={{ color: c.available >= c.required ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>{c.available}</td>
                              <td>{c.reserved}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="admin-modal-actions">
                  <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button id="mo-save-draft" className="btn btn--secondary" onClick={() => handleSave(true)}>Save Draft</button>
                  <button id="mo-confirm" className="btn btn--primary" onClick={() => handleSave(false)}>Confirm Order</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View MO Detail Modal */}
      {viewOrder && (
        <div className="admin-modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{viewOrder.id} — Details</h3>
              <button className="admin-modal-close" onClick={() => setViewOrder(null)}><X size={18}/></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    ['MO Number', viewOrder.id], ['Product', viewOrder.product],
                    ['Quantity', `${viewOrder.qty} units`], ['Status', viewOrder.status],
                    ['Planned Start', viewOrder.start], ['Planned Finish', viewOrder.finish],
                    ['Assigned To', viewOrder.user],
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
                      width: viewOrder.status === 'Completed' ? '100%' : viewOrder.status === 'In Production' ? '65%' : viewOrder.status === 'Quality Check' ? '90%' : '20%',
                      background: viewOrder.status === 'Completed' ? 'var(--color-success)' : 'var(--color-primary)'
                    }} />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '4px', textAlign: 'right' }}>
                    {viewOrder.status === 'Completed' ? '100%' : viewOrder.status === 'In Production' ? '65%' : viewOrder.status === 'Quality Check' ? '90%' : '20%'} complete
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
