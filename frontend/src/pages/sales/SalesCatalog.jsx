import { useState, useEffect } from 'react';
import { Package, Search, Filter } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function SalesCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/products');
        setCatalog(res.data || []);
      } catch (err) {
        console.error('Failed to load catalog', err);
      }
    };
    loadData();
  }, []);

  const categories = ['All', 'Finished Goods', 'Raw Materials', 'Consumables'];

  const filtered = catalog.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    
    let typeMatch = false;
    if (categoryFilter === 'All') {
      typeMatch = true;
    } else if (categoryFilter === 'Finished Goods' && p.type === 'FINISHED_GOOD') {
      typeMatch = true;
    } else if (categoryFilter === 'Raw Materials' && p.type === 'RAW_MATERIAL') {
      typeMatch = true;
    } else if (categoryFilter === 'Consumables' && p.type === 'CONSUMABLE') {
      typeMatch = true;
    }
    
    return matchSearch && typeMatch;
  });

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <Package size={22} style={{ color: 'var(--color-primary)' }} />
              Product Catalog
            </h2>
            <p className="sales-sub">Look up available finished stock, reserved units, and standard list price policies.</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="purchase-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search catalog products..."
                className="purchase-input"
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={14} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Category Filter:</span>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-low)', padding: '2px', borderRadius: 'var(--radius-full)' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      background: categoryFilter === cat ? 'var(--color-primary)' : 'none',
                      color: categoryFilter === cat ? 'var(--color-on-primary)' : 'var(--color-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="purchase-panel">
          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Standard Price</th>
                  <th>Available Stock</th>
                  <th>Reserved Stock</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const onHand = Number(p.inventory?.on_hand_qty || 0);
                  const reserved = Number(p.inventory?.reserved_qty || 0);
                  const available = Math.max(0, onHand - reserved);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.sku || 'N/A'}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{p.type.replace('_', ' ').toLowerCase()}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(p.sales_price).toLocaleString()}</td>
                      <td>{available} units</td>
                      <td style={{ color: 'var(--color-secondary)' }}>{reserved} units</td>
                      <td>
                        {available > 5 ? (
                          <span className="purchase-badge purchase-badge--success">In Stock</span>
                        ) : available > 0 ? (
                          <span className="purchase-badge purchase-badge--warning">Low Stock</span>
                        ) : (
                          <span className="purchase-badge purchase-badge--error">Out of Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
