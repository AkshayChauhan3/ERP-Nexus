import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Save, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { ownerApi } from '../../utils/ownerApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerSettings() {
  const [form, setForm] = useState({
    companyName: '',
    logo: '',
    businessAddress: '',
    gstNumber: '',
    emailServer: '',
    notificationsEnabled: true,
    alertThreshold: 15
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = ownerApi.getSettings();
    setForm(data);
    setLoading(false);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    ownerApi.saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Settings size={22} style={{ color: 'var(--color-primary)' }} />
              System Settings & Profile
            </h2>
            <p className="owner-sub">Administer company configurations, regional tax details, global alert boundaries, and SMTP preferences.</p>
          </div>
        </div>

        {saved && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-success-container)',
            color: 'var(--color-on-success-container)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            <CheckCircle size={16} /> Configurations successfully persisted to global state.
          </div>
        )}

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading workspace settings...</div>
          </div>
        ) : (
          <form className="purchase-panel" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">ERP Workspace Parameters</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>Registered Company Name</label>
                  <input
                    type="text"
                    className="register-input"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>GSTIN Registration Number</label>
                  <input
                    type="text"
                    className="register-input"
                    value={form.gstNumber}
                    onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>Business Address</label>
                  <textarea
                    className="register-input"
                    style={{ height: '78px', padding: '10px', resize: 'none' }}
                    value={form.businessAddress}
                    onChange={e => setForm({ ...form, businessAddress: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>Logo Asset URL</label>
                  <input
                    type="text"
                    className="register-input"
                    value={form.logo}
                    onChange={e => setForm({ ...form, logo: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>SMTP Mail Server Host</label>
                  <input
                    type="text"
                    className="register-input"
                    value={form.emailServer}
                    onChange={e => setForm({ ...form, emailServer: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>Stock Alert Threshold</label>
                    <input
                      type="number"
                      className="register-input"
                      value={form.alertThreshold}
                      onChange={e => setForm({ ...form, alertThreshold: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={form.notificationsEnabled}
                        onChange={e => setForm({ ...form, notificationsEnabled: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable Alerts
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn btn--primary" style={{ gap: '8px' }}>
                <Save size={16} /> Save Configurations
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
