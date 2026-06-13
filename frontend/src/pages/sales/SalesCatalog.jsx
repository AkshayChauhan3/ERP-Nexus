import { useState, useEffect } from 'react';
import { Package, Search, Filter } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Purchase.css';

export default function SalesCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    setCatalog(salesApi.getCatalog());
  }, []);

  const categories = ['All', 'Finished Goods', 'Raw Materials', 'Consumables'];

  const filtered = catalog.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
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
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.code}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td style={{ fontWeight: 700 }}>₹{p.price.toLocaleString()}</td>
                    <td>{p.available} units</td>
                    <td style={{ color: 'var(--color-secondary)' }}>{p.reserved} units</td>
                    <td>
                      {p.available > 5 ? (
                        <span className="purchase-badge purchase-badge--success">In Stock</span>
                      ) : p.available > 0 ? (
                        <span className="purchase-badge purchase-badge--warning">Low Stock</span>
                      ) : (
                        <span className="purchase-badge purchase-badge--error">Out of Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
