import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Package, AlertTriangle, HelpCircle, Activity,
  ArrowRightLeft, Settings, ClipboardList, CheckCircle,
  Plus, Eye, TrendingUp, RefreshCw
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Inventory.css';

export default function InvDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProds: 0,
    totalRawMats: 0,
    lowStock: 0,
    outOfStock: 0,
    reservedStock: 0,
    incoming: 0,
    outgoing: 0,
    totalValue: 0
  });

  const [distribution, setDistribution] = useState({
    raw: 0, finished: 0, consumables: 0, packaging: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [invRes, trfRes] = await Promise.all([
          api.get('/inventory'),
          api.get('/inventory/transfers')
        ]);
        const prods = invRes.data || [];
        const transfers = trfRes.data || [];

        const totalProds = prods.length;
        const totalRawMats = prods.filter(p => p.category === 'Raw Materials').length;
        const lowStock = prods.filter(p => p.currentStock <= p.reorderLevel && p.currentStock > 0).length;
        const outOfStock = prods.filter(p => p.currentStock === 0).length;
        const reservedStock = prods.reduce((sum, p) => sum + p.reservedStock, 0);
        const incoming = transfers.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.qty, 0);
        const outgoing = transfers.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.qty, 0); // Mock
        const totalValue = prods.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);

        // Distribution
        const raw = prods.filter(p => p.category === 'Raw Materials').reduce((sum, p) => sum + p.currentStock, 0);
        const finished = prods.filter(p => p.category === 'Finished Goods').reduce((sum, p) => sum + p.currentStock, 0);
        const consumables = prods.filter(p => p.category === 'Consumables').reduce((sum, p) => sum + p.currentStock, 0);
        const packaging = prods.filter(p => p.category === 'Packaging Materials').reduce((sum, p) => sum + p.currentStock, 0);

        setStats({
          totalProds, totalRawMats, lowStock, outOfStock, reservedStock, incoming, outgoing, totalValue
        });
        setDistribution({ raw, finished, consumables, packaging });
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalDistQty = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <Layers size={24} style={{ color: 'var(--color-primary)' }} />
              Inventory Central Dashboard
            </h2>
            <p className="inventory-sub">Enterprise stock monitoring, replenishment schedules, and transfers control.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => navigate('/inventory/transfers')}>
              <ArrowRightLeft size={14} /> Stock Transfer
            </button>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/inventory/adjustments')}>
              <Settings size={14} /> Stock Adjustment
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading Dashboard Data...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="purchase-kpi-grid">
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><Package size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.totalProds}</div>
                  <div className="purchase-kpi-label">Total Products Tracked</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><Layers size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.totalRawMats}</div>
                  <div className="purchase-kpi-label">Total Raw Materials</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--warning"><AlertTriangle size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.lowStock}</div>
                  <div className="purchase-kpi-label">Low Stock Items</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--error"><AlertTriangle size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.outOfStock}</div>
                  <div className="purchase-kpi-label">Out of Stock Items</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--warning"><Activity size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.reservedStock}</div>
                  <div className="purchase-kpi-label">Reserved Stock Qty</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><Plus size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.incoming}</div>
                  <div className="purchase-kpi-label">Incoming Stock</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><ArrowRightLeft size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.outgoing}</div>
                  <div className="purchase-kpi-label">Outgoing Stock</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--green"><TrendingUp size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">₹{stats.totalValue.toLocaleString()}</div>
                  <div className="purchase-kpi-label">Inventory Valuation</div>
                </div>
              </div>
            </div>

            {/* Split Visual Section */}
            <div className="purchase-split-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              
              {/* Category Distribution */}
              <div className="inventory-panel">
                <div className="inventory-panel-header">
                  <h3 className="inventory-panel-title">Stock Value Distribution</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', flex: 1 }}>
                  {[
                    { name: 'Raw Materials', val: distribution.raw, color: 'var(--color-primary)' },
                    { name: 'Finished Goods', val: distribution.finished, color: 'var(--color-secondary)' },
                    { name: 'Consumables', val: distribution.consumables, color: 'var(--color-amber)' },
                    { name: 'Packaging Materials', val: distribution.packaging, color: 'var(--color-success)' }
                  ].map((cat, idx) => {
                    const pct = Math.round((cat.val / totalDistQty) * 100);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '130px', fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>{cat.name}</span>
                        <div style={{ flex: 1, height: '8px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 'var(--radius-full)' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Movement Trends simulation */}
              <div className="inventory-panel">
                <div className="inventory-panel-header">
                  <h3 className="inventory-panel-title">Fulfillment Activity Trend</h3>
                </div>
                <div className="inventory-chart-container">
                  {[
                    { day: 'Mon', qty: 120 }, { day: 'Tue', qty: 240 },
                    { day: 'Wed', qty: 180 }, { day: 'Thu', qty: 320 },
                    { day: 'Fri', qty: 290 }, { day: 'Sat', qty: 150 },
                    { day: 'Sun', qty: 80 }
                  ].map((d, i) => {
                    const maxQty = 350;
                    const pct = (d.qty / maxQty) * 100;
                    return (
                      <div key={i} className="inventory-chart-bar-group">
                        <div className="inventory-chart-bar" data-value={`${d.qty} transactions`} style={{ height: `${pct}%` }} />
                        <span style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '8px', fontWeight: 600 }}>{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="inventory-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/inventory/transfers')}>
                  + Stock Transfer
                </button>
                <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/inventory/adjustments')}>
                  + Stock Adjustment
                </button>
                <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/inventory/alerts')}>
                  <AlertTriangle size={14} /> View Low Stock
                </button>
                <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/inventory/ledger')}>
                  <ClipboardList size={14} /> View Stock Ledger
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
