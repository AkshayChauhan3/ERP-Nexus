import { useState, useEffect } from 'react';
import { Truck, ArrowDownLeft, ShieldAlert, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function PurchaseGoodsReceipts() {
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form State
  const [receivedQtys, setReceivedQtys] = useState({});
  const [rejectedQtys, setRejectedQtys] = useState({});
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [posRes, vendRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/vendors')
      ]);
      const allPOs = posRes.data || [];
      const openPOs = allPOs.filter(p => p.status === 'confirmed');
      setPOs(openPOs);
      setVendors(vendRes.data || []);
      if (openPOs.length > 0) {
        handleSelectPO(openPOs[0]);
      } else {
        setSelectedPO(null);
      }
    } catch (err) {
      console.error('Failed to load POs data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPO = (po) => {
    setSelectedPO(po);
    const recv = {};
    const rej = {};
    po.lines.forEach(item => {
      const outstanding = Number(item.ordered_qty) - Number(item.received_qty);
      recv[item.product_id] = Math.max(0, outstanding);
      rej[item.product_id] = 0;
    });
    setReceivedQtys(recv);
    setRejectedQtys(rej);
    setNote('');
  };

  const handleRecvChange = (productId, val) => {
    setReceivedQtys({ ...receivedQtys, [productId]: Math.max(0, Number(val)) });
  };

  const handleRejChange = (productId, val) => {
    setRejectedQtys({ ...rejectedQtys, [productId]: Math.max(0, Number(val)) });
  };

  const handleSubmitReceipt = async (e) => {
    e.preventDefault();
    if (!selectedPO) return;

    const items = selectedPO.lines.map(item => {
      const recv = receivedQtys[item.product_id] || 0;
      const rej = rejectedQtys[item.product_id] || 0;
      const remarks = rej > 0 ? `Rejected: ${rej} units.` : '';
      return {
        product_id: item.product_id,
        quantity_received: recv,
        remarks: remarks || note || 'None'
      };
    });

    try {
      await api.post('/purchase/receipts', {
        po_id: selectedPO.id,
        delivery_note_ref: note || 'Standard delivery',
        items
      });

      setSuccessMsg(`Goods Receipt logged successfully for Purchase Order: ${selectedPO.po_number}. Stock adjusted.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit receipt');
    }
  };

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <Truck size={22} style={{ color: 'var(--color-primary)' }} />
              Goods Receipts (GRNs)
            </h2>
            <p className="purchase-sub">Log incoming vendor shipments, record partial quantities, and track rejected stock units.</p>
          </div>
        </div>

        {successMsg && (
          <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.08)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
          {/* Open POs waiting delivery */}
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">Awaiting Delivery</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pos.map(po => {
                const vend = vendors.find(v => v.id === po.vendor_id);
                return (
                  <div
                    key={po.id}
                    onClick={() => handleSelectPO(po)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-outline-variant)',
                      background: selectedPO?.id === po.id ? 'var(--surface-low)' : 'var(--color-canvas)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: selectedPO?.id === po.id ? '4px solid var(--color-primary)' : '1px solid var(--color-outline-variant)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{po.po_number}</span>
                      <span className="purchase-badge purchase-badge--warning" style={{ fontSize: '10px', textTransform: 'capitalize' }}>{po.status}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>{vend ? vend.name : 'Unknown Vendor'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '2px' }}>Ordered: {new Date(po.created_at).toLocaleDateString()}</div>
                  </div>
                );
              })}
              {pos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                  All purchase orders received! No outstanding deliveries.
                </div>
              )}
            </div>
          </div>

          {/* Receive form */}
          {selectedPO ? (
            <div className="purchase-panel">
              <div className="purchase-panel-header">
                <div>
                  <h3 className="purchase-panel-title">Receive Order Items</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Log quantities for {selectedPO.po_number}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitReceipt}>
                <div className="purchase-table-wrapper" style={{ marginBottom: '20px' }}>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Ordered</th>
                        <th>Received Qty</th>
                        <th>Rejected Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.lines?.map(item => (
                        <tr key={item.product_id}>
                          <td style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown Product'}</td>
                          <td>{Number(item.ordered_qty) - Number(item.received_qty)} units remaining</td>
                          <td>
                            <input
                              type="number"
                              className="purchase-input"
                              style={{ width: '80px', padding: '6px' }}
                              value={receivedQtys[item.product_id] || 0}
                              onChange={e => handleRecvChange(item.product_id, e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="purchase-input"
                              style={{ width: '80px', padding: '6px' }}
                              value={rejectedQtys[item.product_id] || 0}
                              onChange={e => handleRejChange(item.product_id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="purchase-form-group">
                  <label className="purchase-label">Receipt Notes / Inspection Details</label>
                  <textarea
                    className="purchase-input"
                    style={{ minHeight: '80px', fontFamily: 'inherit' }}
                    placeholder="Describe any shipment errors, damaged units, or carrier notes..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="submit" className="btn btn--primary" style={{ gap: '6px' }}>
                    <ArrowDownLeft size={16} /> Log Receipt & Update Stock
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="purchase-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--color-secondary)' }}>
              Select a Purchase Order from the left panel to log receipts.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
