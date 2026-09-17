import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Clock, Factory, AlertTriangle,
  ChevronRight, Package, Armchair, Sofa, Layers,
  CheckCircle, AlertCircle, Circle, Zap, RefreshCw,
  ShoppingBag, Warehouse, ClipboardList, Users, Info,
  ArrowRight, ExternalLink, CheckCircle2, X
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { api } from '../utils/api';
import './Dashboard.css';

const ROLE_LABELS = {
  admin: 'Admin',
  sales: 'Sales User',
  purchase: 'Purchase User',
  manufacturing: 'Manufacturing User',
  inventory: 'Inventory Manager',
  owner: 'Business Owner',
};

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

const ADMIN_KPI_CARDS = [
  {
    id: 'total-products',
    label: 'Total Products',
    value: '184',
    icon: Package,
    color: 'primary',
    trend: '+8%',
    trendDir: 'up',
    badge: 'Active',
  },
  {
    id: 'total-sales',
    label: 'Total Sales Orders',
    value: '247',
    icon: TrendingUp,
    color: 'primary',
    trend: '+12%',
    trendDir: 'up',
    badge: 'This Month',
  },
  {
    id: 'total-purchases',
    label: 'Total Purchase Orders',
    value: '36',
    icon: ShoppingBag,
    color: 'blue',
    badge: 'Open',
  },
  {
    id: 'active-mos',
    label: 'Active MOs',
    value: '12',
    icon: Factory,
    color: 'green',
    badge: 'Running',
  },
  {
    id: 'inventory-value',
    label: 'Total Inventory Value',
    value: '₹4,52,800',
    icon: Warehouse,
    color: 'primary',
    badge: 'Audited',
  },
  {
    id: 'low-stock',
    label: 'Low Stock Items',
    value: '7',
    icon: AlertTriangle,
    color: 'error',
    accent: true,
    badge: 'Critical',
  },
  {
    id: 'pending-deliveries',
    label: 'Pending Deliveries',
    value: '18',
    icon: Clock,
    color: 'blue',
    badge: 'In Progress',
  },
  {
    id: 'delayed-orders',
    label: 'Delayed Orders',
    value: '4',
    icon: AlertCircle,
    color: 'error',
    accent: true,
    badge: 'Overdue',
  },
  {
    id: 'procurement-requests',
    label: 'Open Procurement Requests',
    value: '9',
    icon: ClipboardList,
    color: 'blue',
    badge: 'Pending Approval',
  },
  {
    id: 'finished-goods',
    label: 'Finished Goods Stock',
    value: '3,420',
    icon: Sofa,
    color: 'green',
    badge: 'Units',
  },
  {
    id: 'raw-materials',
    label: 'Raw Material Stock',
    value: '8,950',
    icon: Layers,
    color: 'primary',
    badge: 'Units',
  },
  {
    id: 'active-users',
    label: 'Active Users',
    value: '18',
    icon: Users,
    color: 'green',
    badge: 'Online',
  },
];

const RISK_ITEMS = [
  { id: 'wooden-table', label: 'Wooden Table', material: 'Oak Material', level: 'High Risk', levelColor: 'error', icon: '🪵', stock: 12 },
  { id: 'office-chair', label: 'Office Chair', material: 'Foam & Steel', level: 'Low Risk', levelColor: 'success', icon: '🪑', stock: 48 },
  { id: 'bookshelf', label: 'Bookshelf', material: 'Plywood', level: 'Medium Risk', levelColor: 'warning', icon: '📚', stock: 24 },
  { id: 'dining-set', label: 'Dining Set', material: 'Teak Wood', level: 'High Risk', levelColor: 'error', icon: '🍽️', stock: 7 },
];

const PRODUCTION_CENTERS = [
  { id: 'assembly', name: 'Assembly', status: 'Running', statusColor: 'success', progress: 72, units: '24 units/hr' },
  { id: 'painting', name: 'Painting', status: 'Delayed', statusColor: 'warning', progress: 45, units: '12 units/hr' },
  { id: 'packaging', name: 'Packaging', status: 'Waiting', statusColor: 'error', progress: 10, units: '0 units/hr' },
  { id: 'finishing', name: 'Finishing', status: 'Running', statusColor: 'success', progress: 88, units: '18 units/hr' },
];

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

