import { useState, useEffect } from 'react';
import { Check, X, Clock, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { ownerApi } from '../../utils/ownerApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadApprovals = () => {
    setLoading(true);
    // Introduce a tiny mock delay for realistic premium feel
    setTimeout(() => {
      setApprovals(ownerApi.getApprovals());
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleApprove = (id) => {
    ownerApi.approveRequest(id);
    loadApprovals();
  };

  const handleReject = (id) => {
    ownerApi.rejectRequest(id);
    loadApprovals();
  };

  const filteredApprovals = approvals.filter(a => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return a.status === 'Pending';
    if (filter === 'Approved') return a.status === 'Approved';
    if (filter === 'Rejected') return a.status === 'Rejected';
    return true;
  });

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Layers size={22} style={{ color: 'var(--color-primary)' }} />
              Approvals Center
            </h2>
            <p className="owner-sub">Authorise critical purchase orders, financial bills, inventory overrides, and role changes.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadApprovals}>
            <RefreshCw size={14} /> Refresh Requests
          </button>
        </div>

        {/* Filters */}
        <div className="purchase-panel" style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>Status:</span>
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
            <button
              key={status}
              className={`btn ${filter === status ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setFilter(status)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Retrieving approval queue...</div>
          </div>
        ) : (
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">Pending & Past Approval Decisions</h3>
            </div>

            {filteredApprovals.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
                No requests found matching the current status filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredApprovals.map(req => (
                  <div
                    key={req.id}
                    style={{
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'var(--color-outline-variant)' }}>
                          {req.module}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{req.type}</span>
                        <span className={`health-chip ${req.priority === 'High' ? 'health-chip--red' : req.priority === 'Medium' ? 'health-chip--amber' : 'health-chip--green'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                          {req.priority} Priority
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-on-surface)', marginBottom: '8px' }}>{req.details}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                        Requested by <strong>{req.requestedBy}</strong> on {req.date}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {req.status === 'Pending' ? (
                        <>
                          <button className="btn btn--secondary" style={{ gap: '6px', borderColor: 'var(--color-error)' }} onClick={() => handleReject(req.id)}>
                            <X size={14} style={{ color: 'var(--color-error)' }} /> Reject
                          </button>
                          <button className="btn btn--primary" style={{ gap: '6px', background: 'var(--color-success)', color: '#fff' }} onClick={() => handleApprove(req.id)}>
                            <Check size={14} /> Approve
                          </button>
                        </>
                      ) : (
                        <span className={`health-chip ${req.status === 'Approved' ? 'health-chip--green' : 'health-chip--red'}`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
