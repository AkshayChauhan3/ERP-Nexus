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
    include: { vendor: { select: { id: true, name: true } } },
  });
  return products.map(attachFreeQty);
}

async function getProductById(id) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: { vendor: true, bom_reference: true },
  });
  return attachFreeQty(product);
}

async function createProduct(data) {
  const product = await prisma.product.create({
    data,
    include: { vendor: { select: { id: true, name: true } } },
  });
  return attachFreeQty(product);
}

async function updateProduct(id, data) {
  const product = await prisma.product.update({
    where: { id },
    data,
    include: { vendor: { select: { id: true, name: true } } },
  });
  return attachFreeQty(product);
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
