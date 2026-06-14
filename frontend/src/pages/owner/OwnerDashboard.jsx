import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, Layers, Factory, Clock, AlertTriangle, Users, DollarSign,
  TrendingDown, CheckCircle, ArrowRight, Activity, RefreshCw, Zap, X
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlySales: 0,
    todayPurchases: 0,
    monthlyPurchases: 0,
    invValue: 0,
    moInProgress: 0,
    pendingApprovals: 0,
    revenue: 0,
    expenses: 0,
    profit: 0,
    lowStock: 0,
    activeUsers: 0
  });

  const [loading, setLoading] = useState(true);
  const [summaryText, setSummaryText] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/intelligence/dashboard-stats');
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generateSummary = async () => {
    setGeneratingSummary(true);
    setShowSummaryModal(true);
    try {
      const res = await api.get('/intelligence/summary');
      if (res.data) {
        setSummaryText(res.data);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setSummaryText('Failed to generate the business summary. Please ensure the intelligence service is running and try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <TrendingUp size={24} style={{ color: 'var(--color-primary)' }} />
              Strategic Business Overview
            </h2>
            <p className="owner-sub">Real-time consolidated health dashboard for Business Owners.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn--secondary" 
              style={{ gap: '6px', background: 'var(--color-primary)', color: 'white', border: 'none' }} 
              onClick={generateSummary}
            >
              {generatingSummary ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
              Generate Business Summary
            </button>
            <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => navigate('/owner/approvals')}>
              <Clock size={14} /> Review approvals ({stats.pendingApprovals})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading Cockpit Metrics...</div>
          </div>
        ) : (
          <>
            {showSummaryModal && (
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #eee',
                position: 'relative',
                animation: 'slideDown 0.3s ease-out'
              }}>
                <button 
                  onClick={() => setShowSummaryModal(false)}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                >
                  <X size={20} />
                </button>
                <h3 style={{ margin: '0 0 16px 0', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={20} style={{ color: 'var(--color-primary)' }} />
                  Executive Business Summary
                </h3>
                {generatingSummary ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', padding: '20px 0' }}>
                    <RefreshCw size={18} className="spin" />
                    <span>Analyzing ERP data and generating narrative...</span>
                  </div>
                ) : (
                  <div style={{ 
                    color: '#333', 
                    lineHeight: '1.7', 
                    fontSize: '15px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {summaryText}
                  </div>
                )}
              </div>
            )}

            {/* Owner strategic cards */}
            <div className="owner-card-grid">
              <div className="owner-card">
                <span className="purchase-kpi-label">Today's Sales</span>
                <h3 className="purchase-kpi-val" style={{ color: 'var(--color-success)' }}>₹{stats.todaySales.toLocaleString()}</h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Monthly Sales Revenue</span>
                <h3 className="purchase-kpi-val">₹{stats.monthlySales.toLocaleString()}</h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Today's Procurement</span>
                <h3 className="purchase-kpi-val" style={{ color: 'var(--color-amber)' }}>₹{stats.todayPurchases.toLocaleString()}</h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Monthly Purchase Outlay</span>
                <h3 className="purchase-kpi-val">₹{stats.monthlyPurchases.toLocaleString()}</h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Inventory Valuation</span>
                <h3 className="purchase-kpi-val">₹{stats.invValue.toLocaleString()}</h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Manufacturing Orders</span>
                <h3 className="purchase-kpi-val">{stats.moInProgress} Active</h3>
              </div>
              <div className="owner-card" style={{ background: stats.pendingApprovals > 0 ? 'rgba(245, 158, 11, 0.08)' : '' }}>
                <span className="purchase-kpi-label">Pending Approvals</span>
                <h3 className="purchase-kpi-val" style={{ color: stats.pendingApprovals > 0 ? 'var(--color-amber)' : '' }}>{stats.pendingApprovals} requests</h3>
              </div>
              <div className="owner-card" style={{ background: stats.profit >= 0 ? 'var(--color-success-container)' : 'var(--color-error-container)' }}>
                <span className="purchase-kpi-label">Estimated Profit</span>
                <h3 className="purchase-kpi-val" style={{ color: stats.profit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {stats.profit < 0 ? '-' : ''}₹{Math.abs(stats.profit).toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Split visuals */}
            <div className="purchase-split-grid">
              {/* Strategic health indicators */}
              <div className="purchase-panel">
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">Strategic Operations Summary</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Gross Profit Margin:</span>
                    <strong style={{ color: (stats.profit / (stats.revenue || 1)) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {Math.round((stats.profit / (stats.revenue || 1)) * 100)}%
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Inventory Turnover Ratio:</span>
                    <strong>4.2x</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Active Floor Production Efficiency:</span>
                    <strong style={{ color: 'var(--color-success)' }}>96.4% OEE</strong>
                  </div>
                </div>
              </div>

              {/* Quick strategic shortcuts */}
              <div className="purchase-panel">
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">Strategic Controls</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="btn btn--secondary" onClick={() => navigate('/owner/approvals')}>Approvals Center</button>
                  <button className="btn btn--secondary" onClick={() => navigate('/owner/financials')}>Financial Summary</button>
                  <button className="btn btn--secondary" onClick={() => navigate('/owner/users')}>Manage Users</button>
                  <button className="btn btn--secondary" onClick={() => navigate('/owner/employees')}>Monitor Employees</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
