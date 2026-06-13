import { useState, useEffect } from 'react';
import { Layers, Eye, Search } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvReservedStock() {
  const [reserved, setReserved] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setReserved(inventoryApi.getReserved());
    setProducts(inventoryApi.getProducts());
  }, []);

  const handleViewOrder = (item) => {
    alert(`Navigating to Reference Document: ${item.refNo}\nType: ${item.reservedFor}\nAllocation locked for fulfillment.`);
  };

  const filtered = reserved.filter(r => {
    const prodName = products.find(p => p.id === r.productId)?.name || '';
    return prodName.toLowerCase().includes(search.toLowerCase()) || r.refNo.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <Layers size={22} style={{ color: 'var(--color-primary)' }} />
              Reserved Stock Allocations
            </h2>
            <p className="inventory-sub">Track active inventory allocated to sales deliveries or raw materials reserved for manufacturing orders.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="inventory-panel" style={{ padding: '16px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
            <input
              type="text"
              placeholder="Search by product or order ref..."
              className="purchase-input"
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Reserved Stock Table */}
        <div className="inventory-panel">
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Reserved Stock Qty</th>
                  <th>Net Available</th>
                  <th>Reserved For</th>
                  <th>Reference Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const pObj = products.find(p => p.id === r.productId);
                  const name = pObj ? pObj.name : r.productId;
                  const unit = pObj ? pObj.unit : 'units';
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td>{r.currentStock} {unit}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-amber)' }}>{r.reservedStock} {unit}</td>
                      <td style={{ fontWeight: 700 }}>{r.availableStock} {unit}</td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          r.reservedFor.includes('Sales') ? 'success' : 'primary'
                        }`}>
                          {r.reservedFor}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.refNo}</td>
                      <td>
                        <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => handleViewOrder(r)}>
                          <Eye size={12} /> View Order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
