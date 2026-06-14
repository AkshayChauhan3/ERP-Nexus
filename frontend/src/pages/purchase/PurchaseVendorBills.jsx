import { useState, useEffect } from 'react';
import { FileText, Search, Plus, Upload, Link, Check, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
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

  const loadData = async () => {
    try {
      const [billsRes, posRes, vendRes] = await Promise.all([
        api.get('/purchase/bills'),
        api.get('/purchase-orders'),
        api.get('/vendors')
      ]);
      setBills(billsRes.data || []);
      const allPOs = posRes.data || [];
      setPOs(allPOs);
      setVendors(vendRes.data || []);
      if (allPOs.length > 0) {
        setPoId(allPOs[0].id);
        const totalVal = allPOs[0].lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
        setAmount(totalVal);
      }
    } catch (err) {
      console.error('Failed to load vendor bills', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePoChange = (id) => {
    setPoId(id);
    const target = pos.find(p => p.id === id);
    if (target) {
      const totalVal = target.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
      setAmount(totalVal);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitBill = async (e) => {
    e.preventDefault();
    const targetPO = pos.find(p => p.id === poId);
    if (!targetPO) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await api.post('/purchase/bills', {
        bill_number: invoiceNo,
        po_id: poId,
        vendor_id: targetPO.vendor_id,
        invoice_date: today,
        due_date: dueDate,
        subtotal: Number(amount),
        tax: 0,
        attachment_url: 'http://localhost:3000/uploads/mock_bill.pdf'
      });

      setShowUpload(false);
      setInvoiceNo('');
      setFileName('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit vendor bill');
    }
  };

  const filtered = bills.filter(b =>
    (b.bill_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.purchase_order?.po_number || b.po_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (vendors.find(v => v.id === b.vendor_id)?.name || '').toLowerCase().includes(search.toLowerCase())
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

        {successMsg && <div className="global-toast global-toast--success">{successMsg}</div>}

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
                  const vend = vendors.find(v => v.id === b.vendor_id);
                  const poNum = b.purchase_order?.po_number || b.po_id;
                  const displayStatus = b.status === 'pending_payment' ? 'Pending Approval' : 
                                       b.status === 'paid' ? 'Paid' : b.status;
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700 }}>{b.bill_number}</td>
                      <td style={{ fontWeight: 600 }}>{poNum}</td>
                      <td>{vend ? vend.name : 'Unknown'}</td>
                      <td>{new Date(b.due_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(b.total_amount || b.subtotal).toLocaleString()}</td>
                      <td>
                        <a href="#" onClick={e => { e.preventDefault(); alert(`Opening PDF file attachment: ${b.attachment_url}`); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', textDecoration: 'underline' }}>
                          <Link size={12} /> {b.attachment_url ? 'invoice.pdf' : 'N/A'}
                        </a>
                      </td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          b.status === 'paid' ? 'success' : 'primary'
                        }`} style={{ textTransform: 'capitalize' }}>
                          {displayStatus}
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
                    {pos.map(po => {
                      const totalVal = po.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
                      return (
                        <option key={po.id} value={po.id}>{po.po_number} (₹{totalVal.toLocaleString()})</option>
                      );
                    })}
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
