// Purchase Module Mock API and State Management using localStorage
const seedDefaultData = () => {
  if (!localStorage.getItem('purchase_vendors')) {
    const defaultVendors = [
      { id: 'VEND-001', name: 'National Steel Corp', contact: 'Karan Malhotra', email: 'karan@nationalsteel.com', phone: '+91 98765 43210', address: 'Plot 45, Industrial Area Phase II, Mumbai', rating: 4.8, status: 'Active', balance: 125000 },
      { id: 'VEND-002', name: 'Apex Wood Supplies', contact: 'Sarah Chen', email: 'sarah.chen@apexwood.com', phone: '+91 98123 45678', address: '12 Timber Yard, Sector 4, Bangalore', rating: 4.2, status: 'Active', balance: 85000 },
      { id: 'VEND-003', name: 'Premium Fabrics Ltd', contact: 'Rahul Mehta', email: 'rahul@premiumfabrics.in', phone: '+91 99988 77766', address: '77 Textile Park, Surat, Gujarat', rating: 5.0, status: 'Active', balance: 0 },
      { id: 'VEND-004', name: 'Universal Screws & Fasteners', contact: 'John Carter', email: 'j.carter@universalfasteners.com', phone: '+91 88877 66655', address: 'B-12, GIDC Estate, Ahmedabad', rating: 4.0, status: 'Active', balance: 15400 }
    ];
    localStorage.setItem('purchase_vendors', JSON.stringify(defaultVendors));
  }

  if (!localStorage.getItem('purchase_materials')) {
    const defaultMaterials = [
      { id: 'MAT-001', name: 'Oak Wooden Board', sku: 'RM-OAK-01', currentStock: 12, reservedStock: 8, reorderLevel: 25, unit: 'pcs', preferredVendor: 'VEND-002', price: 1200 },
      { id: 'MAT-002', name: 'Foam Padding Sheet', sku: 'RM-FOM-02', currentStock: 3, reservedStock: 3, reorderLevel: 15, unit: 'meters', preferredVendor: 'VEND-003', price: 350 },
      { id: 'MAT-003', name: 'Steel Framing Screws', sku: 'RM-STL-44', currentStock: 150, reservedStock: 120, reorderLevel: 500, unit: 'boxes', preferredVendor: 'VEND-004', price: 95 },
      { id: 'MAT-004', name: 'Premium Leather Roll', sku: 'RM-LTH-09', currentStock: 18, reservedStock: 4, reorderLevel: 10, unit: 'rolls', preferredVendor: 'VEND-003', price: 4500 },
      { id: 'MAT-005', name: 'High-Density Fiberboard', sku: 'RM-HDF-12', currentStock: 8, reservedStock: 0, reorderLevel: 20, unit: 'pcs', preferredVendor: 'VEND-002', price: 750 }
    ];
    localStorage.setItem('purchase_materials', JSON.stringify(defaultMaterials));
  }

  if (!localStorage.getItem('purchase_orders')) {
    const defaultOrders = [
      { id: 'PO-2026-001', vendorId: 'VEND-002', orderDate: '2026-06-01', deliveryDate: '2026-06-14', items: [{ materialId: 'MAT-001', name: 'Oak Wooden Board', qty: 30, price: 1200 }], totalValue: 36000, status: 'Confirmed', receiptStatus: 'Partial', billStatus: 'Submitted' },
      { id: 'PO-2026-002', vendorId: 'VEND-003', orderDate: '2026-06-05', deliveryDate: '2026-06-16', items: [{ materialId: 'MAT-004', name: 'Premium Leather Roll', qty: 10, price: 4500 }], totalValue: 45000, status: 'Confirmed', receiptStatus: 'Pending', billStatus: 'Pending' },
      { id: 'PO-2026-003', vendorId: 'VEND-004', orderDate: '2026-06-10', deliveryDate: '2026-06-18', items: [{ materialId: 'MAT-003', name: 'Steel Framing Screws', qty: 100, price: 95 }], totalValue: 9500, status: 'Draft', receiptStatus: 'Pending', billStatus: 'Pending' },
      { id: 'PO-2026-004', vendorId: 'VEND-001', orderDate: '2026-05-20', deliveryDate: '2026-05-28', items: [{ materialId: 'MAT-001', name: 'Oak Wooden Board', qty: 50, price: 1100 }], totalValue: 55000, status: 'Closed', receiptStatus: 'Fully Received', billStatus: 'Paid' }
    ];
    localStorage.setItem('purchase_orders', JSON.stringify(defaultOrders));
  }

  if (!localStorage.getItem('purchase_bills')) {
    const defaultBills = [
      { id: 'BILL-001', poId: 'PO-2026-001', vendorId: 'VEND-002', invoiceNo: 'INV-APX-889', date: '2026-06-12', dueDate: '2026-07-12', amount: 36000, attachment: 'invoice_apx_889.pdf', status: 'Submitted' },
      { id: 'BILL-002', poId: 'PO-2026-004', vendorId: 'VEND-001', invoiceNo: 'INV-NS-1049', date: '2026-05-28', dueDate: '2026-06-28', amount: 55000, attachment: 'invoice_ns_1049.pdf', status: 'Paid' }
    ];
    localStorage.setItem('purchase_bills', JSON.stringify(defaultBills));
  }

  if (!localStorage.getItem('purchase_receipts')) {
    const defaultReceipts = [
      { id: 'GRN-001', poId: 'PO-2026-001', vendorId: 'VEND-002', date: '2026-06-12', items: [{ materialId: 'MAT-001', qtyOrdered: 30, qtyReceived: 18, qtyRejected: 2 }], note: 'Received 18 boards. 2 damaged boards rejected.', receivedBy: 'Inventory Manager' }
    ];
    localStorage.setItem('purchase_receipts', JSON.stringify(defaultReceipts));
  }
};

