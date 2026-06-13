import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronDown, LogOut, X, Camera } from 'lucide-react';
import './TopBar.css';

const PAGE_TITLES = {
  '/dashboard':     { breadcrumb: 'Home', title: 'Dashboard' },
  '/products':      { breadcrumb: 'Inventory', title: 'Products' },
  '/orders':        { breadcrumb: 'Sales', title: 'Orders' },
  '/new-sales-order': { breadcrumb: 'Sales → New Order', title: 'New Sales Order' },
  '/warehouse':     { breadcrumb: 'Operations', title: 'Warehouse' },
  '/logistics':     { breadcrumb: 'Operations', title: 'Logistics' },
  '/settings':      { breadcrumb: 'System', title: 'Settings' },
};

const ROLE_LABELS = {
  admin: 'Admin',
  sales: 'Sales User',
  purchase: 'Purchase User',
  manufacturing: 'Manufacturing User',
  inventory: 'Inventory Manager',
  owner: 'Business Owner',
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    mobile: '',
    photo: '',
  });

  const meta = PAGE_TITLES[pathname] || { breadcrumb: 'Nexus ERP', title: 'Overview' };
  const [user, setUser] = useState({ name: 'Alexander Sterling', role: 'admin', email: 'admin@erp-nexus.local' });

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    if (authData?.user) {
      setUser(authData.user);
      setProfileForm({
        name: authData.user.name || '',
        address: authData.user.address || 'Colaba, Mumbai, 400001',
        mobile: authData.user.mobile || '+918000000000',
        photo: authData.user.profile_photo || '',
      });
    }
  }, [drawerOpen]);

  const handleLogout = () => {
    localStorage.removeItem('auth_data');
    navigate('/login');
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm(f => ({ ...f, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    if (authData) {
      const updatedUser = {
        ...authData.user,
        name: profileForm.name,
        address: profileForm.address,
        mobile: profileForm.mobile,
        profile_photo: profileForm.photo,
      };

      authData.user = updatedUser;
      localStorage.setItem('auth_data', JSON.stringify(authData));
      setUser(updatedUser);
      window.dispatchEvent(new Event('storage'));

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setDrawerOpen(false);
      }, 1500);
    }
  };

  return (
    <header className="topbar">
      {}
      <div className="topbar-left">
        <span className="topbar-breadcrumb">{meta.breadcrumb}</span>
        <h1 className="topbar-title">{meta.title}</h1>
      </div>

      {}
      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label="Search">
          <Search size={18} strokeWidth={1.75} />
        </button>
        <button className="topbar-icon-btn topbar-notif-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.75} />
          <span className="topbar-notif-badge" />
        </button>
        <div className="topbar-divider" />
        
        {}
        <button 
          className="topbar-user" 
          onClick={() => setDrawerOpen(true)}
          aria-label="User Profile"
        >
          <div className="topbar-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
            {user.profile_photo ? (
              <img src={user.profile_photo} alt={user.name} className="profile-avatar-img" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user.name}</span>
            <span className="topbar-user-role">{ROLE_LABELS[user.role] || user.role}</span>
          </div>
          <ChevronDown size={14} className="topbar-user-chevron" />
        </button>
      </div>

      {}
      {drawerOpen && (
        <>
          <div className="profile-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="profile-drawer">
            <div className="profile-drawer-header">
              <h2 className="profile-drawer-title">User Login Detail Management</h2>
              <button className="profile-drawer-close" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="profile-drawer-content">
              {}
              <div className="profile-photo-wrapper">
                <div className="profile-photo-container" onClick={handlePhotoClick}>
                  {profileForm.photo ? (
                    <img src={profileForm.photo} alt="Avatar" className="profile-avatar-img" />
                  ) : (
                    <span className="profile-photo-initials">{getInitials(profileForm.name)}</span>
                  )}
                </div>
                <button className="profile-photo-edit-btn" onClick={handlePhotoClick} aria-label="Upload photo">
                  <Camera size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image}
              <form className="profile-drawer-form" onSubmit={handleSaveProfile}>
                {}
                <div className="profile-drawer-field">
                  <label className="profile-drawer-label" htmlFor="drawer-name">Name</label>
                  <input
                    id="drawer-name"
                    type="text"
                    className="profile-drawer-input"
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                {}
                <div className="profile-drawer-field">
                  <label className="profile-drawer-label" htmlFor="drawer-address">Address</label>
                  <textarea
                    id="drawer-address"
                    className="profile-drawer-textarea"
                    value={profileForm.address}
                    onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))}
                    required
                  />
                </div>

                {}
                <div className="profile-drawer-field">
                  <label className="profile-drawer-label" htmlFor="drawer-mobile">Mobile Number</label>
                  <input
                    id="drawer-mobile"
                    type="text"
                    className="profile-drawer-input"
                    value={profileForm.mobile}
                    onChange={e => setProfileForm(f => ({ ...f, mobile: e.target.value }))}
                    required
                  />
                </div>

                {}
                <div className="profile-drawer-field">
                  <label className="profile-drawer-label">Email ID</label>
                  <input
                    type="text"
                    className="profile-drawer-input"
                    value={user.email}
                    disabled
                  />
                </div>

                {}
                <div className="profile-drawer-field">
                  <label className="profile-drawer-label">Position</label>
                  <input
                    type="text"
                    className="profile-drawer-input"
                    value={ROLE_LABELS[user.role] || user.role}
                    disabled
                  />
                </div>

                {}
                {successMsg && (
                  <div className="profile-drawer-success-msg">{successMsg}</div>
                )}

                {}
                <div className="profile-drawer-actions">
                  <button type="submit" className="profile-drawer-save-btn">
                    Save Changes
                  </button>
                  <button type="button" className="profile-drawer-signout-btn" onClick={handleLogout}>
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

