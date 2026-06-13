
async function autoProcure(prisma, product, shortage, userId, soId) {
  const method = product.procurement_method || (product.procurement_type === 'MTO' ? 'MANUFACTURING' : 'PURCHASE');
  
  if (method === 'MANUFACTURING') {
    // Determine BOM
    let bomId = product.bom_id;
    if (!bomId) {
      // Find default BOM for the product
      const bom = await prisma.billOfMaterials.findUnique({
        where: { product_id: product.id }
      });
      if (bom) {
        bomId = bom.id;
      }
    }

    if (!bomId) {
      console.warn(`[AutoProcure] Cannot auto-create MO for "${product.name}": default BOM not configured`);
      return null;
    }

    const moNumber = `MO-AUTO-${Date.now().toString().slice(-6)}`;
    const mo = await prisma.manufacturingOrder.create({
      data: {
        mo_number: moNumber,
        product_id: product.id,
        bom_id: bomId,
        quantity: shortage,
        status: 'draft',
        so_id: soId,
        created_by: userId
      }
    });

    // Create Procurement Suggestion
    await prisma.procurementSuggestion.create({
      data: {
        product_id: product.id,
        so_id: soId,
        current_stock: product.inventory?.on_hand_qty || 0,
        shortage_qty: shortage,
        procurement_source: 'MANUFACTURING',
        status: 'MO_CREATED',
        reason: `Auto-procure MTO shortage of ${shortage} for Sales Order ${soId || ''}`
      }
    });

    console.log(`[AutoProcure] Auto-created Manufacturing Order ${moNumber} for ${shortage} units of "${product.name}"`);
    return { type: 'MO', id: mo.id, number: moNumber };
  } else {
    // PURCHASE flow
    // Determine vendor
    let vendorId = product.vendor_id;
    if (!vendorId) {
      // Fallback to first active vendor
      const firstVendor = await prisma.vendor.findFirst({
        where: { is_active: true }
      });
      if (firstVendor) {
        vendorId = firstVendor.id;
      }
    }

    if (!vendorId) {
      console.warn(`[AutoProcure] Cannot auto-create PO for "${product.name}": no vendors configured in system`);
      return null;
    }

    const poNumber = `PO-AUTO-${Date.now().toString().slice(-6)}`;
    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: poNumber,
        vendor_id: vendorId,
        status: 'draft',
        created_by: userId,
        lines: {
          create: [{
            product_id: product.id,
            ordered_qty: shortage,
            unit_price: product.cost_price
          }]
        }
      }
    });

    // Create Procurement Suggestion
    await prisma.procurementSuggestion.create({
      data: {
        product_id: product.id,
        so_id: soId,
        current_stock: product.inventory?.on_hand_qty || 0,
        shortage_qty: shortage,
        procurement_source: 'PURCHASE',
        status: 'PO_CREATED',
        reason: `Auto-procure shortage of ${shortage} for Sales Order ${soId || ''}`
      }
    });

    console.log(`[AutoProcure] Auto-created Purchase Order ${poNumber} for ${shortage} units of "${product.name}"`);
    return { type: 'PO', id: po.id, number: poNumber };
  }
}

module.exports = { autoProcure };
