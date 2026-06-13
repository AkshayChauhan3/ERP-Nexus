// Inventory Module Mock API and State Management using localStorage
const seedDefaultInventoryData = () => {
  if (!localStorage.getItem('inventory_warehouses')) {
    const defaultWarehouses = [
      { id: 'WH-001', name: 'Main Fulfillment Center', location: 'Industrial Area Zone A, Mumbai', manager: 'Amit Sharma', capacity: 5000, value: 450000, status: 'Active' },
      { id: 'WH-002', name: 'Raw Material Warehouse', location: 'Phase II Logistics Yard, Bangalore', manager: 'Kiran Kumar', capacity: 3000, value: 250000, status: 'Active' },
      { id: 'WH-003', name: 'Surat Textile Depot', location: 'Textile Park, Surat', manager: 'Dinesh Patel', capacity: 1500, value: 120000, status: 'Active' },
      { id: 'WH-004', name: 'Secondary Fastener Hub', location: 'Industrial Zone B, Ahmedabad', manager: 'Sanjay Shah', capacity: 1000, value: 22500, status: 'Active' }
    ];
    localStorage.setItem('inventory_warehouses', JSON.stringify(defaultWarehouses));
  }

  if (!localStorage.getItem('inventory_products')) {
    const defaultProducts = [
      { id: 'PROD-001', code: 'RM-OAK-01', name: 'Oak Wooden Board', category: 'Raw Materials', warehouseId: 'WH-002', currentStock: 120, reservedStock: 80, reorderLevel: 250, unit: 'pcs', costPrice: 1200 },
      { id: 'PROD-002', code: 'RM-FOM-02', name: 'Foam Padding Sheet', category: 'Raw Materials', warehouseId: 'WH-002', currentStock: 30, reservedStock: 30, reorderLevel: 150, unit: 'meters', costPrice: 350 },
      { id: 'PROD-003', code: 'RM-STL-44', name: 'Steel Framing Screws', category: 'Consumables', warehouseId: 'WH-004', currentStock: 1500, reservedStock: 120, reorderLevel: 5000, unit: 'boxes', costPrice: 95 },
      { id: 'PROD-004', code: 'RM-LTH-09', name: 'Premium Leather Roll', category: 'Raw Materials', warehouseId: 'WH-003', currentStock: 18, reservedStock: 4, reorderLevel: 10, unit: 'rolls', costPrice: 4500 },
      { id: 'PROD-005', code: 'FG-SOF-09', name: 'Comfort Cushion Sofa', category: 'Finished Goods', warehouseId: 'WH-001', currentStock: 12, reservedStock: 5, reorderLevel: 20, unit: 'pcs', costPrice: 22000 },
      { id: 'PROD-006', code: 'FG-CHR-21', name: 'Executive Swivel Chair', category: 'Finished Goods', warehouseId: 'WH-001', currentStock: 45, reservedStock: 10, reorderLevel: 50, unit: 'pcs', costPrice: 5500 },
      { id: 'PROD-007', code: 'PK-BOX-02', name: 'Heavy Duty Shipping Box', category: 'Packaging Materials', warehouseId: 'WH-001', currentStock: 800, reservedStock: 0, reorderLevel: 1000, unit: 'pcs', costPrice: 45 }
    ];
    localStorage.setItem('inventory_products', JSON.stringify(defaultProducts));
  }

  if (!localStorage.getItem('inventory_transfers')) {
    const defaultTransfers = [
      { id: 'TRF-001', source: 'WH-002', destination: 'WH-001', productId: 'PROD-001', qty: 50, status: 'Completed', date: '2026-06-10', reason: 'Replenishment for Assembly Line' },
      { id: 'TRF-002', source: 'WH-003', destination: 'WH-001', productId: 'PROD-004', qty: 2, status: 'Pending', date: '2026-06-13', reason: 'Leather stock transfer for Sofa manufacturing' }
    ];
    localStorage.setItem('inventory_transfers', JSON.stringify(defaultTransfers));
  }

  if (!localStorage.getItem('inventory_adjustments')) {
    const defaultAdjustments = [
      { id: 'ADJ-001', productId: 'PROD-001', warehouseId: 'WH-002', oldQty: 125, newQty: 120, reason: 'Damage', createdBy: 'Amit Sharma', date: '2026-06-12' }
    ];
    localStorage.setItem('inventory_adjustments', JSON.stringify(defaultAdjustments));
  }

  if (!localStorage.getItem('inventory_ledger')) {
    const defaultLedger = [
      { id: 'LED-001', date: '2026-06-10', productId: 'PROD-001', warehouseId: 'WH-002', type: 'Stock Transfer', qty: -50, prevStock: 170, newStock: 120, refNo: 'TRF-001', createdBy: 'Amit Sharma' },
      { id: 'LED-002', date: '2026-06-10', productId: 'PROD-001', warehouseId: 'WH-001', type: 'Stock Transfer', qty: 50, prevStock: 0, newStock: 50, refNo: 'TRF-001', createdBy: 'Amit Sharma' },
      { id: 'LED-003', date: '2026-06-12', productId: 'PROD-001', warehouseId: 'WH-002', type: 'Stock Adjustment', qty: -5, prevStock: 125, newStock: 120, refNo: 'ADJ-001', createdBy: 'Amit Sharma' }
    ];
    localStorage.setItem('inventory_ledger', JSON.stringify(defaultLedger));
  }

  if (!localStorage.getItem('inventory_reserved')) {
    const defaultReserved = [
      { id: 'RES-001', productId: 'PROD-001', currentStock: 120, reservedStock: 80, availableStock: 40, reservedFor: 'Manufacturing Order', refNo: 'MO-2026-041' },
      { id: 'RES-002', productId: 'PROD-005', currentStock: 12, reservedStock: 5, availableStock: 7, reservedFor: 'Sales Order', refNo: 'SO-1002' }
    ];
    localStorage.setItem('inventory_reserved', JSON.stringify(defaultReserved));
  }
};

