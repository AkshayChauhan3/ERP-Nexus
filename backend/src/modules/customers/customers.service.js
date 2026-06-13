const prisma = require('../../config/db');

async function getAllCustomers() {
  return await prisma.customer.findMany({
    orderBy: { name: 'asc' },
  });
}

async function getCustomerById(id) {
  return await prisma.customer.findUniqueOrThrow({
    where: { id },
  });
}

async function createCustomer(data) {
  return await prisma.customer.create({
    data,
  });
}

async function updateCustomer(id, data) {
  return await prisma.customer.update({
    where: { id },
    data,
  });
}

async function deleteCustomer(id) {
  return await prisma.customer.delete({
    where: { id },
  });
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
