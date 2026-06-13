import { useState } from 'react';
import { BarChart2, TrendingUp, TrendingDown, RefreshCw, Award, PieChart, Hammer } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import '../styles/AdminPages.css';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 450, cost: 280, profit: 170 },
  { month: 'Feb', revenue: 520, cost: 310, profit: 210 },
  { month: 'Mar', revenue: 610, cost: 360, profit: 250 },
  { month: 'Apr', revenue: 580, cost: 340, profit: 240 },
  { month: 'May', revenue: 670, cost: 390, profit: 280 },
  { month: 'Jun', revenue: 780, cost: 420, profit: 360 },
];

const MOST_PROFITABLE = [
  { name: 'Luxury Oak Bed Frame', profit: '₹22,000', margin: '48%' },
  { name: 'Suede Sectional Sofa', profit: '₹18,500', margin: '42%' },
  { name: 'Solid Teak Dining Table', profit: '₹16,000', margin: '40%' },
  { name: 'Ergonomic Desk Pro', profit: '₹6,800', margin: '35%' },
];

const SLOW_MOVING = [
  { name: 'Classic Plywood Chair', stock: 48, idleDays: 120 },
  { name: 'Metal Filing Cabinet', stock: 15, idleDays: 95 },
  { name: 'Oak Desk Side Table', stock: 9, idleDays: 78 },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'products' | 'manufacturing'

  const maxVal = Math.max(...REVENUE_DATA.map(d => d.revenue)) || 100;

  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header Panel */}
      <div className="admin-panel" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '40px', height: '40px' }}><BarChart2 size={18} /></div>
          <div>
            <h3 className="admin-panel-title">Nexus Business Intelligence Reports</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Analytical insights on revenues, profit margins, product speed, and operational yields</p>
          </div>
        </div>

        {/* Tab filters */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-low)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-outline-variant)' }}>
          {[
            { id: 'revenue', label: 'Revenue & Cost' },
            { id: 'products', label: 'Product Speed' },
            { id: 'manufacturing', label: 'Production Yields' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? 'var(--color-primary)' : 'none',
                color: activeTab === t.id ? 'var(--color-on-primary)' : 'var(--color-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content: REVENUE & COST ── */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
          {/* Revenue Chart */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3 className="admin-panel-title">Revenue vs Operating Cost</h3>
              <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 600 }}>(Values in Thousands ₹)</span>
            </div>
            
            {/* Custom Multi-bar Chart */}
            <div className="chart-container" style={{ height: '260px', padding: '16px 0 8px' }}>
              {REVENUE_DATA.map((d, i) => {
                const revPct = (d.revenue / maxVal) * 100;
                const costPct = (d.cost / maxVal) * 100;
                const profitPct = (d.profit / maxVal) * 100;
                return (
                  <div key={i} className="chart-bar-group" style={{ width: '64px', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', width: '100%', gap: '4px', height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div className="chart-bar" data-value={`₹${d.revenue}k`} style={{ height: `${revPct}%`, background: 'var(--color-primary)', width: '14px' }} />
                      <div className="chart-bar" data-value={`₹${d.cost}k`} style={{ height: `${costPct}%`, background: 'var(--color-error)', width: '14px' }} />
                      <div className="chart-bar" data-value={`₹${d.profit}k`} style={{ height: `${profitPct}%`, background: 'var(--color-success)', width: '14px' }} />
                    </div>
                    <span className="chart-label" style={{ fontWeight: 700, fontSize: '11px', marginTop: '8px' }}>{d.month}</span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px' }} />
                <span>Monthly Revenue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--color-error)', borderRadius: '2px' }} />
                <span>Purchase & Operating Cost</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--color-success)', borderRadius: '2px' }} />
                <span>Net Profit</span>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="admin-panel" style={{ justifyContent: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="kpi-icon kpi-icon--green" style={{ width: '48px', height: '48px' }}><TrendingUp size={20} /></div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 600 }}>Total Quarter Profit</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-success)' }}>₹15,10,000</div>
                <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  +18.4% growth compared to Q1
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="kpi-icon kpi-icon--error" style={{ width: '48px', height: '48px' }}><TrendingDown size={20} /></div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 600 }}>Average Monthly Overhead</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)' }}>₹3,53,300</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', opacity: 0.8 }}>Includes logistics, storage, and scrap losses</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: PRODUCT SPEED & MARGINS ── */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Most Profitable */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3 className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--color-success)' }} />
                Most Profitable Products
              </h3>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Average Profit per Unit</th>
                    <th>Gross Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {MOST_PROFITABLE.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{p.profit}</td>
                      <td>
                        <span className="admin-badge admin-badge--success" style={{ fontWeight: 700 }}>
                          {p.margin}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Slow Moving Products */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3 className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} style={{ color: 'var(--color-amber)' }} />
                Slow Moving Inventory Alert
              </h3>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>On Hand Stock</th>
                    <th>Days Since Last Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {SLOW_MOVING.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontWeight: 700 }}>{p.stock} units</td>
                      <td>
                        <span className="admin-badge admin-badge--warning" style={{ fontWeight: 700 }}>
                          {p.idleDays} Days Idle
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: MANUFACTURING METRICS ── */}
      {activeTab === 'manufacturing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Output metrics */}
          <div className="admin-panel" style={{ gap: '20px' }}>
            <h3 className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hammer size={18} /> Production Output Analytics
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-secondary)', marginBottom: '6px' }}>
                  <span>Production Run Completion Rate</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>92.8%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-low)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '92.8%', background: 'var(--color-primary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-secondary)', marginBottom: '6px' }}>
                  <span>Overall Assembly Efficiency</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>96.5%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-low)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '96.5%', background: 'var(--color-success)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-secondary)', marginBottom: '6px' }}>
                  <span>Material Loss Ratio (Scrap)</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>1.7%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-low)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '1.7%', background: 'var(--color-error)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="admin-panel" style={{ justifyContent: 'center', gap: '16px' }}>
            {[
              { label: 'Total Units Produced (Month)', value: '1,248 Units' },
              { label: 'Yield Variance', value: '+3.4% (Favorable)', color: 'var(--color-success)' },
              { label: 'Delayed Production Runs', value: '1 Order', color: 'var(--color-error)' },
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px dashed var(--color-outline-variant)' : 'none' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>{stat.label}</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: stat.color || 'var(--color-primary)' }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
