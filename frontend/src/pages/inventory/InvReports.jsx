import { useState, useEffect } from 'react';
import { BarChart2, Download, TrendingUp, Warehouse, AlertTriangle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvReports() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [activeReport, setActiveReport] = useState('valuation'); // valuation, movement, lowstock, warehouse

  useEffect(() => {
    setProducts(inventoryApi.getProducts());
    setWarehouses(inventoryApi.getWarehouses());
    setLedger(inventoryApi.getLedger());
  }, []);

  const handleExport = () => {
    alert(`Exporting Inventory Analytical ${activeReport.toUpperCase()} report as PDF document...\nExport Successful.`);
  };

  // Calculations
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <BarChart2 size={22} style={{ color: 'var(--color-primary)' }} />
              Inventory Analysis & Reports
            </h2>
            <p className="inventory-sub">Generate and print analytical statements for valuations, stock turnovers, and utilization.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={handleExport}>
            <Download size={14} /> Export Report PDF
          </button>
        </div>

        {/* Tab switcher */}
        <div className="purchase-tabs">
          <button className={`purchase-tab ${activeReport === 'valuation' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('valuation')}>Inventory Valuation</button>
          <button className={`purchase-tab ${activeReport === 'movement' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('movement')}>Stock Movement</button>
          <button className={`purchase-tab ${activeReport === 'lowstock' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('lowstock')}>Low Stock Report</button>
          <button className={`purchase-tab ${activeReport === 'warehouse' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('warehouse')}>Warehouse Utilization</button>
        </div>

        {/* Report Panel */}
        <div className="inventory-panel">
          {activeReport === 'valuation' && (
            <>
              <div className="inventory-panel-header" style={{ justifyContent: 'space-between' }}>
                <h3 className="inventory-panel-title">Asset Valuation Statement</h3>
                <span style={{ fontWeight: 800, fontSize: '15px' }}>Total Assets Value: ₹{totalValue.toLocaleString()}</span>
              </div>
              <div className="inventory-table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Quantity on Hand</th>
                      <th>Cost Price</th>
                      <th>Calculated Asset Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace' }}>{p.code}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td>{p.currentStock} {p.unit}</td>
                        <td>₹{p.costPrice.toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>₹{(p.currentStock * p.costPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeReport === 'movement' && (
            <>
              <div className="inventory-panel-header">
                <h3 className="inventory-panel-title">Stock Net Velocity Balance</h3>
              </div>
              <div className="inventory-table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Incoming Qty (Transfers/Adjustments In)</th>
                      <th>Outgoing Qty (Transfers/Adjustments Out)</th>
                      <th>Net Stock Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const logs = ledger.filter(l => l.productId === p.id);
                      const incoming = logs.filter(l => l.qty > 0).reduce((sum, l) => sum + l.qty, 0);
                      const outgoing = logs.filter(l => l.qty < 0).reduce((sum, l) => sum + Math.abs(l.qty), 0);
                      const net = incoming - outgoing;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>+{incoming} {p.unit}</td>
                          <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>-{outgoing} {p.unit}</td>
                          <td style={{ fontWeight: 700, color: net < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                            {net > 0 ? `+${net}` : net} {p.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeReport === 'lowstock' && (
            <>
              <div className="inventory-panel-header">
                <h3 className="inventory-panel-title">Replenishment Action Required Items</h3>
              </div>
              <div className="inventory-table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Current Qty</th>
                      <th>Reorder Level</th>
                      <th>Deficit Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.currentStock <= p.reorderLevel).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace' }}>{p.code}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td style={{ color: 'var(--color-error)', fontWeight: 700 }}>{p.currentStock} {p.unit}</td>
                        <td>{p.reorderLevel} {p.unit}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-error)' }}>{p.reorderLevel - p.currentStock} {p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeReport === 'warehouse' && (
            <>
              <div className="inventory-panel-header">
                <h3 className="inventory-panel-title">Warehouse Floor Capacity Index</h3>
              </div>
              <div className="inventory-table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Warehouse Code</th>
                      <th>Warehouse Name</th>
                      <th>Total Capacity</th>
                      <th>Used Capacity</th>
                      <th>Available Volume</th>
                      <th>Utilization %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map(w => {
                      const items = products.filter(p => p.warehouseId === w.id);
                      const used = items.reduce((sum, item) => sum + item.currentStock, 0);
                      const pct = Math.min(Math.round((used / w.capacity) * 100), 100);
                      return (
                        <tr key={w.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{w.id}</td>
                          <td style={{ fontWeight: 600 }}>{w.name}</td>
                          <td>{w.capacity} units</td>
                          <td>{used} units</td>
                          <td>{w.capacity - used} units</td>
                          <td style={{ fontWeight: 700, color: pct > 85 ? 'var(--color-error)' : 'inherit' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
