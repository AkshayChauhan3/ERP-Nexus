const prisma = require('../../config/db');

async function getAllBoms() {
  return await prisma.billOfMaterials.findMany({
    include: {
      product: { select: { id: true, name: true } },
      lines: {
        include: { component: { select: { id: true, name: true } } },
      },
    },
  });
}

async function getBomById(id) {
  return await prisma.billOfMaterials.findUniqueOrThrow({
    where: { id },
    include: {
      product: true,
      lines: {
        include: { component: true },
      },
    },
  });
}

async function createBom(data) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.billOfMaterials.findUnique({
      where: { product_id: data.product_id },
    });
    if (existing) {
      const error = new Error('Product already has a BOM');
      error.name = 'BusinessLogicError';
      throw error;
    }

    const bom = await tx.billOfMaterials.create({
      data: {
        product_id: data.product_id,
        lines: {
          create: data.lines.map((line) => ({
            component_product_id: line.component_product_id,
            qty_per_unit: line.qty_per_unit,
            operation: line.operation,
          })),
        },
      },
      include: { lines: true },
    });
    await tx.product.update({
      where: { id: data.product_id },
      data: { 
        procurement_type: 'MTO',
        bom_id: bom.id
      },
    });

    return bom;
  });
}

async function updateBom(id, data) {
  return await prisma.$transaction(async (tx) => {
    const bom = await tx.billOfMaterials.findUniqueOrThrow({
      where: { id },
    });

    if (data.lines) {
      await tx.bOMLine.deleteMany({
        where: { bom_id: id },
      });

      await tx.bOMLine.createMany({
        data: data.lines.map((line) => ({
          bom_id: id,
          component_product_id: line.component_product_id,
          qty_per_unit: line.qty_per_unit,
          operation: line.operation,
        })),
      });
    }

    return await tx.billOfMaterials.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        lines: { include: { component: { select: { id: true, name: true } } } },
      },
    });
  });
}

async function deleteBom(id) {
  return await prisma.$transaction(async (tx) => {
    const bom = await tx.billOfMaterials.findUniqueOrThrow({
      where: { id },
    });

    await tx.billOfMaterials.delete({
      where: { id },
    });
    await tx.product.update({
      where: { id: bom.product_id },
      data: { bom_id: null },
    });

    return true;
  });
}

module.exports = {
  getAllBoms,
  getBomById,
  createBom,
  updateBom,
  deleteBom,
};
