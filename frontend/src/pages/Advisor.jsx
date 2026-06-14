import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { api } from '../utils/api';
import '../styles/Owner.css';
import '../styles/Purchase.css';

export default function Advisor() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/intelligence/advisor');
      // API returns { success: true, data: [...] }
      const recs = response?.data || response;
      if (Array.isArray(recs) && recs.length > 0) {
        setRecommendations(recs);
      } else {
        setError('No recommendations returned.');
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Could not connect to the advisor service. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionLabel) => {
    const label = actionLabel.toLowerCase();
    if (label.includes('po') || label.includes('vendor')) {
      navigate('/purchase');
    } else if (label.includes('inventory')) {
      navigate('/inventory');
    } else if (label.includes('mo') || label.includes('work order')) {
      navigate('/manufacturing');
    } else if (label.includes('order') || label.includes('analytic')) {
      navigate('/sales');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getPriorityStyle = (priority) => {
    if (priority.toLowerCase().includes('high')) {
      return { bg: '#ffe5e5', color: '#d32f2f' };
    }
    if (priority.toLowerCase().includes('medium')) {
      return { bg: '#fff8e1', color: '#f57c00' };
    }
    return { bg: '#e0e0e0', color: '#616161' };
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="kpi-icon" style={{ background: '#1a1a1a', color: '#fff', width: '40px', height: '40px' }}>
              <Zap size={20} />
            </div>
            <div>
              <h2 className="owner-title" style={{ margin: 0, fontSize: '20px' }}>EN Advisor Recommendations</h2>
              <p className="owner-sub" style={{ margin: 0 }}>AI-generated action items based on current data</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {loading ? (
              <div style={{ padding: '40px', width: '100%', textAlign: 'center', color: 'var(--color-secondary)' }}>
                Generating AI Insights...
              </div>
            ) : (
              recommendations.map((rec, idx) => {
                const priorityStyle = getPriorityStyle(rec.priority);
                return (
                  <div key={idx} className="purchase-panel" style={{ flex: '1 1 300px', minWidth: '300px', background: '#f5f5f5', border: '1px solid #eaeaea', borderRadius: '12px' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      backgroundColor: priorityStyle.bg, 
                      color: priorityStyle.color,
                      marginBottom: '16px'
                    }}>
                      {rec.priority}
                    </span>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                      {rec.title}
                    </h3>
                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#555', lineHeight: '1.5' }}>
                      {rec.description}
                    </p>
                    <button 
                      className="btn btn--secondary btn-interactive" 
                      onClick={() => handleActionClick(rec.action_label)}
                      style={{ 
                        background: '#fff', 
                        border: '1px solid #ddd', 
                        borderRadius: '24px', 
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                      {rec.action_label.replace('>', '').trim()} <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
