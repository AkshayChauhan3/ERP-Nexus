import { BarChart2, TrendingUp, Package, Activity } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const MONTHLY_PROD = [
  { month: 'Jan', planned: 80,  produced: 78  },
  { month: 'Feb', planned: 90,  produced: 88  },
  { month: 'Mar', planned: 75,  produced: 72  },
  { month: 'Apr', planned: 100, produced: 96  },
  { month: 'May', planned: 85,  produced: 84  },
  { month: 'Jun', planned: 110, produced: 102 },
];
const maxP = Math.max(...MONTHLY_PROD.map(d => d.planned));

const WC_PERF = [
  { center: 'Assembly',  utilization: 85, efficiency: 94 },
  { center: 'Painting',  utilization: 48, efficiency: 79 },
  { center: 'Packaging', utilization: 72, efficiency: 88 },
  { center: 'Welding',   utilization: 91, efficiency: 96 },
];

const COMPONENT_USAGE = [
  { material: 'Foam Padding',    usage: 210, unit: 'pcs'  },
  { material: 'Steel Frame',     usage: 180, unit: 'pcs'  },
  { material: 'Fabric Cover',    usage: 195, unit: 'pcs'  },
  { material: 'Oak Wood Planks', usage: 96,  unit: 'sq.m' },
  { material: 'Screws & Bolts',  usage: 1840, unit: 'pcs' },
];
const maxUsage = Math.max(...COMPONENT_USAGE.map(c => c.usage));

const EFFICIENCY_DATA = [
  { product: 'Executive Chair',   planned: 450, actual: 442, scrap: 8,  eff: '98.2%' },
  { product: 'Oak Dining Table',  planned: 30,  actual: 28,  scrap: 2,  eff: '93.3%' },
  { product: 'Comfort Sofa',      planned: 24,  actual: 22,  scrap: 2,  eff: '91.7%' },
  { product: 'Wooden Bookshelf',  planned: 72,  actual: 71,  scrap: 1,  eff: '98.6%' },
];

const REPORTS = [
  { title: 'Production Report',       icon: <BarChart2 size={18}/>,   color: 'var(--color-primary)',  desc: 'Product-wise quantity produced by date' },
  { title: 'Work Center Performance', icon: <TrendingUp size={18}/>,  color: 'var(--color-success)',  desc: 'Utilization % and efficiency by work center' },
  { title: 'Component Consumption',   icon: <Package size={18}/>,     color: 'var(--color-amber)',    desc: 'Raw material usage across all MOs' },
  { title: 'Manufacturing Efficiency',icon: <Activity size={18}/>,    color: 'var(--color-blue)',     desc: 'Planned vs Actual production analysis' },
];

export default function MfgReports() {
  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><BarChart2 size={20} style={{ color: 'var(--color-primary)' }} />Manufacturing Reports</h2>
            <p className="mfg-page-sub">Analytical reports on production, efficiency, and resource consumption</p>
          </div>
        </div>

        {/* Report Category Cards */}
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
          {REPORTS.map((r, i) => (
            <div key={i} className="admin-panel" style={{ padding: '18px', cursor: 'pointer', gap: 'var(--space-3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)', background: `color-mix(in srgb, ${r.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color }}>
                {r.icon}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{r.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '3px' }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--space-6)' }}>
          {/* Production Report Chart */}
          <div className="admin-panel">
            <h3 className="admin-panel-title">Production Report — Monthly</h3>
            <div className="chart-container" style={{ height: '200px', gap: '6px' }}>
              {MONTHLY_PROD.map((d, i) => (
                <div key={i} className="chart-bar-group" style={{ width: '56px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', flex: 1, justifyContent: 'center' }}>
                    <div className="chart-bar" data-value={`Planned: ${d.planned}`}
                      style={{ height: `${(d.planned / maxP) * 100}%`, background: 'var(--color-outline-variant)', width: '18px' }} />
                    <div className="chart-bar" data-value={`Produced: ${d.produced}`}
                      style={{ height: `${(d.produced / maxP) * 100}%`, background: 'var(--color-primary)', width: '18px' }} />
                  </div>
                  <span className="chart-label">{d.month}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--color-outline-variant)' }} /> Planned
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--color-primary)' }} /> Produced
              </div>
            </div>
          </div>

          {/* Work Center Performance */}
          <div className="admin-panel">
            <h3 className="admin-panel-title">Work Center Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
              {WC_PERF.map((wc, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{wc.center}</span>
                    <span style={{ color: 'var(--color-secondary)' }}>Util: {wc.utilization}% · Eff: <strong>{wc.efficiency}%</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ flex: wc.utilization, height: '7px', background: 'var(--color-primary)', borderRadius: 'var(--radius-full)' }} />
                    <div style={{ flex: 100 - wc.utilization, height: '7px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 'var(--space-6)' }}>
          {/* Component Consumption */}
          <div className="admin-panel">
            <h3 className="admin-panel-title">Component Consumption</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
              {COMPONENT_USAGE.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '130px', fontSize: '11px', color: 'var(--color-secondary)', flexShrink: 0 }}>{c.material}</span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.usage / maxUsage) * 100}%`, background: 'var(--color-amber)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, minWidth: '50px', textAlign: 'right' }}>{c.usage} {c.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Manufacturing Efficiency */}
          <div className="admin-panel" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <h3 className="admin-panel-title">Manufacturing Efficiency — Planned vs Actual</h3>
            </div>
            <div className="admin-table-wrapper" style={{ border: 'none' }}>
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Planned</th><th>Actual</th><th>Scrap</th><th>Efficiency</th></tr></thead>
                <tbody>
                  {EFFICIENCY_DATA.map((e, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{e.product}</td>
                      <td>{e.planned}</td>
                      <td>{e.actual}</td>
                      <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>{e.scrap}</td>
                      <td>
                        <span style={{ fontWeight: 800, color: parseFloat(e.eff) >= 95 ? 'var(--color-success)' : 'var(--color-amber)' }}>{e.eff}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
