import { useState, useEffect } from 'react';
import { Layers, Eye, ShieldAlert, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Purchase.css';

export default function SalesReservedStock() {
  const [reserved, setReserved] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    const orders = salesApi.getOrders().filter(o => o.status === 'Confirmed');
    const catalog = salesApi.getCatalog();
    
    // Construct reserved rows
    const rows = [];
    orders.forEach(o => {
      o.items.forEach(item => {
        const prod = catalog.find(c => c.id === item.productId);
        rows.push({
          id: `${o.id}-${item.productId}`,
          soId: o.id,
          productId: item.productId,
          productName: item.name,
          reservedQty: item.qty,
          currentStock: prod ? prod.available + prod.reserved : item.qty,
          availableStock: prod ? prod.available : 0
        });
      });
    });

    setReserved(rows);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRelease = (row) => {
    // Release stock reservation mock action
    const orders = salesApi.getOrders();
    const orderIdx = orders.findIndex(o => o.id === row.soId);
    if (orderIdx !== -1) {
      orders[orderIdx].status = 'Cancelled';
      salesApi.saveOrders(orders);

      const catalog = salesApi.getCatalog();
      const prod = catalog.find(c => c.id === row.productId);
      if (prod) {
        prod.available += row.reservedQty;
        prod.reserved -= row.reservedQty;
        salesApi.saveCatalog(catalog);
      }
    }

    setSuccessMsg(`Stock allocation released for order ${row.soId}. Quantities returned to available inventory.`);
    setTimeout(() => setSuccessMsg(''), 5000);
    loadData();
  };

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <Layers size={22} style={{ color: 'var(--color-primary)' }} />
              Reserved Stock Allocations
            </h2>
            <p className="sales-sub">View finished goods reserved for confirmed sales orders waiting dispatch.</p>
          </div>
        </div>

        {successMsg && (
          <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.08)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        {/* Reserved table */}
        <div className="purchase-panel">
          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Product Description</th>
                  <th>Current Stock</th>
                  <th>Reserved Quantity</th>
                  <th>Available Quantity</th>
                  <th>Sales Order Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reserved.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.productName}</td>
                    <td>{r.currentStock} units</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-amber)' }}>{r.reservedQty} units</td>
                    <td style={{ fontWeight: 700 }}>{r.availableStock} units</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.soId}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => { alert(`Viewing Sales Order: ${r.soId}`); }}>
                          <Eye size={12} /> View SO
                        </button>
                        <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px', color: 'var(--color-error)' }} onClick={() => handleRelease(r)}>
                          <ShieldAlert size={12} /> Release Lock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reserved.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      No active stock allocations reserved for sales orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
