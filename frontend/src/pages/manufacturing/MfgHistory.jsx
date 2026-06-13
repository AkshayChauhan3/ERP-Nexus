import { useState } from 'react';
import { History, Download } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/AdminPages.css';
import '../../styles/Manufacturing.css';

const MOCK_HISTORY = [
  { id: 'MO-3990', product: 'Wooden Bookshelf',     qty: 12, start: '2026-06-08', finish: '2026-06-11', center: 'Assembly',  efficiency: '98%' },
  { id: 'MO-3989', product: 'Study Table',           qty: 6,  start: '2026-06-06', finish: '2026-06-09', center: 'Assembly',  efficiency: '95%' },
  { id: 'MO-3988', product: 'Ergonomic Mesh Chair',  qty: 30, start: '2026-06-03', finish: '2026-06-07', center: 'Assembly',  efficiency: '99%' },
  { id: 'MO-3987', product: 'King Bed Frame',        qty: 4,  start: '2026-05-28', finish: '2026-06-02', center: 'Welding',   efficiency: '92%' },
  { id: 'MO-3986', product: 'Corner Sofa',           qty: 3,  start: '2026-05-25', finish: '2026-05-30', center: 'Assembly',  efficiency: '89%' },
  { id: 'MO-3985', product: 'Coffee Table',          qty: 20, start: '2026-05-20', finish: '2026-05-24', center: 'Packaging', efficiency: '97%' },
  { id: 'MO-3984', product: 'Office Chair Deluxe',   qty: 50, start: '2026-05-15', finish: '2026-05-19', center: 'Assembly',  efficiency: '94%' },
];

const WORK_CENTERS = ['All', 'Assembly', 'Painting', 'Packaging', 'Welding'];

export default function MfgHistory() {
  const [search, setSearch]     = useState('');
  const [center, setCenter]     = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const filtered = MOCK_HISTORY.filter(h => {
    const ms = h.product.toLowerCase().includes(search.toLowerCase()) || h.id.toLowerCase().includes(search.toLowerCase());
    const mc = center === 'All' || h.center === center;
    const mf = !dateFrom || h.finish >= dateFrom;
    const mt = !dateTo   || h.finish <= dateTo;
    return ms && mc && mf && mt;
  });

  const handleExport = (fmt) => alert(`Exporting ${filtered.length} records as ${fmt}… (mock)`);

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
          </div>
        </div>

        {/* Filters */}
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap' }}>
          <input id="history-search" className="mfg-search-input" style={{ maxWidth: '220px', flex: 1 }}
            placeholder="Search product or MO ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {WORK_CENTERS.map(c => (
              <button key={c} className={`mfg-role-btn ${center === c ? 'mfg-role-btn--active' : ''}`} style={{ fontSize: '11px' }} onClick={() => setCenter(c)}>{c}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input id="history-date-from" className="mfg-form-input" type="date" style={{ width: '140px' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>to</span>
            <input id="history-date-to" className="mfg-form-input" type="date" style={{ width: '140px' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-secondary)' }}>{filtered.length} records</span>
        </div>

        {/* Summary KPIs */}
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
          {[
            { label: 'Completed MOs',   val: filtered.length },
            { label: 'Units Produced',  val: filtered.reduce((s, h) => s + h.qty, 0) },
            { label: 'Avg Efficiency',  val: filtered.length ? Math.round(filtered.reduce((s, h) => s + parseInt(h.efficiency), 0) / filtered.length) + '%' : 'N/A' },
            { label: 'Centers Used',    val: [...new Set(filtered.map(h => h.center))].length },
          ].map((kpi, i) => (
            <div key={i} className="admin-panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{kpi.val}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* History Table */}
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
      </div>
    </AppShell>
  );
}
