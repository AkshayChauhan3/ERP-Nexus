

async function autoProcure(prisma, product, shortage, userId, soId) {
  console.log(
    `[PROCUREMENT STUB] Would auto-procure ${shortage} units of "${product.name}" ` +
    `via ${product.procurement_type === 'MTO' ? 'ManufacturingOrder' : 'PurchaseOrder'}`
  );
  return null;
}

module.exports = { autoProcure };