seedDefaultInventoryData();

const getAuthEmail = () => {
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  return authData?.user?.email || 'inventory@erp-nexus.local';
};

const addLedgerEntry = (productId, warehouseId, type, qty, prevStock, newStock, refNo) => {
  const ledger = JSON.parse(localStorage.getItem('inventory_ledger') || '[]');
  const entry = {
    id: `LED-${String(ledger.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    productId,
    warehouseId,
    type,
    qty,
    prevStock,
    newStock,
    refNo,
    createdBy: getAuthEmail()
  };
  ledger.unshift(entry);
  localStorage.setItem('inventory_ledger', JSON.stringify(ledger));
};

const triggerAuditLog = (action, oldValue, newValue) => {
  const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
  logs.unshift({
    id: `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: getAuthEmail(),
    module: 'Inventory Operations',
    action,
    old_value: oldValue || '-',
    new_value: newValue || '-',
  });
  localStorage.setItem('audit_logs', JSON.stringify(logs));
};

export const inventoryApi = {
  // Products
  getProducts: () => JSON.parse(localStorage.getItem('inventory_products') || '[]'),
  saveProducts: (products) => localStorage.setItem('inventory_products', JSON.stringify(products)),
  updateProduct: (id, data) => {
    const products = inventoryApi.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const old = products[idx];
      products[idx] = { ...old, ...data };
      inventoryApi.saveProducts(products);
      triggerAuditLog('Product Config Update', `Code: ${old.code}`, `Code: ${products[idx].code}`);
      return products[idx];
    }
    throw new Error('Product not found');
  },

  // Warehouses
  getWarehouses: () => JSON.parse(localStorage.getItem('inventory_warehouses') || '[]'),
  saveWarehouses: (whs) => localStorage.setItem('inventory_warehouses', JSON.stringify(whs)),

  // Transfers
  getTransfers: () => JSON.parse(localStorage.getItem('inventory_transfers') || '[]'),
  saveTransfers: (transfers) => localStorage.setItem('inventory_transfers', JSON.stringify(transfers)),
  createTransfer: (trf) => {
    const transfers = inventoryApi.getTransfers();
    const newTrf = {
      ...trf,
      id: `TRF-${String(transfers.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    transfers.push(newTrf);
    inventoryApi.saveTransfers(transfers);
    triggerAuditLog('Transfer Request', '-', `Created Transfer ${newTrf.id} for Product ${trf.productId}`);
    return newTrf;
  },
  completeTransfer: (id) => {
    const transfers = inventoryApi.getTransfers();
    const products = inventoryApi.getProducts();
    const idx = transfers.findIndex(t => t.id === id);
    if (idx !== -1 && transfers[idx].status === 'Pending') {
      const trf = transfers[idx];
      const prodIdx = products.findIndex(p => p.id === trf.productId);
      
      if (prodIdx !== -1) {
        const prod = products[prodIdx];
        const oldStock = prod.currentStock;
        
        // Subtract from source stock ledger if it exists as warehouse-level stock
        // For simplicity, we adjust product warehouseId and currentStock
        // Create source and destination ledger entries
        addLedgerEntry(trf.productId, trf.source, 'Stock Transfer Out', -trf.qty, oldStock, oldStock - trf.qty, trf.id);
        
        prod.currentStock -= trf.qty;
        prod.warehouseId = trf.destination; // Product moves to new warehouse in mock
        inventoryApi.saveProducts(products);
        
        addLedgerEntry(trf.productId, trf.destination, 'Stock Transfer In', trf.qty, oldStock - trf.qty, oldStock, trf.id);

        transfers[idx].status = 'Completed';
        inventoryApi.saveTransfers(transfers);
        
        triggerAuditLog('Transfer Completed', `ID: ${id}`, `Status: Completed`);
        return transfers[idx];
      }
    }
    throw new Error('Transfer cannot be completed');
  },

  // Adjustments
  getAdjustments: () => JSON.parse(localStorage.getItem('inventory_adjustments') || '[]'),
  saveAdjustments: (adjustments) => localStorage.setItem('inventory_adjustments', JSON.stringify(adjustments)),
  createAdjustment: (adj) => {
    const adjustments = inventoryApi.getAdjustments();
    const products = inventoryApi.getProducts();
    const prodIdx = products.findIndex(p => p.id === adj.productId);

    if (prodIdx !== -1) {
      const prod = products[prodIdx];
      const oldQty = prod.currentStock;
      prod.currentStock = adj.adjustedQuantity;
      inventoryApi.saveProducts(products);

      const newAdj = {
        id: `ADJ-${String(adjustments.length + 1).padStart(3, '0')}`,
        productId: adj.productId,
        warehouseId: adj.warehouseId,
        oldQty,
        newQty: adj.adjustedQuantity,
        reason: adj.reason,
        createdBy: getAuthEmail(),
        date: new Date().toISOString().split('T')[0]
      };
      
      adjustments.unshift(newAdj);
      inventoryApi.saveAdjustments(adjustments);

      addLedgerEntry(adj.productId, adj.warehouseId, 'Stock Adjustment', adj.adjustedQuantity - oldQty, oldQty, adj.adjustedQuantity, newAdj.id);
      triggerAuditLog('Inventory Adjustment', `Qty: ${oldQty}`, `Qty: ${adj.adjustedQuantity}`);
      return newAdj;
    }
    throw new Error('Product not found');
  },

  // Ledger & Reserved
  getLedger: () => JSON.parse(localStorage.getItem('inventory_ledger') || '[]'),
  getReserved: () => JSON.parse(localStorage.getItem('inventory_reserved') || '[]')
};
