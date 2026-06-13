import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, ArrowUpDown, X, Camera, RefreshCw, Trash2 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { api } from '../utils/api';
import './Products.css';
import '../styles/AdminPages.css';

const FILTERS = [
  { key: 'all',      label: 'All Products' },
  { key: 'low',      label: 'Low Stock' },
  { key: 'out',      label: 'Out of Stock' },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'create' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Image uploading state
  const [uploadingImage, setUploadingImage] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [boms, setBoms] = useState([]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    sku: '',
    type: 'RAW_MATERIAL',
    sales_price: '',
    cost_price: '',
    on_hand_qty: '',
    reserved_qty: '',
    reorder_level: '',
    procurement_type: 'MTS',
    procurement_method: 'PURCHASE',
    procure_on_demand: false,
    vendor_id: '',
    bom_id: '',
    image_url: ''
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load products list.');
    } finally {
      setLoading(false);
    }
  };

  const loadVendorsAndBoms = async () => {
    try {
      const [vendorRes, bomRes] = await Promise.all([
        api.get('/vendors'),
        api.get('/boms')
      ]);
      if (vendorRes.success) setVendors(vendorRes.data || []);
      if (bomRes.success) setBoms(bomRes.data || []);
    } catch (err) {
      console.error('Failed to load vendors or boms:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadVendorsAndBoms();
  }, []);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleOpenCreate = () => {
    setForm({
      name: '',
      sku: `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      type: 'RAW_MATERIAL',
      sales_price: '100',
      cost_price: '50',
      on_hand_qty: '0',
      reserved_qty: '0',
      reorder_level: '5',
      procurement_type: 'MTS',
      procurement_method: 'PURCHASE',
      procure_on_demand: false,
      vendor_id: '',
      bom_id: '',
      image_url: ''
    });
    setActiveModal('create');
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      sku: product.sku || '',
      type: product.type,
      sales_price: product.sales_price !== undefined ? String(product.sales_price) : '0',
      cost_price: product.cost_price !== undefined ? String(product.cost_price) : '0',
      on_hand_qty: product.inventory?.on_hand_qty !== undefined ? String(product.inventory.on_hand_qty) : '0',
      reserved_qty: product.inventory?.reserved_qty !== undefined ? String(product.inventory.reserved_qty) : '0',
      reorder_level: product.inventory?.reorder_level !== undefined ? String(product.inventory.reorder_level) : '0',
      procurement_type: product.procurement_type || 'MTS',
      procurement_method: product.procurement_method || 'PURCHASE',
      procure_on_demand: product.procure_on_demand || false,
      vendor_id: product.vendor_id || '',
      bom_id: product.bom_id || '',
      image_url: product.image_url || ''
    });
    setActiveModal('edit');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setUploadingImage(true);
      try {
        const uploadRes = await api.post('/products/upload-image', { image: base64String });
        if (uploadRes.success && uploadRes.imageUrl) {
          setForm(f => ({ ...f, image_url: uploadRes.imageUrl }));
          showNotification('Photo uploaded successfully.');
        } else {
          showNotification('Image upload failed', true);
        }
      } catch (err) {
        showNotification(err.message || 'Image upload failed', true);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const salesPriceNum = parseFloat(form.sales_price) || 0;
    const costPriceNum = parseFloat(form.cost_price) || 0;
    if (!form.name || salesPriceNum <= 0 || costPriceNum <= 0) {
      showNotification('Please fill in all required fields.', true);
      return;
    }

    try {
      const body = {
        name: form.name,
        sku: form.sku,
        type: form.type,
        sales_price: salesPriceNum,
        cost_price: costPriceNum,
        on_hand_qty: parseFloat(form.on_hand_qty) || 0,
        reserved_qty: parseFloat(form.reserved_qty) || 0,
        reorder_level: parseFloat(form.reorder_level) || 0,
        procurement_type: form.procurement_type,
        procurement_method: form.procurement_method,
        procure_on_demand: !!form.procure_on_demand,
        vendor_id: form.vendor_id ? form.vendor_id : null,
        bom_id: form.bom_id ? form.bom_id : null,
        image_url: form.image_url
      };

      if (activeModal === 'create') {
        const res = await api.post('/products', body);
        if (res.success) {
          showNotification('Product created successfully.');
        }
      } else {
        const res = await api.patch(`/products/${selectedProduct.id}`, body);
        if (res.success) {
          showNotification('Product updated successfully.');
        }
      }
      setActiveModal(null);
      loadProducts();
    } catch (err) {
      showNotification(err.message || 'Action failed', true);
    }
  };

  const handleDelete = async (productId) => {
    try {
      const res = await api.delete(`/products/${productId}`);
      if (res.success) {
        showNotification('Product deleted successfully.');
        loadProducts();
      }
    } catch (err) {
      showNotification(err.message || 'Delete failed', true);
    }
  };

  // Filter products list
  const filtered = products.filter(p => {
    const onHand = parseFloat(p.inventory?.on_hand_qty) || 0;
    const reorder = parseFloat(p.inventory?.reorder_level) || 0;
    
    if (activeFilter === 'low' && onHand > reorder) return false;
    if (activeFilter === 'out' && onHand > 0) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <AppShell hideSidebar={activeModal !== null}>
      <div className="products-page animate-page">
        {/* Alerts */}
        {successMsg && <div className="profile-drawer-success-msg" style={{ margin: '0 0 16px 0' }}>{successMsg}</div>}
        {errorMsg && <div className="register-error" style={{ margin: '0 0 16px 0' }}>{errorMsg}</div>}

        {/* Header */}
        <div className="products-header">
          <div>
            <h2 className="text-display-lg products-title">Products Directory</h2>
            <p className="products-subtitle">Master inventory catalog — {products.length} items total</p>
          </div>
          <button id="btn-new-product" className="products-new-btn btn-interactive" onClick={handleOpenCreate}>
            <Plus size={16} strokeWidth={2.5} />
            New Product
          </button>
        </div>

        {/* Controls */}
        <div className="products-controls">
          <div className="filter-pills">
            {FILTERS.map(f => (
              <button
                key={f.key}
                id={`filter-${f.key}`}
                className={`filter-pill ${activeFilter === f.key ? 'filter-pill--active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className={`products-search ${searchExpanded ? 'products-search--expanded' : ''}`}>
            <Search size={16} strokeWidth={1.75} className="products-search-icon" />
            <input
              id="product-search"
              type="search"
              placeholder="Search products or SKU…"
              className="products-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => setSearchExpanded(false)}
            />
          </div>
        </div>

        {/* Loading / Table */}
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <div>Loading product registers...</div>
          </div>
        ) : (
          <div className="products-table-wrapper animate-page stagger-2">
            <table className="products-table">
              <thead>
                <tr>
                  <th className="products-th">Product</th>
                  <th className="products-th">SKU</th>
                  <th className="products-th">Sales Price</th>
                  <th className="products-th">Inventory</th>
                  <th className="products-th">Type</th>
                  <th className="products-th" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => {
                  const onHand = parseFloat(product.inventory?.on_hand_qty) || 0;
                  const reserved = parseFloat(product.inventory?.reserved_qty) || 0;
                  const free = product.free_qty !== undefined ? product.free_qty : (onHand - reserved);
                  return (
                    <tr
                      key={product.id}
                      className="products-tr hover-row"
                    >
                      <td className="products-td">
                        <div className="product-cell">
                          <div className="product-thumbnail" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span className="product-emoji">{product.type === 'FINISHED_GOOD' ? '📦' : '🪵'}</span>
                            )}
                          </div>
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                            <span className="product-category">{product.type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="products-td">
                        <span className="product-sku">{product.sku || 'N/A'}</span>
                      </td>

                      <td className="products-td">
                        <span className="product-price">₹{parseFloat(product.sales_price).toLocaleString()}</span>
                      </td>

                      <td className="products-td">
                        <div className="inventory-badges">
                          <span className="inv-item">
                            <span className="inv-label">On Hand</span>
                            <span className={`inv-value ${onHand === 0 ? 'inv-value--zero' : ''}`}>
                              {onHand}
                            </span>
                          </span>
                          <span className="inv-sep">·</span>
                          <span className="inv-item">
                            <span className="inv-label">Reserved</span>
                            <span className="inv-value">{reserved}</span>
                          </span>
                          <span className="inv-sep">·</span>
                          <span className="inv-item">
                            <span className="inv-label">Free</span>
                            <span className={`inv-value ${free <= 0 ? 'inv-value--zero' : 'inv-value--free'}`}>
                              {free}
                            </span>
                          </span>
                        </div>
                      </td>

                      <td className="products-td">
                        <span className={`badge ${product.type === 'FINISHED_GOOD' ? 'badge--purple' : 'badge--blue'}`}>
                          {product.type === 'FINISHED_GOOD' ? 'Finished Good' : 'Raw Material'}
                        </span>
                      </td>

                      <td className="products-td" style={{ textAlign: 'right' }}>
                        <div className="product-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="product-action-btn" onClick={() => handleOpenEdit(product)}>Edit</button>
                          <button className="product-action-btn product-action-btn--ghost" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(product)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="products-empty">
                <span style={{ fontSize: 40 }}>📦</span>
                <p>No products found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {activeModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {activeModal === 'create' ? 'Add New Product Item' : 'Edit Product Specifications'}
              </h3>
              <button className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={16}/></button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={handleSave} className="admin-modal-form">
                {/* Photo Upload area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-outline-variant)',
                    background: 'var(--surface-low)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {uploadingImage ? (
                      <RefreshCw size={24} className="spin" />
                    ) : form.image_url ? (
                      <img src={form.image_url} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} style={{ color: 'var(--color-secondary)' }} />
                    )}
                  </div>
                  <label className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }}>
                    {uploadingImage ? 'Uploading...' : 'Select Photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} disabled={uploadingImage} />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="register-field" style={{ gridColumn: 'span 2' }}>
                    <label className="register-label">Product Name *</label>
                    <input type="text" className="register-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>

                  <div className="register-field">
                    <label className="register-label">SKU Code</label>
                    <input type="text" className="register-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                  </div>

                  <div className="register-field">
                    <label className="register-label">Product Type</label>
                    <select className="register-input register-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="RAW_MATERIAL">Raw Material</option>
                      <option value="FINISHED_GOOD">Finished Good</option>
                    </select>
                  </div>

                  <div className="register-field">
                    <label className="register-label">Sales Price (₹) *</label>
                    <input type="number" className="register-input" value={form.sales_price} onChange={e => setForm({ ...form, sales_price: e.target.value })} required />
                  </div>

                  <div className="register-field">
                    <label className="register-label">Cost Price (₹) *</label>
                    <input type="number" className="register-input" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} required />
                  </div>

                  <div className="register-field">
                    <label className="register-label">On Hand Qty</label>
                    <input type="number" className="register-input" value={form.on_hand_qty} onChange={e => setForm({ ...form, on_hand_qty: e.target.value })} />
                  </div>

                  <div className="register-field">
                    <label className="register-label">Reserved Qty</label>
                    <input type="number" className="register-input" value={form.reserved_qty} onChange={e => setForm({ ...form, reserved_qty: e.target.value })} />
                  </div>

                  <div className="register-field" style={{ gridColumn: 'span 2' }}>
                    <label className="register-label">Reorder Level Alert Threshold</label>
                    <input type="number" className="register-input" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} />
                  </div>

                  <div className="register-field">
                    <label className="register-label">Procurement Strategy</label>
                    <select className="register-input register-select" value={form.procurement_type} onChange={e => setForm({ ...form, procurement_type: e.target.value })}>
                      <option value="MTS">MTS (Make To Stock)</option>
                      <option value="MTO">MTO (Make To Order)</option>
                    </select>
                  </div>

                  <div className="register-field">
                    <label className="register-label">Procurement Type</label>
                    <select className="register-input register-select" value={form.procurement_method} onChange={e => setForm({ ...form, procurement_method: e.target.value })}>
                      <option value="PURCHASE">Purchase (Generate PO)</option>
                      <option value="MANUFACTURING">Manufacturing (Generate MO)</option>
                    </select>
                  </div>

                  <div className="register-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                    <input 
                      type="checkbox" 
                      id="procure_on_demand"
                      checked={form.procure_on_demand} 
                      onChange={e => setForm({ ...form, procure_on_demand: e.target.checked })} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label className="register-label" htmlFor="procure_on_demand" style={{ margin: 0, cursor: 'pointer' }}>Procure on Demand (Auto-Replenish)</label>
                  </div>

                  <div className="register-field">
                    <label className="register-label">Preferred Vendor</label>
                    <select className="register-input register-select" value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                      <option value="">-- Select Preferred Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="register-field">
                    <label className="register-label">Default Bill of Materials (BoM)</label>
                    <select className="register-input register-select" value={form.bom_id} onChange={e => setForm({ ...form, bom_id: e.target.value })}>
                      <option value="">-- Select Default BoM --</option>
                      {boms.map(b => (
                        <option key={b.id} value={b.id}>
                          BoM for {b.product?.name || b.product_id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="profile-drawer-signout-btn" style={{ height: '36px', padding: '0 16px' }} onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="dashboard-new-order-btn" style={{ height: '36px', padding: '0 16px', margin: 0 }}>Save Product</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: 'var(--color-error)' }}>Confirm Deletion</h3>
              <button className="admin-modal-close" onClick={() => setDeleteTarget(null)}><X size={16}/></button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <Trash2 size={48} style={{ color: 'var(--color-error)', marginBottom: '16px', display: 'inline-block' }} />
              <p style={{ color: 'var(--color-primary)', fontSize: '15px', marginBottom: '8px', fontWeight: '600' }}>
                Are you sure you want to delete this product?
              </p>
              <p style={{ color: 'var(--color-secondary)', fontSize: '13px', marginBottom: '24px' }}>
                This will permanently delete <strong>{deleteTarget.name}</strong> from the catalog. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button 
                  type="button" 
                  className="profile-drawer-signout-btn" 
                  style={{ height: '36px', padding: '0 16px', border: '1.5px solid var(--color-outline-variant)' }} 
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="dashboard-new-order-btn" 
                  style={{ height: '36px', padding: '0 16px', margin: 0, background: 'var(--color-error)', color: '#fff' }} 
                  onClick={() => {
                    handleDelete(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
