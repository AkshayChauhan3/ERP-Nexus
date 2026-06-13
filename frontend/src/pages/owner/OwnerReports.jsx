import { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, Download, FileText, TrendingUp, Layers } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerReports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const sales = salesApi.getOrders();
      const purchases = purchaseApi.getPOs();
      const materials = purchaseApi.getMaterials();

      setSummary({
        salesCount: sales.length,
        salesTotal: sales.reduce((sum, s) => sum + s.amount, 0),
        purchaseCount: purchases.length,
        purchaseTotal: purchases.reduce((sum, p) => sum + p.totalValue, 0),
        inventoryItems: materials.length,
        inventoryValue: materials.reduce((sum, m) => sum + (m.currentStock * m.price), 0)
      });
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerDownload = (reportName) => {
    alert(`Downloading ${reportName} PDF report file...`);
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <BarChart2 size={22} style={{ color: 'var(--color-primary)' }} />
              Executive Reports Cockpit
            </h2>
            <p className="owner-sub">Consolidated analytical reports spanning sales pipelines, outlays, inventory assets, and efficiency logs.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadData}>
            <RefreshCw size={14} /> Recompute Reports
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Compiling ledger metrics...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Analytics Summary */}
            <div className="purchase-panel">
              <div className="purchase-panel-header">
                <h3 className="purchase-panel-title">Business Analytical Summary</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>REVENUE PIPELINE</div>
                  <h3 style={{ margin: '6px 0 0 0', fontWeight: 800 }}>₹{summary.salesTotal?.toLocaleString()}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>From {summary.salesCount} customer sales orders</span>
                </div>
                <div style={{ padding: '16px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>PROCUREMENT SPEND</div>
                  <h3 style={{ margin: '6px 0 0 0', fontWeight: 800 }}>₹{summary.purchaseTotal?.toLocaleString()}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>From {summary.purchaseCount} supplier purchase orders</span>
                </div>
                <div style={{ padding: '16px', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>INVENTORY VALUATION</div>
                  <h3 style={{ margin: '6px 0 0 0', fontWeight: 800 }}>₹{summary.inventoryValue?.toLocaleString()}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Across {summary.inventoryItems} active stock items</span>
                </div>
              </div>
            </div>

            {/* Downloader Grid */}
            <div className="purchase-panel">
              <div className="purchase-panel-header">
                <h3 className="purchase-panel-title">Downloadable PDF Dossiers</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                {[
                  { title: 'Monthly Profit & Loss Statement', desc: 'Detailed breakdown of sales revenue channels against purchase expenditures and overhead.' },
                  { title: 'Operational Inventory Valuations', desc: 'Current assets, safety levels, safety thresholds, and projected replenishment spends.' },
                  { title: 'Supplier Velocity Performance', desc: 'Overview of vendor ratings, lead delivery times, and fulfillment rejection ratios.' },
                  { title: 'Shop Floor Productivity Log', desc: 'Overall Equipment Effectiveness (OEE) metrics, active work hours, and yield ratios.' }
                ].map((rep, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.01)'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700 }}>{rep.title}</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-secondary)', lineHeight: '1.4' }}>{rep.desc}</p>
                    </div>
                    <button className="topbar-icon-btn" style={{ minWidth: '40px', height: '40px' }} onClick={() => triggerDownload(rep.title)}>
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
