// Business Owner Module Mock API and State Management using localStorage
const seedDefaultOwnerData = () => {
  // Clear mock owner approvals to remove legacy fake purchase permission constraint
  localStorage.removeItem('owner_approvals');

  if (!localStorage.getItem('owner_settings')) {
    const defaultSettings = {
      companyName: 'Nexus Ltd',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop',
      businessAddress: 'Nexus Building, Block 4, Bandra Kurla Complex, Mumbai',
      gstNumber: '27AAAAA1111A1Z1',
      emailServer: 'smtp.nexus-erp.local',
      notificationsEnabled: true,
      alertThreshold: 15
    };
    localStorage.setItem('owner_settings', JSON.stringify(defaultSettings));
  }

  if (!localStorage.getItem('owner_employees')) {
    const defaultEmployees = [
      { name: 'Alexander Sterling', department: 'Administration', lastLogin: '2026-06-13 08:30 PM', actions: 14, status: 'Online' },
      { name: 'Sarah Executive', department: 'Sales & Purchases', lastLogin: '2026-06-13 07:15 PM', actions: 28, status: 'Online' },
      { name: 'Rahul Kumar', department: 'Manufacturing', lastLogin: '2026-06-13 09:12 AM', actions: 8, status: 'Offline' },
      { name: 'Amit Sharma', department: 'Inventory Logistics', lastLogin: '2026-06-13 05:45 PM', actions: 19, status: 'Offline' }
    ];
    localStorage.setItem('owner_employees', JSON.stringify(defaultEmployees));
  }
};

seedDefaultOwnerData();

const getAuthEmail = () => {
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  return authData?.user?.email || 'owner@erp-nexus.local';
};

const addOwnerAuditLog = (action, oldValue, newValue) => {
  const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
  logs.unshift({
    id: `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: getAuthEmail(),
    module: 'Business Owner Operations',
    action,
    old_value: oldValue || '-',
    new_value: newValue || '-',
  });
  localStorage.setItem('audit_logs', JSON.stringify(logs));
};

export const ownerApi = {
  // Approvals
  getApprovals: () => JSON.parse(localStorage.getItem('owner_approvals') || '[]'),
  saveApprovals: (approvals) => localStorage.setItem('owner_approvals', JSON.stringify(approvals)),
  approveRequest: (id) => {
    const list = ownerApi.getApprovals();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx].status = 'Approved';
      ownerApi.saveApprovals(list);
      addOwnerAuditLog('Request Approval', `ID: ${id}`, `Status: Approved`);
      
      // Perform specific state side-effects based on what was approved
      if (list[idx].details.includes('BILL-001')) {
        const bills = JSON.parse(localStorage.getItem('purchase_bills') || '[]');
        const target = bills.find(b => b.id === 'BILL-001');
        if (target) {
          target.status = 'Paid';
          localStorage.setItem('purchase_bills', JSON.stringify(bills));
        }
      }
      return list[idx];
    }
  },
  rejectRequest: (id) => {
    const list = ownerApi.getApprovals();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx].status = 'Rejected';
      ownerApi.saveApprovals(list);
      addOwnerAuditLog('Request Rejection', `ID: ${id}`, `Status: Rejected`);
      return list[idx];
    }
  },

  // Settings
  getSettings: () => JSON.parse(localStorage.getItem('owner_settings') || '{}'),
  saveSettings: (settings) => {
    localStorage.setItem('owner_settings', JSON.stringify(settings));
    addOwnerAuditLog('Settings Config Update', '-', `Updated owner settings profile.`);
  },

  // Employees
  getEmployees: () => JSON.parse(localStorage.getItem('owner_employees') || '[]')
};
