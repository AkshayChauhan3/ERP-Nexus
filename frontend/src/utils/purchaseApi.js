// Purchase Module - Legacy localStorage utility kept for backward compat.
// All real data now comes from the backend REST API via api.js.
// This file is preserved for any legacy components that may still call purchaseApi.

const getAuthEmail = () => {
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  return authData?.user?.email || 'inventory@erp-nexus.local';
};

const addGlobalAuditLog = (action, oldValue, newValue) => {
  const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
  logs.unshift({
    id: `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: getAuthEmail(),
    module: 'Procurement & Inventory',
    action,
    old_value: oldValue || '-',
    new_value: newValue || '-',
  });
  localStorage.setItem('audit_logs', JSON.stringify(logs));
};

export const purchaseApi = {
  // All real data is fetched via the /api/* backend endpoints using api.js.
  // Legacy helpers below are no-ops or pass-throughs.
  getVendors: () => [],
  saveVendors: () => {},
  addVendor: () => { console.warn('purchaseApi.addVendor is deprecated — use api.post(/vendors)'); },
  updateVendor: () => { console.warn('purchaseApi.updateVendor is deprecated — use api.patch(/vendors/:id)'); },

  getMaterials: () => [],
  saveMaterials: () => {},
  updateMaterial: () => { console.warn('purchaseApi.updateMaterial is deprecated — use api.patch(/products/:id)'); },
  adjustStock: () => { console.warn('purchaseApi.adjustStock is deprecated — use api.post(/inventory/adjustments)'); },

  getPOs: () => [],
  savePOs: () => {},
  createPO: () => { console.warn('purchaseApi.createPO is deprecated — use api.post(/purchase-orders)'); },
  updatePO: () => { console.warn('purchaseApi.updatePO is deprecated — use api.patch(/purchase-orders/:id)'); },

  getReceipts: () => [],
  saveReceipts: () => {},
  createReceipt: () => { console.warn('purchaseApi.createReceipt is deprecated — use api.post(/purchase/receipts)'); },

  getBills: () => [],
  saveBills: () => {},
  createBill: () => { console.warn('purchaseApi.createBill is deprecated — use api.post(/purchase/bills)'); }
};
