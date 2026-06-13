

class BusinessLogicError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

async function checkReorderLevel(tx, productId) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (product && parseFloat(product.on_hand_qty) < parseFloat(product.reorder_level)) {
    const existing = await tx.procurementSuggestion.findFirst({
      where: { product_id: productId, status: 'pending' }
    });
    if (!existing) {
      const needed = parseFloat(product.reorder_level) - parseFloat(product.on_hand_qty);
      await tx.procurementSuggestion.create({
        data: {
          product_id: productId,
          suggested_qty: needed > 0 ? needed : 1,
          reason: `Stock level (${product.on_hand_qty}) fell below reorder level (${product.reorder_level})`,
          status: 'pending'
        }
      });
    }
  }
}

function validateStockLevels(product, newOnHand, newReserved) {
  const onHand = parseFloat(newOnHand);
  const reserved = parseFloat(newReserved);

  if (onHand < 0) {
    throw new BusinessLogicError(
      `Stock violation for "${product.name}": ` +
      `on_hand_qty would become ${onHand.toFixed(3)}, which is below zero. ` +
      `Current stock: ${parseFloat(product.on_hand_qty).toFixed(3)}`
    );
  }

  if (reserved < 0) {
    throw new BusinessLogicError(
      `Stock violation for "${product.name}": ` +
      `reserved_qty would become ${reserved.toFixed(3)}, which is below zero.`
    );
  }

  if (reserved > onHand) {
    throw new BusinessLogicError(
      `Stock violation for "${product.name}": ` +
      `reserved_qty (${reserved.toFixed(3)}) would exceed on_hand_qty (${onHand.toFixed(3)}).`
    );
  }
}

function getFreeQty(product) {
  return parseFloat(product.on_hand_qty) - parseFloat(product.reserved_qty);
}

async function reserveStock(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newReserved = parseFloat(product.reserved_qty) + parseFloat(qty);
  validateStockLevels(product, product.on_hand_qty, newReserved);

  return await prisma.product.update({
    where: { id: productId },
    data: { reserved_qty: newReserved }
  });
}

async function releaseReservation(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newReserved = parseFloat(product.reserved_qty) - parseFloat(qty);
  validateStockLevels(product, product.on_hand_qty, newReserved);

  return await prisma.product.update({
    where: { id: productId },
    data: { reserved_qty: newReserved }
  });
}

async function deductStockOnDelivery(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) - parseFloat(qty);
  const newReserved = parseFloat(product.reserved_qty) - parseFloat(qty);
  validateStockLevels(product, newOnHand, newReserved);

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      on_hand_qty: newOnHand,
      reserved_qty: newReserved
    }
  });

  await checkReorderLevel(prisma, productId);
  return updated;
}

async function addStockOnReceipt(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) + parseFloat(qty);
  validateStockLevels(product, newOnHand, product.reserved_qty);

  return await prisma.product.update({
    where: { id: productId },
    data: { on_hand_qty: newOnHand }
  });
}

async function consumeComponentStock(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) - parseFloat(qty);
  const newReserved = parseFloat(product.reserved_qty) - parseFloat(qty);
  validateStockLevels(product, newOnHand, newReserved);

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      on_hand_qty: newOnHand,
      reserved_qty: newReserved
    }
  });

  await checkReorderLevel(prisma, productId);
  return updated;
}

async function produceFinishedGoods(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) + parseFloat(qty);
  validateStockLevels(product, newOnHand, product.reserved_qty);

  return await prisma.product.update({
    where: { id: productId },
    data: { on_hand_qty: newOnHand }
  });
}

module.exports = {
  BusinessLogicError,
  validateStockLevels,
  getFreeQty,
  reserveStock,
  releaseReservation,
  deductStockOnDelivery,
  addStockOnReceipt,
  consumeComponentStock,
  produceFinishedGoods,
};
