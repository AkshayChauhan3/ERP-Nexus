import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Zap, ArrowLeft, Truck,
  Calendar, User, MapPin, Package, ChevronRight
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import './NewSalesOrder.css';

const ORDER_ITEMS = [
  { id: 'item-1', sku: 'SKU-001', name: 'Artisan Oak Dining Table', qty: 5, unitPrice: '₹42,000', subtotal: '₹2,10,000' },
  { id: 'item-2', sku: 'SKU-002', name: 'Ergonomic Office Chair', qty: 8, unitPrice: '₹18,500', subtotal: '₹1,48,000' },
  { id: 'item-3', sku: 'SKU-006', name: 'Executive Work Desk', qty: 2, unitPrice: '₹22,000', subtotal: '₹44,000' },
];

const STOCK_CHECKS = [
  {
    id: 'stock-table',
    name: 'Artisan Oak Dining Table',
    requested: 5,
    available: 17,
    status: 'sufficient',
    note: 'Sufficient stock available',
  },
  {
    id: 'stock-chair',
    name: 'Ergonomic Office Chair',
    requested: 8,
    available: 0,
    status: 'shortage',
    note: 'Out of stock — suggests production delay',
  },
  {
    id: 'stock-desk',
    name: 'Executive Work Desk',
    requested: 2,
    available: 14,
    status: 'sufficient',
    note: 'Sufficient stock available',
  },
];

