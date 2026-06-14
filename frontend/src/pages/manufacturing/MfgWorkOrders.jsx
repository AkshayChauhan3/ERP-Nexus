import { useState, useEffect } from 'react';
import { Wrench, Play, Pause, RotateCcw, CheckCircle, X, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const WO_STATUSES = ['planned', 'released', 'in_progress', 'done'];
const STATUS_CLS = { planned: 'info', released: 'warning', in_progress: 'info', done: 'success', cancelled: 'error' };
const STATUS_LABEL = { planned: 'Planned', released: 'Released', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled' };

const TRANSITIONS = {
  planned: { next: 'released', label: 'Release', icon: <RotateCcw size={13}/> },
  released: { next: 'in_progress', label: 'Start', icon: <Play size={13}/> },
  in_progress: { next: 'done', label: 'Complete', icon: <CheckCircle size={13}/> },
};

export default function MfgWorkOrders() {
  const [wos, setWos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCenter, setFilterCenter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [updating, setUpdating] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manufacturing-orders');
      const mos = res.data || [];
      // Expand each MO into "work orders" per BOM component operation
      const expanded = [];
      mos.filter(mo => mo.status !== 'done' && mo.status !== 'cancelled').forEach(mo => {
        const components = mo.bom?.components || [];
        if (components.length === 0) {
          expanded.push({
            id: `WO-${mo.mo_number || mo.id}`,
            moId: mo.id,
            moNumber: mo.mo_number || mo.id,
            operation: 'Production',
            center: 'Assembly',
            status: mo.status,
            product: mo.product?.name || 'Unknown',
            qty: mo.quantity,
            instructions: `Produce ${mo.quantity} unit(s) of ${mo.product?.name || 'product'}.`
          });
        } else {
          components.forEach((comp, idx) => {
            expanded.push({
              id: `WO-${mo.mo_number || mo.id}-${idx + 1}`,
              moId: mo.id,
              moNumber: mo.mo_number || mo.id,
              operation: comp.operation ? comp.operation.charAt(0).toUpperCase() + comp.operation.slice(1) : 'Assembly',
              center: comp.operation ? comp.operation.charAt(0).toUpperCase() + comp.operation.slice(1) : 'Assembly',
              status: mo.status,
              product: mo.product?.name || 'Unknown',
              qty: mo.quantity,
              material: comp.raw_material?.name || 'Component',
              instructions: `Use ${comp.qty_per_unit} ${comp.raw_material?.name || 'unit(s)'} per finished product for ${comp.operation || 'assembly'}.`
            });
          });
        }
      });
      setWos(expanded);
    } catch (err) {
      console.error('Failed to load work orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const centers = ['all', ...new Set(wos.map(w => w.center))];

  const filtered = wos.filter(wo => {
    const ms = filterStatus === 'all' || wo.status === filterStatus;
    const mc = filterCenter === 'all' || wo.center === filterCenter;
    return ms && mc;
  });

  const transition = async (wo) => {
    const t = TRANSITIONS[wo.status];
    if (!t) return;
    setUpdating(wo.id);
    try {
      if (t.next === 'in_progress') {
        await api.post(`/manufacturing-orders/${wo.moId}/start`);
      } else if (t.next === 'done') {
        await api.post(`/manufacturing-orders/${wo.moId}/complete`, { produced_qty: wo.qty });
      } else {
        // Optimistic update for released state (no dedicated endpoint)
        setWos(prev => prev.map(w => w.moId === wo.moId ? { ...w, status: t.next } : w));
        setUpdating(null);
        if (detail?.moId === wo.moId) setDetail(d => ({ ...d, status: t.next }));
        return;
      }
      await loadData();
      setDetail(null);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><Wrench size={20} style={{ color: 'var(--color-primary)' }} />Work Orders</h2>
            <p className="mfg-page-sub">Manage individual work operations across all manufacturing orders</p>
          </div>
          <button className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '12px' }} onClick={loadData}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>

        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Status:</span>
          {['all', ...WO_STATUSES].map(s => (
            <button key={s} className={`mfg-role-btn ${filterStatus === s ? 'mfg-role-btn--active' : ''}`}
              style={{ fontSize: '11px' }} onClick={() => setFilterStatus(s)}>{s === 'all' ? 'All' : STATUS_LABEL[s] || s}</button>
          ))}
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', marginLeft: '10px' }}>Center:</span>
          {centers.map(c => (
            <button key={c} className={`mfg-role-btn ${filterCenter === c ? 'mfg-role-btn--active' : ''}`}
              style={{ fontSize: '11px' }} onClick={() => setFilterCenter(c)}>{c === 'all' ? 'All' : c}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading work orders...</div>
          </div>
        ) : (
          <div className="admin-panel" style={{ padding: 0 }}>
            <div className="admin-table-wrapper" style={{ border: 'none' }}>
              <table className="admin-table">
                <thead>
                  <tr><th>WO ID</th><th>MO</th><th>Operation</th><th>Work Center</th><th>Product</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(wo => {
                    const t = TRANSITIONS[wo.status];
                    return (
                      <tr key={wo.id}>
                        <td style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => setDetail(wo)}>{wo.id}</td>
                        <td><span className="admin-badge admin-badge--info" style={{ fontSize: '11px' }}>{wo.moNumber}</span></td>
                        <td>{wo.operation}</td>
                        <td>{wo.center}</td>
                        <td style={{ fontWeight: 600 }}>{wo.product}</td>
                        <td><span className={`admin-badge admin-badge--${STATUS_CLS[wo.status] || 'info'}`}>{STATUS_LABEL[wo.status] || wo.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {t && (
                              <button className="btn btn--secondary" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                disabled={updating === wo.id} onClick={() => transition(wo)}>
                                {t.icon} {updating === wo.id ? '...' : t.label}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No active work orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
                    ['Product', detail.product], ['Quantity', `${detail.qty} units`],
                    ['Status', STATUS_LABEL[detail.status] || detail.status], ['MO Reference', detail.moNumber],
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
                {TRANSITIONS[detail.status] && (
                  <button className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '13px' }}
                    onClick={() => { transition(detail); setDetail(null); }}>
                    {TRANSITIONS[detail.status].icon} {TRANSITIONS[detail.status].label}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
