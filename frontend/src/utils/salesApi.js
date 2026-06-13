// Sales Module Mock API and State Management using localStorage
const seedDefaultSalesData = () => {
  if (!localStorage.getItem('sales_customers')) {
    const defaultCustomers = [
      { id: 'CUST-001', name: 'Sterling Office Furnishings', mobile: '+91 99887 76655', email: 'procure@sterlingoffices.com', gst: '27AAAAA1111A1Z1', address: '101 Corporate tower, Bandra Complex', city: 'Mumbai', state: 'Maharashtra', country: 'India', status: 'Active' },
      { id: 'CUST-002', name: 'DecoSpace Designs', mobile: '+91 91234 56789', email: 'design@decospace.in', gst: '29BBBBB2222B2Z2', address: '44 Residency Road', city: 'Bangalore', state: 'Karnataka', country: 'India', status: 'Active' },
      { id: 'CUST-003', name: 'Gujarat Hospitality Ltd', mobile: '+91 88899 90011', email: 'purchase@gujarathospitality.com', gst: '24CCCCC3333C3Z3', address: 'Hotel Regency Complex', city: 'Ahmedabad', state: 'Gujarat', country: 'India', status: 'Active' }
    ];
    localStorage.setItem('sales_customers', JSON.stringify(defaultCustomers));
  }

  if (!localStorage.getItem('sales_catalog')) {
    const defaultCatalog = [
      { id: 'CAT-001', code: 'FG-SOF-09', name: 'Comfort Cushion Sofa', category: 'Finished Goods', available: 7, reserved: 5, price: 35000 },
      { id: 'CAT-002', code: 'FG-CHR-21', name: 'Executive Swivel Chair', category: 'Finished Goods', available: 35, reserved: 10, price: 8500 },
      { id: 'CAT-003', code: 'FG-TAB-12', name: 'Oak Dining Table', category: 'Finished Goods', available: 15, reserved: 0, price: 18000 }
    ];
    localStorage.setItem('sales_catalog', JSON.stringify(defaultCatalog));
  }

  if (!localStorage.getItem('sales_quotations')) {
    const defaultQuotations = [
      { id: 'QTN-2026-001', customerId: 'CUST-001', date: '2026-06-01', expiryDate: '2026-06-30', items: [{ productId: 'CAT-002', name: 'Executive Swivel Chair', qty: 10, price: 8500, discount: 5, tax: 18, total: 85275 }], amount: 85275, status: 'Approved', remarks: 'Corporate discount applied.' },
      { id: 'QTN-2026-002', customerId: 'CUST-002', date: '2026-06-05', expiryDate: '2026-06-20', items: [{ productId: 'CAT-001', name: 'Comfort Cushion Sofa', qty: 2, price: 35000, discount: 0, tax: 18, total: 82600 }], amount: 82600, status: 'Draft', remarks: 'Awaiting customer response.' }
    ];
    localStorage.setItem('sales_quotations', JSON.stringify(defaultQuotations));
  }

  if (!localStorage.getItem('sales_orders')) {
    const defaultOrders = [
      { id: 'SO-2026-001', customerId: 'CUST-001', orderDate: '2026-06-02', deliveryDate: '2026-06-15', items: [{ productId: 'CAT-002', name: 'Executive Swivel Chair', qty: 10, price: 8500, discount: 5, tax: 18, total: 85275 }], amount: 85275, status: 'Confirmed', timeline: ['Created', 'Confirmed', 'Reserved'], shippingAddress: '101 Corporate tower, Bandra Complex, Mumbai', remarks: 'Deliver before 5 PM.' },
      { id: 'SO-2026-002', customerId: 'CUST-003', orderDate: '2026-06-10', deliveryDate: '2026-06-20', items: [{ productId: 'CAT-001', name: 'Comfort Cushion Sofa', qty: 5, price: 35000, discount: 10, tax: 18, total: 185850 }], amount: 185850, status: 'Delivered', timeline: ['Created', 'Confirmed', 'Reserved', 'Packed', 'Dispatched', 'Delivered'], shippingAddress: 'Hotel Regency Complex, Ahmedabad', remarks: 'Fragile handling needed.' }
    ];
    localStorage.setItem('sales_orders', JSON.stringify(defaultOrders));
  }

  if (!localStorage.getItem('sales_deliveries')) {
    const defaultDeliveries = [
      { id: 'DLV-001', soId: 'SO-2026-001', customerId: 'CUST-001', deliveryDate: '2026-06-15', status: 'Pending', shippingAddress: '101 Corporate tower, Bandra Complex, Mumbai', dispatchDate: '-', items: [{ name: 'Executive Swivel Chair', qty: 10 }] },
      { id: 'DLV-002', soId: 'SO-2026-002', customerId: 'CUST-003', deliveryDate: '2026-06-20', status: 'Delivered', shippingAddress: 'Hotel Regency Complex, Ahmedabad', dispatchDate: '2026-06-11', items: [{ name: 'Comfort Cushion Sofa', qty: 5 }] }
    ];
    localStorage.setItem('sales_deliveries', JSON.stringify(defaultDeliveries));
  }
};

