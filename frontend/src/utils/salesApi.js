// Sales Module - Legacy localStorage utility kept for backward compat.
// All real data now comes from the backend REST API via api.js.
// This file is preserved for any legacy components that may still call salesApi.

const getAuthEmail = () => {
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  return authData?.user?.email || 'sales@erp-nexus.local';
};

const triggerGlobalAuditLog = (action, oldValue, newValue) => {
  const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
  logs.unshift({
    id: `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: getAuthEmail(),
    module: 'Sales & Distribution',
    action,
    old_value: oldValue || '-',
    new_value: newValue || '-',
  });
  localStorage.setItem('audit_logs', JSON.stringify(logs));
};

export const salesApi = {
  // All real data is fetched via the /api/* backend endpoints using api.js.
  // Legacy helpers below are no-ops or pass-throughs.
  getCustomers: () => [],
  saveCustomers: () => {},
  addCustomer: () => { console.warn('salesApi.addCustomer is deprecated — use api.post(/customers)'); },

  getCatalog: () => [],
  saveCatalog: () => {},

  getQuotations: () => [],
  saveQuotations: () => {},
  createQuotation: () => { console.warn('salesApi.createQuotation is deprecated — use api.post(/sales-quotations)'); },
  updateQuotation: () => { console.warn('salesApi.updateQuotation is deprecated — use api.patch(/sales-quotations/:id)'); },

  getOrders: () => [],
  saveOrders: () => {},
  createOrder: () => { console.warn('salesApi.createOrder is deprecated — use api.post(/sales-orders)'); },
  updateOrderStatus: () => { console.warn('salesApi.updateOrderStatus is deprecated — use api.patch(/sales-orders/:id)'); },

  getDeliveries: () => [],
  saveDeliveries: () => {},
  updateDeliveryStatus: () => { console.warn('salesApi.updateDeliveryStatus is deprecated — use api.patch(/sales-deliveries/:id)'); }
};
