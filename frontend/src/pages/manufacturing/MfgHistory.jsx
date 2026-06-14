import { useState, useEffect } from 'react';
import { History, Download, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const WORK_CENTERS = ['All', 'assembly', 'painting', 'packaging', 'welding'];

export default function MfgHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [center, setCenter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manufacturing-orders');
      const mos = res.data || [];
      // Only show completed/done orders
      const completed = mos
        .filter(mo => mo.status === 'done' || mo.status === 'cancelled')
        .map(mo => {
          const components = mo.bom?.components || [];
          const operations = [...new Set(components.map(c => c.operation).filter(Boolean))];
          const centerLabel = operations[0] || 'Assembly';
          const startDate = mo.created_at?.split('T')[0] || '-';
          const endDate = mo.updated_at?.split('T')[0] || '-';
          const efficiency = mo.produced_qty && mo.quantity
            ? Math.round((Number(mo.produced_qty) / Number(mo.quantity)) * 100)
            : (mo.status === 'done' ? 100 : 0);
          return {
            id: mo.mo_number || mo.id,
            product: mo.product?.name || 'Unknown',
            qty: Number(mo.produced_qty) || Number(mo.quantity) || 0,
            start: startDate,
            finish: endDate,
            center: centerLabel,
            efficiency: `${efficiency}%`,
            status: mo.status
          };
        });
      setHistory(completed);
    } catch (err) {
      console.error('Failed to load MO history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = history.filter(h => {
    const ms = h.product.toLowerCase().includes(search.toLowerCase()) || h.id.toLowerCase().includes(search.toLowerCase());
    const mc = center === 'All' || h.center.toLowerCase() === center.toLowerCase();
    const mf = !dateFrom || h.finish >= dateFrom;
    const mt = !dateTo || h.finish <= dateTo;
    return ms && mc && mf && mt;
  });

  const handleExport = (fmt) => {
    if (fmt === 'CSV') {
      const headers = ['MO Number', 'Product', 'Qty Produced', 'Start Date', 'Finish Date', 'Work Center', 'Efficiency'];
      const rows = filtered.map(h => [h.id, h.product, h.qty, h.start, h.finish, h.center, h.efficiency]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mfg_history.csv';
      a.click();
    } else {
      alert(`Export as ${fmt} — Please use CSV for now.`);
    }
  };

  return (
    <AppShell>
      <div className="animate-page mfg-root">
        <div className="mfg-topbar">
          <div>
            <h2 className="mfg-page-title"><History size={20} style={{ color: 'var(--color-primary)' }} />Production History</h2>
            <p className="mfg-page-sub">Completed manufacturing orders, quantities, and performance records</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['PDF', 'Excel', 'CSV'].map(fmt => (
              <button key={fmt} id={`export-${fmt.toLowerCase()}`}
                className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '12px' }}
                onClick={() => handleExport(fmt)}>
                <Download size={13}/> {fmt}
              </button>
            ))}
            <button className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', fontSize: '12px' }} onClick={loadData}>
              <RefreshCw size={13}/> Refresh
            </button>
          </div>
        </div>

        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <input id="history-search" className="mfg-search-input" style={{ maxWidth: '220px', flex: 1 }}
            placeholder="Search product or MO ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {WORK_CENTERS.map(c => (
              <button key={c} className={`mfg-role-btn ${center === c ? 'mfg-role-btn--active' : ''}`} style={{ fontSize: '11px' }} onClick={() => setCenter(c)}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input id="history-date-from" className="mfg-form-input" type="date" style={{ width: '140px' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>to</span>
            <input id="history-date-to" className="mfg-form-input" type="date" style={{ width: '140px' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-secondary)' }}>{filtered.length} records</span>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading production history...</div>
          </div>
        ) : (
          <>
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
              {[
                { label: 'Completed MOs', val: filtered.length },
                { label: 'Units Produced', val: filtered.reduce((s, h) => s + h.qty, 0) },
                { label: 'Avg Efficiency', val: filtered.length ? Math.round(filtered.reduce((s, h) => s + parseInt(h.efficiency), 0) / filtered.length) + '%' : 'N/A' },
                { label: 'Centers Used', val: [...new Set(filtered.map(h => h.center))].length },
              ].map((kpi, i) => (
                <div key={i} className="admin-panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{kpi.val}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            <div className="admin-panel" style={{ padding: 0 }}>
              <div className="admin-table-wrapper" style={{ border: 'none' }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>MO Number</th><th>Product</th><th>Qty Produced</th><th>Start Date</th><th>Finish Date</th><th>Work Center</th><th>Efficiency</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 700 }}>{h.id}</td>
                        <td style={{ fontWeight: 600 }}>{h.product}</td>
                        <td>{h.qty} units</td>
                        <td style={{ color: 'var(--color-secondary)' }}>{h.start}</td>
                        <td style={{ color: 'var(--color-secondary)' }}>{h.finish}</td>
                        <td><span className="admin-badge admin-badge--info">{h.center}</span></td>
                        <td>
                          <span style={{ fontWeight: 700, color: parseInt(h.efficiency) >= 95 ? 'var(--color-success)' : 'var(--color-amber)' }}>
                            {h.efficiency}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>No history records match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