seedDefaultData();

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
  // Vendors
  getVendors: () => JSON.parse(localStorage.getItem('purchase_vendors') || '[]'),
  saveVendors: (vendors) => localStorage.setItem('purchase_vendors', JSON.stringify(vendors)),
  addVendor: (vendor) => {
    const vendors = purchaseApi.getVendors();
    const newVendor = { ...vendor, id: `VEND-${String(vendors.length + 1).padStart(3, '0')}`, balance: 0, rating: 5.0, status: 'Active' };
    vendors.push(newVendor);
    purchaseApi.saveVendors(vendors);
    addGlobalAuditLog('Vendor Creation', '-', `Created vendor ${newVendor.name} (${newVendor.id})`);
    return newVendor;
  },
  updateVendor: (id, data) => {
    const vendors = purchaseApi.getVendors();
    const idx = vendors.findIndex(v => v.id === id);
    if (idx !== -1) {
      const old = vendors[idx];
      vendors[idx] = { ...old, ...data };
      purchaseApi.saveVendors(vendors);
      addGlobalAuditLog('Vendor Update', `Name: ${old.name}`, `Name: ${vendors[idx].name}`);
      return vendors[idx];
    }
    throw new Error('Vendor not found');
  },

  // Materials
  getMaterials: () => JSON.parse(localStorage.getItem('purchase_materials') || '[]'),
  saveMaterials: (materials) => localStorage.setItem('purchase_materials', JSON.stringify(materials)),
  updateMaterial: (id, data) => {
    const materials = purchaseApi.getMaterials();
    const idx = materials.findIndex(m => m.id === id);
    if (idx !== -1) {
      const old = materials[idx];
      materials[idx] = { ...old, ...data };
      purchaseApi.saveMaterials(materials);
      addGlobalAuditLog('Material Config Update', `Reorder: ${old.reorderLevel}`, `Reorder: ${materials[idx].reorderLevel}`);
      return materials[idx];
    }
    throw new Error('Material not found');
  },
  adjustStock: (id, qtyChange) => {
    const materials = purchaseApi.getMaterials();
    const idx = materials.findIndex(m => m.id === id);
    if (idx !== -1) {
      const oldStock = materials[idx].currentStock;
      materials[idx].currentStock += qtyChange;
      purchaseApi.saveMaterials(materials);
      addGlobalAuditLog('Inventory Stock Adjustment', `On Hand: ${oldStock}`, `On Hand: ${materials[idx].currentStock}`);
      return materials[idx];
    }
    throw new Error('Material not found');
  },

  // Purchase Orders
  getPOs: () => JSON.parse(localStorage.getItem('purchase_orders') || '[]'),
  savePOs: (pos) => localStorage.setItem('purchase_orders', JSON.stringify(pos)),
  createPO: (po) => {
    const pos = purchaseApi.getPOs();
    const newPO = {
      ...po,
      id: `PO-2026-${String(pos.length + 1).padStart(3, '0')}`,
      orderDate: new Date().toISOString().split('T')[0],
      status: po.status || 'Draft',
      receiptStatus: 'Pending',
      billStatus: 'Pending'
    };
    pos.push(newPO);
    purchaseApi.savePOs(pos);
    addGlobalAuditLog('PO Creation', '-', `Created Purchase Order ${newPO.id}`);
    return newPO;
  },
  updatePO: (id, data) => {
    const pos = purchaseApi.getPOs();
    const idx = pos.findIndex(p => p.id === id);
    if (idx !== -1) {
      const old = pos[idx];
      pos[idx] = { ...old, ...data };
      purchaseApi.savePOs(pos);
      addGlobalAuditLog('PO Update', `Status: ${old.status}`, `Status: ${pos[idx].status}`);
      return pos[idx];
    }
    throw new Error('Purchase Order not found');
  },

  // Goods Receipts
  getReceipts: () => JSON.parse(localStorage.getItem('purchase_receipts') || '[]'),
  saveReceipts: (receipts) => localStorage.setItem('purchase_receipts', JSON.stringify(receipts)),
  createReceipt: (receipt) => {
    const receipts = purchaseApi.getReceipts();
    const newReceipt = {
      ...receipt,
      id: `GRN-${String(receipts.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      receivedBy: 'Inventory Manager'
    };
    receipts.push(newReceipt);
    purchaseApi.saveReceipts(receipts);

    // Update material stocks
    receipt.items.forEach(item => {
      purchaseApi.adjustStock(item.materialId, item.qtyReceived);
    });

    // Update PO status
    const po = purchaseApi.getPOs().find(p => p.id === receipt.poId);
    if (po) {
      let receiptStatus = 'Fully Received';
      if (receipt.isPartial) {
        receiptStatus = 'Partial';
      }
      purchaseApi.updatePO(receipt.poId, { receiptStatus, status: receiptStatus === 'Fully Received' ? 'Closed' : 'Confirmed' });
    }

    addGlobalAuditLog('Goods Receipt Created', '-', `Created GRN ${newReceipt.id} for PO ${receipt.poId}`);
    return newReceipt;
  },

  // Vendor Bills
  getBills: () => JSON.parse(localStorage.getItem('purchase_bills') || '[]'),
  saveBills: (bills) => localStorage.setItem('purchase_bills', JSON.stringify(bills)),
  createBill: (bill) => {
    const bills = purchaseApi.getBills();
    const newBill = {
      ...bill,
      id: `BILL-${String(bills.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Submitted'
    };
    bills.push(newBill);
    purchaseApi.saveBills(bills);

    // Update PO bill status
    const po = purchaseApi.getPOs().find(p => p.id === bill.poId);
    if (po) {
      purchaseApi.updatePO(bill.poId, { billStatus: 'Submitted' });
    }

    addGlobalAuditLog('Vendor Bill Uploaded', '-', `Uploaded Bill ${newBill.id} for PO ${bill.poId}`);
    return newBill;
  }
};
