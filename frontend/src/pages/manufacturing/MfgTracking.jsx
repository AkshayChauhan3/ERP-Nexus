import { Activity } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const LIVE_MOS = [
  {
    id: 'MO-4005', product: 'Executive Chair x20', status: 'In Production', progress: 65,
    stage: 'Frame Assembly', startedAt: '09:30', indicator: 'green',
    workOrders: [
      { id: 'WO-1009', op: 'Foam Cutting',    status: 'Completed',   progress: 100 },
      { id: 'WO-1010', op: 'Frame Assembly',  status: 'In Progress', progress: 65 },
      { id: 'WO-1011', op: 'Fabric Attach',   status: 'Pending',     progress: 0 },
      { id: 'WO-1012', op: 'Quality Check',   status: 'Pending',     progress: 0 },
    ]
  },
  {
    id: 'MO-4004', product: 'Oak Dining Table x5', status: 'In Production', progress: 30,
    stage: 'Wood Cutting', startedAt: '11:00', indicator: 'orange',
    workOrders: [
      { id: 'WO-1007', op: 'Wood Cutting',    status: 'In Progress', progress: 30 },
      { id: 'WO-1008', op: 'Surface Painting', status: 'Ready',       progress: 0 },
      { id: 'WO-1013', op: 'Assembly',        status: 'Pending',     progress: 0 },
    ]
  },
  {
    id: 'MO-4003', product: 'Comfort Sofa x8', status: 'Delayed', progress: 20,
    stage: 'Upholstery (Paused)', startedAt: '08:00', indicator: 'red',
    workOrders: [
      { id: 'WO-1006', op: 'Fabric Upholstery', status: 'Paused',   progress: 20 },
      { id: 'WO-1005', op: 'Quality Check',      status: 'Pending',  progress: 0 },
    ]
  },
];

const INDICATOR = {
  green:  { label: 'On Schedule', cls: 'success', dot: '#22c55e' },
  orange: { label: 'Warning',     cls: 'warning', dot: '#f59e0b' },
  red:    { label: 'Delayed',     cls: 'error',   dot: '#ef4444' },
};

const WO_STATUS_CLS = { Completed: 'success', 'In Progress': 'info', Ready: 'warning', Pending: 'info', Paused: 'error' };

export default function MfgTracking() {
  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><Activity size={20} style={{ color: 'var(--color-primary)' }} />Live Production Tracking</h2>
            <p className="mfg-page-sub">Real-time status of all running manufacturing and work orders</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', alignItems: 'center' }}>
            {Object.entries(INDICATOR).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: v.dot, animation: k === 'green' ? 'pulse 2s infinite' : 'none' }} />
                {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* Live MO Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {LIVE_MOS.map(mo => {
            const ind = INDICATOR[mo.indicator];
            return (
              <div key={mo.id} className="admin-panel" style={{ gap: 'var(--space-4)', borderLeft: `4px solid ${ind.dot}` }}>
                {/* MO Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800 }}>{mo.id}</span>
                      <span className={`admin-badge admin-badge--${ind.cls}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ind.dot }} />
                        {ind.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-secondary)', marginTop: '2px' }}>{mo.product}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Current Stage</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{mo.stage}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Started: {mo.startedAt}</div>
                  </div>
                </div>

                {/* Main Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Overall Completion</span>
                    <span style={{ fontWeight: 700 }}>{mo.progress}%</span>
                  </div>
                  <div className="mfg-progress-track" style={{ height: '12px' }}>
                    <div className="mfg-progress-fill" style={{
                      width: `${mo.progress}%`,
                      background: mo.indicator === 'green' ? 'var(--color-success)' : mo.indicator === 'orange' ? 'var(--color-amber)' : 'var(--color-error)'
                    }} />
                  </div>
                </div>

                {/* Work Orders Breakdown */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Orders</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mo.workOrders.map(wo => (
                      <div key={wo.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)', minWidth: '64px' }}>{wo.id}</span>
                        <span style={{ flex: 1, fontSize: '13px' }}>{wo.op}</span>
                        <div style={{ width: '120px' }}>
                          <div className="mfg-progress-track" style={{ height: '5px' }}>
                            <div className="mfg-progress-fill" style={{ width: `${wo.progress}%`, background: wo.status === 'Completed' ? 'var(--color-success)' : 'var(--color-primary)' }} />
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-secondary)', minWidth: '28px', textAlign: 'right' }}>{wo.progress}%</span>
                        <span className={`admin-badge admin-badge--${WO_STATUS_CLS[wo.status]}`} style={{ fontSize: '10px', padding: '1px 8px' }}>{wo.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
