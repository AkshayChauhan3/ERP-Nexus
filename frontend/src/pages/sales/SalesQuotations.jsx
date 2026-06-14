import { useState, useEffect } from 'react';
import { FileText, Search, Plus, ArrowRight, Eye } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function SalesQuotations() {
  const [qtns, setQtns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQtn, setSelectedQtn] = useState(null);

  // Form State
  const [formCust, setFormCust] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formItems, setFormItems] = useState([{ productId: '', qty: 1, discount: 0, tax: 18 }]);
  const [remarks, setRemarks] = useState('');

  const loadData = async () => {
    try {
      const [qtnRes, custRes, catRes] = await Promise.all([
        api.get('/sales-quotations'),
        api.get('/customers'),
        api.get('/products')
      ]);
      const qtnsList = qtnRes.data || [];
      const custsList = custRes.data || [];
      const catList = catRes.data || [];
      setQtns(qtnsList);
      setCustomers(custsList);
      setCatalog(catList);

      if (catList.length > 0) {
        setFormItems([{ productId: catList[0].id, qty: 1, discount: 0, tax: 18 }]);
      }
      if (custsList.length > 0) {
        setFormCust(custsList[0].id);
      }
      setFormExpiry(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]); // 15 days expiry
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItemRow = () => {
    setFormItems([...formItems, { productId: catalog[0]?.id || '', qty: 1, discount: 0, tax: 18 }]);
  };

  const handleRemoveItemRow = (idx) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (idx, field, val) => {
    const updated = [...formItems];
    updated[idx][field] = val;
    setFormItems(updated);
  };

  const calculateTotal = () => {
    return formItems.reduce((sum, item) => {
      const prod = catalog.find(p => p.id === item.productId);
      const basePrice = prod ? Number(prod.sales_price) : 0;
      const discounted = basePrice * (1 - Number(item.discount) / 100);
      const totalItem = discounted * Number(item.qty) * (1 + Number(item.tax) / 100);
      return sum + totalItem;
    }, 0);
  };

  const handleCreateSubmit = async (e, status = 'Sent') => {
    e.preventDefault();
    const lines = formItems.map(item => {
      const prod = catalog.find(p => p.id === item.productId);
      const basePrice = prod ? Number(prod.sales_price) : 0;
      const discounted = basePrice * (1 - Number(item.discount) / 100);
      const totalItem = Math.round(discounted * Number(item.qty) * (1 + Number(item.tax) / 100));
      return {
        product_id: item.productId,
        qty: Number(item.qty),
        price: basePrice,
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: totalItem
      };
    });

    try {
      await api.post('/sales-quotations', {
        customer_id: formCust,
        expiry_date: formExpiry,
        lines,
        amount: Math.round(calculateTotal()),
        status,
        remarks
      });

      setShowCreate(false);
      setRemarks('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create quotation');
    }
  };

  const handleConvertToOrder = async (qtn) => {
    try {
      await api.post(`/sales-quotations/${qtn.id}/convert`);
      alert(`Quotation ${qtn.quotation_number} converted to Sales Order successfully! Stock allocated.`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to convert quotation to order');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.get(`/sales-quotations/${id}`);
      setSelectedQtn(res.data);
    } catch (err) {
      alert('Failed to fetch quotation details');
    }
  };

  const filtered = qtns.filter(q => 
    (q.quotation_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <FileText size={22} style={{ color: 'var(--color-primary)' }} />
              Sales Quotations
            </h2>
            <p className="sales-sub">Issue, track, and manage commercial proposals. Convert to active orders with one click.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Quotation
          </button>
        </div>

        <div className="purchase-panel">
          <div className="purchase-panel-header">
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search quotations..."
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
                  <th>Quotation ID</th>
                  <th>Customer</th>
                  <th>Issued Date</th>
                  <th>Expiry Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => {
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 700 }}>{q.quotation_number}</td>
                      <td style={{ fontWeight: 600 }}>{q.customer?.name || 'Unknown'}</td>
                      <td>{new Date(q.created_at).toLocaleDateString()}</td>
                      <td>{new Date(q.expiry_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(q.amount).toLocaleString()}</td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          q.status === 'Approved' ? 'success' :
                          q.status === 'Draft' ? 'outline' : 'warning'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => handleViewDetails(q.id)}>
                            <Eye size={12} /> View
                          </button>
                          {q.status !== 'Approved' && (
                            <button className="btn btn--primary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => handleConvertToOrder(q)}>
                              <ArrowRight size={12} /> Convert to SO
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Quotation Modal */}
        {showCreate && (
          <div className="purchase-modal-backdrop" onClick={() => setShowCreate(false)}>
            <div className="purchase-modal" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Create Sales Quotation</h3>
                <button className="purchase-modal-close" onClick={() => setShowCreate(false)}>&times;</button>
              </div>
              <form onSubmit={e => handleCreateSubmit(e, 'Sent')}>
                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Select Customer</label>
                    <select className="purchase-input" value={formCust} onChange={e => setFormCust(e.target.value)}>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Expiry Date</label>
                    <input type="date" className="purchase-input" required value={formExpiry} onChange={e => setFormExpiry(e.target.value)} />
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Quotation Items</h4>
                    <button type="button" className="btn btn--secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleAddItemRow}>
                      + Add Item
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 2 }}>
                          <select className="purchase-input" value={item.productId} onChange={e => handleFieldChange(idx, 'productId', e.target.value)}>
                            {catalog.map(c => <option key={c.id} value={c.id}>{c.name} (₹{c.sales_price})</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <input type="number" className="purchase-input" placeholder="Qty" value={item.qty} onChange={e => handleFieldChange(idx, 'qty', Math.max(1, Number(e.target.value)))} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input type="number" className="purchase-input" placeholder="Disc %" value={item.discount} onChange={e => handleFieldChange(idx, 'discount', Math.max(0, Number(e.target.value)))} />
                        </div>
                        <button type="button" className="btn btn--secondary" style={{ padding: '8px', color: 'var(--color-error)' }} onClick={() => handleRemoveItemRow(idx)}>&times;</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="purchase-form-group" style={{ marginTop: '14px' }}>
                  <label className="purchase-label">Remarks / Special Terms</label>
                  <textarea className="purchase-input" placeholder="Commercial validity, payment terms..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800 }}>Estimated Total: ₹{Math.round(calculateTotal()).toLocaleString()}</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn--secondary" onClick={e => handleCreateSubmit(e, 'Draft')}>Save Draft</button>
                    <button type="submit" className="btn btn--primary">Send Commercial Proposal</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {selectedQtn && (
          <div className="purchase-modal-backdrop" onClick={() => setSelectedQtn(null)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Commercial Quotation Details</h3>
                <button className="purchase-modal-close" onClick={() => setSelectedQtn(null)}>&times;</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div><strong>Quotation ID:</strong> {selectedQtn.quotation_number}</div>
                <div><strong>Client Account:</strong> {selectedQtn.customer?.name}</div>
                <div><strong>Expiry date:</strong> {new Date(selectedQtn.expiry_date).toLocaleDateString()}</div>
                <div><strong>Terms/Notes:</strong> {selectedQtn.remarks || 'None'}</div>

                <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '10px' }}>
                  <table className="purchase-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Discount</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQtn.lines?.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown'}</td>
                          <td>{Number(item.qty)}</td>
                          <td>₹{Number(item.price).toLocaleString()}</td>
                          <td>{Number(item.discount)}%</td>
                          <td>₹{Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 800, fontSize: '14px', marginTop: '12px' }}>
                    Total Value: ₹{Number(selectedQtn.amount).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
