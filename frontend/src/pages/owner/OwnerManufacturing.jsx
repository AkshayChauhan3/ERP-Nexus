import { useState, useEffect } from 'react';
import { Factory, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerManufacturing() {
  const [moList, setMoList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMOs = () => {
    setLoading(true);
    setTimeout(() => {
      // Mock some detailed MOs for owner premium oversight
      const mockMOs = [
        { id: 'MO-041', product: 'Comfort Cushion Sofa', qty: 15, status: 'In Progress', progress: 65, workCenter: 'Assembly Floor A', efficiency: 98.2 },
        { id: 'MO-042', product: 'Executive Swivel Chair', qty: 40, status: 'In Progress', progress: 40, workCenter: 'Welding Section B', efficiency: 94.5 },
        { id: 'MO-043', product: 'Oak Dining Table', qty: 5, status: 'Planned', progress: 0, workCenter: 'Carpentry Center', efficiency: 100 }
      ];
      setMoList(mockMOs);
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadMOs();
  }, []);

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Factory size={22} style={{ color: 'var(--color-primary)' }} />
              Manufacturing & Shop Floor Performance
            </h2>
            <p className="owner-sub">Real-time overall equipment efficiency (OEE), bill of materials consumption, and routing progression.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadMOs}>
            <RefreshCw size={14} /> Refresh Floor Status
          </button>
        </div>

        {/* Manufacturing KPIs */}
        <div className="owner-card-grid">
          <div className="owner-card">
            <span className="purchase-kpi-label">Average OEE (Overall Efficiency)</span>
            <h3 className="purchase-kpi-val" style={{ color: 'var(--color-success)' }}>96.4% OEE</h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Active Work Centers</span>
            <h3 className="purchase-kpi-val">3 Stations</h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Production Target Progress</span>
            <h3 className="purchase-kpi-val">2 Active MOs</h3>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Polling manufacturing telemetry...</div>
          </div>
        ) : (
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">Production Order Router</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="purchase-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>MO Ref</th>
                    <th>Product</th>
                    <th>Planned Qty</th>
                    <th>Current Station</th>
                    <th>Efficiency Rating</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {moList.map(mo => (
                    <tr key={mo.id}>
                      <td style={{ fontWeight: 'bold' }}>{mo.id}</td>
                      <td>{mo.product}</td>
                      <td>{mo.qty} units</td>
                      <td>{mo.workCenter}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{mo.efficiency}%</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', minWidth: '80px' }}>
                            <div style={{ width: `${mo.progress}%`, height: '100%', background: 'var(--color-primary)' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600 }}>{mo.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`health-chip ${mo.status === 'In Progress' ? 'health-chip--amber' : 'health-chip--green'}`}>
                          {mo.status}
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
