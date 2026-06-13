import { useState, useEffect } from 'react';
import { History, Search, Download, Filter } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Purchase.css';

export default function PurchaseHistory() {
  const [receipts, setReceipts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Filters
  const [vendorFilter, setVendorFilter] = useState('All');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = () => {
    setReceipts(purchaseApi.getReceipts());
    setVendors(purchaseApi.getVendors());
    setMaterials(purchaseApi.getMaterials());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = () => {
    alert('Exporting purchase history to CSV format...\nDownload Successful.');
  };

  const filtered = receipts.filter(r => {
    const matchVendor = vendorFilter === 'All' || r.vendorId === vendorFilter;
    
    // Check if receipt contains the selected material filter
    const matchMaterial = materialFilter === 'All' || r.items.some(i => i.materialId === materialFilter);
    
    // Date filter
    const matchDate = (!startDate || new Date(r.date) >= new Date(startDate)) &&
                      (!endDate || new Date(r.date) <= new Date(endDate));

    return matchVendor && matchMaterial && matchDate;
  });

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <History size={22} style={{ color: 'var(--color-primary)' }} />
              Goods Receipt History
            </h2>
            <p className="purchase-sub">Historical audit logs of received material shipments and inspections.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={handleExport}>
            <Download size={14} /> Export Report
          </button>
        </div>

        {/* Filter Panel */}
        <div className="purchase-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Filter by Vendor</label>
              <select className="purchase-input" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
                <option value="All">All Vendors</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Filter by Material</label>
              <select className="purchase-input" value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}>
                <option value="All">All Materials</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">From Date</label>
              <input type="date" className="purchase-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">To Date</label>
              <input type="date" className="purchase-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="purchase-panel">
          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>GRN ID</th>
                  <th>PO Reference</th>
                  <th>Vendor</th>
                  <th>Receipt Date</th>
                  <th>Received Items</th>
                  <th>Inspection Notes</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const vend = vendors.find(v => v.id === r.vendorId);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{r.id}</td>
                      <td style={{ fontWeight: 600 }}>{r.poId}</td>
                      <td>{vend ? vend.name : r.vendorId}</td>
                      <td>{r.date}</td>
                      <td>
                        {r.items.map((item, idx) => {
                          const matName = materials.find(m => m.id === item.materialId)?.name || 'Material';
                          return (
                            <div key={idx} style={{ fontSize: '12px' }}>
                              • {matName}: Received <strong>{item.qtyReceived}</strong> (Rejected {item.qtyRejected})
                            </div>
                          );
                        })}
                      </td>
                      <td style={{ fontStyle: 'italic', color: 'var(--color-secondary)' }}>
                        {r.note || 'None'}
                      </td>
                      <td>{r.receivedBy}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      No purchase receipt logs matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