function BusinessGauge({ value = 87 }) {
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="gauge-wrapper">
      <svg className="gauge-svg" viewBox="0 0 200 200" width="200" height="200">
        {}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="var(--surface-high)"
          strokeWidth={stroke}
        />
        {}
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
        {}
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
        {}
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
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const [user, setUser] = useState({ name: 'Alexander Sterling', role: 'admin' });

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'error',
      category: 'Critical',
      title: 'Low Stock: Oak Wood Sheets',
      text: 'Low Stock: Oak Wood Sheets falls below safety threshold (12 units remaining).',
      time: '10 mins ago',
      actionText: 'Inspect Inventory',
      path: '/inventory',
      impact: 'Risk of stopping 4 scheduled dining table manufacturing orders.',
      steps: [
        'Check existing safety stock and minimum threshold in Inventory Monitor.',
        'Create an urgent Purchase Order or transfer stock from central warehouse.',
        'Notify the production supervisor of the supply bottleneck.'
      ]
    },
    {
      id: 2,
      type: 'error',
      category: 'Critical',
      title: 'Delayed Delivery: Sales Order #1048',
      text: 'Delayed Delivery: Sales Order #1048 for Sterling Offices is 2 days overdue.',
      time: '1 hour ago',
      actionText: 'View Sales Order',
      path: '/sales',
      impact: 'Customer satisfaction risk and possible contractual delivery penalty.',
      steps: [
        'Review current stage and shipping status in Sales Monitor.',
        'Expedite carrier dispatch or assign dedicated delivery vehicle.',
        'Contact customer with updated tracking ETA.'
      ]
    },
    {
      id: 3,
      type: 'warning',
      category: 'Warning',
      title: 'Vendor Delay: PO #3029',
      text: 'Vendor Delay: PO #3029 for Steel Screws has not been confirmed by vendor.',
      time: '2 hours ago',
      actionText: 'Manage Purchase Order',
      path: '/purchase',
      impact: 'Hardware assembly line might experience component starvation.',
      steps: [
        'Contact vendor directly to request order acknowledgment.',
        'Verify delivery commitment or request alternate vendor supply.',
        'Update PO status in Purchase module.'
      ]
    },
    {
      id: 4,
      type: 'warning',
      category: 'Warning',
      title: 'Delayed MO: Manufacturing Order #2041',
      text: 'Delayed MO: Manufacturing Order #2041 is delayed at Painting center.',
      time: '4 hours ago',
      actionText: 'Inspect MO',
      path: '/manufacturing',
      impact: 'Subsequent finishing and packaging stages are on hold.',
      steps: [
        'Check work center capacity and bottleneck status in Manufacturing Monitor.',
        'Reallocate paint booth technicians or adjust queue priority.',
        'Update work order completion estimate.'
      ]
    },
    {
      id: 5,
      type: 'blue',
      category: 'Info',
      title: 'Procurement Demands Pending',
      text: 'Procurement Pending: 3 raw material demands are pending approval.',
      time: 'Today',
      actionText: 'Review Demands',
      path: '/procurement',
      impact: 'Materials cannot be ordered until authorized by administrator.',
      steps: [
        'Review demand line items against monthly budget.',
        'Approve or modify requested quantities.',
        'Auto-generate Purchase Orders for approved suppliers.'
      ]
    }
  ]);

  const [selectedAlert, setSelectedAlert] = useState(null);

  const getAlertDestination = (alert) => {
    if (user.role === 'owner') {
      if (alert.path === '/inventory') return '/owner/inventory';
      if (alert.path === '/sales') return '/owner/sales';
      if (alert.path === '/purchase') return '/owner/purchase';
      if (alert.path === '/manufacturing') return '/owner/manufacturing';
      if (alert.path === '/procurement') return '/owner/approvals';
    }
    return alert.path;
  };

  const handleWorkOnAlert = (alert) => {
    const dest = getAlertDestination(alert);
    if (dest) {
      navigate(dest);
    }
  };

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
    if (selectedAlert?.id === id) {
      setSelectedAlert(null);
    }
  };

  useEffect(() => {
    if (!selectedAlert) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedAlert(null);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAlert]);

  useEffect(() => {
    const updateUserData = () => {
      const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
      if (authData?.user) {
        setUser(authData.user);
      }
    };
    updateUserData();
    window.addEventListener('storage', updateUserData);
    return () => window.removeEventListener('storage', updateUserData);
  }, []);

  useEffect(() => {
    if (user.role === 'admin') {
      loadPendingUsers();
    }
  }, [user.role]);

  const loadPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const data = await api.get('/users/pending');
      setPendingUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load pending users:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.post(`/users/${userId}/approve`);
      loadPendingUsers();
    } catch (err) {
      alert(err.message || 'Failed to approve user.');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/users/${userId}/reject`);
      loadPendingUsers();
    } catch (err) {
      alert(err.message || 'Failed to reject user.');
    }
  };

  return (
    <AppShell>
      <div className="dashboard animate-page">
        {}
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-greeting">Good morning, {user.name.trim().split(/\s+/)[0]} 👋</h2>
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

        {}
        {user.role === 'admin' && (
          <div className="panel animate-page stagger-1" style={{ marginBottom: 'var(--space-6)', backdropFilter: 'blur(20px)' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="panel-title">Pending Access Approvals</h3>
                <p className="panel-subtitle" style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                  Review and approve new user signups for ERP Nexus
                </p>
              </div>
              <span className="badge badge--warning" style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px', fontWeight: 600 }}>
                {pendingUsers.length} Requests
              </span>
            </div>
            
            <div style={{ height: '1px', background: 'var(--color-outline-variant)', margin: '16px 0' }} />
            
            {loadingPending ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={24} className="spin" />
                <span>Loading registration requests…</span>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontWeight: 500 }}>No pending user requests. All caught up!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingUsers.map(pUser => (
                  <div 
                    key={pUser.id} 
                    className="hover-row" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px', 
                      background: 'var(--surface-low)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-outline-variant)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '15px' }}>{pUser.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                        {pUser.email} • Requested: <strong style={{ color: 'var(--color-primary)' }}>{ROLE_LABELS[pUser.role] || pUser.role}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)', opacity: 0.6, marginTop: '4px' }}>
                        Requested on: {new Date(pUser.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleApprove(pUser.id)}
                        className="btn-interactive"
                        style={{ 
                          background: 'var(--color-success)', 
                          color: 'var(--color-on-primary)', 
                          border: 'none', 
                          borderRadius: 'var(--radius-full)', 
                          padding: '8px 18px', 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(pUser.id)}
                        className="btn-interactive"
                        style={{ 
                          background: 'transparent', 
                          color: 'var(--color-error)', 
                          border: '1px solid var(--color-error)', 
                          borderRadius: 'var(--radius-full)', 
                          padding: '7px 18px', 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {(user.role === 'admin' || user.role === 'owner') && alerts.length > 0 && (
          <div className="panel animate-page stagger-1" style={{ marginBottom: 'var(--space-6)', backdropFilter: 'blur(20px)' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="panel-title">System Alerts</h3>
                <p className="panel-subtitle" style={{ fontSize: '13px', color: 'var(--color-secondary)', marginTop: '2px' }}>
                  Critical operational exceptions requiring attention
                </p>
              </div>
              <button 
                onClick={() => setAlerts([])} 
                className="panel-link"
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                Clear All
              </button>
            </div>
            
            <div style={{ height: '1px', background: 'var(--color-outline-variant)', margin: '16px 0' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map(alert => {
                const accentColor = alert.type === 'error' ? 'var(--color-error)' : alert.type === 'warning' ? 'var(--color-warning-light, #f59e0b)' : 'var(--color-secondary)';
                return (
                  <div 
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 16px', 
                      background: alert.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : alert.type === 'warning' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${accentColor}`,
                      borderTop: '1px solid var(--color-outline-variant)',
                      borderRight: '1px solid var(--color-outline-variant)',
                      borderBottom: '1px solid var(--color-outline-variant)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Click to view details and resolution steps"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, marginRight: '16px' }}>
                      <div style={{
                        color: accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0
                      }}>
                        {alert.type === 'error' ? <AlertCircle size={18} /> : alert.type === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: accentColor, marginRight: '8px' }}>
                          {alert.category}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>{alert.text}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-secondary)', opacity: 0.7 }}>{alert.time}</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkOnAlert(alert);
                        }}
                        className="btn-interactive"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: accentColor,
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          whiteSpace: 'nowrap'
                        }}
                        title={`Navigate to ${alert.actionText || 'work on this'}`}
                      >
                        <span>{alert.actionText || 'Work on this'}</span>
                        <ArrowRight size={13} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                        className="btn-interactive"
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--color-secondary)', 
                          cursor: 'pointer',
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '18px',
                          lineHeight: 1,
                          opacity: 0.6
                        }}
                        title="Dismiss alert"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Work on System Alert Modal (Rendered in Portal to prevent transform/animation stacking context clipping) */}
        {selectedAlert && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
            onClick={() => setSelectedAlert(null)}
          >
            <div
              style={{
                background: 'var(--color-canvas, #ffffff)',
                borderRadius: 'var(--radius-xl, 16px)',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                border: '1px solid var(--color-outline-variant, #e5e7eb)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--color-outline-variant, #e5e7eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: selectedAlert.type === 'error' ? 'rgba(239, 68, 68, 0.06)' : selectedAlert.type === 'warning' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(59, 130, 246, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      color: selectedAlert.type === 'error' ? 'var(--color-error, #ef4444)' : selectedAlert.type === 'warning' ? '#f59e0b' : 'var(--color-primary, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {selectedAlert.type === 'error' ? <AlertCircle size={22} /> : selectedAlert.type === 'warning' ? <AlertTriangle size={22} /> : <Info size={22} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: selectedAlert.type === 'error' ? 'var(--color-error, #ef4444)' : selectedAlert.type === 'warning' ? '#f59e0b' : 'var(--color-primary, #3b82f6)'
                        }}
                      >
                        {selectedAlert.category} Operational Alert
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-secondary)', opacity: 0.7 }}>
                        • {selectedAlert.time}
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {selectedAlert.title || selectedAlert.category}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-secondary)',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Close alert"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-secondary)', letterSpacing: '0.05em' }}>
                    Exception Summary
                  </label>
                  <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--color-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    {selectedAlert.text}
                  </p>
                </div>

                {selectedAlert.impact && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'var(--surface-high, #f8fafc)',
                      borderRadius: 'var(--radius-md, 8px)',
                      borderLeft: '3px solid #f59e0b'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#b45309' }}>
                      Potential Operational Impact
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-primary)', lineHeight: 1.4 }}>
                      {selectedAlert.impact}
                    </p>
                  </div>
                )}

                {selectedAlert.steps && selectedAlert.steps.length > 0 && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-secondary)', letterSpacing: '0.05em' }}>
                      Recommended Resolution Steps
                    </label>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedAlert.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--color-primary)' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'var(--color-outline-variant, #e2e8f0)',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ lineHeight: 1.4 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--color-outline-variant, #e5e7eb)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--surface-high, #fafafa)'
                }}
              >
                <button
                  onClick={() => dismissAlert(selectedAlert.id)}
                  className="btn-interactive"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'transparent',
                    border: '1px solid var(--color-outline-variant, #cbd5e1)',
                    color: 'var(--color-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Mark as Resolved
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="btn-interactive"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md, 8px)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleWorkOnAlert(selectedAlert);
                      setSelectedAlert(null);
                    }}
                    className="btn-interactive"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-md, 8px)',
                      background: selectedAlert.type === 'error' ? 'var(--color-error, #ef4444)' : selectedAlert.type === 'warning' ? '#f59e0b' : 'var(--color-primary, #2563eb)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                  >
                    <span>Go to {selectedAlert.actionText || 'Module'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {}
        <div className="kpi-grid">
          {(user.role === 'admin' || user.role === 'owner' ? ADMIN_KPI_CARDS : KPI_CARDS).map((card, i) => {
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

        {}
        <div className="dual-grid">
          {}
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

          {}
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

        {}
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

        {}
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
