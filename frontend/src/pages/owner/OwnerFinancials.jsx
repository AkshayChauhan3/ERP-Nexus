import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Award, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerFinancials() {
  const [bills, setBills] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setBills(purchaseApi.getBills());
      setSales(salesApi.getOrders());
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRevenue = sales.reduce((sum, order) => sum + order.amount, 0);
  const totalBillsAmount = bills.reduce((sum, b) => sum + b.amount, 0);
  
  // Expenses = paid bills + unpaid bills + general business overhead of 25,000
  const generalOverhead = 25000;
  const totalExpenses = totalBillsAmount + generalOverhead;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const handlePayBill = (billId) => {
    const updated = bills.map(b => {
      if (b.id === billId) {
        return { ...b, status: 'Paid' };
      }
      return b;
    });
    purchaseApi.saveBills(updated);
    
    // Log in audit log
    const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    const userEmail = authData?.user?.email || 'owner@erp-nexus.local';
    
    auditLogs.unshift({
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      user: userEmail,
      module: 'Business Owner Operations',
      action: 'Record Vendor Bill Payment',
      old_value: `Bill: ${billId} (Status: Submitted)`,
      new_value: `Status: Paid`
    });
    localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
    
    // Sync the PO status too
    const poList = purchaseApi.getPOs();
    const targetBill = bills.find(b => b.id === billId);
    if (targetBill) {
      const idx = poList.findIndex(p => p.id === targetBill.poId);
      if (idx !== -1) {
        poList[idx].billStatus = 'Paid';
        purchaseApi.savePOs(poList);
      }
    }
    
    loadData();
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <DollarSign size={22} style={{ color: 'var(--color-primary)' }} />
              Financial Summary
            </h2>
            <p className="owner-sub">Consolidated income statement, vendor bills ledger and cash-flow overview.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadData}>
            <RefreshCw size={14} /> Refresh Financials
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Aggregating financial journals...</div>
          </div>
        ) : (
          <>
            {/* Financial Health KPIs */}
            <div className="owner-card-grid">
              <div className="owner-card">
                <span className="purchase-kpi-label">Total Revenue (Monthly)</span>
                <h3 className="purchase-kpi-val" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ₹{totalRevenue.toLocaleString()} <ArrowUpRight size={18} />
                </h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Total Operating Outlay</span>
                <h3 className="purchase-kpi-val" style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ₹{totalExpenses.toLocaleString()} <ArrowDownRight size={18} />
                </h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Net Projected Profit</span>
                <h3 className="purchase-kpi-val" style={{ color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                  ₹{netProfit.toLocaleString()}
                </h3>
              </div>
              <div className="owner-card">
                <span className="purchase-kpi-label">Gross Margin</span>
                <h3 className="purchase-kpi-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {profitMargin}% <Award size={18} style={{ color: 'var(--color-amber)' }} />
                </h3>
              </div>
            </div>

            {/* Split Section */}
            <div className="purchase-split-grid">
              {/* Unpaid Vendor Bills (Owner Payment Controls) */}
              <div className="purchase-panel" style={{ flex: 1.5 }}>
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">Vendor Invoices & Payment Approvals</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="purchase-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Bill ID</th>
                        <th>PO Ref</th>
                        <th>Invoice No</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 'bold' }}>{b.id}</td>
                          <td>{b.poId}</td>
                          <td>{b.invoiceNo}</td>
                          <td>{b.dueDate}</td>
                          <td style={{ fontWeight: 600 }}>₹{b.amount.toLocaleString()}</td>
                          <td>
                            <span className={`health-chip ${b.status === 'Paid' ? 'health-chip--green' : 'health-chip--amber'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            {b.status !== 'Paid' ? (
                              <button
                                className="btn btn--primary"
                                style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--color-success)', color: '#fff' }}
                                onClick={() => handlePayBill(b.id)}
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> Settled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Ledger breakdown */}
              <div className="purchase-panel" style={{ flex: 1 }}>
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">Consolidated Ledger Details</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Gross Sales Orders:</span>
                    <span>₹{totalRevenue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Vendor Bills (Outlays):</span>
                    <span>₹{totalBillsAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Logistics & Overhead:</span>
                    <span>₹{generalOverhead.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: '4px' }}>
                    <span>Total Operating Income:</span>
                    <span style={{ color: 'var(--color-success)' }}>₹{netProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
