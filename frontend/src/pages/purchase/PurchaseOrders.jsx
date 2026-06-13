import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Printer, Download, Eye, FileText, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function PurchaseOrders() {
  const [pos, setPOs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Form State
  const [formVendor, setFormVendor] = useState('');
  const [formItems, setFormItems] = useState([{ materialId: '', qty: 1, price: 0 }]);
  const [formDeliveryDate, setFormDeliveryDate] = useState('');

  const loadData = async () => {
    try {
      const [posRes, matRes, venRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/products'),
        api.get('/vendors')
      ]);
      setPOs(posRes.data || []);
      setMaterials((matRes.data || []).filter(p => p.type === 'RAW_MATERIAL'));
      setVendors(venRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormVendor(vendors[0]?.id || '');
    setFormItems([{ materialId: materials[0]?.id || '', qty: 1, price: materials[0]?.cost_price || 0 }]);
    setFormDeliveryDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]); // 7 days from now
    setShowCreate(true);
  };

  const handleItemMaterialChange = (index, matId) => {
    const selectedMat = materials.find(m => m.id === matId);
    const newItems = [...formItems];
    newItems[index].materialId = matId;
    newItems[index].price = selectedMat ? selectedMat.cost_price : 0;
    setFormItems(newItems);
  };

  const handleItemQtyChange = (index, qty) => {
    const newItems = [...formItems];
    newItems[index].qty = Math.max(1, Number(qty));
    setFormItems(newItems);
  };

  const handleItemPriceChange = (index, price) => {
    const newItems = [...formItems];
    newItems[index].price = Math.max(0, Number(price));
    setFormItems(newItems);
  };

  const handleAddItemRow = () => {
    setFormItems([...formItems, { materialId: materials[0]?.id || '', qty: 1, price: materials[0]?.cost_price || 0 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const lines = formItems.map(item => ({
      product_id: item.materialId,
      ordered_qty: Number(item.qty),
      unit_price: Number(item.price)
    }));

    try {
      await api.post('/purchase-orders', {
        vendor_id: formVendor,
        lines
      });
      setShowCreate(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create PO');
    }
  };

  const handleExportPDF = (po) => {
    alert(`Generating PDF download link for Purchase Order: ${po.po_number}\nExport Successful.`);
  };

  const handlePrint = (po) => {
    setSelectedPO(po);
    setShowPrint(true);
  };

  const handleViewDetails = (po) => {
    setSelectedPO(po);
    setShowDetails(true);
  };

  const filtered = pos.filter(po => 
    (po.po_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (po.vendor?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} />
              Purchase Orders
            </h2>
            <p className="purchase-sub">Create, approve, and track outgoing purchase orders sent to vendors.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={handleOpenCreate}>
            <Plus size={14} /> Create Purchase Order
          </button>
        </div>

        <div className="purchase-panel">
          <div className="purchase-panel-header">
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search PO number or vendor..."
                className="purchase-input"
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>Vendor</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Value</th>
                  <th>Receipt Status</th>
                  <th>Bill Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(po => {
                  const vendName = po.vendor?.name || 'Unknown';
                  const totalValue = po.lines?.reduce((s, l) => s + (l.ordered_qty * l.unit_price), 0) || 0;
                  const receiptStatus = po.status === 'received' ? 'Fully Received' : 'Pending';
                  const billStatus = po.status === 'draft' ? 'Draft' : 'Submitted';
                  return (
                    <tr key={po.id}>
                      <td style={{ fontWeight: 700 }}>{po.po_number}</td>
                      <td style={{ fontWeight: 600 }}>{vendName}</td>
                      <td>{new Date(po.created_at).toLocaleDateString()}</td>
                      <td>-</td>
                      <td style={{ fontWeight: 700 }}>₹{totalValue.toLocaleString()}</td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          receiptStatus === 'Fully Received' ? 'success' :
                          receiptStatus === 'Partial' ? 'warning' : 'outline'
                        }`}>
                          {receiptStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          billStatus === 'Paid' ? 'success' :
                          billStatus === 'Submitted' ? 'primary' : 'outline'
                        }`}>
                          {billStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn--secondary" style={{ padding: '6px', borderRadius: '50%' }} title="View Details" onClick={() => handleViewDetails(po)}>
                            <Eye size={14} />
                          </button>
                          <button className="btn btn--secondary" style={{ padding: '6px', borderRadius: '50%' }} title="Print PO" onClick={() => handlePrint(po)}>
                            <Printer size={14} />
                          </button>
                          <button className="btn btn--secondary" style={{ padding: '6px', borderRadius: '50%' }} title="Export PDF" onClick={() => handleExportPDF(po)}>
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create PO Modal */}
        {showCreate && (
          <div className="purchase-modal-backdrop" onClick={() => setShowCreate(false)}>
            <div className="purchase-modal" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Create Purchase Order</h3>
                <button className="purchase-modal-close" onClick={() => setShowCreate(false)}>&times;</button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Select Vendor</label>
                    <select className="purchase-input" value={formVendor} onChange={e => setFormVendor(e.target.value)}>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Requested Delivery Date</label>
                    <input type="date" className="purchase-input" required value={formDeliveryDate} onChange={e => setFormDeliveryDate(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>PO Items</h4>
                    <button type="button" className="btn btn--secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleAddItemRow}>
                      + Add Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ flex: 2 }}>
                          <select className="purchase-input" value={item.materialId} onChange={e => handleItemMaterialChange(idx, e.target.value)}>
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <input type="number" className="purchase-input" placeholder="Qty" value={item.qty} onChange={e => handleItemQtyChange(idx, e.target.value)} />
                        </div>
                        <div style={{ flex: 1.2 }}>
                          <input type="number" className="purchase-input" placeholder="Price (₹)" value={item.price} onChange={e => handleItemPriceChange(idx, e.target.value)} />
                        </div>
                        <button type="button" className="btn btn--secondary" style={{ padding: '8px', color: 'var(--color-error)' }} onClick={() => handleRemoveItemRow(idx)}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn--primary">Confirm & Send PO</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PO Details Modal */}
        {showDetails && selectedPO && (
          <div className="purchase-modal-backdrop" onClick={() => setShowDetails(false)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Purchase Order Details</h3>
                <button className="purchase-modal-close" onClick={() => setShowDetails(false)}>&times;</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div><strong>PO ID:</strong> {selectedPO.po_number}</div>
                  <div><strong>Vendor:</strong> {selectedPO.vendor?.name}</div>
                  <div><strong>Order Date:</strong> {new Date(selectedPO.created_at).toLocaleDateString()}</div>
                  <div><strong>Delivery Date:</strong> -</div>
                  <div><strong>Receipt status:</strong> {selectedPO.status === 'received' ? 'Fully Received' : 'Pending'}</div>
                  <div><strong>Bill status:</strong> Pending</div>
                </div>
                
                {selectedPO.status === 'draft' && (
                  <div>
                    <button className="btn btn--primary" onClick={async () => {
                      try {
                        await api.post(`/purchase-orders/${selectedPO.id}/confirm`);
                        setShowDetails(false);
                        loadData();
                      } catch (e) { alert(e.message); }
                    }}>Confirm PO</button>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Order Items</h4>
                  <table className="purchase-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.lines?.map((item, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown'}</td>
                          <td>{item.ordered_qty}</td>
                          <td>₹{Number(item.unit_price).toLocaleString()}</td>
                          <td>₹{(item.ordered_qty * item.unit_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 800, marginTop: '12px', fontSize: '14px' }}>
                    Total Value: ₹{(selectedPO.lines?.reduce((s, l) => s + (l.ordered_qty * l.unit_price), 0) || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print PO Modal (Mock Print Layout) */}
        {showPrint && selectedPO && (
          <div className="purchase-modal-backdrop" onClick={() => setShowPrint(false)}>
            <div className="purchase-modal" style={{ maxWidth: '800px', background: '#fff', color: '#000' }} onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header" style={{ borderColor: '#ddd' }}>
                <h3 className="purchase-modal-title" style={{ fontFamily: 'var(--font-sans)', color: '#000' }}>PO Print Preview</h3>
                <button className="purchase-modal-close" onClick={() => setShowPrint(false)} style={{ color: '#000' }}>&times;</button>
              </div>
              
              {/* Printed PO Area */}
              <div style={{ padding: '24px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', fontSize: '13px', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase' }}>Nexus ERP Purchase</h2>
                    <p style={{ margin: 0 }}>Fulfillment Operations, Nexus Ltd.</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0 }}>PURCHASE ORDER</h3>
                    <p style={{ margin: 0 }}><strong>{selectedPO.po_number}</strong></p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
                  <div>
                    <strong>Supplier:</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      {selectedPO.vendor?.name}<br />
                      {selectedPO.vendor?.address || ''}
                    </p>
                  </div>
                  <div>
                    <strong>Order Info:</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      Date: {new Date(selectedPO.created_at).toLocaleDateString()}<br />
                      Delivery ETA: -
                    </p>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                      <th style={{ padding: '8px 0' }}>Item Description</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Unit Price (₹)</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.lines?.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 0' }}>{item.product?.name || 'Unknown'}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{item.ordered_qty}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{Number(item.unit_price)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{(item.ordered_qty * item.unit_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '2px solid #000', paddingTop: '8px', fontSize: '15px', fontWeight: 'bold' }}>
                  Total Invoice Value: ₹{(selectedPO.lines?.reduce((s, l) => s + (l.ordered_qty * l.unit_price), 0) || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button className="btn btn--secondary" onClick={() => setShowPrint(false)}>Close</button>
                <button className="btn btn--primary" onClick={() => { window.print(); }}>Print Document</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
