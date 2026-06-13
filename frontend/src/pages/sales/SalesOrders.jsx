import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Eye, Truck, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Purchase.css';
import '../../styles/Sales.css';

export default function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form State
  const [formCust, setFormCust] = useState('');
  const [formDeliveryDate, setFormDeliveryDate] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formItems, setFormItems] = useState([{ productId: '', qty: 1, discount: 0, tax: 18 }]);
  const [remarks, setRemarks] = useState('');

  const loadData = () => {
    setOrders(salesApi.getOrders());
    setCustomers(salesApi.getCustomers());
    const cat = salesApi.getCatalog();
    setCatalog(cat);
    if (cat.length > 0) {
      setFormItems([{ productId: cat[0].id, qty: 1, discount: 0, tax: 18 }]);
    }
    const custs = salesApi.getCustomers();
    if (custs.length > 0) {
      setFormCust(custs[0].id);
      setFormAddress(custs[0].address);
    }
    setFormDeliveryDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]); // 5 days delivery ETA
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCustChange = (id) => {
    setFormCust(id);
    const target = customers.find(c => c.id === id);
    if (target) {
      setFormAddress(target.address);
    }
  };

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
      const basePrice = prod ? prod.price : 0;
      const discounted = basePrice * (1 - Number(item.discount) / 100);
      const totalItem = discounted * Number(item.qty) * (1 + Number(item.tax) / 100);
      return sum + totalItem;
    }, 0);
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const items = formItems.map(item => {
      const prod = catalog.find(p => p.id === item.productId);
      const basePrice = prod ? prod.price : 0;
      const discounted = basePrice * (1 - Number(item.discount) / 100);
      const totalItem = Math.round(discounted * Number(item.qty) * (1 + Number(item.tax) / 100));
      return {
        productId: item.productId,
        name: prod ? prod.name : 'Unknown Product',
        qty: Number(item.qty),
        price: basePrice,
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: totalItem
      };
    });

    salesApi.createOrder({
      customerId: formCust,
      deliveryDate: formDeliveryDate,
      shippingAddress: formAddress,
      items,
      amount: Math.round(calculateTotal()),
      remarks
    });

    setShowCreate(false);
    setRemarks('');
    loadData();
  };

  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    (customers.find(c => c.id === o.customerId)?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const steps = ['Created', 'Confirmed', 'Reserved', 'Packed', 'Dispatched', 'Delivered'];

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} />
              Sales Orders
            </h2>
            <p className="sales-sub">Confirm customer orders, reserve stock quantities automatically, and track shipments.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Sales Order
          </button>
        </div>

        <div className="purchase-panel">
          <div className="purchase-panel-header">
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search orders..."
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
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const cust = customers.find(c => c.id === o.customerId);
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>{o.id}</td>
                      <td style={{ fontWeight: 600 }}>{cust ? cust.name : o.customerId}</td>
                      <td>{o.orderDate}</td>
                      <td>{o.deliveryDate}</td>
                      <td style={{ fontWeight: 700 }}>₹{o.amount.toLocaleString()}</td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          o.status === 'Delivered' ? 'success' : 'warning'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => setSelectedOrder(o)}>
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Sales Order Modal */}
        {showCreate && (
          <div className="purchase-modal-backdrop" onClick={() => setShowCreate(false)}>
            <div className="purchase-modal" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Create Sales Order</h3>
                <button className="purchase-modal-close" onClick={() => setShowCreate(false)}>&times;</button>
              </div>
              <form onSubmit={handleCreateOrder}>
                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Select Customer</label>
                    <select className="purchase-input" value={formCust} onChange={e => handleCustChange(e.target.value)}>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Delivery Commitment Date</label>
                    <input type="date" className="purchase-input" required value={formDeliveryDate} onChange={e => setFormDeliveryDate(e.target.value)} />
                  </div>
                </div>

                <div className="purchase-form-group" style={{ marginTop: '10px' }}>
                  <label className="purchase-label">Shipping Address</label>
                  <textarea className="purchase-input" style={{ minHeight: '50px', fontFamily: 'inherit' }} required value={formAddress} onChange={e => setFormAddress(e.target.value)} />
                </div>

                {/* Items */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Order Items</h4>
                    <button type="button" className="btn btn--secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleAddItemRow}>
                      + Add Item
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formItems.map((item, idx) => {
                      const prod = catalog.find(c => c.id === item.productId);
                      const avail = prod ? prod.available : 0;
                      return (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ flex: 2 }}>
                            <select className="purchase-input" value={item.productId} onChange={e => handleFieldChange(idx, 'productId', e.target.value)}>
                              {catalog.map(c => <option key={c.id} value={c.id}>{c.name} (Avail: {c.available})</option>)}
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
                      );
                    })}
                  </div>
                </div>

                <div className="purchase-form-group" style={{ marginTop: '14px' }}>
                  <label className="purchase-label">Internal Remarks</label>
                  <textarea className="purchase-input" placeholder="Delivery coordination details..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800 }}>Total Invoice Amount: ₹{Math.round(calculateTotal()).toLocaleString()}</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="submit" className="btn btn--primary">Confirm Sales Order</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Details Modal (with status progress timeline) */}
        {selectedOrder && (
          <div className="purchase-modal-backdrop" onClick={() => setSelectedOrder(null)}>
            <div className="purchase-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Sales Order Details — {selectedOrder.id}</h3>
                <button className="purchase-modal-close" onClick={() => setSelectedOrder(null)}>&times;</button>
              </div>
              
              {/* Timeline Progress */}
              <div className="timeline-track">
                {steps.map((step, idx) => {
                  const isCompleted = selectedOrder.timeline.includes(step);
                  const isActive = selectedOrder.status === step || (selectedOrder.status === 'Processing' && (step === 'Packed' || step === 'Dispatched'));
                  let stepCls = '';
                  if (isCompleted) stepCls = 'timeline-step--completed';
                  if (isActive) stepCls = 'timeline-step--active';
                  
                  return (
                    <div key={idx} className={`timeline-step ${stepCls}`}>
                      <div className="timeline-dot">{idx + 1}</div>
                      <span className="timeline-label">{step}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', marginTop: '20px' }}>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: '0 0 4px 0' }}>Order Profile</h4>
                  <div>Customer Account: <strong>{customers.find(c => c.id === selectedOrder.customerId)?.name}</strong></div>
                  <div>Order Date: <strong>{selectedOrder.orderDate}</strong></div>
                  <div>Delivery Date Commitment: <strong>{selectedOrder.deliveryDate}</strong></div>
                  <div>Shipping Target: <strong>{selectedOrder.shippingAddress}</strong></div>
                  <div>Internal Remarks: <em>{selectedOrder.remarks || 'None'}</em></div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Items Ordered</h4>
                  <table className="purchase-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Discount</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>₹{item.price}</td>
                          <td>{item.discount}%</td>
                          <td>₹{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 800, fontSize: '15px', marginTop: '12px' }}>
                    Total Invoice Amount: ₹{selectedOrder.amount.toLocaleString()}
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
