import { useState, useMemo } from 'react';
import {
  Factory, CheckCircle, Clock, AlertTriangle, Play,
  Bell, Search, BarChart2, Users, TrendingUp, Shield,
  Wrench, Package, Zap, ChevronRight, Filter,
  RefreshCw, Activity, Target, User
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import '../styles/AdminPages.css';
import '../styles/Manufacturing.css';

const SMART_ALERTS = [
  { id: 1, type: 'error',   icon: '🔴', label: 'Delayed Manufacturing Order',   desc: 'MO-3996 (Office Swivel Chair x15) is 2 days behind schedule.', time: '5 min ago',  roles: ['Owner / Admin', 'Floor Supervisor'] },
  { id: 2, type: 'error',   icon: '🔴', label: 'Critical Stock Shortage',        desc: 'Raw material "Foam Padding" below reorder level (5 units left).', time: '18 min ago', roles: ['Owner / Admin', 'Inventory Manager'] },
  { id: 3, type: 'warning', icon: '🟡', label: 'Work Center Low Efficiency',     desc: 'Painting Center running at 48% — below 60% target.', time: '1 hr ago',  roles: ['Owner / Admin', 'Floor Supervisor'] },
  { id: 4, type: 'warning', icon: '🟡', label: 'Large Production Order Queued',  desc: 'MO-4001 (Executive Chair x20) requires urgent raw material approval.', time: '2 hr ago', roles: ['Owner / Admin', 'Inventory Manager'] },
];

const KANBAN = {
  draft:       [{ id: 'MO-4001', item: 'Executive Chair x20', date: '2026-06-14', priority: 'high' }, { id: 'MO-4002', item: 'Oak Wood Desk x5', date: '2026-06-15', priority: 'medium' }],
  ready:       [{ id: 'MO-3998', item: 'Dining Table Set x3', date: '2026-06-13', priority: 'high' }],
  in_progress: [{ id: 'MO-3995', item: 'Comfort Cushion Sofa x8', center: 'Assembly', progress: 65 }, { id: 'MO-3996', item: 'Office Swivel Chair x15', center: 'Painting', progress: 30, delayed: true }],
  completed:   [{ id: 'MO-3990', item: 'Wooden Bookshelf x12', date: '2026-06-12' }, { id: 'MO-3989', item: 'Study Table x6', date: '2026-06-11' }],
};

const PRODUCTION_TREND = [
  { month: 'Jan', planned: 80, produced: 78 },
  { month: 'Feb', planned: 90, produced: 88 },
  { month: 'Mar', planned: 75, produced: 72 },
  { month: 'Apr', planned: 100, produced: 96 },
  { month: 'May', planned: 85, produced: 84 },
  { month: 'Jun', planned: 110, produced: 102 },
];

const WORK_CENTERS = [
  { label: 'Assembly',  value: 85, color: 'var(--color-primary)' },
  { label: 'Painting',  value: 48, color: 'var(--color-amber)' },
  { label: 'Packaging', value: 72, color: 'var(--color-success)' },
];

const MATERIALS = [
  { id: 'MAT-001', name: 'Foam Padding',       stock: 5,   reorder: 20,  unit: 'pcs',   status: 'critical', vendor: 'FoamTech Pvt Ltd' },
  { id: 'MAT-002', name: 'Oak Wood Planks',    stock: 85,  reorder: 30,  unit: 'pcs',   status: 'ok',       vendor: 'WoodCraft Suppliers' },
  { id: 'MAT-003', name: 'Steel Bolts M8',     stock: 18,  reorder: 50,  unit: 'pcs',   status: 'low',      vendor: 'FastenPro Industries' },
  { id: 'MAT-004', name: 'Wood Varnish 1L',    stock: 12,  reorder: 10,  unit: 'cans',  status: 'ok',       vendor: 'CoatMaster Co.' },
  { id: 'MAT-005', name: 'Fabric Roll (Grey)', stock: 3,   reorder: 15,  unit: 'rolls', status: 'critical', vendor: 'TextilePro India' },
  { id: 'MAT-006', name: 'Packaging Boxes',    stock: 200, reorder: 100, unit: 'pcs',   status: 'ok',       vendor: 'PackSmart Ltd' },
];

const PROCUREMENT_REQUESTS = [
  { id: 'PR-0091', material: 'Foam Padding',       qty: 50,  moId: 'MO-3995', status: 'Pending',  urgency: 'high' },
  { id: 'PR-0092', material: 'Fabric Roll (Grey)', qty: 20,  moId: 'MO-4001', status: 'Pending',  urgency: 'high' },
  { id: 'PR-0093', material: 'Steel Bolts M8',     qty: 100, moId: 'MO-3998', status: 'Approved', urgency: 'medium' },
];

const AUDIT_TIMELINE = [
  { id: 'a1', time: '17:30', user: 'Rahul K.  (Floor Supervisor)', action: 'Updated MO-3995 progress to 65%', module: 'Manufacturing', icon: '🔧' },
  { id: 'a2', time: '16:15', user: 'Priya M. (Inventory Manager)', action: 'Approved raw material request for MO-4001', module: 'Inventory', icon: '📦' },
  { id: 'a3', time: '14:00', user: 'Admin (Alexander Sterling)',    action: 'Created Manufacturing Order MO-4002', module: 'Manufacturing', icon: '➕' },
  { id: 'a4', time: '11:45', user: 'Rahul K. (Floor Supervisor)',  action: 'Marked MO-3990 as Completed', module: 'Manufacturing', icon: '✅' },
  { id: 'a5', time: '09:20', user: 'Owner (John Owner)',           action: 'Reviewed production report for May 2026', module: 'Reports', icon: '📊' },
];

const ALL_ITEMS = [
  { type: 'MO', id: 'MO-4001', name: 'Executive Chair x20', status: 'Draft' },
  { type: 'MO', id: 'MO-4002', name: 'Oak Wood Desk x5', status: 'Draft' },
  { type: 'MO', id: 'MO-3998', name: 'Dining Table Set x3', status: 'Ready' },
  { type: 'MO', id: 'MO-3995', name: 'Comfort Cushion Sofa x8', status: 'In Progress' },
  { type: 'MO', id: 'MO-3996', name: 'Office Swivel Chair x15', status: 'Delayed' },
  { type: 'MO', id: 'MO-3990', name: 'Wooden Bookshelf x12', status: 'Completed' },
  { type: 'Material', id: 'MAT-001', name: 'Foam Padding', status: 'Low Stock' },
  { type: 'Material', id: 'MAT-002', name: 'Oak Wood Planks', status: 'In Stock' },
  { type: 'Center',   id: 'WC-01', name: 'Assembly Center', status: '85% Utilization' },
  { type: 'Center',   id: 'WC-02', name: 'Painting Center', status: '48% Utilization' },
];

const ROLE_VIEWS = ['Owner / Admin', 'Floor Supervisor', 'Inventory Manager'];

const ROLE_META = {
  'Owner / Admin':     { icon: '👑', color: 'var(--color-primary)', desc: 'Full access — KPIs, analytics, pipeline, materials & audit trail.' },
  'Floor Supervisor':  { icon: '🔧', color: 'var(--color-amber)',   desc: 'Production focus — active orders, work centers & progress tracking.' },
  'Inventory Manager': { icon: '📦', color: 'var(--color-success)', desc: 'Materials focus — stock levels, procurement requests & reorder alerts.' },
};

const maxProduced = Math.max(...PRODUCTION_TREND.map(d => d.planned));

export default function ManufacturingMonitor() {
  const [activeAlerts, setActiveAlerts] = useState(SMART_ALERTS);
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeRole, setActiveRole]     = useState('Owner / Admin');
  const [activeTab, setActiveTab]       = useState('dashboard');

  const dismissAlert = (id) => setActiveAlerts(prev => prev.filter(a => a.id !== id));

  const visibleAlerts = activeAlerts.filter(a => a.roles.includes(activeRole));

  const tabsForRole = {
    'Owner / Admin':     ['dashboard', 'pipeline', 'analytics', 'audit'],
    'Floor Supervisor':  ['pipeline', 'analytics'],
    'Inventory Manager': ['materials', 'procurement'],
  };

  const allTabs = [
    { key: 'dashboard',   icon: <Activity size={14}/>,  label: 'Executive Dashboard' },
    { key: 'pipeline',    icon: <Factory size={14}/>,   label: 'Production Pipeline' },
    { key: 'analytics',   icon: <BarChart2 size={14}/>, label: 'Visual Analytics' },
    { key: 'materials',   icon: <Package size={14}/>,   label: 'Materials Stock' },
    { key: 'procurement', icon: <Wrench size={14}/>,    label: 'Procurement Requests' },
    { key: 'audit',       icon: <Shield size={14}/>,    label: 'Audit Timeline' },
  ];

  const visibleTabs = allTabs.filter(t => tabsForRole[activeRole].includes(t.key));

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setActiveTab(tabsForRole[role][0]);
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_ITEMS.filter(item =>
      item.id.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title">
              <Factory size={22} style={{ color: 'var(--color-primary)' }} />
              Manufacturing Monitor
            </h2>
            <p className="mfg-page-sub">Real-time production insights for decision-makers</p>
          </div>
          <div className="mfg-search-wrap">
            <Search size={15} className="mfg-search-icon" />
            <input
              id="mfg-global-search"
              className="mfg-search-input"
              placeholder="Search orders, materials, work centers…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="mfg-search-dropdown">
                {searchResults.map(r => (
                  <div key={r.id} className="mfg-search-result">
                    <span className="mfg-search-result-type">{r.type}</span>
                    <span className="mfg-search-result-id">{r.id}</span>
                    <span className="mfg-search-result-name">{r.name}</span>
                    <span className={`admin-badge admin-badge--${
                      r.status === 'Completed' ? 'success' :
                      r.status === 'In Progress' ? 'info' :
                      r.status === 'Delayed' || r.status === 'Low Stock' ? 'error' : 'warning'
                    }`} style={{ fontSize: '10px', padding: '1px 7px' }}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mfg-role-switcher">
            <Users size={13} style={{ color: 'var(--color-secondary)' }} />
            {ROLE_VIEWS.map(role => (
              <button
                key={role}
                id={`role-btn-${role.replace(/[^a-z]/gi,'').toLowerCase()}`}
                onClick={() => handleRoleChange(role)}
                className={`mfg-role-btn ${activeRole === role ? 'mfg-role-btn--active' : ''}`}
              >
                {ROLE_META[role].icon} {role}
              </button>
            ))}
          </div>
        </div>

        <div className="mfg-role-banner" style={{ borderLeft: `3px solid ${ROLE_META[activeRole].color}` }}>
          <span className="mfg-role-banner-icon">{ROLE_META[activeRole].icon}</span>
          <div>
            <span className="mfg-role-banner-label">Viewing as: <strong>{activeRole}</strong></span>
            <span className="mfg-role-banner-desc">{ROLE_META[activeRole].desc}</span>
          </div>
        </div>

        {visibleAlerts.length > 0 && (
          <div className="mfg-alerts-bar">
            <div className="mfg-alerts-title">
              <Bell size={14} />
              Smart Alerts
              <span className="mfg-alerts-count">{visibleAlerts.length}</span>
            </div>
            <div className="mfg-alerts-list">
              {visibleAlerts.map(alert => (
                <div key={alert.id} className={`mfg-alert mfg-alert--${alert.type}`}>
                  <span className="mfg-alert-icon">{alert.icon}</span>
                  <div className="mfg-alert-body">
                    <span className="mfg-alert-label">{alert.label}</span>
                    <span className="mfg-alert-desc">{alert.desc}</span>
                  </div>
                  <span className="mfg-alert-time">{alert.time}</span>
                  <button
                    className="mfg-alert-dismiss"
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mfg-tabs">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              id={`mfg-tab-${tab.key}`}
              className={`mfg-tab ${activeTab === tab.key ? 'mfg-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="mfg-section">
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 0 }}>
              {[
                { icon: <Factory size={16}/>,       cls: 'kpi-icon--primary', val: '3',     label: 'Active MOs',    sub: 'Manufacturing Orders' },
                { icon: <CheckCircle size={16}/>,   cls: 'kpi-icon--green',   val: '48',    label: 'Completed MOs', sub: 'This Month' },
                { icon: <AlertTriangle size={16}/>, cls: 'kpi-icon--error',   val: '1',     label: 'Delayed MOs',   sub: 'Needs Attention 🔴' },
                { icon: <Clock size={16}/>,         cls: 'kpi-icon--blue',    val: '4',     label: 'Pending WOs',   sub: 'Work Orders' },
                { icon: <Target size={16}/>,        cls: 'kpi-icon--green',   val: '98.2%', label: 'Efficiency',    sub: 'Overall OEE' },
              ].map((kpi, i) => (
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
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
              <div className="admin-panel">
                <h3 className="admin-panel-title">Manufacturing Efficiency</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', flex: 1 }}>
                  {[
                    { label: 'Planned Quantity',  value: '450 units' },
                    { label: 'Produced Quantity', value: '442 units' },
                    { label: 'Scrap Quantity',    value: '8 units (1.7%)', color: 'var(--color-error)' },
                    { label: 'Total Efficiency',  value: '98.2%', color: 'var(--color-success)', highlight: true },
                  ].map((metric, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px dashed var(--color-outline-variant)' : 'none' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>{metric.label}</span>
                      <span style={{ fontSize: metric.highlight ? '20px' : '14px', fontWeight: 700, color: metric.color || 'var(--color-primary)' }}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-panel">
                <h3 className="admin-panel-title">Work Center Utilization</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flex: 1, padding: '12px 0' }}>
                  {WORK_CENTERS.map((wc, i) => {
                    const radius = 33; const stroke = 6;
                    const circ = 2 * Math.PI * radius;
                    const offset = circ - (wc.value / 100) * circ;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', width: '74px', height: '74px' }}>
                          <svg className="utilization-ring-svg" width="74" height="74" viewBox="0 0 74 74">
                            <circle cx="37" cy="37" r={radius} fill="none" stroke="var(--surface-high)" strokeWidth={stroke} />
                            <circle cx="37" cy="37" r={radius} fill="none" stroke={wc.color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                          </svg>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>{wc.value}%</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary)', textAlign: 'center' }}>{wc.label}</span>
                        {wc.value < 60 && <span className="admin-badge admin-badge--error" style={{ fontSize: '9px', padding: '1px 6px' }}>Low</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="mfg-section">
            {activeRole === 'Floor Supervisor' && (
              <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
                {[
                  { icon: <Play size={16}/>,          cls: 'kpi-icon--primary', val: '2',   label: 'In Progress',  sub: 'Active Work Orders' },
                  { icon: <AlertTriangle size={16}/>,  cls: 'kpi-icon--error',  val: '1',   label: 'Delayed',      sub: 'Needs Escalation' },
                  { icon: <Clock size={16}/>,          cls: 'kpi-icon--blue',   val: '3',   label: 'Queued',       sub: 'Awaiting Start' },
                  { icon: <Target size={16}/>,         cls: 'kpi-icon--green',  val: '48%', label: 'Paint Center', sub: 'Below 60% Target ⚠️' },
                ].map((kpi, i) => (
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
            )}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3 className="admin-panel-title">Manufacturing Pipeline — Kanban View</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} /> Live
                </span>
              </div>
              <div className="kanban-board">
                {activeRole !== 'Floor Supervisor' && (
                  <div className="kanban-column">
                    <div className="kanban-column-header">
                      <span className="kanban-column-title">Draft</span>
                      <span className="kanban-column-count">{KANBAN.draft.length}</span>
                    </div>
                    {KANBAN.draft.map(card => (
                      <div key={card.id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                          <span>{card.id}</span>
                          <span className={`admin-badge admin-badge--${card.priority === 'high' ? 'error' : 'warning'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>{card.priority}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{card.item}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-secondary)' }}>Planned: {card.date}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title">Ready</span>
                    <span className="kanban-column-count">{KANBAN.ready.length}</span>
                  </div>
                  {KANBAN.ready.map(card => (
                    <div key={card.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        <span>{card.id}</span>
                        <span className="admin-badge admin-badge--warning" style={{ fontSize: '9px', padding: '1px 6px' }}>Queued</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{card.item}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-secondary)' }}>Queued: {card.date}</div>
                    </div>
                  ))}
                </div>
                <div className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title">In Progress</span>
                    <span className="kanban-column-count">{KANBAN.in_progress.length}</span>
                  </div>
                  {KANBAN.in_progress.map(card => (
                    <div key={card.id} className={`kanban-card ${card.delayed ? 'kanban-card--delayed' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        <span>{card.id}</span>
                        {card.delayed
                          ? <span className="admin-badge admin-badge--error" style={{ fontSize: '9px', padding: '1px 6px' }}>🔴 Delayed</span>
                          : <span className="admin-badge admin-badge--info" style={{ fontSize: '9px', padding: '1px 6px', background: 'var(--color-blue-container)', color: 'var(--color-blue)' }}>{card.progress}%</span>
                        }
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{card.item}</div>
                      <div className="mfg-progress-track">
                        <div className="mfg-progress-fill" style={{ width: `${card.progress}%`, background: card.delayed ? 'var(--color-error)' : 'var(--color-primary)' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Play size={9} /> {card.center} Center
                      </div>
                    </div>
                  ))}
                </div>
                <div className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title">Completed</span>
                    <span className="kanban-column-count">{KANBAN.completed.length}</span>
                  </div>
                  {KANBAN.completed.map(card => (
                    <div key={card.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        <span>{card.id}</span>
                        <span className="admin-badge admin-badge--success" style={{ fontSize: '9px', padding: '1px 6px' }}>Done</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{card.item}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 600 }}>✓ Finished: {card.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {activeRole === 'Floor Supervisor' && (
              <div className="admin-panel">
                <h3 className="admin-panel-title">Work Center Utilization</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                  {WORK_CENTERS.map((wc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '130px', fontSize: '12px', color: 'var(--color-secondary)', flexShrink: 0 }}>{wc.label}</span>
                      <div style={{ flex: 1, height: '14px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${wc.value}%`, background: wc.color, borderRadius: 'var(--radius-full)', transition: 'width 0.8s var(--ease-out)' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '38px', textAlign: 'right', color: wc.color }}>{wc.value}%</span>
                      {wc.value < 60 && <span className="admin-badge admin-badge--error" style={{ fontSize: '9px', padding: '1px 7px' }}>Low ⚠️</span>}
                      {wc.value >= 80 && <span className="admin-badge admin-badge--success" style={{ fontSize: '9px', padding: '1px 7px' }}>Optimal</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="mfg-section">
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3 className="admin-panel-title">Monthly Production Trend</h3>
                  <TrendingUp size={16} style={{ color: 'var(--color-secondary)' }} />
                </div>
                <div className="chart-container" style={{ height: '220px', gap: '4px' }}>
                  {PRODUCTION_TREND.map((d, i) => (
                    <div key={i} className="chart-bar-group" style={{ width: '52px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', flex: 1, justifyContent: 'center' }}>
                        <div className="chart-bar" data-value={`Planned: ${d.planned}`} style={{ height: `${(d.planned / maxProduced) * 100}%`, background: 'var(--color-outline-variant)', width: '16px' }} />
                        <div className="chart-bar" data-value={`Produced: ${d.produced}`} style={{ height: `${(d.produced / maxProduced) * 100}%`, background: 'var(--color-primary)', width: '16px' }} />
                      </div>
                      <span className="chart-label">{d.month}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--color-outline-variant)' }} /> Planned
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-secondary)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--color-primary)' }} /> Produced
                  </div>
                </div>
              </div>
              <div className="admin-panel">
                <h3 className="admin-panel-title">Production Status Split</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '20px' }}>
                  <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                    <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                      {(() => {
                        const segments = [
                          { label: 'Completed', val: 48, color: 'var(--color-success)' },
                          { label: 'In Progress', val: 3, color: 'var(--color-primary)' },
                          { label: 'Delayed', val: 1, color: 'var(--color-error)' },
                          { label: 'Draft/Ready', val: 3, color: 'var(--color-amber)' },
                        ];
                        const total = segments.reduce((s, x) => s + x.val, 0);
                        const r = 55; const circ = 2 * Math.PI * r;
                        let offset = 0;
                        return segments.map((seg, i) => {
                          const dash = (seg.val / total) * circ;
                          const gap  = circ - dash;
                          const el = <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={seg.color} strokeWidth="18" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} />;
                          offset += dash;
                          return el;
                        });
                      })()}
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800 }}>55</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-secondary)' }}>Total MOs</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                    {[
                      { label: 'Completed',   val: '48', color: 'var(--color-success)' },
                      { label: 'In Progress', val: '3',  color: 'var(--color-primary)' },
                      { label: 'Delayed',     val: '1',  color: 'var(--color-error)' },
                      { label: 'Draft/Ready', val: '3',  color: 'var(--color-amber)' },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-secondary)' }}>{s.label}</span>
                        <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-panel">
              <h3 className="admin-panel-title">Work Center Utilization — Bar View</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {WORK_CENTERS.map((wc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '130px', fontSize: '12px', color: 'var(--color-secondary)', flexShrink: 0 }}>{wc.label}</span>
                    <div style={{ flex: 1, height: '14px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${wc.value}%`, background: wc.color, borderRadius: 'var(--radius-full)', transition: 'width 0.8s var(--ease-out)' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '38px', textAlign: 'right', color: wc.color }}>{wc.value}%</span>
                    {wc.value < 60 && <span className="admin-badge admin-badge--error" style={{ fontSize: '9px', padding: '1px 7px' }}>Low</span>}
                    {wc.value >= 80 && <span className="admin-badge admin-badge--success" style={{ fontSize: '9px', padding: '1px 7px' }}>Optimal</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="mfg-section">
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
              {[
                { icon: <Package size={16}/>,       cls: 'kpi-icon--primary', val: '6', label: 'Total Materials', sub: 'Tracked Items' },
                { icon: <AlertTriangle size={16}/>,  cls: 'kpi-icon--error',  val: '2', label: 'Critical Stock',  sub: 'Immediate Reorder' },
                { icon: <Zap size={16}/>,            cls: 'kpi-icon--blue',   val: '1', label: 'Low Stock',       sub: 'Monitor Closely' },
              ].map((kpi, i) => (
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
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3 className="admin-panel-title">Raw Material Stock Levels</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Updated live from inventory</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Material ID</th>
                      <th>Name</th>
                      <th>On Hand</th>
                      <th>Reorder Level</th>
                      <th>Unit</th>
                      <th>Vendor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATERIALS.map(mat => (
                      <tr key={mat.id}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-secondary)' }}>{mat.id}</span></td>
                        <td style={{ fontWeight: 600 }}>{mat.name}</td>
                        <td style={{ fontWeight: 700, color: mat.status === 'critical' ? 'var(--color-error)' : mat.status === 'low' ? 'var(--color-amber)' : 'var(--color-success)' }}>
                          {mat.stock} {mat.unit}
                        </td>
                        <td style={{ color: 'var(--color-secondary)', fontSize: '12px' }}>{mat.reorder} {mat.unit}</td>
                        <td style={{ color: 'var(--color-secondary)', fontSize: '12px' }}>{mat.unit}</td>
                        <td style={{ fontSize: '12px' }}>{mat.vendor}</td>
                        <td>
                          <span className={`admin-badge admin-badge--${mat.status === 'critical' ? 'error' : mat.status === 'low' ? 'warning' : 'success'}`}>
                            {mat.status === 'critical' ? '🔴 Critical' : mat.status === 'low' ? '🟡 Low' : '🟢 OK'}
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

        {activeTab === 'procurement' && (
          <div className="mfg-section">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3 className="admin-panel-title">Pending Procurement Requests</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Raised by Floor Supervisors</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PROCUREMENT_REQUESTS.map(req => (
                  <div key={req.id} className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '16px', background: 'var(--color-bg-tertiary)' }}>
                    <div style={{ minWidth: '80px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-secondary)' }}>{req.id}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-secondary)' }}>{req.moId}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{req.material}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Qty required: <strong style={{ color: 'var(--color-primary)' }}>{req.qty} units</strong></div>
                    </div>
                    <span className={`admin-badge admin-badge--${req.urgency === 'high' ? 'error' : 'warning'}`}>
                      {req.urgency === 'high' ? '🔴 Urgent' : '🟡 Medium'}
                    </span>
                    <span className={`admin-badge admin-badge--${req.status === 'Approved' ? 'success' : 'warning'}`}>
                      {req.status}
                    </span>
                    {req.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="admin-btn admin-btn--primary" style={{ padding: '6px 14px', fontSize: '12px' }}>Approve</button>
                        <button className="admin-btn admin-btn--ghost" style={{ padding: '6px 14px', fontSize: '12px' }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="mfg-section">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3 className="admin-panel-title">Audit Timeline — Today</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Full accountability trail</span>
              </div>
              <div className="mfg-timeline">
                {AUDIT_TIMELINE.map((entry, i) => (
                  <div key={entry.id} className="mfg-timeline-item">
                    <div className="mfg-timeline-dot">
                      <span style={{ fontSize: '16px' }}>{entry.icon}</span>
                    </div>
                    {i < AUDIT_TIMELINE.length - 1 && <div className="mfg-timeline-line" />}
                    <div className="mfg-timeline-content">
                      <div className="mfg-timeline-action">{entry.action}</div>
                      <div className="mfg-timeline-meta">
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{entry.user}</span>
                        <span className="admin-badge admin-badge--info" style={{ fontSize: '9px', padding: '1px 7px' }}>{entry.module}</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--color-secondary)', fontSize: '11px' }}>{entry.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mfg-audit-note">
                <Shield size={13} />
                All actions are permanently logged and tamper-proof. Only admins and owners can access this trail.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
