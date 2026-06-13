import { useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import './Products.css';

const PRODUCTS = [
  {
    id: 'SKU-001',
    name: 'Artisan Oak Dining Table',
    category: 'Furniture',
    price: '₹42,000',
    onHand: 25,
    reserved: 8,
    free: 17,
    type: 'Manufacturing',
    typeColor: 'purple',
    emoji: '🪵',
    status: 'active',
  },
  {
    id: 'SKU-002',
    name: 'Ergonomic Office Chair',
    category: 'Seating',
    price: '₹18,500',
    onHand: 0,
    reserved: 0,
    free: 0,
    type: 'Purchase',
    typeColor: 'blue',
    emoji: '🪑',
    status: 'out',
  },
  {
    id: 'SKU-003',
    name: 'Modular Bookshelf Unit',
    category: 'Storage',
    price: '₹12,000',
    onHand: 7,
    reserved: 3,
    free: 4,
    type: 'Manufacturing',
    typeColor: 'purple',
    emoji: '📚',
    status: 'low',
  },
  {
    id: 'SKU-004',
    name: 'Teak Wood Coffee Table',
    category: 'Furniture',
    price: '₹28,750',
    onHand: 42,
    reserved: 10,
    free: 32,
    type: 'Purchase',
    typeColor: 'blue',
    emoji: '☕',
    status: 'active',
  },
  {
    id: 'SKU-005',
    name: 'Steel Frame Bed (Queen)',
    category: 'Bedroom',
    price: '₹35,000',
    onHand: 5,
    reserved: 5,
    free: 0,
    type: 'Manufacturing',
    typeColor: 'purple',
    emoji: '🛏️',
    status: 'low',
  },
  {
    id: 'SKU-006',
    name: 'Executive Work Desk',
    category: 'Office',
    price: '₹22,000',
    onHand: 18,
    reserved: 4,
    free: 14,
    type: 'Manufacturing',
    typeColor: 'purple',
    emoji: '🖥️',
    status: 'active',
  },
];

const FILTERS = [
  { key: 'all',      label: 'All Products' },
  { key: 'low',      label: 'Low Stock' },
  { key: 'out',      label: 'Out of Stock' },
];

export default function Products() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const filtered = PRODUCTS.filter(p => {
    if (activeFilter === 'low' && p.status !== 'low') return false;
    if (activeFilter === 'out' && p.status !== 'out') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AppShell>
      <div className="products-page animate-page">
        {}
        <div className="products-header">
          <div>
            <h2 className="text-display-lg products-title">Products</h2>
            <p className="products-subtitle">Master inventory catalog — {PRODUCTS.length} items total</p>
          </div>
          <button id="btn-new-product" className="products-new-btn btn-interactive">
            <Plus size={16} strokeWidth={2.5} />
            New Product
          </button>
        </div>

        {}
        <div className="products-controls">
          {}
          <div className="filter-pills">
            {FILTERS.map(f => (
              <button
                key={f.key}
                id={`filter-${f.key}`}
                className={`filter-pill ${activeFilter === f.key ? 'filter-pill--active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {}
          <div className={`products-search ${searchExpanded ? 'products-search--expanded' : ''}`}>
            <Search size={16} strokeWidth={1.75} className="products-search-icon" />
            <input
              id="product-search"
              type="search"
              placeholder="Search products or SKU…"
              className="products-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => setSearchExpanded(false)}
            />
          </div>
        </div>

        {}
        <div className="products-table-wrapper animate-page stagger-2">
          <table className="products-table">
            <thead>
              <tr>
                <th className="products-th">
                  <span className="th-content">Product <ArrowUpDown size={12} /></span>
                </th>
                <th className="products-th">SKU</th>
                <th className="products-th">Price</th>
                <th className="products-th">
                  <span className="th-content">Inventory <ArrowUpDown size={12} /></span>
                </th>
                <th className="products-th">Type</th>
                <th className="products-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr
                  key={product.id}
                  id={`product-row-${product.id.toLowerCase()}`}
                  className={`products-tr hover-row animate-page stagger-${Math.min(i + 1, 6)}`}
                >
                  {}
                  <td className="products-td">
                    <div className="product-cell">
                      <div className="product-thumbnail">
                        <span className="product-emoji">{product.emoji}</span>
                      </div>
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-category">{product.category}</span>
                      </div>
                    </div>
                  </td>

                  {}
                  <td className="products-td">
                    <span className="product-sku">{product.id}</span>
                  </td>

                  {}
                  <td className="products-td">
                    <span className="product-price">{product.price}</span>
                  </td>

                  {}
                  <td className="products-td">
                    <div className="inventory-badges">
                      <span className="inv-item">
                        <span className="inv-label">On Hand</span>
                        <span className={`inv-value ${product.onHand === 0 ? 'inv-value--zero' : ''}`}>
                          {product.onHand}
                        </span>
                      </span>
                      <span className="inv-sep">·</span>
                      <span className="inv-item">
                        <span className="inv-label">Reserved</span>
                        <span className="inv-value">{product.reserved}</span>
                      </span>
                      <span className="inv-sep">·</span>
                      <span className="inv-item">
                        <span className="inv-label">Free</span>
                        <span className={`inv-value ${product.free === 0 ? 'inv-value--zero' : 'inv-value--free'}`}>
                          {product.free}
                        </span>
                      </span>
                    </div>
                  </td>

                  {}
                  <td className="products-td">
                    <span className={`badge badge--${product.typeColor}`}>{product.type}</span>
                  </td>

                  {}
                  <td className="products-td">
                    <div className="product-actions">
                      <button className="product-action-btn" id={`edit-${product.id.toLowerCase()}`}>Edit</button>
                      <button className="product-action-btn product-action-btn--ghost">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="products-empty">
              <span style={{ fontSize: 40 }}>📦</span>
              <p>No products found matching your filters.</p>
            </div>
          )}
        </div>

        {}
        <div className="pagination animate-page stagger-3">
          <p className="pagination-info">
            Showing <strong>1 to {filtered.length}</strong> of <strong>42</strong> products
          </p>
          <div className="pagination-controls">
            <button className="page-btn" id="page-prev" disabled>
              <ChevronLeft size={16} />
            </button>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} id={`page-${n}`} className={`page-btn ${n === 1 ? 'page-btn--active' : ''}`}>
                {n}
              </button>
            ))}
            <button className="page-btn" id="page-next">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
