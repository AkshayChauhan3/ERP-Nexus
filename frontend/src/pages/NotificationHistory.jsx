import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Clock, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle, 
  Info, ArrowRight, ShieldCheck, Filter, ChevronLeft
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { api } from '../utils/api';
import '../styles/Owner.css';
import '../styles/Purchase.css';

export default function NotificationHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, completed, dismissed, critical

  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  const userRole = authData?.user?.role || '';

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/intelligence/notifications/history');
      if (res?.success && Array.isArray(res.history)) {
        setHistory(res.history);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to load notification history:', err);
      setError(err.message || 'Unable to retrieve notification history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Filter items based on selected tab
  const filteredHistory = useMemo(() => {
    if (activeTab === 'unread') return history.filter(h => !h.isRead && h.status !== 'completed');
    if (activeTab === 'completed') return history.filter(h => h.status === 'completed');
    if (activeTab === 'dismissed') return history.filter(h => h.status === 'dismissed');
    if (activeTab === 'critical') return history.filter(h => h.type === 'critical');
    return history;
  }, [history, activeTab]);

  const counts = useMemo(() => {
    return {
      all: history.length,
      unread: history.filter(h => !h.isRead && h.status !== 'completed').length,
      completed: history.filter(h => h.status === 'completed').length,
      dismissed: history.filter(h => h.status === 'dismissed').length,
      critical: history.filter(h => h.type === 'critical').length,
    };
  }, [history]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: '#15803d',
          bg: '#dcfce7',
          border: '#bbf7d0',
          icon: CheckCircle2
        };
      case 'dismissed':
        return {
          label: 'Dismissed',
          color: '#64748b',
          bg: '#f1f5f9',
          border: '#e2e8f0',
          icon: Clock
        };
      case 'read':
        return {
          label: 'Viewed',
          color: '#0369a1',
          bg: '#e0f2fe',
          border: '#bae6fd',
          icon: CheckCircle2
        };
      case 'active':
      default:
        return {
          label: 'Active Alert',
          color: '#b45309',
          bg: '#fef3c7',
          border: '#fde68a',
          icon: AlertCircle
        };
    }
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        {/* Header with back button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#60a5fa', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="owner-title" style={{ margin: 0, fontSize: '22px' }}>
                  Notification History
                </h2>
                <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                  Last 48 Hours
                </span>
              </div>
              <p className="owner-sub" style={{ margin: '2px 0 0 0' }}>
                Archived notifications, operational events, and task outcomes for {userRole.toUpperCase()} role.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn--secondary"
              style={{ gap: '6px' }}
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={15} /> Back
            </button>
            <button 
              className="btn btn--secondary" 
              style={{ gap: '6px' }}
              onClick={loadHistory}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh History'}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--color-outline-variant, #e2e8f0)',
          paddingBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'all', label: `All Events (${counts.all})` },
            { id: 'unread', label: `Unread (${counts.unread})` },
            { id: 'completed', label: `Completed (${counts.completed})` },
            { id: 'dismissed', label: `Dismissed (${counts.dismissed})` },
            { id: 'critical', label: `Critical (${counts.critical})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--color-primary, #0f172a)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--color-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* History List */}
        {loading ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={36} className="spin" style={{ margin: '0 auto 16px auto', display: 'block', color: 'var(--color-primary)' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading 48-Hour Notification History...</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>Fetching archived system alerts, resolution logs, and operational milestones.</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ 
            padding: '48px 20px', 
            textAlign: 'center', 
            background: 'var(--color-surface, #ffffff)', 
            borderRadius: '16px', 
            border: '1px solid var(--color-outline-variant, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <CheckCircle2 size={36} style={{ color: 'var(--color-success, #22c55e)', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--color-on-surface, #1e293b)' }}>
              No Notifications In This View
            </h3>
            <p style={{ margin: '0', color: 'var(--color-secondary, #64748b)', fontSize: '13px' }}>
              {activeTab === 'all' 
                ? 'Zero notifications or operational alerts recorded in the past 48 hours.'
                : `No notifications currently matched the "${activeTab}" filter.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredHistory.map((item) => {
              const statusBadge = getStatusBadge(item.status);
              const StatusIcon = statusBadge.icon;
              const typeColor = item.type === 'critical' ? 'var(--color-error, #ef4444)' : item.type === 'warning' ? '#f59e0b' : 'var(--color-primary, #3b82f6)';

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'var(--color-surface, #ffffff)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-outline-variant, #e2e8f0)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                    <div style={{ color: typeColor, marginTop: '2px', flexShrink: 0 }}>
                      {item.type === 'critical' ? <AlertCircle size={20} /> : item.type === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: typeColor }}>
                          {item.category}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-secondary, #94a3b8)' }}>
                          • {item.time} ({item.formattedTimestamp})
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: 'var(--color-primary, #0f172a)' }}>
                        {item.title || item.category}
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-secondary, #475569)', lineHeight: 1.5 }}>
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    {/* Status Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.color,
                      border: `1px solid ${statusBadge.border}`
                    }}>
                      <StatusIcon size={12} />
                      <span>{statusBadge.label}</span>
                    </span>

                    {/* Action link if available */}
                    {item.path && (
                      <button
                        onClick={() => navigate(item.path)}
                        className="btn-interactive"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: 'var(--surface-high, #f8fafc)',
                          color: 'var(--color-primary, #0f172a)',
                          border: '1px solid var(--color-outline-variant, #cbd5e1)',
                          cursor: 'pointer'
                        }}
                      >
                        <span>{item.actionText || 'View Order'}</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
