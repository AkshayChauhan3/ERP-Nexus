import { useState } from 'react';
import { Wrench, Play, Pause, RotateCcw, CheckCircle, X } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const WO_STATUSES = ['Pending', 'Ready', 'In Progress', 'Paused', 'Completed'];
const STATUS_CLS = { Pending: 'info', Ready: 'warning', 'In Progress': 'info', Paused: 'warning', Completed: 'success' };

const MOCK_WOS = [
  { id: 'WO-1010', mo: 'MO-4005', operation: 'Frame Assembly',   center: 'Assembly',  status: 'In Progress', operator: 'Rahul K.',  instructions: 'Assemble the steel frame using M8 bolts. Torque to 25 Nm.', duration: 90 },
  { id: 'WO-1009', mo: 'MO-4005', operation: 'Foam Cutting',     center: 'Assembly',  status: 'Completed',   operator: 'Priya M.',  instructions: 'Cut foam padding to 60x60 cm. Use CNC foam cutter.', duration: 30 },
  { id: 'WO-1008', mo: 'MO-4004', operation: 'Surface Painting',  center: 'Painting',  status: 'Ready',       operator: 'Nikhil S.', instructions: 'Apply 2 coats of walnut stain. Wait 1h between coats.', duration: 120 },
  { id: 'WO-1007', mo: 'MO-4004', operation: 'Wood Cutting',     center: 'Assembly',  status: 'Pending',     operator: 'Nikhil S.', instructions: 'Cut oak planks to blueprint dimensions.', duration: 60 },
  { id: 'WO-1006', mo: 'MO-4003', operation: 'Fabric Upholstery', center: 'Assembly',  status: 'Paused',      operator: 'Rahul K.',  instructions: 'Attach upholstery fabric to cushion frames using staple gun.', duration: 150 },
  { id: 'WO-1005', mo: 'MO-4003', operation: 'Quality Inspection',center: 'Packaging', status: 'Pending',     operator: 'Admin',     instructions: 'Inspect finished units for defects. Document any scrap.', duration: 45 },
];

const TRANSITIONS = {
  Pending:     { next: 'Ready',       label: 'Mark Ready',  icon: <RotateCcw size={13}/> },
  Ready:       { next: 'In Progress', label: 'Start',       icon: <Play size={13}/> },
  'In Progress': { next: 'Paused',   label: 'Pause',       icon: <Pause size={13}/> },
  Paused:      { next: 'In Progress', label: 'Resume',      icon: <Play size={13}/> },
};

export default function MfgWorkOrders() {
  const [wos, setWos] = useState(MOCK_WOS);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCenter, setFilterCenter] = useState('all');
  const [detail, setDetail] = useState(null);

  const filtered = wos.filter(wo => {
    const ms = filterStatus === 'all' || wo.status === filterStatus;
    const mc = filterCenter === 'all' || wo.center === filterCenter;
    return ms && mc;
  });

  const transition = (id) => {
    setWos(prev => prev.map(wo => {
      if (wo.id !== id) return wo;
      const t = TRANSITIONS[wo.status];
      if (!t) return wo;
      const updated = { ...wo, status: t.next };
      if (detail?.id === id) setDetail(updated);
      return updated;
    }));
  };

  const complete = (id) => {
    setWos(prev => prev.map(wo => wo.id === id ? { ...wo, status: 'Completed' } : wo));
    if (detail?.id === id) setDetail(d => ({ ...d, status: 'Completed' }));
  };

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><Wrench size={20} style={{ color: 'var(--color-primary)' }} />Work Orders</h2>
            <p className="mfg-page-sub">Manage individual work operations across all manufacturing orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Status:</span>
          {['all', ...WO_STATUSES].map(s => (
            <button key={s} className={`mfg-role-btn ${filterStatus === s ? 'mfg-role-btn--active' : ''}`}
              style={{ fontSize: '11px' }} onClick={() => setFilterStatus(s)}>{s === 'all' ? 'All' : s}</button>
          ))}
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', marginLeft: '10px' }}>Center:</span>
          {['all', 'Assembly', 'Painting', 'Packaging'].map(c => (
            <button key={c} className={`mfg-role-btn ${filterCenter === c ? 'mfg-role-btn--active' : ''}`}
              style={{ fontSize: '11px' }} onClick={() => setFilterCenter(c)}>{c === 'all' ? 'All' : c}</button>
          ))}
        </div>

        {/* Table */}
        <div className="admin-panel" style={{ padding: 0 }}>
          <div className="admin-table-wrapper" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr><th>WO Number</th><th>MO</th><th>Operation</th><th>Work Center</th><th>Status</th><th>Operator</th><th>Duration</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(wo => {
                  const t = TRANSITIONS[wo.status];
                  return (
                    <tr key={wo.id}>
                      <td style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => setDetail(wo)}>{wo.id}</td>
                      <td><span className="admin-badge admin-badge--info" style={{ fontSize: '11px' }}>{wo.mo}</span></td>
                      <td>{wo.operation}</td>
                      <td>{wo.center}</td>
                      <td><span className={`admin-badge admin-badge--${STATUS_CLS[wo.status]}`}>{wo.status}</span></td>
                      <td>{wo.operator}</td>
                      <td style={{ color: 'var(--color-secondary)' }}>{wo.duration} min</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {t && (
                            <button className="btn btn--secondary" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => transition(wo.id)}>
                              {t.icon} {t.label}
                            </button>
                          )}
                          {(wo.status === 'In Progress' || wo.status === 'Paused') && (
                            <button className="btn btn--primary" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => complete(wo.id)}>
                              <CheckCircle size={13}/> Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* WO Detail Side Panel */}
      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{detail.id} — Work Order Detail</h3>
              <button className="admin-modal-close" onClick={() => setDetail(null)}><X size={18}/></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    ['Operation', detail.operation], ['Work Center', detail.center],
                    ['Duration', `${detail.duration} min`], ['Operator', detail.operator],
                    ['Status', detail.status], ['MO Reference', detail.mo],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '10px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Work Instructions</p>
                  <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{detail.instructions}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {TRANSITIONS[detail.status] && (
                    <button className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '13px' }} onClick={() => transition(detail.id)}>
                      {TRANSITIONS[detail.status].icon} {TRANSITIONS[detail.status].label}
                    </button>
                  )}
                  {(detail.status === 'In Progress' || detail.status === 'Paused') && (
                    <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '13px' }} onClick={() => complete(detail.id)}>
                      <CheckCircle size={14}/> Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
