import { useState, useEffect } from 'react';
import { Layers, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerOverview() {
  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Activity size={22} style={{ color: 'var(--color-primary)' }} />
              Business Health Overview
            </h2>
            <p className="owner-sub">Consolidated health metrics across core company operational workflows.</p>
          </div>
        </div>

        {/* Overview cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="purchase-panel">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Sales Summary</h4>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>₹2,47,000</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 700, marginTop: '4px' }}>↑ +12.4% revenue growth</div>
          </div>
          <div className="purchase-panel">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Purchase Summary</h4>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>₹1,45,400</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 700, marginTop: '4px' }}>↓ -3.2% expense control</div>
          </div>
          <div className="purchase-panel">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Inventory Summary</h4>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>₹8,42,500</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '4px' }}>Stable safety threshold status</div>
          </div>
          <div className="purchase-panel">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Manufacturing Summary</h4>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>3 Active MOs</div>
            <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 700, marginTop: '4px' }}>96.4% efficiency rating</div>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="purchase-panel">
          <div className="purchase-panel-header">
            <h3 className="purchase-panel-title">Operational Health Ratios</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ border: '1px solid var(--color-outline-variant)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 600 }}>REVENUE GROWTH</div>
              <h2 style={{ margin: '8px 0 0 0', fontWeight: 800 }}>+12.4%</h2>
              <span className="health-chip health-chip--green" style={{ marginTop: '8px', fontSize: '10px' }}>Strong Performance</span>
            </div>
            <div style={{ border: '1px solid var(--color-outline-variant)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 600 }}>EXPENSE CONTROL</div>
              <h2 style={{ margin: '8px 0 0 0', fontWeight: 800 }}>-3.2%</h2>
              <span className="health-chip health-chip--green" style={{ marginTop: '8px', fontSize: '10px' }}>Optimal Spend</span>
            </div>
            <div style={{ border: '1px solid var(--color-outline-variant)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 600 }}>NET PROFIT MARGIN</div>
              <h2 style={{ margin: '8px 0 0 0', fontWeight: 800 }}>37.4%</h2>
              <span className="health-chip health-chip--green" style={{ marginTop: '8px', fontSize: '10px' }}>High Profitability</span>
            </div>
            <div style={{ border: '1px solid var(--color-outline-variant)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 600 }}>PRODUCTION EFFICIENCY (OEE)</div>
              <h2 style={{ margin: '8px 0 0 0', fontWeight: 800 }}>96.4%</h2>
              <span className="health-chip health-chip--green" style={{ marginTop: '8px', fontSize: '10px' }}>Excellent Yield</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
