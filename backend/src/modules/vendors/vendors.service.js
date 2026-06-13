const prisma = require('../../config/db');

async function getAllVendors() {
  return await prisma.vendor.findMany({
    orderBy: { name: 'asc' },
  });
}

async function getVendorById(id) {
  return await prisma.vendor.findUniqueOrThrow({
    where: { id },
  });
}

async function createVendor(data) {
  return await prisma.vendor.create({
    data,
  });
}

async function updateVendor(id, data) {
  return await prisma.vendor.update({
    where: { id },
    data,
  });
}

async function deleteVendor(id) {
  return await prisma.vendor.delete({
    where: { id },
  });
}

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
};
