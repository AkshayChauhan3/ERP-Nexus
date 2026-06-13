import { useState, useEffect } from 'react';
import { Users, UserPlus, Key, Edit, Power, RefreshCw, X } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Owner.css';
import '../../styles/AdminPages.css';

const ROLE_LABELS = {
  admin: 'Admin',
  sales: 'Sales User',
  purchase: 'Purchase User',
  manufacturing: 'Manufacturing User',
  inventory: 'Inventory Manager',
  owner: 'Business Owner',
};

export default function OwnerUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [pwForm, setPwForm] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 2000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    }
  };

  const openCreateModal = () => {
    setForm({ name: '', email: '', password: '', role: 'sales' });
    setError('');
    setActiveModal('create');
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setForm({ name: user.name, email: user.email, role: user.role });
    setError('');
    setActiveModal('edit');
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPwForm({ password: '', confirmPassword: '' });
    setError('');
    setActiveModal('password');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      await api.post('/users', form);
      setActiveModal(null);
      showNotification(`User "${form.name}" created successfully.`);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      await api.put(`/users/${selectedUser.id}`, form);
      setActiveModal(null);
      showNotification(`User "${form.name}" updated successfully.`);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.post(`/users/${user.id}/toggle`);
      showNotification(`User "${user.name}" status updated.`);
      loadUsers();
    } catch (err) {
      showNotification(err.message || 'Action failed.', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (pwForm.password !== pwForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (pwForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await api.post(`/users/${selectedUser.id}/reset-password`, { password: pwForm.password });
      setActiveModal(null);
      showNotification(`Password for "${selectedUser.name}" reset successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    }
  };

  return (
    <AppShell hideSidebar={activeModal !== null}>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Users size={22} style={{ color: 'var(--color-primary)' }} />
              User Accounts Directory
            </h2>
            <p className="owner-sub">Establish and modify access profiles, credentials, and roles for ERP Nexus users.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={openCreateModal}>
            <UserPlus size={14} /> Create User Account
          </button>
        </div>

        {success && <div className="profile-drawer-success-msg" style={{ margin: 0 }}>{success}</div>}
        {error && <div className="register-error" style={{ margin: 0 }}>{error}</div>}

        <div className="purchase-panel">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              Loading directory index...
            </div>
          ) : (
            <div className="admin-table-wrapper" style={{ border: 'none' }}>
              <table className="admin-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email / Login ID</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id}>
                      <td style={{ fontWeight: 600 }}>{userItem.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{userItem.email}</td>
                      <td>{ROLE_LABELS[userItem.role] || userItem.role}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${
                          userItem.status === 'APPROVED' ? 'success' :
                          userItem.status === 'PENDING' ? 'warning' : 'error'
                        }`}>
                          {userItem.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                        {userItem.last_login ? new Date(userItem.last_login).toLocaleString() : 'Never'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button className="topbar-icon-btn" onClick={() => openEditModal(userItem)} title="Edit User" style={{ width: '30px', height: '30px' }}>
                            <Edit size={12} />
                          </button>
                          <button className="topbar-icon-btn" onClick={() => openPasswordModal(userItem)} title="Reset Password" style={{ width: '30px', height: '30px' }}>
                            <Key size={12} />
                          </button>
                          <button className="topbar-icon-btn" onClick={() => handleToggleStatus(userItem)} title={userItem.is_active ? 'Deactivate' : 'Activate'}
                            style={{ 
                              width: '30px', 
                              height: '30px', 
                              color: userItem.is_active ? 'var(--color-error)' : 'var(--color-success)',
                              borderColor: userItem.is_active ? 'var(--color-error)' : 'var(--color-success)'
                            }}
                          >
                            <Power size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create User */}
        {activeModal === 'create' && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Create New User Account</h3>
                <button className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
              </div>
              <div className="admin-modal-body">
                <form className="admin-modal-form" onSubmit={handleCreateUser}>
                  <div className="register-field">
                    <label className="register-label">Full Name</label>
                    <input type="text" className="register-input" placeholder="Enter name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="register-field">
                    <label className="register-label">Email ID (Login ID)</label>
                    <input type="email" className="register-input" placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="register-field">
                    <label className="register-label">Temporary Password</label>
                    <input type="password" className="register-input" placeholder="welcome123" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                  </div>
                  <div className="register-field">
                    <label className="register-label">Access Role</label>
                    <select className="register-input register-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-modal-actions">
                    <button type="button" className="profile-drawer-signout-btn" style={{ height: '36px', padding: '0 16px' }} onClick={() => setActiveModal(null)}>Cancel</button>
                    <button type="submit" className="dashboard-new-order-btn" style={{ height: '36px', padding: '0 16px', margin: 0 }}>Create User</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit User */}
        {activeModal === 'edit' && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Edit User Account</h3>
                <button className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
              </div>
              <div className="admin-modal-body">
                <form className="admin-modal-form" onSubmit={handleEditUser}>
                  <div className="register-field">
                    <label className="register-label">Full Name</label>
                    <input type="text" className="register-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="register-field">
                    <label className="register-label">Email ID (Login ID)</label>
                    <input type="email" className="register-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="register-field">
                    <label className="register-label">Access Role</label>
                    <select className="register-input register-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-modal-actions">
                    <button type="button" className="profile-drawer-signout-btn" style={{ height: '36px', padding: '0 16px' }} onClick={() => setActiveModal(null)}>Cancel</button>
                    <button type="submit" className="dashboard-new-order-btn" style={{ height: '36px', padding: '0 16px', margin: 0 }}>Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reset Password */}
        {activeModal === 'password' && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Reset User Password</h3>
                <button className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
              </div>
              <div className="admin-modal-body">
                <form className="admin-modal-form" onSubmit={handleResetPassword}>
                  <p style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Resetting password for: <strong>{selectedUser?.name}</strong></p>
                  <div className="register-field">
                    <label className="register-label">New Password</label>
                    <input type="password" className="register-input" placeholder="Enter new password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} required />
                  </div>
                  <div className="register-field">
                    <label className="register-label">Confirm New Password</label>
                    <input type="password" className="register-input" placeholder="Confirm password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
                  </div>
                  <div className="admin-modal-actions">
                    <button type="button" className="profile-drawer-signout-btn" style={{ height: '36px', padding: '0 16px' }} onClick={() => setActiveModal(null)}>Cancel</button>
                    <button type="submit" className="dashboard-new-order-btn" style={{ height: '36px', padding: '0 16px', margin: 0 }}>Reset Password</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
