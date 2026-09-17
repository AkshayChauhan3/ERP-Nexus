import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, AlertTriangle, Zap, CheckCircle, ArrowRight, RefreshCw, ShoppingBag, Clock } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function PurchaseProcurement() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null); // { message: string, poNumbers: string[] }
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [prodRes, vendRes, suggRes, poRes] = await Promise.all([
        api.get('/products'),
        api.get('/vendors'),
        api.get('/purchase/suggestions'),
        api.get('/purchase-orders')
      ]);

      const prodsList = prodRes.data || [];
      const vendsList = vendRes.data || [];
      const suggsList = suggRes.data || [];
      const posList = poRes.data || [];
      setVendors(vendsList);

      // Build active orders index by product_id
      // A PO is active if it's draft or confirmed (not yet fully received or cancelled)
      const openPOs = posList.filter(p => p.status === 'draft' || p.status === 'confirmed');
      const activeOrdersByProduct = {};
      openPOs.forEach(po => {
        (po.lines || []).forEach(line => {
          if (!activeOrdersByProduct[line.product_id]) {
            activeOrdersByProduct[line.product_id] = {
              poId: po.id,
              poNumber: po.po_number,
              status: po.status,
              totalOrderedQty: 0
            };
          }
          activeOrdersByProduct[line.product_id].totalOrderedQty += Number(line.ordered_qty || 0);
        });
      });

      // 1. Dynamic suggestions: Raw materials below safety threshold (MTS)
      const lowStockMats = prodsList.filter(m => {
        if (m.type !== 'RAW_MATERIAL') return false;
        const inv = Array.isArray(m.inventory) ? m.inventory[0] : m.inventory;
        const onHand = Number(inv?.on_hand_qty ?? 0);
        const reorder = Number(inv?.reorder_level ?? 0);
        return onHand <= reorder;
      });
      
      const mtsSuggestions = lowStockMats.map(m => {
        const inv = Array.isArray(m.inventory) ? m.inventory[0] : m.inventory;
        const onHand = Number(inv?.on_hand_qty ?? 0);
        const reorder = Number(inv?.reorder_level ?? 0);
        const vend = vendsList.find(v => v.id === m.vendor_id);
        const deficit = Math.max(reorder - onHand, 0);
        const recommendedQty = Math.max(deficit * 2, 10);
        const activeOrder = activeOrdersByProduct[m.id];
        const costPrice = Math.max(Number(m.cost_price) || 100, 1);

        return {
          type: 'MTS',
          materialId: m.id,
          name: m.name,
          sku: m.sku || 'N/A',
          current: onHand,
          threshold: reorder,
          unit: m.unit || 'units',
          preferredVendorId: m.vendor_id || (vendsList[0]?.id || ''),
          preferredVendorName: vend ? vend.name : (vendsList[0]?.name || 'Unassigned Vendor'),
          recommendedQty,
          estimatedCost: recommendedQty * costPrice,
          costPrice,
          hasActiveOrder: Boolean(activeOrder && activeOrder.totalOrderedQty > 0),
          activePO: activeOrder || null
        };
      });

      // 2. Database MTO suggestions (status: PENDING, source: PURCHASE)
      const mtoSuggestions = suggsList
        .filter(s => (s.status === 'PENDING' || s.status === 'pending') && s.procurement_source === 'PURCHASE')
        .map(s => {
          const prod = prodsList.find(p => p.id === s.product_id) || s.product;
          const inv = prod ? (Array.isArray(prod.inventory) ? prod.inventory[0] : prod.inventory) : null;
          const vend = prod ? vendsList.find(v => v.id === prod.vendor_id) : null;
          const costPrice = Math.max(Number(prod?.cost_price) || 100, 1);
          const activeOrder = prod ? activeOrdersByProduct[prod.id] : null;

          return {
            type: 'MTO',
            suggestionId: s.id,
            materialId: s.product_id,
            name: prod ? prod.name : 'Unknown Material',
            sku: prod ? prod.sku : 'N/A',
            current: Number(s.current_stock ?? inv?.on_hand_qty ?? 0),
            threshold: Number(inv?.reorder_level ?? 0),
            unit: prod?.unit || 'units',
            preferredVendorId: prod?.vendor_id || (vendsList[0]?.id || ''),
            preferredVendorName: vend ? vend.name : (vendsList[0]?.name || 'Unassigned Vendor'),
            recommendedQty: Math.max(Number(s.shortage_qty) || 10, 1),
            estimatedCost: (Number(s.shortage_qty) || 10) * costPrice,
            costPrice,
            reason: s.reason,
            hasActiveOrder: Boolean(activeOrder && activeOrder.totalOrderedQty > 0),
            activePO: activeOrder || null
          };
        });

      setSuggestions([...mtsSuggestions, ...mtoSuggestions]);
    } catch (err) {
      console.error('Failed to load procurement suggestions', err);
      setErrorMsg('Failed to fetch procurement suggestions. Please ensure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOneClickPO = async (item) => {
    if (item.hasActiveOrder) {
      alert(`An active Purchase Order (${item.activePO?.poNumber}) is already in progress for ${item.name}.`);
      return;
    }

    try {
      const vendorId = (item.preferredVendorId && item.preferredVendorId.length > 20)
        ? item.preferredVendorId
        : (vendors[0]?.id || null);

      if (!vendorId) {
        alert('Cannot create PO: No active vendor is registered in the system.');
        return;
      }

      // Create draft PO
      const poRes = await api.post('/purchase-orders', {
        vendor_id: vendorId,
        lines: [{
          product_id: item.materialId,
          ordered_qty: item.recommendedQty,
          unit_price: item.costPrice
        }]
      });

      const poNumber = poRes.data?.po_number || 'New PO';

      // If database MTO suggestion, update status
      if (item.type === 'MTO' && item.suggestionId) {
        await api.patch(`/purchase/suggestions/${item.suggestionId}/status`, {
          status: 'po_created'
        }).catch(() => {});
      }

      setSuccessInfo({
        message: `Draft Purchase Order created successfully for ${item.preferredVendorName}!`,
        poNumbers: [poNumber]
      });

      loadData();
    } catch (err) {
      alert(err.message || 'Failed to generate Purchase Order');
    }
  };

  const handleOrderAll = async () => {
    const unplacedItems = suggestions.filter(item => !item.hasActiveOrder);

    if (unplacedItems.length === 0) {
      alert('All replenishment recommendations already have active Purchase Orders placed.');
      return;
    }

    setIsOrdering(true);
    setErrorMsg('');

    // Group items by preferred vendor
    const grouped = {};
    unplacedItems.forEach(item => {
      const vId = (item.preferredVendorId && item.preferredVendorId.length > 20)
        ? item.preferredVendorId
        : (vendors[0]?.id || 'default');
      if (!grouped[vId]) {
        grouped[vId] = [];
      }
      grouped[vId].push(item);
    });

    try {
      const createdPOs = [];

      for (const vendorId of Object.keys(grouped)) {
        const items = grouped[vendorId];
        const actualVendorId = vendorId === 'default' ? vendors[0]?.id : vendorId;
        if (!actualVendorId) continue;

        const lines = items.map(item => ({
          product_id: item.materialId,
          ordered_qty: item.recommendedQty,
          unit_price: item.costPrice
        }));

        // Create consolidated PO
        const poRes = await api.post('/purchase-orders', {
          vendor_id: actualVendorId,
          lines
        });

        if (poRes.data?.po_number) {
          createdPOs.push(poRes.data.po_number);
        }

        // Update statuses for any MTO suggestions
        for (const item of items) {
          if (item.type === 'MTO' && item.suggestionId) {
            await api.patch(`/purchase/suggestions/${item.suggestionId}/status`, {
              status: 'po_created'
            }).catch(() => {});
          }
        }
      }

      setSuccessInfo({
        message: `Generated ${createdPOs.length} Consolidated Purchase Order(s) for ${unplacedItems.length} materials!`,
        poNumbers: createdPOs
      });

      await loadData();
    } catch (err) {
      console.error('Order All failed:', err);
      setErrorMsg(err.message || 'Failed to generate consolidated purchase orders.');
    } finally {
      setIsOrdering(false);
    }
  };

  const pendingItems = suggestions.filter(s => !s.hasActiveOrder);
  const orderedItems = suggestions.filter(s => s.hasActiveOrder);

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        {/* Page Header */}
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <ClipboardList size={22} style={{ color: 'var(--color-primary)' }} />
              Procurement Suggestions
            </h2>
            <p className="purchase-sub">Automated inventory replenishment recommendations based on real-time stock thresholds.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn--secondary" onClick={loadData} disabled={loading} style={{ gap: '6px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
            {pendingItems.length > 0 && (
              <button 
                className="btn btn--primary" 
                style={{ gap: '6px' }} 
                onClick={handleOrderAll}
                disabled={isOrdering}
              >
                <Zap size={14} /> {isOrdering ? 'Generating Orders...' : `Order All Recommendations (${pendingItems.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Success Guidance Banner */}
        {successInfo && (
          <div style={{
            padding: '20px',
            background: 'rgba(46, 125, 50, 0.08)',
            border: '1px solid rgba(46, 125, 50, 0.25)',
            borderLeft: '5px solid var(--color-success)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-success)' }}>
                    {successInfo.message}
                  </span>
                </div>
                {successInfo.poNumbers.length > 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--color-on-surface)', marginBottom: '8px' }}>
                    Created Purchase Orders: <strong>{successInfo.poNumbers.join(', ')}</strong> (Status: <em>Draft</em>)
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--color-secondary)', lineHeight: 1.5 }}>
                  <strong>Next Steps in Factory Lifecycle:</strong><br />
                  1. <strong>Confirm / Authorize:</strong> Confirm the draft order under <em>Purchase Orders</em>, or have the Owner approve it in the <em>Owner Approvals Center</em>.<br />
                  2. <strong>Goods Receipt (GRN):</strong> When the supplier delivers the goods, receive them in <em>Goods Receipts</em> to update physical inventory on hand.<br />
                  3. <strong>Vendor Bill:</strong> Review and settle the supplier invoice in <em>Vendor Bills</em>.
                </div>
              </div>
              <button 
                className="btn btn--primary"
                onClick={() => navigate('/purchase/orders')}
                style={{ alignSelf: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <ShoppingBag size={14} /> View Purchase Orders <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ padding: '14px', background: 'rgba(211, 47, 47, 0.08)', borderLeft: '4px solid var(--color-error)', color: 'var(--color-error)', borderRadius: 'var(--radius-lg)', marginBottom: '16px', fontSize: '13px' }}>
            {errorMsg}
          </div>
        )}

        {/* Table Panel */}
        <div className="purchase-panel">
          <div className="purchase-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="purchase-panel-title">
              Replenishment Actions Required
              {pendingItems.length > 0 && (
                <span style={{ marginLeft: '10px', fontSize: '12px', background: 'rgba(211, 47, 47, 0.1)', color: 'var(--color-error)', padding: '2px 8px', borderRadius: '10px' }}>
                  {pendingItems.length} Needs Ordering
                </span>
              )}
              {orderedItems.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '12px', background: 'rgba(33, 150, 243, 0.1)', color: '#1976d2', padding: '2px 8px', borderRadius: '10px' }}>
                  {orderedItems.length} Ordered / Inbound
                </span>
              )}
            </h3>
          </div>

          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Material Code</th>
                  <th>Material Description</th>
                  <th>Current Stock</th>
                  <th>Safety Threshold</th>
                  <th>Preferred Vendor</th>
                  <th>Replenish Lot Qty</th>
                  <th>Estimated Cost</th>
                  <th>Order Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, idx) => (
                  <tr key={idx} style={{ opacity: s.hasActiveOrder ? 0.85 : 1, background: s.hasActiveOrder ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
                    <td>
                      <span className={`purchase-badge purchase-badge--${s.type === 'MTO' ? 'warning' : 'outline'}`}>
                        {s.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{s.sku}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: s.current <= s.threshold ? 'var(--color-error)' : 'inherit', fontWeight: 600 }}>
                      {s.current} {s.unit}
                    </td>
                    <td>{s.threshold} {s.unit}</td>
                    <td>{s.preferredVendorName}</td>
                    <td style={{ fontWeight: 600 }}>{s.recommendedQty} {s.unit}</td>
                    <td style={{ fontWeight: 700 }}>₹{s.estimatedCost.toLocaleString()}</td>
                    <td>
                      {s.hasActiveOrder ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontWeight: 700, 
                            background: s.activePO?.status === 'confirmed' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                            color: s.activePO?.status === 'confirmed' ? '#2e7d32' : '#e65100',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={11} /> {s.activePO?.poNumber} ({s.activePO?.status})
                          </span>
                          <button 
                            className="btn btn--secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => navigate('/purchase/orders')}
                            title="View in Purchase Orders"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn--primary" 
                          style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                          onClick={() => handleOneClickPO(s)}
                        >
                          <Zap size={12} /> One-Click PO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && suggestions.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary)' }}>
                      ✓ All inventory units are safely above their replenishment thresholds. No orders required.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary)' }}>
                      Loading replenishment metrics...
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
