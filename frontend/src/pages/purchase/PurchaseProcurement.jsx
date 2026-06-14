import { useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function PurchaseProcurement() {
  const [suggestions, setSuggestions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [prodRes, vendRes, suggRes] = await Promise.all([
        api.get('/products'),
        api.get('/vendors'),
        api.get('/purchase/suggestions')
      ]);
      const prodsList = prodRes.data || [];
      const vendsList = vendRes.data || [];
      const suggsList = suggRes.data || [];
      setVendors(vendsList);

      // 1. Dynamic suggestions: Raw materials below safety threshold (MTS)
      const lowStockMats = prodsList.filter(
        m => m.type === 'RAW_MATERIAL' && (m.inventory?.on_hand_qty || 0) <= (m.inventory?.reorder_level || 0)
      );
      
      const mtsSuggestions = lowStockMats.map(m => {
        const vend = vendsList.find(v => v.id === m.vendor_id);
        const deficit = (m.inventory?.reorder_level || 0) - (m.inventory?.on_hand_qty || 0);
        const recommendedQty = Math.max(deficit * 2, 10);
        return {
          type: 'MTS',
          materialId: m.id,
          name: m.name,
          sku: m.sku || 'N/A',
          current: m.inventory?.on_hand_qty || 0,
          threshold: m.inventory?.reorder_level || 0,
          unit: 'units',
          preferredVendorId: m.vendor_id || (vendsList[0]?.id || ''),
          preferredVendorName: vend ? vend.name : (vendsList[0]?.name || 'No Vendor Assigned'),
          recommendedQty,
          estimatedCost: recommendedQty * Number(m.cost_price),
          costPrice: Number(m.cost_price)
        };
      });

      // 2. Database MTO suggestions (status: PENDING, source: PURCHASE)
      const mtoSuggestions = suggsList
        .filter(s => s.status === 'PENDING' && s.procurement_source === 'PURCHASE')
        .map(s => {
          const prod = prodsList.find(p => p.id === s.product_id) || s.product;
          const vend = prod ? vendsList.find(v => v.id === prod.vendor_id) : null;
          return {
            type: 'MTO',
            suggestionId: s.id,
            materialId: s.product_id,
            name: prod ? prod.name : 'Unknown',
            sku: prod ? prod.sku : 'N/A',
            current: Number(s.current_stock),
            threshold: prod?.inventory?.reorder_level || 0,
            unit: 'units',
            preferredVendorId: prod?.vendor_id || (vendsList[0]?.id || ''),
            preferredVendorName: vend ? vend.name : (vendsList[0]?.name || 'No Vendor Assigned'),
            recommendedQty: Number(s.shortage_qty),
            estimatedCost: Number(s.shortage_qty) * Number(prod?.cost_price || 0),
            costPrice: Number(prod?.cost_price || 0),
            reason: s.reason
          };
        });

      // Combine both suggestions lists
      setSuggestions([...mtsSuggestions, ...mtoSuggestions]);
    } catch (err) {
      console.error('Failed to load procurement suggestions', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOneClickPO = async (item) => {
    try {
      // Create draft PO
      const poRes = await api.post('/purchase-orders', {
        vendor_id: item.preferredVendorId,
        lines: [{
          product_id: item.materialId,
          ordered_qty: item.recommendedQty,
          unit_price: item.costPrice
        }]
      });

      // If database MTO suggestion, mark as PO created
      if (item.type === 'MTO' && item.suggestionId) {
        await api.patch(`/purchase/suggestions/${item.suggestionId}/status`, {
          status: 'po_created'
        });
      }

      setSuccessMsg(`Draft Purchase Order ${poRes.data?.po_number || ''} successfully generated for ${item.preferredVendorName}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to generate PO');
    }
  };

  const handleOrderAll = async () => {
    if (suggestions.length === 0) return;

    // Group suggestions by preferred vendor
    const grouped = {};
    suggestions.forEach(item => {
      if (!grouped[item.preferredVendorId]) {
        grouped[item.preferredVendorId] = [];
      }
      grouped[item.preferredVendorId].push(item);
    });

    try {
      for (const vendorId of Object.keys(grouped)) {
        const items = grouped[vendorId];
        const lines = items.map(item => ({
          product_id: item.materialId,
          ordered_qty: item.recommendedQty,
          unit_price: item.costPrice
        }));

        // Create consolidated PO
        const poRes = await api.post('/purchase-orders', {
          vendor_id: vendorId,
          lines
        });

        // Update statuses for MTO entries
        for (const item of items) {
          if (item.type === 'MTO' && item.suggestionId) {
            await api.patch(`/purchase/suggestions/${item.suggestionId}/status`, {
              status: 'po_created'
            });
          }
        }
      }

      setSuccessMsg(`Consolidated Purchase Orders created for all low stock items!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to generate consolidated POs');
    }
  };

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <ClipboardList size={22} style={{ color: 'var(--color-primary)' }} />
              Procurement Suggestions
            </h2>
            <p className="purchase-sub">Automated inventory replenishment recommendations based on real-time stock thresholds.</p>
          </div>
          {suggestions.length > 0 && (
            <button className="btn btn--primary" style={{ gap: '6px' }} onClick={handleOrderAll}>
              <Zap size={14} /> Order All Recommendations
            </button>
          )}
        </div>

        {successMsg && (
          <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.08)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        <div className="purchase-panel">
          <div className="purchase-panel-header">
            <h3 className="purchase-panel-title">Replenishment Actions Required</h3>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className={`purchase-badge purchase-badge--${s.type === 'MTO' ? 'warning' : 'outline'}`}>
                        {s.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{s.sku}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>{s.current} units</td>
                    <td>{s.threshold} units</td>
                    <td>{s.preferredVendorName}</td>
                    <td style={{ fontWeight: 600 }}>{s.recommendedQty} units</td>
                    <td style={{ fontWeight: 700 }}>₹{s.estimatedCost.toLocaleString()}</td>
                    <td>
                      <button className="btn btn--primary" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleOneClickPO(s)}>
                        <Zap size={12} /> One-Click PO
                      </button>
                    </td>
                  </tr>
                ))}
                {suggestions.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      ✓ All inventory units are above their safety thresholds. No replenishment suggestions.
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
