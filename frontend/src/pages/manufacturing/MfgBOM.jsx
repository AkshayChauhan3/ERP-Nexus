import { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Trash2, X } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const EMPTY_BOM = {
  product_id: '',
  components: [{ id: 1, component_product_id: '', qty_per_unit: 1, operation: 'assembly' }]
};

export default function MfgBOM() {
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_BOM);

  const loadData = async () => {
    try {
      const [bomRes, prodRes] = await Promise.all([
        api.get('/boms'),
        api.get('/products')
      ]);
      setBoms(bomRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const finishedGoods = products.filter(p => p.type === 'FINISHED_GOOD');
  const rawMaterials = products.filter(p => p.type === 'RAW_MATERIAL');

  const filtered = boms.filter(b => {
    const pName = b.product?.name || '';
    return pName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
  });

  const addComponent = () => setForm(f => ({ ...f, components: [...f.components, { id: Date.now(), component_product_id: '', qty_per_unit: 1, operation: 'assembly' }] }));
  const removeComponent = (id) => setForm(f => ({ ...f, components: f.components.filter(c => c.id !== id) }));

  const handleSave = async () => {
    if (!form.product_id) return;
    try {
      const payload = {
        product_id: form.product_id,
        lines: form.components.map(c => ({
          component_product_id: c.component_product_id,
          qty_per_unit: Number(c.qty_per_unit),
          operation: c.operation
        }))
      };
      await api.post('/boms', payload);
      setShowModal(false);
      setForm(EMPTY_BOM);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create BOM');
    }
  };

  const deleteBom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this BOM?")) return;
    try {
      await api.delete(`/boms/${id}`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><FileText size={20} style={{ color: 'var(--color-primary)' }} />Bills of Materials</h2>
            <p className="mfg-page-sub">Manage product BoMs and components</p>
          </div>
          <button id="btn-new-bom" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={() => setShowModal(true)}>
            <Plus size={14}/> New BoM
          </button>
        </div>

        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <input id="bom-search" className="mfg-search-input" style={{ maxWidth: '280px', flex: 1 }}
            placeholder="Search by product or BoM ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-secondary)' }}>{filtered.length} records</span>
        </div>

        <div className="admin-panel" style={{ padding: 0 }}>
          <div className="admin-table-wrapper" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>BoM ID</th>
                  <th>Product Name</th>
                  <th>Components</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bom => (
                  <tr key={bom.id}>
                    <td style={{ fontWeight: 700, fontSize: '11px' }}>{bom.id}</td>
                    <td style={{ fontWeight: 600 }}>{bom.product?.name}</td>
                    <td>{bom.lines?.length || 0} components</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} onClick={() => deleteBom(bom.id)}><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No BoMs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create New BoM</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-form">
                <div>
                  <label className="mfg-form-label">Finished Good Product *</label>
                  <select className="mfg-form-input" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                    <option value="">Select a Product</option>
                    {finishedGoods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Components</span>
                    <button id="bom-add-component" className="mfg-role-btn mfg-role-btn--active" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={addComponent}>+ Add</button>
                  </div>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead><tr><th>Raw Material</th><th>Quantity</th><th>Operation</th><th></th></tr></thead>
                      <tbody>
                        {form.components.map((c, i) => (
                          <tr key={c.id}>
                            <td>
                              <select className="mfg-form-input" style={{ margin: 0 }} value={c.component_product_id} onChange={e => setForm(f => ({ ...f, components: f.components.map(x => x.id === c.id ? { ...x, component_product_id: e.target.value } : x) }))}>
                                <option value="">Select Component</option>
                                {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                              </select>
                            </td>
                            <td><input className="mfg-form-input" style={{ margin: 0, width: '80px' }} type="number" placeholder="0" value={c.qty_per_unit} onChange={e => setForm(f => ({ ...f, components: f.components.map(x => x.id === c.id ? { ...x, qty_per_unit: e.target.value } : x) }))} /></td>
                            <td>
                              <select className="mfg-form-input" style={{ margin: 0 }} value={c.operation} onChange={e => setForm(f => ({ ...f, components: f.components.map(x => x.id === c.id ? { ...x, operation: e.target.value } : x) }))}>
                                {['assembly', 'painting', 'packing'].map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </td>
                            <td><button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} onClick={() => removeComponent(c.id)}><Trash2 size={14}/></button></td>
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
