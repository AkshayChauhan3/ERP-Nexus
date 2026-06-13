import { useState, useEffect } from 'react';
import { FileText, Search, Plus, Upload, Link, Check, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Purchase.css';

export default function PurchaseVendorBills() {
  const [bills, setBills] = useState([]);
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal Upload Form
  const [showUpload, setShowUpload] = useState(false);
  const [poId, setPoId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [fileName, setFileName] = useState('');

  const loadData = () => {
    setBills(purchaseApi.getBills());
    const allPOs = purchaseApi.getPOs();
    setPOs(allPOs);
    setVendors(purchaseApi.getVendors());
    if (allPOs.length > 0) {
      setPoId(allPOs[0].id);
      setAmount(allPOs[0].totalValue);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePoChange = (id) => {
    setPoId(id);
    const target = pos.find(p => p.id === id);
    if (target) {
      setAmount(target.totalValue);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmitBill = (e) => {
    e.preventDefault();
    const targetPO = pos.find(p => p.id === poId);
    if (!targetPO) return;

    purchaseApi.createBill({
      poId,
      vendorId: targetPO.vendorId,
      invoiceNo,
      dueDate,
      amount: Number(amount),
      attachment: fileName || 'mock_uploaded_bill.pdf'
    });

    setShowUpload(false);
    setInvoiceNo('');
    setFileName('');
    loadData();
  };

  const filtered = bills.filter(b =>
    b.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    b.poId.toLowerCase().includes(search.toLowerCase()) ||
    (vendors.find(v => v.id === b.vendorId)?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <FileText size={22} style={{ color: 'var(--color-primary)' }} />
              Vendor Bills & Invoices
            </h2>
            <p className="purchase-sub">Upload supplier invoices, link them to Purchase Orders, and submit to Admin for payment approval.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => setShowUpload(true)}>
            <Plus size={14} /> Upload Vendor Bill
          </button>
        </div>

        <div className="purchase-panel">
          <div className="purchase-panel-header">
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search invoice or PO..."
                className="purchase-input"
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>PO Link</th>
                  <th>Vendor</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Attachment</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const vend = vendors.find(v => v.id === b.vendorId);
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700 }}>{b.invoiceNo}</td>
                      <td style={{ fontWeight: 600 }}>{b.poId}</td>
                      <td>{vend ? vend.name : b.vendorId}</td>
                      <td>{b.dueDate}</td>
                      <td style={{ fontWeight: 700 }}>₹{b.amount.toLocaleString()}</td>
                      <td>
                        <a href="#" onClick={e => { e.preventDefault(); alert(`Opening PDF file attachment: ${b.attachment}`); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', textDecoration: 'underline' }}>
                          <Link size={12} /> {b.attachment}
                        </a>
                      </td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          b.status === 'Paid' ? 'success' : 'primary'
                        }`}>
                          {b.status === 'Submitted' ? 'Pending Approval' : b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Bill Modal */}
        {showUpload && (
          <div className="purchase-modal-backdrop" onClick={() => setShowUpload(false)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Upload Vendor Bill</h3>
                <button className="purchase-modal-close" onClick={() => setShowUpload(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmitBill}>
                <div className="purchase-form-group">
                  <label className="purchase-label">Link to Purchase Order</label>
                  <select className="purchase-input" value={poId} onChange={e => handlePoChange(e.target.value)}>
                    {pos.map(po => (
                      <option key={po.id} value={po.id}>{po.id} (₹{po.totalValue.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                
                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Invoice Number</label>
                    <input type="text" className="purchase-input" required placeholder="e.g. INV-2026-90" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Due Date</label>
                    <input type="date" className="purchase-input" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>

                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Invoiced Amount (₹)</label>
                    <input type="number" className="purchase-input" required value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Attach PDF / Image</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="file" id="bill-upload" style={{ display: 'none' }} accept="application/pdf,image/*" onChange={handleFileUpload} />
                      <label htmlFor="bill-upload" className="btn btn--secondary" style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', flex: 1 }}>
                        <Upload size={14} style={{ marginRight: '6px' }} /> Upload File
                      </label>
                    </div>
                    {fileName && <span style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px', display: 'block' }}>✓ {fileName}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                  <button type="submit" className="btn btn--primary" style={{ gap: '6px' }}>
                    <Check size={14} /> Submit to Owner/Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
