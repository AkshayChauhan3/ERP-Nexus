import { useState } from 'react';
import { FileText, Plus, Eye, Edit2, Copy, XCircle, X, Trash2 } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const MOCK_BOMS = [
  { id: 'BOM-001', product: 'Executive Chair', version: 'v1.2', components: 8, status: 'active',   created: '2026-05-10' },
  { id: 'BOM-002', product: 'Oak Dining Table', version: 'v2.0', components: 12, status: 'active', created: '2026-05-14' },
  { id: 'BOM-003', product: 'Comfort Sofa 3-Seater', version: 'v1.0', components: 15, status: 'draft', created: '2026-05-20' },
  { id: 'BOM-004', product: 'Wooden Bookshelf', version: 'v1.1', components: 6,  status: 'active', created: '2026-04-28' },
  { id: 'BOM-005', product: 'Office Swivel Chair', version: 'v3.0', components: 10, status: 'inactive', created: '2026-04-15' },
];

const EMPTY_BOM = {
  product: '', name: '', version: 'v1.0', description: '',
  components: [{ id: 1, product: '', qty: '', unit: 'pcs' }],
  operations: [{ id: 1, name: '', center: '', duration: '', sequence: 1 }],
};

export default function MfgBOM() {
  const [boms, setBoms]         = useState(MOCK_BOMS);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY_BOM);

  const filtered = boms.filter(b => {
    const matchSearch = b.product.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const addComponent = () => setForm(f => ({ ...f, components: [...f.components, { id: Date.now(), product: '', qty: '', unit: 'pcs' }] }));
  const removeComponent = (id) => setForm(f => ({ ...f, components: f.components.filter(c => c.id !== id) }));
  const addOperation = () => setForm(f => ({ ...f, operations: [...f.operations, { id: Date.now(), name: '', center: '', duration: '', sequence: f.operations.length + 1 }] }));
  const removeOperation = (id) => setForm(f => ({ ...f, operations: f.operations.filter(o => o.id !== id) }));

  const handleSave = () => {
    if (!form.product) return;
    setBoms(prev => [{
      id: `BOM-${String(prev.length + 1).padStart(3, '0')}`,
      product: form.product, version: form.version,
      components: form.components.length, status: 'draft',
      created: new Date().toISOString().split('T')[0]
    }, ...prev]);
    setShowModal(false);
    setForm(EMPTY_BOM);
  };

  const deactivate = (id) => setBoms(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
  const duplicate  = (bom) => setBoms(prev => [{ ...bom, id: `BOM-${String(prev.length + 1).padStart(3, '0')}`, status: 'draft', created: new Date().toISOString().split('T')[0] }, ...prev]);

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><FileText size={20} style={{ color: 'var(--color-primary)' }} />Bills of Materials</h2>
            <p className="mfg-page-sub">Manage product BoMs, components, and operations</p>
          </div>
          <button id="btn-new-bom" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={() => setShowModal(true)}>
            <Plus size={14}/> New BoM
          </button>
        </div>

        {/* Filters */}
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <input id="bom-search" className="mfg-search-input" style={{ maxWidth: '280px', flex: 1 }}
            placeholder="Search by product or BoM ID…" value={search} onChange={e => setSearch(e.target.value)} />
          {['all', 'active', 'draft', 'inactive'].map(s => (
            <button key={s} id={`bom-filter-${s}`}
              className={`mfg-role-btn ${statusFilter === s ? 'mfg-role-btn--active' : ''}`}
              onClick={() => setStatus(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-secondary)' }}>{filtered.length} records</span>
        </div>

        {/* Table */}
        <div className="admin-panel" style={{ padding: 0 }}>
          <div className="admin-table-wrapper" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>BoM ID</th><th>Product Name</th><th>Version</th>
                  <th>Components</th><th>Status</th><th>Created</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bom => (
                  <tr key={bom.id}>
                    <td style={{ fontWeight: 700 }}>{bom.id}</td>
                    <td>{bom.product}</td>
                    <td><span className="admin-badge admin-badge--info">{bom.version}</span></td>
                    <td>{bom.components} components</td>
                    <td>
                      <span className={`admin-badge admin-badge--${bom.status === 'active' ? 'success' : bom.status === 'draft' ? 'warning' : 'error'}`}>
                        {bom.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-secondary)' }}>{bom.created}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button title="View" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}><Eye size={15}/></button>
                        <button title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}><Edit2 size={15}/></button>
                        <button title="Duplicate" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => duplicate(bom)}><Copy size={15}/></button>
                        <button title="Toggle Status" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => deactivate(bom.id)}><XCircle size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No BoMs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create BoM Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create New BoM</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-form">
                {/* Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="mfg-form-label">Product *</label>
                    <input id="bom-product" className="mfg-form-input" placeholder="e.g. Executive Chair"
                      value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mfg-form-label">BoM Name</label>
                    <input id="bom-name" className="mfg-form-input" placeholder="e.g. Chair Assembly v1"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mfg-form-label">Version</label>
                    <input id="bom-version" className="mfg-form-input" placeholder="v1.0"
                      value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mfg-form-label">Description</label>
                    <input id="bom-desc" className="mfg-form-input" placeholder="Optional notes"
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>

                {/* Components */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Components</span>
                    <button id="bom-add-component" className="mfg-role-btn mfg-role-btn--active" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={addComponent}>+ Add</button>
                  </div>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead><tr><th>Component Product</th><th>Quantity</th><th>Unit</th><th></th></tr></thead>
                      <tbody>
                        {form.components.map(c => (
                          <tr key={c.id}>
                            <td><input className="mfg-form-input" style={{ margin: 0 }} placeholder="e.g. Foam Padding" value={c.product} onChange={e => setForm(f => ({ ...f, components: f.components.map(x => x.id === c.id ? { ...x, product: e.target.value } : x) }))} /></td>
                            <td><input className="mfg-form-input" style={{ margin: 0, width: '80px' }} type="number" placeholder="0" value={c.qty} onChange={e => setForm(f => ({ ...f, components: f.components.map(x => x.id === c.id ? { ...x, qty: e.target.value } : x) }))} /></td>
                            <td>
                              <select className="mfg-form-input" style={{ margin: 0 }} value={c.unit} onChange={e => setForm(f => ({ ...f, components: f.components.map(x => x.id === c.id ? { ...x, unit: e.target.value } : x) }))}>
                                {['pcs', 'kg', 'm', 'L', 'sq.m'].map(u => <option key={u}>{u}</option>)}
                              </select>
                            </td>
                            <td><button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} onClick={() => removeComponent(c.id)}><Trash2 size={14}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Operations</span>
                    <button id="bom-add-operation" className="mfg-role-btn mfg-role-btn--active" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={addOperation}>+ Add</button>
                  </div>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead><tr><th>Operation</th><th>Work Center</th><th>Duration (min)</th><th>Seq</th><th></th></tr></thead>
                      <tbody>
                        {form.operations.map(op => (
                          <tr key={op.id}>
                            <td><input className="mfg-form-input" style={{ margin: 0 }} placeholder="e.g. Foam Cutting" value={op.name} onChange={e => setForm(f => ({ ...f, operations: f.operations.map(x => x.id === op.id ? { ...x, name: e.target.value } : x) }))} /></td>
                            <td>
                              <select className="mfg-form-input" style={{ margin: 0 }} value={op.center} onChange={e => setForm(f => ({ ...f, operations: f.operations.map(x => x.id === op.id ? { ...x, center: e.target.value } : x) }))}>
                                <option value="">Select…</option>
                                {['Assembly', 'Painting', 'Packaging', 'Welding'].map(wc => <option key={wc}>{wc}</option>)}
                              </select>
                            </td>
                            <td><input className="mfg-form-input" style={{ margin: 0, width: '80px' }} type="number" placeholder="30" value={op.duration} onChange={e => setForm(f => ({ ...f, operations: f.operations.map(x => x.id === op.id ? { ...x, duration: e.target.value } : x) }))} /></td>
                            <td style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{op.sequence}</td>
                            <td><button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} onClick={() => removeOperation(op.id)}><Trash2 size={14}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="admin-modal-actions">
                  <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button id="bom-save" className="btn btn--primary" onClick={handleSave}>Save BoM</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
