import { useState, useEffect } from 'react';
import { Factory, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerManufacturing() {
  const [moList, setMoList] = useState([]);
  const [kpis, setKpis] = useState({ avgEfficiency: 0, activeWCs: 0, activeMOs: 0 });
  const [loading, setLoading] = useState(true);

  const loadMOs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manufacturing-orders');
      const mos = res.data || [];

      const active = mos.filter(m => m.status === 'in_progress' || m.status === 'released' || m.status === 'planned');
      const done = mos.filter(m => m.status === 'done');

      // Calculate avg efficiency from done MOs
      const efficiencies = done.map(m =>
        m.quantity > 0 ? Math.min(100, Math.round((Number(m.produced_qty) / Number(m.quantity)) * 100)) : 0
      );
      const avgEfficiency = efficiencies.length > 0
        ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
        : 0;

      // Unique work centers from active MOs' BOM operations
      const wcSet = new Set();
      active.forEach(m => {
        (m.bom?.components || []).forEach(c => { if (c.operation) wcSet.add(c.operation); });
        if (!m.bom?.components?.length) wcSet.add('Assembly');
      });

      setKpis({ avgEfficiency, activeWCs: wcSet.size, activeMOs: active.filter(m => m.status === 'in_progress').length });

      // Build display list for table
      const displayList = active.slice(0, 10).map(mo => {
        const ops = [...new Set((mo.bom?.components || []).map(c => c.operation).filter(Boolean))];
        const workCenter = ops.length > 0 ? ops.join(', ') : 'Assembly Floor';
        const progress = mo.quantity > 0
          ? Math.round((Number(mo.produced_qty || 0) / Number(mo.quantity)) * 100)
          : (mo.status === 'in_progress' ? 50 : mo.status === 'released' ? 10 : 0);
        const efficiency = done.length > 0 ? avgEfficiency : 100;
        return {
          id: mo.mo_number || mo.id,
          product: mo.product?.name || 'Unknown',
          qty: mo.quantity,
          status: mo.status === 'in_progress' ? 'In Progress' : mo.status === 'released' ? 'Released' : 'Planned',
          progress,
          workCenter,
          efficiency
        };
      });
      setMoList(displayList);
    } catch (err) {
      console.error('Failed to load manufacturing data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMOs(); }, []);

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
            <h3 className="purchase-kpi-val" style={{ color: kpis.avgEfficiency >= 90 ? 'var(--color-success)' : 'var(--color-amber)' }}>
              {kpis.avgEfficiency}% OEE
            </h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Active Work Centers</span>
            <h3 className="purchase-kpi-val">{kpis.activeWCs} Station{kpis.activeWCs !== 1 ? 's' : ''}</h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Active Manufacturing Orders</span>
            <h3 className="purchase-kpi-val">{kpis.activeMOs} Active MO{kpis.activeMOs !== 1 ? 's' : ''}</h3>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Polling manufacturing telemetry...</div>
          </div>
        ) : moList.length === 0 ? (
          <div className="purchase-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            No active manufacturing orders on the shop floor.
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
                        <span className={`health-chip ${mo.status === 'In Progress' ? 'health-chip--amber' : mo.status === 'Planned' ? 'health-chip--green' : 'health-chip--green'}`}>
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
