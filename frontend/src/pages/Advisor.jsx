import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, AlertCircle, RefreshCw, ChevronRight, CheckCircle, 
  Sparkles, ShoppingBag, X, Check, ArrowRight, Clock, ShieldCheck
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { api } from '../utils/api';
import '../styles/Owner.css';
import '../styles/Purchase.css';

export default function Advisor() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active PO Creation Modal State
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedRecForPo, setSelectedRecForPo] = useState(null);
  const [vendorsList, setVendorsList] = useState([]);
  const [creatingPo, setCreatingPo] = useState(false);
  const [poForm, setPoForm] = useState({
    productId: '',
    productName: '',
    vendorId: '',
    qty: 10,
    unitPrice: 100,
    deliveryDate: '',
    unit: 'units',
    remarks: ''
  });

  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  const userRole = authData?.user?.role || '';

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.get('/intelligence/advisor');
      const recs = response?.data || response;
      if (Array.isArray(recs) && recs.length > 0) {
        setRecommendations(recs);
      } else {
        setRecommendations([]);
        setError('All operations are currently running smoothly! No outstanding bottlenecks detected for your role.');
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || 'Could not connect to the advisor service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // Load vendors in background for PO creation modal
    api.get('/vendors')
      .then(res => {
        const vList = res.data || res || [];
        setVendorsList(vList);
      })
      .catch(() => {});
  }, []);

  const handleActionClick = (rec) => {
    const actionType = rec.action_type || '';
    const label = (rec.action_label || '').toLowerCase();
    const payload = rec.action_payload || {};

    // 1. Create PO Action (prefill and open modal)
    if (actionType === 'CREATE_PO' || label.includes('po') || label.includes('procure')) {
      const defaultVendorId = payload.vendorId || (vendorsList[0]?.id || '');
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const deliveryDateStr = d.toISOString().split('T')[0];

      setPoForm({
        productId: payload.productId || '',
        productName: payload.productName || 'Raw Material',
        vendorId: defaultVendorId,
        qty: payload.suggestedQty || 10,
        unitPrice: payload.costPrice || 150,
        deliveryDate: deliveryDateStr,
        unit: payload.unit || 'units',
        remarks: `Auto-generated via EN Advisor recommendation for ${payload.productName || 'stock replenishment'}.`
      });
      setSelectedRecForPo(rec);
      setPoModalOpen(true);
      return;
    }

    // 2. View Work Orders
    if (actionType === 'VIEW_WORK_ORDERS' || label.includes('work order') || label.includes('mo')) {
      navigate(userRole === 'owner' ? '/owner/manufacturing' : '/manufacturing/work-orders');
      return;
    }

    // 3. View Analytics
    if (actionType === 'VIEW_ANALYTICS' || label.includes('analytic')) {
      if (userRole === 'owner') {
        navigate('/owner/financials');
      } else if (userRole === 'sales') {
        navigate('/sales/analytics');
      } else {
        navigate('/reports');
      }
      return;
    }

    // 4. Other Target Navigation
    if (payload.targetPath) {
      navigate(payload.targetPath);
      return;
    }

    // Fallback based on text
    if (label.includes('inventory') || label.includes('stock')) {
      navigate(userRole === 'owner' ? '/owner/inventory' : (userRole === 'purchase' ? '/purchase/materials' : '/inventory/overview'));
    } else if (label.includes('order') || label.includes('sale') || label.includes('delivery')) {
      navigate(userRole === 'owner' ? '/owner/sales' : '/sales/orders');
    } else {
      navigate(userRole === 'owner' ? '/owner/dashboard' : '/dashboard');
    }
  };

  const handleCreatePoSubmit = async (e) => {
    e.preventDefault();
    if (!poForm.vendorId) {
      alert('Please select a supplier for this Purchase Order.');
      return;
    }

    setCreatingPo(true);
    try {
      // 1. Create real purchase order in database
      const res = await api.post('/purchase-orders', {
        vendor_id: poForm.vendorId,
        remarks: poForm.remarks,
        lines: [
          {
            product_id: poForm.productId,
            ordered_qty: Number(poForm.qty),
            unit_price: Number(poForm.unitPrice)
          }
        ]
      });

      const poNumber = res?.data?.po_number || 'PO-NEW';

      // 2. Resolve the recommendation on the backend
      if (selectedRecForPo?.id) {
        await api.post('/intelligence/advisor/resolve', {
          recommendationKey: selectedRecForPo.id,
          actionType: 'PO_CREATED'
        }).catch(() => {});
      }

      // 3. Automatically remove recommendation from active UI list
      setRecommendations(prev => prev.filter(r => r.id !== selectedRecForPo?.id));
      setPoModalOpen(false);
      setSelectedRecForPo(null);

      // 4. Show success banner
      setSuccessMessage(`Draft Purchase Order ${poNumber} generated successfully! Task marked resolved.`);
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      alert(err.message || 'Failed to generate Purchase Order. Recommendation remains pending.');
    } finally {
      setCreatingPo(false);
    }
  };

  const handleManualResolve = async (rec) => {
    try {
      await api.post('/intelligence/advisor/resolve', {
        recommendationKey: rec.id,
        actionType: 'MANUAL_RESOLVED'
      });
      setRecommendations(prev => prev.filter(r => r.id !== rec.id));
      setSuccessMessage(`Recommendation "${rec.title}" marked as resolved.`);
    } catch (err) {
      console.error('Failed to resolve recommendation:', err);
    }
  };

  const getPriorityStyle = (priority = '') => {
    const p = (priority || '').toLowerCase();
    if (p.includes('high') || p.includes('urgent')) {
      return { bg: 'rgba(211, 47, 47, 0.12)', color: '#d32f2f', border: '1px solid rgba(211, 47, 47, 0.3)' };
    }
    if (p.includes('medium') || p.includes('mod')) {
      return { bg: 'rgba(245, 124, 0, 0.12)', color: '#f57c00', border: '1px solid rgba(245, 124, 0, 0.3)' };
    }
    return { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', border: '1px solid rgba(46, 125, 50, 0.3)' };
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)', color: '#ffd700', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} fill="#ffd700" />
            </div>
            <div>
              <h2 className="owner-title" style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                EN Advisor
                <span style={{ fontSize: '11px', background: 'rgba(255, 215, 0, 0.2)', color: '#b8860b', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  AI + Live Heuristics
                </span>
              </h2>
              <p className="owner-sub" style={{ margin: 0 }}>
                Real-time autonomous recommendations synthesized across Inventory, Manufacturing, and Sales streams for your role ({userRole.toUpperCase()}).
              </p>
            </div>
          </div>
          <button 
            className="btn btn--secondary" 
            style={{ gap: '6px' }}
            onClick={fetchRecommendations}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Analyzing ERP...' : 'Refresh Insights'}
          </button>
        </div>

        {/* Success Feedback Banner */}
        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            marginBottom: '20px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            color: '#15803d',
            fontSize: '13px',
            fontWeight: 500
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} />
              <span>{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage('')} 
              style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: '4px' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Content Cards */}
        {loading ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={36} className="spin" style={{ margin: '0 auto 16px auto', display: 'block', color: 'var(--color-primary)' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>Analyzing Live ERP Data Stream...</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>Checking stock thresholds, production bottlenecks, and delivery commitments against your role permissions.</div>
          </div>
        ) : error && recommendations.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--color-outline-variant)' }}>
            <CheckCircle size={32} style={{ color: 'var(--color-success)', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>All Operations In Good Health</h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--color-secondary)', fontSize: '13px' }}>{error}</p>
            <button className="btn btn--primary" onClick={fetchRecommendations}>Re-scan ERP</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {recommendations.map((rec, idx) => {
              const priorityStyle = getPriorityStyle(rec.priority);
              return (
                <div 
                  key={rec.id || idx} 
                  className="purchase-panel" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    background: 'var(--color-surface, #ffffff)', 
                    border: '1px solid var(--color-outline-variant, #e0e0e0)', 
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        backgroundColor: priorityStyle.bg, 
                        color: priorityStyle.color,
                        border: priorityStyle.border
                      }}>
                        {rec.priority}
                      </span>
                      <Sparkles size={16} style={{ color: '#f59e0b', opacity: 0.8 }} />
                    </div>
                    
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '17px', fontWeight: 700, color: 'var(--color-on-surface, #1a1a1a)' }}>
                      {rec.title}
                    </h3>
                    
                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-secondary, #555)', lineHeight: '1.6' }}>
                      {rec.description}
                    </p>
                  </div>

                  <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant, #eee)', display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn--primary btn-interactive" 
                      onClick={() => handleActionClick(rec)}
                      style={{ 
                        flex: 1,
                        borderRadius: '10px', 
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                      <span>{rec.action_label ? rec.action_label.replace('>', '').trim() : 'Execute Action'}</span>
                      <ChevronRight size={15} />
                    </button>
                    <button
                      onClick={() => handleManualResolve(rec)}
                      title="Mark as Resolved"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--color-outline-variant, #cbd5e1)',
                        borderRadius: '10px',
                        padding: '0 12px',
                        color: 'var(--color-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dedicated Prefilled Purchase Order Modal (Rendered via React Portal) */}
        {poModalOpen && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
            onClick={() => !creatingPo && setPoModalOpen(false)}
          >
            <div
              style={{
                background: 'var(--color-canvas, #ffffff)',
                borderRadius: 'var(--radius-xl, 16px)',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                border: '1px solid var(--color-outline-variant, #e5e7eb)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--color-outline-variant, #e5e7eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(37, 99, 235, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: 'var(--color-primary, #2563eb)' }}>
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      Generate Purchase Order
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-secondary)' }}>
                      Prefilled from EN Advisor intelligent replenishment trigger
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !creatingPo && setPoModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-secondary)',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Close"
                  disabled={creatingPo}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreatePoSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Product Display */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                      Material / Product
                    </label>
                    <input
                      type="text"
                      value={poForm.productName}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-outline-variant, #cbd5e1)',
                        background: '#f8fafc',
                        fontSize: '13px',
                        color: 'var(--color-primary)',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Supplier Selection */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                      Supplier / Vendor *
                    </label>
                    <select
                      value={poForm.vendorId}
                      onChange={e => setPoForm({ ...poForm, vendorId: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-outline-variant, #cbd5e1)',
                        fontSize: '13px',
                        color: 'var(--color-primary)',
                        background: '#fff'
                      }}
                    >
                      {vendorsList.length === 0 && <option value="">Loading vendors...</option>}
                      {vendorsList.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.phone || v.email || 'Supplier'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Unit Cost Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                        Order Quantity ({poForm.unit}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={poForm.qty}
                        onChange={e => setPoForm({ ...poForm, qty: Math.max(1, Number(e.target.value)) })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-outline-variant, #cbd5e1)',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                        Unit Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={poForm.unitPrice}
                        onChange={e => setPoForm({ ...poForm, unitPrice: Math.max(0, Number(e.target.value)) })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-outline-variant, #cbd5e1)',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Order Total Highlight */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-secondary)', fontWeight: 500 }}>
                      Estimated Order Value:
                    </span>
                    <span style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: 700 }}>
                      ₹{(Number(poForm.qty) * Number(poForm.unitPrice)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Expected Delivery Date */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={poForm.deliveryDate}
                      onChange={e => setPoForm({ ...poForm, deliveryDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-outline-variant, #cbd5e1)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--color-outline-variant, #e5e7eb)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    background: '#fafafa'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPoModalOpen(false)}
                    disabled={creatingPo}
                    className="btn btn--secondary"
                    style={{ fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingPo}
                    className="btn btn--primary btn-interactive"
                    style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {creatingPo ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Creating PO...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Confirm & Generate PO</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AppShell>
  );
}
