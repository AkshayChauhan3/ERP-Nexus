import { useState, useEffect } from 'react';
import { Activity, RefreshCw, UserCheck, ShieldAlert } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { ownerApi } from '../../utils/ownerApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = () => {
    setLoading(true);
    setTimeout(() => {
      setEmployees(ownerApi.getEmployees());
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Activity size={22} style={{ color: 'var(--color-primary)' }} />
              Employee Activity Monitor
            </h2>
            <p className="owner-sub">Real-time status tracking and operation velocity across departments.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadEmployees}>
            <RefreshCw size={14} /> Refresh Roster
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Reading active sessions...</div>
          </div>
        ) : (
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">ERP Staff Roster & Activity Velocity</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="purchase-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Last Active Time</th>
                    <th>Transactions Recorded</th>
                    <th>Session Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: emp.status === 'Online' ? 'var(--color-success)' : 'var(--color-secondary)'
                        }} />
                        {emp.name}
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.lastLogin}</td>
                      <td style={{ fontWeight: 600 }}>{emp.actions} ops</td>
                      <td>
                        <span className={`health-chip ${emp.status === 'Online' ? 'health-chip--green' : 'health-chip--amber'}`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
