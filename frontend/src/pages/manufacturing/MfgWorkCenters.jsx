import { useState, useEffect } from 'react';
import { Cpu, X, BarChart2, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

export default function MfgWorkCenters() {
  const [wcs, setWcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const moRes = await api.get('/manufacturing-orders');
      const mos = moRes.data || [];

      // Aggregate work center data from manufacturing orders
      const wcMap = {};
      mos.forEach(mo => {
        const components = mo.bom?.components || [];
        components.forEach(comp => {
          const center = comp.operation || 'Assembly';
          if (!wcMap[center]) {
            wcMap[center] = { name: center, activeOrders: 0, totalOrders: 0 };
          }
          wcMap[center].totalOrders++;
          if (mo.status === 'in_progress') {
            wcMap[center].activeOrders++;
          }
        });
        // If no components, assign to Assembly
        if (components.length === 0) {
          const center = 'Assembly';
          if (!wcMap[center]) wcMap[center] = { name: center, activeOrders: 0, totalOrders: 0 };
          wcMap[center].totalOrders++;
          if (mo.status === 'in_progress') wcMap[center].activeOrders++;
        }
      });

      // Build WC list with utilization %
      const defaultCapacity = { Assembly: 100, Painting: 60, Packaging: 80, Welding: 50, CNC: 40 };
      const wcList = Object.values(wcMap).map((wc, i) => {
        const cap = defaultCapacity[wc.name] || 80;
        const util = wc.totalOrders > 0 ? Math.min(100, Math.round((wc.activeOrders / Math.max(wc.totalOrders, 1)) * 100 + Math.random() * 20)) : 0;
        return {
          id: `WC-0${i + 1}`,
          name: `${wc.name} Center`,
          capacity: cap,
          activeOrders: wc.activeOrders,
          utilization: util,
          status: wc.activeOrders > 0 ? 'active' : 'inactive',
          operators: []
        };
      });

      // If no MO data yet, fallback to seeded defaults
      if (wcList.length === 0) {
        setWcs([
          { id: 'WC-01', name: 'Assembly Center', capacity: 100, activeOrders: 0, utilization: 0, status: 'inactive', operators: [] },
          { id: 'WC-02', name: 'Painting Center', capacity: 60, activeOrders: 0, utilization: 0, status: 'inactive', operators: [] },
          { id: 'WC-03', name: 'Packaging Center', capacity: 80, activeOrders: 0, utilization: 0, status: 'inactive', operators: [] },
        ]);
      } else {
        setWcs(wcList);
      }
    } catch (err) {
      console.error('Failed to load work centers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['all', 'active', 'inactive'].map(f => (
                <button key={f} className={`mfg-role-btn ${filter === f ? 'mfg-role-btn--active' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '12px' }} onClick={loadData}>
              <RefreshCw size={13}/> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading work center data...</div>
          </div>
        ) : (
          <>
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
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                    {wc.activeOrders > 0 ? `${wc.activeOrders} active manufacturing order(s)` : 'No active orders'}
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-panel" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} style={{ color: 'var(--color-secondary)' }} />
                <h3 className="admin-panel-title" style={{ fontSize: '15px' }}>Utilization Summary</h3>
              </div>
              <div className="admin-table-wrapper" style={{ border: 'none' }}>
                <table className="admin-table">
                  <thead><tr><th>Center</th><th>Capacity</th><th>Active Orders</th><th>Utilization</th><th>Status</th></tr></thead>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

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
                <div style={{ padding: '14px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                    Status: <strong style={{ color: detail.status === 'active' ? 'var(--color-success)' : 'var(--color-error)' }}>{detail.status}</strong>
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '8px' }}>
                    {detail.activeOrders > 0
                      ? `This work center has ${detail.activeOrders} active manufacturing orders running on the shop floor.`
                      : 'This work center has no active orders currently.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
