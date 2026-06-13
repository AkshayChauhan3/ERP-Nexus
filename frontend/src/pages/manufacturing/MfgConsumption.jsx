import { Package } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const CONSUMED = [
  { material: 'Foam Padding',       planned: 20,  actual: 21,  variance: +1  },
  { material: 'Steel Frame',        planned: 20,  actual: 20,  variance: 0   },
  { material: 'Fabric Cover',       planned: 20,  actual: 19,  variance: -1  },
  { material: 'Caster Wheels',      planned: 100, actual: 100, variance: 0   },
  { material: 'Screws & Bolts',     planned: 200, actual: 208, variance: +8  },
  { material: 'Oak Wood Planks',    planned: 15,  actual: 16,  variance: +1  },
  { material: 'Wood Stain (L)',     planned: 5,   actual: 4.5, variance: -0.5 },
];

const PRODUCED = [
  { product: 'Executive Chair',    planned: 20, produced: 18, uom: 'units' },
  { product: 'Oak Dining Table',   planned: 5,  produced: 3,  uom: 'units' },
  { product: 'Comfort Sofa',       planned: 8,  produced: 2,  uom: 'units' },
  { product: 'Wooden Bookshelf',   planned: 12, produced: 12, uom: 'units' },
];

const varColor = (v) => v > 0 ? 'var(--color-error)' : v < 0 ? 'var(--color-success)' : 'var(--color-secondary)';
const varLabel = (v) => v > 0 ? `+${v} (over)` : v < 0 ? `${v} (saved)` : '0 (exact)';

export default function MfgConsumption() {
  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><Package size={20} style={{ color: 'var(--color-primary)' }} />Inventory Consumption</h2>
            <p className="mfg-page-sub">Track raw material usage and finished goods production against plan</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Consumed Materials */}
          <div className="admin-panel" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <h3 className="admin-panel-title">Consumed Materials</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>Planned vs Actual raw material usage</p>
            </div>
            <div className="admin-table-wrapper" style={{ border: 'none' }}>
              <table className="admin-table">
                <thead>
                  <tr><th>Material</th><th>Planned</th><th>Actual</th><th>Variance</th></tr>
                </thead>
                <tbody>
                  {CONSUMED.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{c.material}</td>
                      <td style={{ color: 'var(--color-secondary)' }}>{c.planned}</td>
                      <td style={{ fontWeight: 600 }}>{c.actual}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: varColor(c.variance), fontSize: '12px' }}>
                          {varLabel(c.variance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Produced Goods */}
          <div className="admin-panel" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <h3 className="admin-panel-title">Produced Goods</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>Planned vs actual finished goods output</p>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {PRODUCED.map((p, i) => {
                const pct = Math.min(100, Math.round((p.produced / p.planned) * 100));
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 600 }}>{p.product}</span>
                      <span style={{ color: pct === 100 ? 'var(--color-success)' : 'var(--color-amber)', fontWeight: 700 }}>
                        {p.produced}/{p.planned} {p.uom}
                      </span>
                    </div>
                    <div className="mfg-progress-track" style={{ height: '10px' }}>
                      <div className="mfg-progress-fill" style={{
                        width: `${pct}%`,
                        background: pct === 100 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-primary)' : 'var(--color-amber)'
                      }} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-secondary)', marginTop: '3px', textAlign: 'right' }}>{pct}% complete</div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div style={{ padding: '0 var(--space-5) var(--space-5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'var(--color-success-container)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success)' }}>{PRODUCED.reduce((s, p) => s + p.produced, 0)}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Units Produced</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-blue-container)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-blue)' }}>{PRODUCED.reduce((s, p) => s + p.planned, 0)}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Total Planned</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
