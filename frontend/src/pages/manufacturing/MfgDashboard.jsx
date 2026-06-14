import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory, CheckCircle, Clock, AlertTriangle, Zap,
  TrendingUp, Plus, Play, FileText, Target, Activity, RefreshCw
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

export default function MfgDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ open: 0, inProgress: 0, completed: 0, delayed: 0, todayOutput: 0 });
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [wcUtil, setWcUtil] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const WC_COLORS = ['var(--color-primary)', 'var(--color-amber)', 'var(--color-success)', 'var(--color-error)', 'var(--color-secondary)'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [moRes, wcRes] = await Promise.all([
        api.get('/manufacturing-orders'),
        api.get('/manufacturing-orders/work-centers').catch(() => ({ data: [] }))
      ]);
      const mos = moRes.data || [];

      // KPIs from real MOs
      const open = mos.filter(m => m.status === 'planned' || m.status === 'released').length;
      const inProgress = mos.filter(m => m.status === 'in_progress').length;
      const completed = mos.filter(m => m.status === 'done').length;
      const today = new Date().toISOString().split('T')[0];
      const delayed = mos.filter(m => {
        const isActive = m.status !== 'done' && m.status !== 'cancelled';
        const isDue = m.due_date && m.due_date < today;
        return isActive && isDue;
      }).length;
      const todayOutput = mos
        .filter(m => m.status === 'done' && m.updated_at && m.updated_at.startsWith(today))
        .reduce((sum, m) => sum + (Number(m.produced_qty) || 0), 0);

      setKpis({ open, inProgress, completed, delayed, todayOutput });

      // Weekly Production Trend — group completed MOs by day of week
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const trend = dayNames.map(day => ({ day, qty: 0 }));
      mos.filter(m => m.status === 'done').forEach(m => {
        const d = new Date(m.updated_at || m.created_at);
        trend[d.getDay()].qty += Number(m.produced_qty) || 0;
      });
      setWeeklyTrend(trend);

      // Work Center Utilization — aggregate active MOs per BOM operation
      const wcMap = {};
      mos.filter(m => m.status === 'in_progress' || m.status === 'released').forEach(m => {
        const center = m.bom?.components?.[0]?.operation || 'Assembly';
        if (!wcMap[center]) wcMap[center] = { active: 0, total: 0 };
        wcMap[center].active++;
        wcMap[center].total++;
      });
      mos.forEach(m => {
        const center = m.bom?.components?.[0]?.operation || 'Assembly';
        if (!wcMap[center]) wcMap[center] = { active: 0, total: 0 };
        wcMap[center].total++;
      });

      // If no MO data for WC, fall back to seeder-derived fixed centers
      const wcArray = Object.keys(wcMap).slice(0, 5).map((label, i) => ({
        label,
        val: wcMap[label].total > 0 ? Math.round((wcMap[label].active / wcMap[label].total) * 100) : 0,
        color: WC_COLORS[i % WC_COLORS.length]
      }));
      setWcUtil(wcArray.length > 0 ? wcArray : [
        { label: 'Assembly', val: 0, color: 'var(--color-primary)' },
        { label: 'Packaging', val: 0, color: 'var(--color-success)' }
      ]);

      // Top Products — rank by produced_qty
      const productMap = {};
      mos.filter(m => m.status === 'done').forEach(m => {
        const name = m.product?.name || 'Unknown';
        productMap[name] = (productMap[name] || 0) + (Number(m.produced_qty) || 0);
      });
      const sorted = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));
      setTopProducts(sorted);
    } catch (err) {
      console.error('Failed to load Mfg Dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const maxQty = Math.max(...weeklyTrend.map(d => d.qty), 1);
  const maxProd = topProducts[0]?.qty || 1;

  const kpiCards = [
    { icon: <Factory size={16}/>, cls: 'kpi-icon--primary', val: kpis.open, label: 'Open MOs', sub: 'Manufacturing Orders' },
    { icon: <Play size={16}/>, cls: 'kpi-icon--blue', val: kpis.inProgress, label: 'In Progress', sub: 'Active productions' },
    { icon: <CheckCircle size={16}/>, cls: 'kpi-icon--green', val: kpis.completed, label: 'Completed', sub: 'This month' },
    { icon: <AlertTriangle size={16}/>, cls: 'kpi-icon--error', val: kpis.delayed, label: 'Delayed', sub: 'Need attention 🔴' },
    { icon: <Target size={16}/>, cls: 'kpi-icon--green', val: kpis.todayOutput, label: "Today's Output", sub: 'Units produced' },
    { icon: <Activity size={16}/>, cls: 'kpi-icon--primary', val: `${kpis.completed > 0 ? Math.round((kpis.completed / Math.max(kpis.completed + kpis.delayed, 1)) * 100) : 0}%`, label: 'Efficiency', sub: 'Overall OEE' },
    { icon: <Clock size={16}/>, cls: 'kpi-icon--blue', val: kpis.open + kpis.inProgress, label: 'Active WOs', sub: 'Work Orders' },
    { icon: <Zap size={16}/>, cls: 'kpi-icon--green', val: wcUtil.filter(w => w.val > 0).length, label: 'Active Centers', sub: 'Work Centers' },
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
            <button className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }} onClick={loadData}>
              <RefreshCw size={14}/> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading Manufacturing Dashboard...</div>
          </div>
        ) : (
          <>
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
              {kpiCards.map((kpi, i) => (
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

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 'var(--space-6)' }}>
              {/* Weekly Production Trend */}
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3 className="admin-panel-title">Weekly Production Trend</h3>
                  <TrendingUp size={16} style={{ color: 'var(--color-secondary)' }} />
                </div>
                <div className="chart-container" style={{ height: '180px' }}>
                  {weeklyTrend.map((d, i) => (
                    <div key={i} className="chart-bar-group" style={{ width: '36px' }}>
                      <div className="chart-bar" data-value={`${d.qty} units`}
                        style={{ height: `${(d.qty / maxQty) * 100}%`, background: 'var(--color-primary)', width: '28px' }} />
                      <span className="chart-label">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Center Utilization */}
              <div className="admin-panel">
                <h3 className="admin-panel-title">Work Center Utilization</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                  {wcUtil.map((wc, i) => (
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

              {/* Top Products */}
              <div className="admin-panel">
                <h3 className="admin-panel-title">Top Products</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                  {topProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-secondary)', fontSize: '13px', padding: '20px 0' }}>No completed MOs yet</div>
                  ) : topProducts.map((p, i) => (
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
          </>
        )}
      </div>
    </AppShell>
  );
}
