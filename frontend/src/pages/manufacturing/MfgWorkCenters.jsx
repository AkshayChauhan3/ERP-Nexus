import { useState } from 'react';
import { Cpu, Edit2, X, BarChart2 } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const MOCK_WCS = [
  { id: 'WC-01', name: 'Assembly Center',  capacity: 100, activeOrders: 3, utilization: 85, status: 'active',   operators: ['Rahul K.', 'Suresh P.'] },
  { id: 'WC-02', name: 'Painting Center',  capacity: 60,  activeOrders: 1, utilization: 48, status: 'active',   operators: ['Nikhil S.'] },
  { id: 'WC-03', name: 'Packaging Center', capacity: 80,  activeOrders: 2, utilization: 72, status: 'active',   operators: ['Priya M.', 'Anil T.'] },
  { id: 'WC-04', name: 'Welding Center',   capacity: 50,  activeOrders: 4, utilization: 91, status: 'active',   operators: ['Vikram J.'] },
  { id: 'WC-05', name: 'CNC Center',       capacity: 40,  activeOrders: 0, utilization: 0,  status: 'inactive', operators: [] },
];

const UTIL_TREND = [62, 70, 55, 80, 85, 75, 88]; // last 7 days
const maxTrend = Math.max(...UTIL_TREND);

export default function MfgWorkCenters() {
  const [wcs] = useState(MOCK_WCS);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);

  const filtered = wcs.filter(w => filter === 'all' || w.status === filter);

  const utilColor = (v) => v >= 80 ? 'var(--color-error)' : v >= 60 ? 'var(--color-amber)' : 'var(--color-success)';

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><Cpu size={20} style={{ color: 'var(--color-primary)' }} />Work Centers</h2>
            <p className="mfg-page-sub">Monitor work center capacity, utilization, and active orders</p>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'active', 'inactive'].map(f => (
              <button key={f} className={`mfg-role-btn ${filter === f ? 'mfg-role-btn--active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {filtered.map(wc => (
            <div key={wc.id} className="admin-panel" style={{ cursor: 'pointer', transition: 'transform 0.2s ease', gap: 'var(--space-3)' }}
              onClick={() => setDetail(wc)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>{wc.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '2px' }}>{wc.id}</div>
                </div>
                <span className={`admin-badge admin-badge--${wc.status === 'active' ? 'success' : 'error'}`}>{wc.status}</span>
              </div>

              {/* Utilization Ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                  {(() => {
                    const r = 27, stroke = 6, circ = 2 * Math.PI * r;
                    const offset = circ - (wc.utilization / 100) * circ;
                    return (
                      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-high)" strokeWidth={stroke} />
                        <circle cx="32" cy="32" r={r} fill="none" stroke={utilColor(wc.utilization)} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                      </svg>
                    );
                  })()}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    {wc.utilization}%
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Capacity</span>
                    <span style={{ fontWeight: 600 }}>{wc.capacity} hrs/mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Active Orders</span>
                    <span style={{ fontWeight: 600 }}>{wc.activeOrders}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Operators</span>
                    <span style={{ fontWeight: 600 }}>{wc.operators.length}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                {wc.operators.length > 0 ? wc.operators.join(', ') : 'No operators assigned'}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="admin-panel" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} style={{ color: 'var(--color-secondary)' }} />
            <h3 className="admin-panel-title" style={{ fontSize: '15px' }}>Utilization Summary</h3>
          </div>
          <div className="admin-table-wrapper" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead><tr><th>Center</th><th>Capacity</th><th>Active Orders</th><th>Utilization</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {wcs.map(wc => (
                  <tr key={wc.id}>
                    <td style={{ fontWeight: 600 }}>{wc.name}</td>
                    <td style={{ color: 'var(--color-secondary)' }}>{wc.capacity} hrs/mo</td>
                    <td>{wc.activeOrders}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${wc.utilization}%`, background: utilColor(wc.utilization) }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: utilColor(wc.utilization) }}>{wc.utilization}%</span>
                      </div>
                    </td>
                    <td><span className={`admin-badge admin-badge--${wc.status === 'active' ? 'success' : 'error'}`}>{wc.status}</span></td>
                    <td>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => setDetail(wc)}><Edit2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{detail.name} — Detail</h3>
              <button className="admin-modal-close" onClick={() => setDetail(null)}><X size={18}/></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[['Capacity', `${detail.capacity} hrs/mo`], ['Active Orders', detail.activeOrders], ['Utilization', `${detail.utilization}%`]].map(([k, v]) => (
                    <div key={k} style={{ padding: '12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800 }}>{v}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{k}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-secondary)', textTransform: 'uppercase' }}>Utilization Trend (7 Days)</p>
                  <div className="chart-container" style={{ height: '100px' }}>
                    {UTIL_TREND.map((v, i) => (
                      <div key={i} className="chart-bar-group" style={{ width: '32px' }}>
                        <div className="chart-bar" data-value={`${v}%`}
                          style={{ height: `${(v / maxTrend) * 100}%`, background: utilColor(v), width: '22px' }} />
                        <span className="chart-label">D{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-secondary)', textTransform: 'uppercase' }}>Assigned Operators</p>
                  {detail.operators.length > 0
                    ? <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {detail.operators.map(op => <span key={op} className="admin-badge admin-badge--info">{op}</span>)}
                      </div>
                    : <p style={{ color: 'var(--color-secondary)', fontSize: '13px' }}>No operators assigned.</p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