export default function NewSalesOrder() {
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState('draft'); // draft | confirmed
  const [shipAddress, setShipAddress] = useState('14-B, Nehru Industrial Estate, Mumbai - 400020');
  const [showAIPanel, setShowAIPanel] = useState(true);

  const handleConfirm = () => {
    setOrderStatus('confirmed');
  };

  return (
    <AppShell>
      <div className="nso-page animate-page">
        {/* ── Back nav ── */}
        <button className="nso-back-btn btn-interactive" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to Orders
        </button>

        {/* ── Page Title ── */}
        <div className="nso-header">
          <div>
            <div className="nso-order-meta">
              <span className="nso-order-id">SO-2024-090</span>
              <span className={`badge badge--${orderStatus === 'confirmed' ? 'success' : 'secondary'} nso-status-badge`}>
                {orderStatus === 'confirmed' ? '✓ Confirmed' : 'Draft'}
              </span>
            </div>
            <h2 className="nso-title">New Sales Order</h2>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="nso-grid">
          {/* ── Left: Order Details ── */}
          <div className="nso-main animate-page stagger-1">
            {/* Order Info */}
            <div className="nso-card">
              <h3 className="nso-card-title">Order Information</h3>
              <div className="nso-info-grid">
                <div className="nso-info-item">
                  <span className="nso-info-label"><Calendar size={13} /> Order Date</span>
                  <span className="nso-info-value">13 June 2026</span>
                </div>
                <div className="nso-info-item">
                  <span className="nso-info-label"><Calendar size={13} /> Delivery Date</span>
                  <span className="nso-info-value">25 June 2026</span>
                </div>
                <div className="nso-info-item">
                  <span className="nso-info-label"><User size={13} /> Customer</span>
                  <span className="nso-info-value">Apex Furnishings Ltd.</span>
                </div>
                <div className="nso-info-item">
                  <span className="nso-info-label"><Package size={13} /> Total Items</span>
                  <span className="nso-info-value">3 line items</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="nso-card nso-items-card">
              <h3 className="nso-card-title">Order Line Items</h3>
              <table className="nso-table">
                <thead>
                  <tr>
                    <th className="nso-th">Product</th>
                    <th className="nso-th nso-th--center">Qty</th>
                    <th className="nso-th nso-th--right">Unit Price</th>
                    <th className="nso-th nso-th--right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER_ITEMS.map((item, i) => (
                    <tr key={item.id} id={item.id} className={`nso-tr hover-row animate-page stagger-${i + 1}`}>
                      <td className="nso-td">
                        <div className="nso-product-cell">
                          <span className="nso-sku">{item.sku}</span>
                          <span className="nso-product-name">{item.name}</span>
                        </div>
                      </td>
                      <td className="nso-td nso-td--center">
                        <span className="nso-qty">{item.qty}</span>
                      </td>
                      <td className="nso-td nso-td--right">
                        <span className="nso-unit-price">{item.unitPrice}</span>
                      </td>
                      <td className="nso-td nso-td--right">
                        <span className="nso-subtotal">{item.subtotal}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="nso-total-row">
                <div className="nso-total-spacer" />
                <div className="nso-total-block">
                  <div className="nso-total-line">
                    <span>Subtotal</span>
                    <span>₹4,02,000</span>
                  </div>
                  <div className="nso-total-line">
                    <span>GST (18%)</span>
                    <span>₹72,360</span>
                  </div>
                  <div className="nso-total-divider" />
                  <div className="nso-total-line nso-total-line--grand">
                    <span>Grand Total</span>
                    <span className="nso-grand-total">₹4,74,360</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ship To */}
            <div className="nso-card nso-ship-card">
              <div className="nso-ship-header">
                <div className="nso-ship-icon"><Truck size={16} strokeWidth={1.75} /></div>
                <h3 className="nso-card-title">Shipping Address</h3>
              </div>
              <div className="nso-ship-input-wrapper">
                <MapPin size={15} className="nso-ship-pin" strokeWidth={1.75} />
                <textarea
                  className="nso-ship-textarea"
                  value={shipAddress}
                  onChange={e => setShipAddress(e.target.value)}
                  rows={2}
                  id="ship-to-address"
                />
              </div>

              {/* Action buttons */}
              <div className="nso-actions">
                <button
                  id="btn-save-draft"
                  className="nso-btn nso-btn--outline btn-interactive"
                  onClick={() => setOrderStatus('draft')}
                >
                  Save Draft
                </button>
                <button
                  id="btn-confirm-order"
                  className={`nso-btn nso-btn--solid btn-interactive ${orderStatus === 'confirmed' ? 'nso-btn--confirmed' : ''}`}
                  onClick={handleConfirm}
                >
                  {orderStatus === 'confirmed' ? (
                    <><CheckCircle size={16} /> Order Confirmed</>
                  ) : (
                    'Confirm Order'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Side Panels ── */}
          <div className="nso-sidebar">
            {/* Stock Check */}
            <div className="nso-card animate-page stagger-2">
              <h3 className="nso-card-title">Stock Availability Check</h3>
              <div className="stock-check-list">
                {STOCK_CHECKS.map(item => (
                  <div
                    key={item.id}
                    id={item.id}
                    className={`stock-check-item stock-check-item--${item.status}`}
                  >
                    <div className="stock-check-icon">
                      {item.status === 'sufficient'
                        ? <CheckCircle size={16} color="var(--color-success)" strokeWidth={2} />
                        : <XCircle size={16} color="var(--color-error)" strokeWidth={2} />
                      }
                    </div>
                    <div className="stock-check-info">
                      <span className="stock-check-name">{item.name}</span>
                      <span className="stock-check-note">{item.note}</span>
                      <div className="stock-check-numbers">
                        <span className="stock-num">
                          Req: <strong>{item.requested}</strong>
                        </span>
                        <span className="stock-num">
                          Avail:{' '}
                          <strong className={item.available === 0 ? 'stock-zero' : ''}>
                            {item.available}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Advisor */}
            {showAIPanel && (
              <div className="nso-card nso-ai-card animate-page stagger-3">
                <div className="nso-ai-header">
                  <div className="nso-ai-icon">
                    <Zap size={15} strokeWidth={2.5} />
                  </div>
                  <span className="nso-ai-label">EN Advisor</span>
                  <button
                    className="nso-ai-dismiss"
                    onClick={() => setShowAIPanel(false)}
                    aria-label="Dismiss"
                  >×</button>
                </div>
                <h4 className="nso-ai-title">
                  Shortage detected for Office Chair
                </h4>
                <p className="nso-ai-desc">
                  Suggesting a stock transfer from <strong>Warehouse B</strong> to meet the shortage of 8 units for this order by 15 Jun 2026.
                </p>
                <p className="nso-ai-desc" style={{ marginTop: 'var(--space-2)' }}>
                  Alternatively, a Manufacturing Order can be raised immediately — estimated completion by 20 Jun 2026.
                </p>
                <div className="nso-ai-actions">
                  <button id="btn-initiate-transfer" className="nso-ai-btn-primary btn-interactive">
                    Initiate Transfer
                    <ChevronRight size={14} />
                  </button>
                  <button id="btn-create-mo" className="nso-ai-btn-ghost btn-interactive">
                    Create MO
                  </button>
                </div>
              </div>
            )}

            {/* Summary card */}
            <div className="nso-card nso-summary-card animate-page stagger-4">
              <h3 className="nso-card-title">Order Summary</h3>
              <div className="nso-summary-list">
                <div className="nso-summary-item">
                  <span>Total Items</span>
                  <span className="nso-summary-value">15 units</span>
                </div>
                <div className="nso-summary-item">
                  <span>Order Value</span>
                  <span className="nso-summary-value">₹4,74,360</span>
                </div>
                <div className="nso-summary-item">
                  <span>Stock Issues</span>
                  <span className="nso-summary-value nso-summary-value--error">1 item</span>
                </div>
                <div className="nso-summary-item">
                  <span>Expected Delivery</span>
                  <span className="nso-summary-value">25 Jun 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
