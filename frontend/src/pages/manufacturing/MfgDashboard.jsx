import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory, CheckCircle, Clock, AlertTriangle, Zap,
  TrendingUp, BarChart2, Plus, Play, FileText, Target, Activity
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const WEEKLY_DATA = [
  { day: 'Mon', qty: 42 }, { day: 'Tue', qty: 58 }, { day: 'Wed', qty: 35 },
  { day: 'Thu', qty: 70 }, { day: 'Fri', qty: 61 }, { day: 'Sat', qty: 28 }, { day: 'Sun', qty: 15 },
];
const maxQty = Math.max(...WEEKLY_DATA.map(d => d.qty));

const WC_UTIL = [
  { label: 'Assembly',  val: 85, color: 'var(--color-primary)' },
  { label: 'Painting',  val: 48, color: 'var(--color-amber)' },
  { label: 'Packaging', val: 72, color: 'var(--color-success)' },
  { label: 'Welding',   val: 91, color: 'var(--color-error)' },
];

const TOP_PRODUCTS = [
  { name: 'Executive Chair',    qty: 120 },
  { name: 'Oak Dining Table',   qty: 85 },
  { name: 'Comfort Sofa',       qty: 67 },
  { name: 'Office Swivel Chair', qty: 54 },
  { name: 'Wooden Bookshelf',   qty: 43 },
];
const maxProd = TOP_PRODUCTS[0].qty;

export default function MfgDashboard() {
  const navigate = useNavigate();

  const kpis = [
    { icon: <Factory size={16}/>,       cls: 'kpi-icon--primary', val: '7',    label: 'Open MOs',        sub: 'Manufacturing Orders' },
    { icon: <Play size={16}/>,          cls: 'kpi-icon--blue',    val: '3',    label: 'In Progress',     sub: 'Active productions' },
    { icon: <CheckCircle size={16}/>,   cls: 'kpi-icon--green',   val: '48',   label: 'Completed',       sub: 'This month' },
    { icon: <AlertTriangle size={16}/>, cls: 'kpi-icon--error',   val: '2',    label: 'Delayed',         sub: 'Need attention 🔴' },
    { icon: <Clock size={16}/>,         cls: 'kpi-icon--blue',    val: '9',    label: 'Pending WOs',     sub: 'Work Orders' },
    { icon: <Target size={16}/>,        cls: 'kpi-icon--green',   val: '309',  label: "Today's Output",  sub: 'Units produced' },
    { icon: <Activity size={16}/>,      cls: 'kpi-icon--primary', val: '96.4%', label: 'Efficiency',     sub: 'Overall OEE' },
    { icon: <Zap size={16}/>,           cls: 'kpi-icon--green',   val: '4',    label: 'Active Centers',  sub: 'Work Centers' },
  ];

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="mfg-page-title"><Factory size={22} style={{ color: 'var(--color-primary)' }} />Manufacturing Dashboard</h2>
            <p className="mfg-page-sub">Production overview — real-time insights for manufacturing users</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button id="btn-create-mo" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={() => navigate('/manufacturing/orders')}>
              <Plus size={14}/> Create MO
            </button>
            <button id="btn-create-bom" className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={() => navigate('/manufacturing/bom')}>
              <FileText size={14}/> Create BoM
            </button>
            <button id="btn-start-prod" className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={() => navigate('/manufacturing/tracking')}>
              <Play size={14}/> Start Production
            </button>
          </div>
        </div>

        {}
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
          {kpis.map((kpi, i) => (
            <div key={i} className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
              <div className={`kpi-icon ${kpi.cls}`} style={{ width: '38px', height: '38px', flexShrink: 0 }}>{kpi.icon}</div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{kpi.val}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>{kpi.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-secondary)' }}>{kpi.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 'var(--space-6)' }}>
          {}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3 className="admin-panel-title">Weekly Production Trend</h3>
              <TrendingUp size={16} style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div className="chart-container" style={{ height: '180px' }}>
              {WEEKLY_DATA.map((d, i) => (
                <div key={i} className="chart-bar-group" style={{ width: '36px' }}>
                  <div className="chart-bar" data-value={`${d.qty} units`}
                    style={{ height: `${(d.qty / maxQty) * 100}%`, background: 'var(--color-primary)', width: '28px' }} />
                  <span className="chart-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="admin-panel">
            <h3 className="admin-panel-title">Work Center Utilization</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
              {WC_UTIL.map((wc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '72px', fontSize: '11px', color: 'var(--color-secondary)', flexShrink: 0 }}>{wc.label}</span>
                  <div style={{ flex: 1, height: '10px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${wc.val}%`, background: wc.color, borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, minWidth: '32px', textAlign: 'right', color: wc.color }}>{wc.val}%</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="admin-panel">
            <h3 className="admin-panel-title">Top Products</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
              {TOP_PRODUCTS.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '16px', fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: 'var(--color-secondary)' }}>{p.qty}</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(p.qty / maxProd) * 100}%`, background: 'var(--color-primary)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