seedDefaultSalesData();

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
  // Customers
  getCustomers: () => JSON.parse(localStorage.getItem('sales_customers') || '[]'),
  saveCustomers: (customers) => localStorage.setItem('sales_customers', JSON.stringify(customers)),
  addCustomer: (cust) => {
    const customers = salesApi.getCustomers();
    const newCust = {
      ...cust,
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      status: 'Active'
    };
    customers.push(newCust);
    salesApi.saveCustomers(customers);
    triggerGlobalAuditLog('Customer Creation', '-', `Created Customer ${newCust.name} (${newCust.id})`);
    return newCust;
  },

  // Catalog
  getCatalog: () => JSON.parse(localStorage.getItem('sales_catalog') || '[]'),
  saveCatalog: (catalog) => localStorage.setItem('sales_catalog', JSON.stringify(catalog)),

  // Quotations
  getQuotations: () => JSON.parse(localStorage.getItem('sales_quotations') || '[]'),
  saveQuotations: (qtns) => localStorage.setItem('sales_quotations', JSON.stringify(qtns)),
  createQuotation: (qtn) => {
    const qtns = salesApi.getQuotations();
    const newQtn = {
      ...qtn,
      id: `QTN-2026-${String(qtns.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: qtn.status || 'Draft'
    };
    qtns.push(newQtn);
    salesApi.saveQuotations(qtns);
    triggerGlobalAuditLog('Quotation Creation', '-', `Created Quotation ${newQtn.id}`);
    return newQtn;
  },
  updateQuotation: (id, data) => {
    const qtns = salesApi.getQuotations();
    const idx = qtns.findIndex(q => q.id === id);
    if (idx !== -1) {
      qtns[idx] = { ...qtns[idx], ...data };
      salesApi.saveQuotations(qtns);
      return qtns[idx];
    }
    throw new Error('Quotation not found');
  },

  // Sales Orders
  getOrders: () => JSON.parse(localStorage.getItem('sales_orders') || '[]'),
  saveOrders: (orders) => localStorage.setItem('sales_orders', JSON.stringify(orders)),
  createOrder: (so) => {
    const orders = salesApi.getOrders();
    const newSO = {
      ...so,
      id: `SO-2026-${String(orders.length + 1).padStart(3, '0')}`,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      timeline: ['Created', 'Confirmed', 'Reserved']
    };
    orders.push(newSO);
    salesApi.saveOrders(orders);

    // Reserve stock automatically
    const catalog = salesApi.getCatalog();
    newSO.items.forEach(item => {
      const prod = catalog.find(c => c.id === item.productId);
      if (prod) {
        prod.available -= item.qty;
        prod.reserved += item.qty;
      }
    });
    salesApi.saveCatalog(catalog);

    // Create Delivery Request
    const deliveries = salesApi.getDeliveries();
    const newDlv = {
      id: `DLV-${String(deliveries.length + 1).padStart(3, '0')}`,
      soId: newSO.id,
      customerId: newSO.customerId,
      deliveryDate: newSO.deliveryDate,
      status: 'Pending',
      shippingAddress: newSO.shippingAddress,
      dispatchDate: '-',
      items: newSO.items.map(i => ({ name: i.name, qty: i.qty }))
    };
    deliveries.push(newDlv);
    salesApi.saveDeliveries(deliveries);

    triggerGlobalAuditLog('Sales Order Confirmed', '-', `Confirmed SO ${newSO.id} & reserved stock.`);
    return newSO;
  },
  updateOrderStatus: (id, status, timelineStep) => {
    const orders = salesApi.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = status;
      if (timelineStep && !orders[idx].timeline.includes(timelineStep)) {
        orders[idx].timeline.push(timelineStep);
      }
      salesApi.saveOrders(orders);
      triggerGlobalAuditLog('SO Status Update', `ID: ${id}`, `Status: ${status}`);
      return orders[idx];
    }
  },

  // Deliveries
  getDeliveries: () => JSON.parse(localStorage.getItem('sales_deliveries') || '[]'),
  saveDeliveries: (dlvs) => localStorage.setItem('sales_deliveries', JSON.stringify(dlvs)),
  updateDeliveryStatus: (id, status) => {
    const dlvs = salesApi.getDeliveries();
    const idx = dlvs.findIndex(d => d.id === id);
    if (idx !== -1) {
      const old = dlvs[idx];
      dlvs[idx].status = status;
      
      if (status === 'Dispatched') {
        dlvs[idx].dispatchDate = new Date().toISOString().split('T')[0];
        salesApi.updateOrderStatus(old.soId, 'Processing', 'Dispatched');
      }
      if (status === 'Delivered') {
        salesApi.updateOrderStatus(old.soId, 'Delivered', 'Delivered');
        // Release physical reservations
        const orders = salesApi.getOrders();
        const order = orders.find(o => o.id === old.soId);
        if (order) {
          const catalog = salesApi.getCatalog();
          order.items.forEach(item => {
            const prod = catalog.find(c => c.id === item.productId);
            if (prod) {
              prod.reserved -= item.qty;
            }
          });
          salesApi.saveCatalog(catalog);
        }
      }
      if (status === 'Packed') {
        salesApi.updateOrderStatus(old.soId, 'Processing', 'Packed');
      }

      salesApi.saveDeliveries(dlvs);
      triggerGlobalAuditLog('Delivery Status Update', `ID: ${id}`, `Status: ${status}`);
      return dlvs[idx];
    }
  }
};
