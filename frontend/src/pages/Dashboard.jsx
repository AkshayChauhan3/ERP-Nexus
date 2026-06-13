import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Clock, Factory, AlertTriangle,
  ChevronRight, Package, Armchair, Sofa, Layers,
  CheckCircle, AlertCircle, Circle, Zap
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import './Dashboard.css';

/* ── KPI Data ── */
const KPI_CARDS = [
  {
    id: 'total-sales',
    label: 'Total Sales',
    value: '247',
    trend: '+12%',
    trendDir: 'up',
    badge: 'This Month',
    icon: TrendingUp,
    color: 'primary',
  },
  {
    id: 'pending-deliveries',
    label: 'Pending Deliveries',
    value: '18',
    badge: 'In Progress',
    icon: Clock,
    color: 'blue',
  },
  {
    id: 'active-mos',
    label: 'Active MOs',
    value: '9',
    badge: 'Stable',
    icon: Factory,
    color: 'green',
  },
  {
    id: 'low-stock',
    label: 'Low Stock',
    value: '5',
    badge: 'Critical',
    icon: AlertTriangle,
    color: 'error',
    accent: true,
  },
];

/* ── Risk Monitor ── */
const RISK_ITEMS = [
  { id: 'wooden-table', label: 'Wooden Table', material: 'Oak Material', level: 'High Risk', levelColor: 'error', icon: '🪵', stock: 12 },
  { id: 'office-chair', label: 'Office Chair', material: 'Foam & Steel', level: 'Low Risk', levelColor: 'success', icon: '🪑', stock: 48 },
  { id: 'bookshelf', label: 'Bookshelf', material: 'Plywood', level: 'Medium Risk', levelColor: 'warning', icon: '📚', stock: 24 },
  { id: 'dining-set', label: 'Dining Set', material: 'Teak Wood', level: 'High Risk', levelColor: 'error', icon: '🍽️', stock: 7 },
];

/* ── Production Floor ── */
const PRODUCTION_CENTERS = [
  { id: 'assembly', name: 'Assembly', status: 'Running', statusColor: 'success', progress: 72, units: '24 units/hr' },
  { id: 'painting', name: 'Painting', status: 'Delayed', statusColor: 'warning', progress: 45, units: '12 units/hr' },
  { id: 'packaging', name: 'Packaging', status: 'Waiting', statusColor: 'error', progress: 10, units: '0 units/hr' },
  { id: 'finishing', name: 'Finishing', status: 'Running', statusColor: 'success', progress: 88, units: '18 units/hr' },
];

/* ── AI Advisor ── */
const ADVISOR_CARDS = [
  {
    id: 'adv-1',
    priority: 'High Priority',
    priorityColor: 'error',
    title: 'Create PO for Wood Sheets',
    desc: 'Stock for oak material falls below safety threshold in 3 days. Immediate procurement needed.',
    action: 'Create PO',
  },
  {
    id: 'adv-2',
    priority: 'Medium',
    priorityColor: 'warning',
    title: 'Start MO for Dining Tables',
    desc: '4 confirmed orders pending production start. Assembly center has available capacity.',
    action: 'Start MO',
  },
  {
    id: 'adv-3',
    priority: 'Low',
    priorityColor: 'secondary',
    title: 'Review Overdue Deliveries',
    desc: '3 deliveries are past their expected date. Review and update delivery schedules.',
    action: 'View Orders',
  },
];

