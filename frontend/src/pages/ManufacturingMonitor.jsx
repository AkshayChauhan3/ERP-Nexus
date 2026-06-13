import { useState } from 'react';
import { Factory, CheckCircle, Clock, AlertTriangle, Play } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import '../styles/AdminPages.css';

const INITIAL_KANBAN = {
  draft: [
    { id: 'MO-4001', item: 'Executive Chair x20', date: '2026-06-14' },
    { id: 'MO-4002', item: 'Oak Wood Desk x5', date: '2026-06-15' },
  ],
  ready: [
    { id: 'MO-3998', item: 'Dining Table Set x3', date: '2026-06-13' },
  ],
  in_progress: [
    { id: 'MO-3995', item: 'Comfort Cushion Sofa x8', center: 'Assembly', progress: '65%' },
    { id: 'MO-3996', item: 'Office Swivel Chair x15', center: 'Painting', progress: '30%' },
  ],
  completed: [
    { id: 'MO-3990', item: 'Wooden Bookshelf x12', date: '2026-06-12' },
  ]
};

export default function ManufacturingMonitor() {
  const [kanban, setKanban] = useState(INITIAL_KANBAN);

  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Section 1: Summary Cards ── */}
      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '36px', height: '36px' }}><Factory size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>3</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Active MOs</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--green" style={{ width: '36px', height: '36px' }}><CheckCircle size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>48</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Completed MOs</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--error" style={{ width: '36px', height: '36px' }}><AlertTriangle size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>1</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Delayed MOs</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--blue" style={{ width: '36px', height: '36px' }}><Clock size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>4</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Pending WOs</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--green" style={{ width: '36px', height: '36px' }}><CheckCircle size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>142</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Completed WOs</div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Kanban Board ── */}
      <div className="admin-panel">
        <h3 className="admin-panel-title" style={{ marginBottom: 'var(--space-2)' }}>Manufacturing Pipeline</h3>
        <div className="kanban-board">
          {/* Draft Column */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">Draft</span>
              <span className="kanban-column-count">{kanban.draft.length}</span>
            </div>
            {kanban.draft.map(card => (
              <div key={card.id} className="kanban-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  <span>{card.id}</span>
                  <span className="admin-badge admin-badge--info" style={{ fontSize: '10px', padding: '1px 6px' }}>Draft</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>{card.item}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Created: {card.date}</div>
              </div>
            ))}
          </div>

          {/* Ready Column */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">Ready</span>
              <span className="kanban-column-count">{kanban.ready.length}</span>
            </div>
            {kanban.ready.map(card => (
              <div key={card.id} className="kanban-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  <span>{card.id}</span>
                  <span className="admin-badge admin-badge--warning" style={{ fontSize: '10px', padding: '1px 6px' }}>Ready</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>{card.item}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Queued: {card.date}</div>
              </div>
            ))}
          </div>

          {/* In Progress Column */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">In Progress</span>
              <span className="kanban-column-count">{kanban.in_progress.length}</span>
            </div>
            {kanban.in_progress.map(card => (
              <div key={card.id} className="kanban-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  <span>{card.id}</span>
                  <span className="admin-badge admin-badge--info" style={{ fontSize: '10px', padding: '1px 6px', background: 'var(--color-blue-container)', color: 'var(--color-blue)' }}>{card.progress}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>{card.item}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Play size={10} /> {card.center} Center
                </div>
              </div>
            ))}
          </div>

          {/* Completed Column */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">Completed</span>
              <span className="kanban-column-count">{kanban.completed.length}</span>
            </div>
            {kanban.completed.map(card => (
              <div key={card.id} className="kanban-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  <span>{card.id}</span>
                  <span className="admin-badge admin-badge--success" style={{ fontSize: '10px', padding: '1px 6px' }}>Done</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>{card.item}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>Finished: {card.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: Dual Grid (Utilization & Efficiency) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Utilization percentages */}
        <div className="admin-panel">
          <h3 className="admin-panel-title">Work Center Utilization</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flex: 1, padding: '12px 0' }}>
            {[
              { label: 'Assembly Center', value: 85, color: 'var(--color-primary)' },
              { label: 'Painting Center', value: 48, color: 'var(--color-amber)' },
              { label: 'Packaging Center', value: 72, color: 'var(--color-success)' },
            ].map((wc, i) => {
              const radius = 35;
              const stroke = 6;
              const circ = 2 * Math.PI * radius;
              const offset = circ - (wc.value / 100) * circ;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg className="utilization-ring-svg" width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--surface-high)" strokeWidth={stroke} />
                      <circle 
                        cx="40" cy="40" r={radius} fill="none" stroke={wc.color} strokeWidth={stroke}
                        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                      {wc.value}%
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>{wc.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manufacturing Efficiency */}
        <div className="admin-panel">
          <h3 className="admin-panel-title">Manufacturing Efficiency</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', flex: 1 }}>
            {[
              { label: 'Planned Quantity', value: '450 units' },
              { label: 'Produced Quantity', value: '442 units' },
              { label: 'Scrap Quantity', value: '8 units (1.7%)', color: 'var(--color-error)' },
              { label: 'Total Efficiency', value: '98.2%', color: 'var(--color-success)', highlight: true },
            ].map((metric, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px dashed var(--color-outline-variant)' : 'none' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>{metric.label}</span>
                <span style={{ 
                  fontSize: metric.highlight ? '18px' : '14px', 
                  fontWeight: 700, 
                  color: metric.color || 'var(--color-primary)'
                }}>
                  {metric.value}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
    </div>
    </AppShell>
  );
}
