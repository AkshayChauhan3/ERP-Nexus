import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Search, Filter, Download, Eye } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvOverview() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    setProducts(inventoryApi.getProducts());
    setWarehouses(inventoryApi.getWarehouses());
  }, []);

  const handleExport = (type) => {
    alert(`Exporting Inventory Overview as ${type} format...\nDownload Successful.`);
  };

  const getStatus = (p) => {
    if (p.currentStock === 0) return { label: 'Out of Stock', cls: 'red' };
    if (p.currentStock <= p.reorderLevel) return { label: 'Low Stock', cls: 'orange' };
    return { label: 'Stable', cls: 'green' };
  };

  const categories = ['All', 'Raw Materials', 'Finished Goods', 'Consumables', 'Packaging Materials'];

  // Filter and Sort Logic
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchWH = selectedWarehouse === 'All' || p.warehouseId === selectedWarehouse;
    return matchSearch && matchCat && matchWH;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'code') return a.code.localeCompare(b.code);
    if (sortBy === 'stock') return b.currentStock - a.currentStock;
    return 0;
  });

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <Layers size={22} style={{ color: 'var(--color-primary)' }} />
              Inventory Overview
            </h2>
            <p className="inventory-sub">Complete real-time stock levels across all categories and warehouse locations.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => handleExport('Excel')}>
              <Download size={14} /> Export Excel
            </button>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => handleExport('PDF')}>
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="inventory-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search by code or name..."
                className="purchase-input"
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Category:</span>
                <select className="purchase-input" style={{ width: '150px', padding: '6px 12px' }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Warehouse:</span>
                <select className="purchase-input" style={{ width: '180px', padding: '6px 12px' }} value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                  <option value="All">All Warehouses</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Sort By:</span>
                <select className="purchase-input" style={{ width: '120px', padding: '6px 12px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="name">Name</option>
                  <option value="code">Product Code</option>
                  <option value="stock">Current Stock</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="inventory-panel">
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th>Current Stock</th>
                  <th>Reserved Stock</th>
                  <th>Available Stock</th>
                  <th>Reorder Level</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = getStatus(p);
                  const wh = warehouses.find(w => w.id === p.warehouseId)?.name || p.warehouseId;
                  const available = p.currentStock - p.reservedStock;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.code}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{wh}</td>
                      <td>{p.currentStock}</td>
                      <td>{p.reservedStock}</td>
                      <td style={{ fontWeight: 700 }}>{available}</td>
                      <td>{p.reorderLevel}</td>
                      <td>{p.unit}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                          <span className={`status-pill status-pill--${status.cls}`} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => navigate(`/inventory/products?id=${p.id}`)}>
                          <Eye size={12} /> View Details
                        </button>
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
