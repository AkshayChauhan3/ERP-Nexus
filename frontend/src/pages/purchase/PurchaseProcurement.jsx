import { useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Purchase.css';

export default function PurchaseProcurement() {
  const [suggestions, setSuggestions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    const mats = purchaseApi.getMaterials();
    const vends = purchaseApi.getVendors();
    setVendors(vends);

    // Filter materials that are below reorder level
    const lowStockMats = mats.filter(m => m.currentStock <= m.reorderLevel);
    
    // Map to procurement suggestions
    const items = lowStockMats.map(m => {
      const vend = vends.find(v => v.id === m.preferredVendor);
      const deficit = m.reorderLevel - m.currentStock;
      const recommendedQty = Math.max(deficit * 2, 10); // Standard replenish lot size

      return {
        materialId: m.id,
        name: m.name,
        sku: m.sku,
        current: m.currentStock,
        threshold: m.reorderLevel,
        unit: m.unit,
        preferredVendorId: m.preferredVendor,
        preferredVendorName: vend ? vend.name : 'Unknown Vendor',
        recommendedQty,
        estimatedCost: recommendedQty * m.price
      };
    });

    setSuggestions(items);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOneClickPO = (item) => {
    const originalMaterial = purchaseApi.getMaterials().find(m => m.id === item.materialId);
    
    purchaseApi.createPO({
      vendorId: item.preferredVendorId,
      deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], // 5 days delivery ETA
      items: [{
        materialId: item.materialId,
        name: item.name,
        qty: item.recommendedQty,
        price: originalMaterial ? originalMaterial.price : 100
      }],
      totalValue: item.estimatedCost,
      status: 'Confirmed'
    });

    setSuccessMsg(`Draft Purchase Order successfully generated for ${item.preferredVendorName}!`);
    setTimeout(() => setSuccessMsg(''), 5000);
    loadData();
  };

  const handleOrderAll = () => {
    if (suggestions.length === 0) return;

    // Group suggestions by vendor to create consolidated POs
    const grouped = {};
    suggestions.forEach(item => {
      if (!grouped[item.preferredVendorId]) {
        grouped[item.preferredVendorId] = [];
      }
      grouped[item.preferredVendorId].push(item);
    });

    Object.keys(grouped).forEach(vendorId => {
      const items = grouped[vendorId];
      const poItems = items.map(item => {
        const mat = purchaseApi.getMaterials().find(m => m.id === item.materialId);
        return {
          materialId: item.materialId,
          name: item.name,
          qty: item.recommendedQty,
          price: mat ? mat.price : 100
        };
      });

      const totalValue = poItems.reduce((sum, i) => sum + (i.qty * i.price), 0);

      purchaseApi.createPO({
        vendorId,
        deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
        items: poItems,
        totalValue,
        status: 'Confirmed'
      });
    });

    setSuccessMsg(`Consolidated Purchase Orders created for all low stock items!`);
    setTimeout(() => setSuccessMsg(''), 5000);
    loadData();
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
          <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.08)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-lg)' }}>
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
                {suggestions.map(s => (
                  <tr key={s.materialId}>
                    <td style={{ fontFamily: 'monospace' }}>{s.sku}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>{s.current} {s.unit}</td>
                    <td>{s.threshold} {s.unit}</td>
                    <td>{s.preferredVendorName}</td>
                    <td style={{ fontWeight: 600 }}>{s.recommendedQty} {s.unit}</td>
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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
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
