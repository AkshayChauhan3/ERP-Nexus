import { useState, useEffect } from 'react';
import { Layers, ShieldAlert, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function SalesReservedStock() {
  const [reserved, setReserved] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const res = await api.get('/sales-orders');
      const orders = (res.data || []).filter(o => o.status === 'confirmed');
      
      const rows = [];
      orders.forEach(o => {
        o.lines?.forEach(line => {
          const onHand = Number(line.product?.inventory?.on_hand_qty || 0);
          const reservedQty = Number(line.product?.inventory?.reserved_qty || 0);
          rows.push({
            id: `${o.id}-${line.product_id}`,
            soId: o.id,
            soNumber: o.order_number,
            productId: line.product_id,
            productName: line.product?.name || 'Unknown Product',
            reservedQty: Number(line.ordered_qty),
            currentStock: onHand,
            availableStock: Math.max(0, onHand - reservedQty)
          });
        });
      });

      setReserved(rows);
    } catch (err) {
      console.error('Failed to load reserved stock', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRelease = async (row) => {
    try {
      await api.post(`/sales-orders/${row.soId}/cancel`);
      setSuccessMsg(`Stock allocation released for order ${row.soNumber}. Quantities returned to available inventory.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to release reservation');
    }
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
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.soNumber}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
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