/* ── Gauge Component ── */
function BusinessGauge({ value = 87 }) {
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="gauge-wrapper">
      <svg className="gauge-svg" viewBox="0 0 200 200" width="200" height="200">
        {/* Track */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="var(--surface-high)"
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25,0.46,0.45,0.94)' }}
        />
        {/* Decorative ticks */}
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = (i / 32) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const inner = 64, outer = 72;
          return (
            <line
              key={i}
              x1={100 + inner * Math.cos(rad)}
              y1={100 + inner * Math.sin(rad)}
              x2={100 + outer * Math.cos(rad)}
              y2={100 + outer * Math.sin(rad)}
              stroke="var(--surface-high)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        {/* Center text */}
        <text x="100" y="95" textAnchor="middle" className="gauge-value-text">
          {value}
        </text>
        <text x="100" y="118" textAnchor="middle" className="gauge-label-text">
          /100
        </text>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="dashboard animate-page">
        {/* ── Section: Overview ── */}
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-greeting">Good morning, Alexander 👋</h2>
            <p className="dashboard-date">Saturday, 13 June 2026 — Operations Overview</p>
          </div>
          <button
            className="dashboard-new-order-btn btn-interactive"
            onClick={() => navigate('/new-sales-order')}
            id="btn-new-sales-order"
          >
            + New Sales Order
          </button>
        </div>

        {/* ── Row 1: KPI Cards ── */}
        <div className="kpi-grid">
          {KPI_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={card.id}
                className={`kpi-card animate-page stagger-${i + 1} ${card.accent ? 'kpi-card--accent' : ''}`}
              >
                <div className="kpi-card-top">
                  <div className={`kpi-icon kpi-icon--${card.color}`}>
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  {card.trend && (
                    <span className={`kpi-trend kpi-trend--${card.trendDir}`}>
                      <TrendingUp size={12} />
                      {card.trend}
                    </span>
                  )}
                </div>
                <div className="kpi-value">{card.value}</div>
                <div className="kpi-label">{card.label}</div>
                <span className={`kpi-badge kpi-badge--${card.color}`}>{card.badge}</span>
              </div>
            );
          })}
        </div>

        {/* ── Row 2: Dual panels ── */}
        <div className="dual-grid">
          {/* Risk Monitor */}
          <div className="panel animate-page stagger-2">
            <div className="panel-header">
              <h3 className="panel-title">Stock Risk Monitor</h3>
              <button className="panel-link">View all <ChevronRight size={14} /></button>
            </div>
            <div className="risk-list">
              {RISK_ITEMS.map(item => (
                <div key={item.id} id={`risk-${item.id}`} className="risk-item hover-row">
                  <div className="risk-icon-grid">
                    <span className="risk-emoji">{item.icon}</span>
                  </div>
                  <div className="risk-info">
                    <span className="risk-name">{item.label}</span>
                    <span className="risk-material">{item.material}</span>
                  </div>
                  <div className="risk-right">
                    <span className="risk-stock">{item.stock} units</span>
                    <span className={`badge badge--${item.levelColor}`}>{item.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Production Floor */}
          <div className="panel animate-page stagger-3">
            <div className="panel-header">
              <h3 className="panel-title">Production Floor</h3>
              <button className="panel-link">Live view <ChevronRight size={14} /></button>
            </div>
            <div className="production-list">
              {PRODUCTION_CENTERS.map(center => (
                <div key={center.id} id={`prod-${center.id}`} className="production-item">
                  <div className="production-item-header">
                    <div className="production-name-group">
                      <span className={`status-dot ${center.statusColor === 'success' ? 'pulse-dot' : ''}`}
                        style={{
                          background: center.statusColor === 'success' ? 'var(--color-success)'
                            : center.statusColor === 'warning' ? 'var(--color-amber)'
                            : 'var(--color-error)'
                        }}
                      />
                      <span className="production-name">{center.name}</span>
                    </div>
                    <div className="production-meta">
                      <span className="production-units">{center.units}</span>
                      <span className={`badge badge--${center.statusColor}`}>{center.status}</span>
                    </div>
                  </div>
                  <div className="production-bar-track">
                    <div
                      className="production-bar-fill"
                      style={{
                        width: `${center.progress}%`,
                        background: center.statusColor === 'success' ? 'var(--color-success)'
                          : center.statusColor === 'warning' ? 'var(--color-amber)'
                          : 'var(--color-error)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Business Health ── */}
        <div className="health-panel animate-page stagger-4">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Business Health Score</h3>
              <p className="panel-subtitle">Overall operational performance across all departments</p>
            </div>
          </div>
          <div className="health-content">
            <BusinessGauge value={87} />
            <div className="health-metrics">
              {[
                { label: 'Inventory Accuracy', value: 92, color: 'var(--color-success)' },
                { label: 'Delivery Performance', value: 78, color: 'var(--color-amber)' },
                { label: 'Manufacturing Efficiency', value: 85, color: 'var(--color-secondary)' },
                { label: 'Order Fulfillment Rate', value: 94, color: 'var(--color-success)' },
              ].map((m, i) => (
                <div key={m.label} className="health-metric">
                  <div className="health-metric-header">
                    <span className="health-metric-label">{m.label}</span>
                    <span className="health-metric-value">{m.value}%</span>
                  </div>
                  <div className="health-bar-track">
                    <div
                      className="health-bar-fill"
                      style={{ width: `${m.value}%`, background: m.color, transitionDelay: `${i * 0.15}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: AI Advisor ── */}
        <div className="advisor-section animate-page stagger-5">
          <div className="advisor-section-header">
            <div className="advisor-title-group">
              <div className="advisor-icon"><Zap size={16} strokeWidth={2} /></div>
              <div>
                <h3 className="panel-title">EN Advisor Recommendations</h3>
                <p className="panel-subtitle">AI-generated action items based on current data</p>
              </div>
            </div>
          </div>
          <div className="advisor-grid">
            {ADVISOR_CARDS.map((card, i) => (
              <div
                key={card.id}
                id={card.id}
                className={`advisor-card animate-page stagger-${i + 1} card-lift`}
              >
                <span className={`badge badge--${card.priorityColor} advisor-badge`}>{card.priority}</span>
                <h4 className="advisor-card-title">{card.title}</h4>
                <p className="advisor-card-desc">{card.desc}</p>
                <button className="advisor-action-btn btn-interactive">
                  {card.action}
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
