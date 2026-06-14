const prisma = require('../../config/db');
const { getFreeQty } = require('../../utils/stockMutations');

function attachFreeQty(product) {
  if (!product) return product;
  return {
    ...product,
    free_qty: getFreeQty(product),
  };
}

async function getAllProducts() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: { 
      vendor: { select: { id: true, name: true } },
      inventory: true
    },
  });
  return products.map(attachFreeQty);
}

async function getProductById(id) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: { vendor: true, bom_reference: true, inventory: true },
  });
  return attachFreeQty(product);
}

async function createProduct(data) {
  return await prisma.$transaction(async (tx) => {
    let whId = data.warehouse_id;
    if (!whId) {
      const firstWh = await tx.warehouse.findFirst({ orderBy: { warehouse_code: 'asc' } });
      if (firstWh) whId = firstWh.id;
    }

    const product = await tx.product.create({
      data: {
        name: data.name,
        type: data.type,
        sales_price: data.sales_price,
        cost_price: data.cost_price,
        procurement_type: data.procurement_type,
        procurement_method: data.procurement_method,
        procure_on_demand: data.procure_on_demand,
        vendor_id: data.vendor_id,
        bom_id: data.bom_id,
        image_url: data.image_url,
        warehouse_id: whId || undefined,
        inventory: whId ? {
          create: {
            warehouse_id: whId,
            on_hand_qty: data.on_hand_qty || 0,
            reserved_qty: data.reserved_qty || 0,
            reorder_level: data.reorder_level || 0,
          }
        } : undefined
      },
      include: { 
        vendor: { select: { id: true, name: true } },
        inventory: true
      },
    });
    return attachFreeQty(product);
  });
}

async function updateProduct(id, data) {
  return await prisma.$transaction(async (tx) => {
    const { on_hand_qty, reserved_qty, reorder_level, ...productData } = data;
    
    let whId = productData.warehouse_id;
    if (!whId) {
      const existingInv = await tx.inventory.findFirst({ where: { product_id: id } });
      if (existingInv) {
        whId = existingInv.warehouse_id;
      } else {
        const firstWh = await tx.warehouse.findFirst({ orderBy: { warehouse_code: 'asc' } });
        if (firstWh) whId = firstWh.id;
      }
    }

    const product = await tx.product.update({
      where: { id },
      data: {
        ...productData,
        warehouse_id: whId || undefined,
        inventory: (whId && (on_hand_qty !== undefined || reserved_qty !== undefined || reorder_level !== undefined)) ? {
          upsert: {
            where: {
              product_id_warehouse_id: {
                product_id: id,
                warehouse_id: whId
              }
            },
            create: {
              warehouse_id: whId,
              on_hand_qty: on_hand_qty || 0,
              reserved_qty: reserved_qty || 0,
              reorder_level: reorder_level || 0,
            },
            update: {
              on_hand_qty,
              reserved_qty,
              reorder_level,
            }
          }
        } : undefined
      },
      include: { 
        vendor: { select: { id: true, name: true } },
        inventory: true
      },
    });
    return attachFreeQty(product);
  });
}

async function deleteProduct(id) {
  return await prisma.product.delete({
    where: { id },
  });
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
